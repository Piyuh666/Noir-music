/**
 * NOIR MUSIC — Canonical UI application-service boundary.
 *
 * UI interactions are deliberately routed through this service instead of
 * mutating Lavalink/Prisma state ad-hoc in Discord event code. Commands may
 * continue to use their existing domain services; this layer is the shared
 * application boundary for interactive UI mutations and therefore prevents
 * button-specific business logic from becoming a second implementation.
 */
import { prisma } from "../database/prisma";
import { GuildSession } from "../audio/session";
import { clearAllEffects } from "../audio/filters";
import { PlaybackService } from "../audio/playbackService";
import { publishPlayerState } from "../events/playerStateBus";

export type UiPlayerLike = any;

function requirePlayer(session: GuildSession): UiPlayerLike {
  const player = session.player;
  if (!player) throw new Error("NO_ACTIVE_PLAYER");
  return player;
}

function clampVolume(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 70;
  return Math.max(0, Math.min(150, Math.round(n)));
}

export class UIControlService {
  static async playPause(guildId: string): Promise<void> { await PlaybackService.playPause(guildId); }

  static async skip(guildId: string): Promise<void> { await PlaybackService.skip(guildId); }

  static async previous(guildId: string): Promise<void> { await PlaybackService.previous(guildId); }

  static async cycleLoop(guildId: string): Promise<void> {
    const session = GuildSession.for(guildId);
    const player = requirePlayer(session);
    const next = player.repeatMode === "off" ? "track" : player.repeatMode === "track" ? "queue" : "off";
    await PlaybackService.setRepeat(guildId, next);
  }

  static async shuffle(guildId: string): Promise<void> { await PlaybackService.shuffle(guildId); }

  static async setVolume(guildId: string, volume: number): Promise<number> { return PlaybackService.setVolume(guildId, volume); }

  static async volumeStep(guildId: string, delta: number): Promise<number> {
    const p = requirePlayer(GuildSession.for(guildId));
    return PlaybackService.setVolume(guildId, Number(p.volume ?? 70) + Number(delta || 0));
  }

  static async toggleMute(guildId: string): Promise<{ muted: boolean; volume: number }> {
    const session = GuildSession.for(guildId);
    return session.withLock(async () => {
      const player = requirePlayer(session);
      const muted = Boolean(player.getData("noirUiMuted"));
      if (muted) {
        const restore = Math.max(1, Math.min(150, clampVolume(player.getData("noirUiPreviousVolume") ?? 70)));
        await player.setVolume(restore);
        player.setData("noirUiMuted", false);
        player.setData("noirUiPreviousVolume", restore);
        publishPlayerState(guildId, "PLAYBACK_MUTATION", "mute:off");
        return { muted: false, volume: restore };
      }
      const current = clampVolume(player.volume ?? 70);
      player.setData("noirUiPreviousVolume", current || 70);
      await player.setVolume(0);
      player.setData("noirUiMuted", true);
      publishPlayerState(guildId, "PLAYBACK_MUTATION", "mute:on");
      return { muted: true, volume: 0 };
    });
  }

  static async replay(guildId: string): Promise<void> { await PlaybackService.replay(guildId); }

  static async stop(guildId: string): Promise<void> { await PlaybackService.stop(guildId); }

  static async toggleAutoplay(guildId: string): Promise<boolean> {
    const session = GuildSession.for(guildId);
    return session.withLock(async () => {
      const current = await prisma.guild.findUnique({ where: { discordId: guildId }, select: { autoplay: true } });
      const enabled = !(current?.autoplay ?? false);
      await prisma.guild.upsert({
        where: { discordId: guildId },
        update: { autoplay: enabled },
        create: { discordId: guildId, autoplay: enabled },
      });
      session.player?.setData("autoplay", enabled);
      publishPlayerState(guildId, "PLAYBACK_MUTATION", "autoplay");
      return enabled;
    });
  }

  static async toggleEffects(guildId: string): Promise<boolean> {
    const session = GuildSession.for(guildId);
    return session.withLock(async () => {
      const current = await prisma.guild.findUnique({ where: { discordId: guildId }, select: { effectsEnabled: true } });
      const enabled = !(current?.effectsEnabled ?? true);
      await prisma.guild.upsert({
        where: { discordId: guildId },
        update: { effectsEnabled: enabled },
        create: { discordId: guildId, effectsEnabled: enabled },
      });
      const player = session.player;
      if (!enabled && player) {
        await clearAllEffects(player);
        player.setData("activeEffects", []);
      }
      publishPlayerState(guildId, "PLAYBACK_MUTATION", "effects");
      return enabled;
    });
  }

  static async cycleDefaultSource(guildId: string): Promise<string> {
    const session = GuildSession.for(guildId);
    return session.withLock(async () => {
      const current = await prisma.guild.findUnique({ where: { discordId: guildId }, select: { defaultSource: true } });
      const source = current?.defaultSource === "scsearch" ? "ytsearch" : "scsearch";
      await prisma.guild.upsert({
        where: { discordId: guildId },
        update: { defaultSource: source },
        create: { discordId: guildId, defaultSource: source },
      });
      session.player?.setData("defaultSource", source);
      publishPlayerState(guildId, "PLAYBACK_MUTATION", "source");
      return source;
    });
  }

  static async favoriteCurrent(guildId: string, userId: string): Promise<void> {
    const session = GuildSession.for(guildId);
    await session.withLock(async () => {
      const player = requirePlayer(session);
      const current = player.queue.current;
      if (!current) throw new Error("NOTHING_PLAYING");
      const uri = current.info?.uri ?? current.info?.identifier;
      if (!uri) throw new Error("TRACK_IDENTITY_MISSING");
      const user = await prisma.user.upsert({ where: { discordId: userId }, update: {}, create: { discordId: userId } });
      await prisma.favorite.upsert({
        where: { userId_trackUri: { userId: user.id, trackUri: uri } },
        update: { title: current.info?.title ?? "Untitled", artist: current.info?.author ?? "Unknown artist" },
        create: { userId: user.id, trackUri: uri, title: current.info?.title ?? "Untitled", artist: current.info?.author ?? "Unknown artist" },
      });
    });
  }
}
