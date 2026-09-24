import { LavalinkManager, Player } from "lavalink-client";
import { prisma } from "../database/prisma";
import { KeyedMutex } from "../utils/keyedMutex";
import { boundedInt, boundedString, discordSnowflake } from "../utils/limits";
import { publishPlayerState } from "../events/playerStateBus";
import { sessionRecoveryService } from "../services/sessionRecoveryService";

export type QueueTrack = {
  info?: {
    uri?: string;
    identifier?: string;
    title?: string;
    author?: string;
    duration?: number;
    isStream?: boolean;
  };
  requester?: unknown;
};

export type QueueSnapshot = {
  current: QueueTrack | undefined;
  tracks: QueueTrack[];
  length: number;
  capturedAt: number;
};

function trackKey(track: QueueTrack | undefined): string | undefined {
  const value = track?.info?.uri ?? track?.info?.identifier;
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 2048) : undefined;
}

function validateTrack(track: QueueTrack | undefined): asserts track is QueueTrack {
  if (!track?.info) throw new Error("INVALID_TRACK");
  const key = trackKey(track);
  if (!key) throw new Error("INVALID_TRACK");
  if (track.info.title && String(track.info.title).length > 1000) throw new Error("INVALID_TRACK");
}

function validateQuery(query: unknown): string {
  const normalized = String(query ?? "").replace(/[\u0000-\u001F\u007F]/g, " ").trim();
  if (!normalized || normalized.length > 1000) throw new Error("INVALID_SEARCH_QUERY");
  return normalized;
}

/**
 * Per-guild isolation boundary and authoritative gateway for stateful audio
 * mutations. Commands may read the player directly for presentation, but all
 * queue insertion and lifecycle-sensitive operations should pass through this
 * class so concurrent interactions cannot corrupt one guild's state.
 */
export class GuildSession {
  private static readonly sessions = new Map<string, GuildSession>();
  private static manager: LavalinkManager | undefined;
  private static readonly mutex = new KeyedMutex();
  private static readonly operationCounts = new Map<string, number>();

  private constructor(public readonly guildId: string, private readonly manager: LavalinkManager) {}

  static bootstrap(manager: LavalinkManager): void {
    if (!manager) throw new TypeError("Audio manager is required");
    GuildSession.manager = manager;
  }

  static for(guildId: string): GuildSession {
    const id = discordSnowflake(guildId, "guild id");
    let session = this.sessions.get(id);
    if (!session) {
      if (!this.manager) throw new Error("Audio manager has not been bootstrapped");
      session = new GuildSession(id, this.manager);
      this.sessions.set(id, session);
    }
    return session;
  }

  static activeSessionCount(): number {
    return this.sessions.size;
  }

  static activeGuildIds(): readonly string[] {
    return Object.freeze([...this.sessions.keys()]);
  }

  static clearSession(guildId: string): void {
    const id = discordSnowflake(guildId, "guild id");
    this.sessions.delete(id);
    GuildSession.operationCounts.delete(id);
  }

  get player(): Player | undefined {
    return this.manager.getPlayer(this.guildId);
  }

  async withLock<T>(task: () => Promise<T>): Promise<T> {
    const current = GuildSession.operationCounts.get(this.guildId) ?? 0;
    GuildSession.operationCounts.set(this.guildId, current + 1);
    try {
      return await GuildSession.mutex.runExclusive(this.guildId, task);
    } finally {
      const next = (GuildSession.operationCounts.get(this.guildId) ?? 1) - 1;
      if (next <= 0) GuildSession.operationCounts.delete(this.guildId);
      else GuildSession.operationCounts.set(this.guildId, next);
    }
  }

  queueOperationDepth(): number {
    return GuildSession.operationCounts.get(this.guildId) ?? 0;
  }

  async ensurePlayer(voiceChannelId: string, textChannelId: string): Promise<Player> {
    const voiceId = discordSnowflake(voiceChannelId, "voice channel id");
    const textId = discordSnowflake(textChannelId, "text channel id");

    return this.withLock(async () => {
      const guild = await prisma.guild.upsert({
        where: { discordId: this.guildId },
        update: {},
        create: { discordId: this.guildId },
      });
      let player = this.player;

      if (!player) {
        const preferredNode = (this.manager as unknown as { getNoirPreferredNode?: () => string | undefined }).getNoirPreferredNode?.();
        player = this.manager.createPlayer({
          guildId: this.guildId,
          voiceChannelId: voiceId,
          textChannelId: textId,
          selfDeaf: true,
          volume: boundedInt(guild.defaultVolume, 70, 0, 1000),
          ...(preferredNode ? { node: preferredNode } : {}),
        });
        if (!player) throw new Error("AUDIO_PLAYER_CREATE_FAILED");
        this.applyGuildPolicy(player, guild);
        await player.connect();
      } else {
        this.applyGuildPolicy(player, guild);
        if (player.voiceChannelId !== voiceId) {
          if (player.getData<boolean>("voiceLocked")) throw new Error("VOICE_LOCKED");
          await player.changeVoiceState({ voiceChannelId: voiceId });
        }
        player.setData("textChannelId", textId);
      }
      return player;
    });
  }

  private applyGuildPolicy(player: Player, guild: Awaited<ReturnType<typeof prisma.guild.upsert>>): void {
    player.setData("maxQueueSize", boundedInt(guild.maxQueueSize, 500, 1, 10_000));
    player.setData("maxPlaylistSize", boundedInt(guild.maxPlaylistSize, 1000, 1, 10_000));
    player.setData("defaultSource", boundedString(guild.defaultSource, "ytsearch", 32));
    player.setData("duplicateHandling", boundedString(guild.duplicateHandling, "allow", 32));
    player.setData("explicitFilter", Boolean(guild.explicitFilter));
    player.setData("always247", Boolean(guild.always247));
    player.setData("voiceLocked", Boolean(guild.voiceLocked));
    player.setData("announceChannelId", guild.announceChannelId ?? undefined);
    player.setData("playerStyle", boundedString(guild.playerStyle, "glyph", 32));
    player.setData("language", boundedString(guild.language, "en", 16));
    player.setData("idleTimeoutMinutes", boundedInt(guild.idleTimeoutMinutes, 5, 1, 120));
    player.setData("autoplay", Boolean(guild.autoplay));
    player.setData("maxQueueSizeSource", "guild-policy");
  }

  async search(player: Player, query: string, requester: unknown, sourceOverride?: string): Promise<unknown> {
    const normalized = validateQuery(query);
    const guild = await prisma.guild.upsert({ where: { discordId: this.guildId }, update: {}, create: { discordId: this.guildId } });
    const looksLikeDirectSource = /^(?:https?:\/\/|spotify:|soundcloud:|scsearch:|ytsearch:|ytmsearch:|httpsearch:|local:)/i.test(normalized);
    const filteredQuery = guild.explicitFilter && !looksLikeDirectSource && !/\b(clean|explicit)\b/i.test(normalized)
      ? `${normalized} clean`
      : normalized;
    const source = boundedString(sourceOverride || guild.defaultSource || "ytsearch", "ytsearch", 32);
    if (!/^[a-z0-9_-]{1,32}$/i.test(source)) throw new Error("INVALID_AUDIO_SOURCE");
    return player.search({ query: filteredQuery, source } as never, requester);
  }

  async searchAndQueue(player: Player, query: string, requester: unknown, sourceOverride?: string): Promise<number> {
    return this.withLock(async () => {
      const result = await this.search(player, query, requester, sourceOverride) as { tracks?: QueueTrack[] } | undefined;
      const tracks = Array.isArray(result?.tracks) ? result.tracks : [];
      if (!tracks.length) return 0;
      return (await this.addToQueueUnlocked(player, tracks[0])) ? 1 : 0;
    });
  }

  async addToQueue(player: Player, track: QueueTrack): Promise<boolean> {
    return this.withLock(() => this.addToQueueUnlocked(player, track));
  }

  async addManyToQueue(player: Player, tracks: QueueTrack[]): Promise<number> {
    if (!Array.isArray(tracks) || !tracks.length) return 0;
    if (tracks.length > 10_000) throw new Error("QUEUE_BATCH_TOO_LARGE");
    return this.withLock(async () => {
      let added = 0;
      for (const track of tracks) {
        try {
          if (await this.addToQueueUnlocked(player, track)) added++;
        } catch (error) {
          if (error instanceof Error && error.message === "QUEUE_LIMIT") break;
          throw error;
        }
      }
      return added;
    });
  }

  async mutateQueue<T>(player: Player, operation: (tracks: QueueTrack[], current: QueueTrack | undefined) => Promise<T> | T): Promise<T> {
    if (!player) throw new TypeError("Player is required");
    return this.withLock(async () => {
      const tracks = player.queue.tracks as QueueTrack[];
      const current = player.queue.current as unknown as QueueTrack | undefined;
      const beforeLength = tracks.length;
      const result = await operation(tracks, current);
      if (tracks.length < 0 || tracks.length > 10_000) throw new Error("QUEUE_STATE_INVALID");
      player.setData("monoQueueLength", tracks.length);
      player.setData("monoQueueMutationAt", Date.now());
      player.setData("monoQueueMutationDelta", tracks.length - beforeLength);
      sessionRecoveryService.capture(player);
      publishPlayerState(this.guildId, "QUEUE_CHANGED", "mutateQueue");
      return result;
    });
  }

  queueSnapshot(player: Player): QueueSnapshot {
    const tracks = [...(player.queue.tracks as QueueTrack[])];
    return {
      current: player.queue.current as unknown as QueueTrack | undefined,
      tracks,
      length: tracks.length,
      capturedAt: Date.now(),
    };
  }

  private async addToQueueUnlocked(player: Player, track: QueueTrack): Promise<boolean> {
    validateTrack(track);
    const guild = await prisma.guild.upsert({ where: { discordId: this.guildId }, update: {}, create: { discordId: this.guildId } });
    const max = boundedInt(guild.maxQueueSize, 500, 1, 10_000);
    if (player.queue.tracks.length >= max) throw new Error("QUEUE_LIMIT");

    const key = trackKey(track);
    if (guild.duplicateHandling === "block" && key) {
      const duplicate = player.queue.tracks.some((item: QueueTrack) => trackKey(item) === key)
        || trackKey(player.queue.current as unknown as QueueTrack | undefined) === key;
      if (duplicate) return false;
    }

    player.queue.add(track as never);
    player.setData("monoQueueLength", player.queue.tracks.length);
    player.setData("monoQueueMutationAt", Date.now());
    return true;
  }

  async destroy(): Promise<void> {
    sessionRecoveryService.markIntentional(this.guildId);
    await this.withLock(async () => {
      const player = this.player;
      if (player) await player.destroy();
    });
    GuildSession.clearSession(this.guildId);
  }

  hasActivePlayback(): boolean {
    return Boolean(this.player?.playing);
  }
}
