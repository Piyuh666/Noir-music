import { LavalinkManager, Player } from "lavalink-client";
import { Client, Events, VoiceState } from "discord.js";
import { config } from "../config";
import { logger, musicLog } from "../utils/logger";
import { StatsService } from "../services/statsService";
import { prisma } from "../database/prisma";
import { GuildSession } from "./session";
import { publishPlayerState } from "../events/playerStateBus";
import { PlaybackService } from "./playbackService";
import { KeyedMutex } from "../utils/keyedMutex";
import { registerAudioNode, updateAudioNode } from "../services/audioHealth";
import { LavalinkNodeOrchestrator } from "./nodeOrchestrator";
import { startLavalinkHealthMonitor } from "./lavalinkHealthMonitor";
import { assertAudioRuntimeWiring, buildAudioRuntimeWiring } from "./runtimeWiring";
import { sessionRecoveryService } from "../services/sessionRecoveryService";
import { sessionReconciliationService } from "../services/sessionReconciliationService";

interface TrackLike {
  info?: {
    uri?: string;
    identifier?: string;
    title?: string;
    author?: string;
    duration?: number;
    isStream?: boolean;
  };
  requester?: unknown;
}

interface TrackStartState {
  startedAt: number;
  track: TrackLike;
  generation: number;
}

const DISCORD_ID = /^[0-9]{5,32}$/;
const MAX_SEARCH_LENGTH = 1000;
const EMPTY_TIMER_FLOOR_MS = 60_000;
const MAX_EMPTY_TIMER_MS = 120 * 60_000;
const STUCK_RECOVERY_DELAY_MS = 1_500;
const MAX_TRACK_FAILURES_PER_GUILD = 5;
const FAILOVER_RETRY_BASE_MS = 1_000;
const FAILOVER_RETRY_MAX_MS = 30_000;

function trackUri(track: TrackLike | undefined): string {
  const value = track?.info?.uri ?? track?.info?.identifier ?? "";
  return typeof value === "string" ? value.trim().slice(0, 2048) : "";
}

function trackTitle(track: TrackLike | undefined): string {
  return String(track?.info?.title ?? "Unknown track")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, 200) || "Unknown track";
}

function safeGuildId(value: unknown): string {
  const guildId = String(value ?? "").trim();
  if (!DISCORD_ID.test(guildId)) throw new TypeError("Invalid Discord guild id");
  return guildId;
}

function asError(value: unknown): Error {
  if (value instanceof Error) return value;
  if (typeof value === "string") return new Error(value.slice(0, 1000));
  try { return new Error(JSON.stringify(value).slice(0, 1000)); } catch { return new Error("Unknown audio error"); }
}

function nodeIdOf(player: Player): string | undefined {
  const node = (player as unknown as { node?: { id?: unknown } }).node;
  return typeof node?.id === "string" && node.id.trim() ? node.id.trim() : undefined;
}

function isPlayerOperational(player: Player | undefined): player is Player {
  if (!player) return false;
  const candidate = player as unknown as { guildId?: unknown; destroyed?: unknown };
  return DISCORD_ID.test(String(candidate.guildId ?? "")) && candidate.destroyed !== true;
}

function sameTrack(a: TrackLike | undefined, b: TrackLike | undefined): boolean {
  const aUri = trackUri(a);
  const bUri = trackUri(b);
  if (aUri || bUri) return aUri === bUri;
  return trackTitle(a) === trackTitle(b);
}

export function createAudioManager(client: Client) {
  if (!client?.guilds) throw new TypeError("Discord client must be initialized before creating the audio manager");

  const manager = new LavalinkManager({
    nodes: config.lavalink.nodes.map((node) => ({
      authorization: node.authorization,
      host: node.host,
      port: node.port,
      secure: node.secure,
      id: node.id,
    })),
    sendToShard: (guildId, payload) => {
      const safeGuild = String(guildId ?? "").trim();
      if (!DISCORD_ID.test(safeGuild)) return false;
      try {
        const guild = client.guilds.cache.get(safeGuild);
        if (!guild) return false;
        guild.shard.send(payload);
        return true;
      } catch (error) {
        logger.error({ err: asError(error), guildId: safeGuild }, "Failed to forward Lavalink voice payload to Discord shard");
        return false;
      }
    },
    client: { id: config.discord.clientId, username: "NOIR MUSIC" },
    autoSkip: true,
    emitNewSongsOnly: true,
    playerOptions: {
      defaultSearchPlatform: "ytsearch",
      volumeDecrementer: 1,
      onDisconnect: { autoReconnect: true, destroyPlayer: false },
      onEmptyQueue: { destroyAfterMs: 365 * 24 * 60 * 60 * 1000 },
    },
  });

  const starts = new Map<string, TrackStartState>();
  const emptyTimers = new Map<string, ReturnType<typeof setTimeout>>();
  const recoveryTimers = new Map<string, ReturnType<typeof setTimeout>>();
  const recoveryLocks = new KeyedMutex();
  const nodeHealth = new Map<string, { id: string; connected: boolean; lastConnectedAt: number; lastDisconnectedAt: number; lastErrorAt: number; consecutiveFailures: number; reconnecting: boolean; lastReason?: string }>();
  const failureCounts = new Map<string, number>();
  const failoverCooldown = new Map<string, number>();
  const failoverRetries = new Map<string, ReturnType<typeof setTimeout>>();
  const playersByNode = new Map<string, Set<string>>();
  const nodeOrchestrator = new LavalinkNodeOrchestrator(config.lavalink.nodes);
  nodeOrchestrator.assertTopology(config.lavalink.nodes.map((node) => node.id));
  const stopLavalinkHealthMonitor = startLavalinkHealthMonitor(config.lavalink.nodes, nodeOrchestrator);
  assertAudioRuntimeWiring(nodeOrchestrator);

  // Expose one authoritative node-selection boundary to GuildSession.
  // New players therefore participate in the same health/load-aware policy
  // as failover instead of relying on a separate implicit node choice.
  (manager as unknown as { getNoirPreferredNode?: () => string | undefined }).getNoirPreferredNode = () => nodeOrchestrator.choose();
  (manager as unknown as { getNoirHealthyNodeCount?: () => number }).getNoirHealthyNodeCount = () => nodeOrchestrator.healthyNodeCount();
  GuildSession.bootstrap(manager);
  sessionRecoveryService.configure(async (snapshot) => {
    const session = GuildSession.for(snapshot.guildId);
    const player = await session.ensurePlayer(snapshot.voiceChannelId, snapshot.textChannelId);
    await player.setVolume(snapshot.volume);
    if (snapshot.repeatMode === "track" || snapshot.repeatMode === "queue" || snapshot.repeatMode === "off") {
      await player.setRepeatMode(snapshot.repeatMode as "track" | "queue" | "off");
    }
    player.setData("autoplay", snapshot.autoplay);
    player.setData("always247", snapshot.always247);
    if (snapshot.current) await session.addToQueue(player, snapshot.current);
    if (snapshot.tracks.length) await session.addManyToQueue(player, [...snapshot.tracks]);
    if (snapshot.current || snapshot.tracks.length) await PlaybackService.play(snapshot.guildId);
  });
  sessionReconciliationService.configure({
    guildIds: () => GuildSession.activeGuildIds(),
    getPlayer: (guildId) => manager.getPlayer(guildId),
  });
  sessionReconciliationService.start();
  let generation = 0;

  for (const node of config.lavalink.nodes) {
    const state = {
      id: node.id,
      connected: false,
      lastConnectedAt: 0,
      lastDisconnectedAt: 0,
      lastErrorAt: 0,
      consecutiveFailures: 0,
      reconnecting: false,
    };
    nodeHealth.set(node.id, state);
    registerAudioNode(node.id);
  }

  const clearGuildTimer = (guildId: string) => {
    const timer = emptyTimers.get(guildId);
    if (timer) clearTimeout(timer);
    emptyTimers.delete(guildId);
  };

  const clearRecovery = (guildId: string) => {
    const timer = recoveryTimers.get(guildId);
    if (timer) clearTimeout(timer);
    recoveryTimers.delete(guildId);
  };

  const clearFailoverRetry = (guildId: string) => {
    const timer = failoverRetries.get(guildId);
    if (timer) clearTimeout(timer);
    failoverRetries.delete(guildId);
  };

  const bindPlayerToNode = (guildId: string, nodeId?: string) => {
    nodeOrchestrator.bindPlayer(guildId, nodeId);
    for (const guilds of playersByNode.values()) guilds.delete(guildId);
    if (!nodeId) return;
    const guilds = playersByNode.get(nodeId) ?? new Set<string>();
    guilds.add(guildId);
    playersByNode.set(nodeId, guilds);
  };

  const getHealthyNode = (exclude?: string): string | undefined => {
    return nodeOrchestrator.choose({ exclude, maxConsecutiveFailures: 0 });
  };

  const scheduleFailover = (player: Player, reason: string): void => {
    if (!isPlayerOperational(player)) return;
    const guildId = safeGuildId(player.guildId);
    const now = Date.now();
    const last = failoverCooldown.get(guildId) ?? 0;
    if (now - last < config.lavalink.failoverCooldownMs) return;
    failoverCooldown.set(guildId, now);

    void recoveryLocks.runExclusive(`failover:${guildId}`, async () => {
      if (!isPlayerOperational(player)) return;
      const currentNode = nodeIdOf(player);
      const targetNode = getHealthyNode(currentNode);
      if (!targetNode) {
        logger.error({ guildId, currentNode, reason }, "Lavalink failover requested but no healthy node is available");
        return;
      }

      const attemptKey = `failoverAttempts:${guildId}`;
      const rawAttempts = Number(player.getData<number>(attemptKey) ?? 0);
      const attempts = Number.isFinite(rawAttempts) ? Math.max(0, Math.trunc(rawAttempts)) : 0;
      if (attempts >= config.lavalink.failoverMaxAttempts) {
        logger.error({ guildId, currentNode, targetNode, attempts }, "Lavalink failover attempt limit reached");
        return;
      }
      player.setData(attemptKey, attempts + 1);

      try {
        logger.warn({ guildId, currentNode, targetNode, reason, attempt: attempts + 1 }, "Migrating Lavalink player to a healthy node");
        const mutablePlayer = player as unknown as { changeNode?: (nodeId: string) => Promise<unknown> };
        if (typeof mutablePlayer.changeNode !== "function") throw new Error("LAVALINK_CHANGE_NODE_UNAVAILABLE");
        await mutablePlayer.changeNode(targetNode);
        nodeOrchestrator.recordFailover(targetNode);
        bindPlayerToNode(guildId, targetNode);
        player.setData(attemptKey, 0);
        player.setData("monoNodeFailoverAt", Date.now());
        clearFailoverRetry(guildId);
        musicLog("NODE_FAILOVER", { guildId, extra: { from: currentNode, to: targetNode, reason, attempt: attempts + 1 } });
      } catch (error) {
        const err = asError(error);
        logger.error({ err, guildId, currentNode, targetNode, attempt: attempts + 1 }, "Lavalink player failover failed");
        if (attempts + 1 < config.lavalink.failoverMaxAttempts) {
          const delay = Math.min(FAILOVER_RETRY_MAX_MS, FAILOVER_RETRY_BASE_MS * 2 ** attempts);
          clearFailoverRetry(guildId);
          const retry = setTimeout(() => {
            failoverRetries.delete(guildId);
            scheduleFailover(player, `${reason}:retry`);
          }, delay);
          failoverRetries.set(guildId, retry);
        }
      }
    }).catch((error) => logger.error({ err: asError(error), guildId, reason }, "Failover lock failed"));
  };

  manager.nodeManager.on("create", (node) => {
    const id = String(node.id).trim();
    if (!id) return;
    if (!nodeHealth.has(id)) {
      nodeHealth.set(id, { id, connected: false, lastConnectedAt: 0, lastDisconnectedAt: 0, lastErrorAt: 0, consecutiveFailures: 0, reconnecting: false });
    }
    registerAudioNode(id);
    logger.debug({ nodeId: id }, "Lavalink node created");
  });

  manager.nodeManager.on("connect", (node) => {
    const id = String(node.id);
    const state = nodeHealth.get(id) ?? { id, connected: false, lastConnectedAt: 0, lastDisconnectedAt: 0, lastErrorAt: 0, consecutiveFailures: 0, reconnecting: false };
    state.connected = true;
    state.reconnecting = false;
    state.lastConnectedAt = Date.now();
    state.consecutiveFailures = 0;
    state.lastReason = undefined;
    nodeHealth.set(id, state);
    nodeOrchestrator.markConnected(id, state.lastConnectedAt);
    updateAudioNode(id, { connected: true, reconnecting: false, lastConnectedAt: state.lastConnectedAt, consecutiveFailures: 0, lastReason: undefined });

    const resumeTimeoutMs = config.lavalink.nodes.find((item) => item.id === id)?.resumeTimeoutMs ?? 300_000;
    const sessionNode = node as unknown as { updateSession?: (enabled: boolean, timeout: number) => Promise<void> };
    if (typeof sessionNode.updateSession === "function") {
      void sessionNode.updateSession(true, resumeTimeoutMs).catch((error) => logger.warn({ err: asError(error), nodeId: id }, "Failed to enable Lavalink session resuming"));
    }
    logger.info({ nodeId: id, resumeTimeoutMs }, "Lavalink node connected");
  });

  manager.nodeManager.on("reconnecting", (node) => {
    const id = String(node.id);
    const state = nodeHealth.get(id);
    if (state) state.reconnecting = true;
    nodeOrchestrator.markReconnecting(id);
    updateAudioNode(id, { reconnecting: true });
    logger.warn({ nodeId: id }, "Lavalink node reconnecting");
  });

  manager.nodeManager.on("disconnect", (node, reason) => {
    const id = String(node.id);
    const reasonText = String(reason ?? "unknown").replace(/[\u0000-\u001F\u007F]/g, " ").slice(0, 500);
    const state = nodeHealth.get(id);
    if (state) {
      state.connected = false;
      state.reconnecting = true;
      state.lastDisconnectedAt = Date.now();
      state.lastReason = reasonText;
      state.consecutiveFailures = Math.min(1_000, state.consecutiveFailures + 1);
    }
    nodeOrchestrator.markDisconnected(id, reasonText);
    updateAudioNode(id, { connected: false, reconnecting: true, lastDisconnectedAt: Date.now(), consecutiveFailures: state?.consecutiveFailures ?? 1, lastReason: reasonText });
    logger.warn({ nodeId: id, reason: reasonText, affectedPlayers: playersByNode.get(id)?.size ?? 0 }, "Lavalink node disconnected");

    const affectedGuilds = [...(playersByNode.get(id) ?? [])];
    for (const guildId of affectedGuilds) {
      nodeOrchestrator.unbindPlayer(guildId);
      const player = manager.getPlayer(guildId);
      if (player && nodeIdOf(player) === id) scheduleFailover(player, "node-disconnect");
    }
  });

  manager.nodeManager.on("error", (node, error, payload) => {
    const id = String(node.id);
    const state = nodeHealth.get(id);
    if (state) {
      state.lastErrorAt = Date.now();
      state.consecutiveFailures = Math.min(1_000, state.consecutiveFailures + 1);
    }
    nodeOrchestrator.markError(id);
    updateAudioNode(id, { lastErrorAt: Date.now(), consecutiveFailures: state?.consecutiveFailures ?? 1 });
    logger.error({ err: asError(error), nodeId: id, payload }, "Lavalink node error");
  });

  manager.nodeManager.on("resumed", async (node, _payload, players) => {
    const id = String(node.id);
    logger.info({ nodeId: id, playerCount: Array.isArray(players) ? players.length : 0 }, "Lavalink node session resumed");
    if (!Array.isArray(players)) return;
    for (const resumed of players) {
      const guildId = String((resumed as { guildId?: unknown })?.guildId ?? "").trim();
      if (!DISCORD_ID.test(guildId)) continue;
      const player = manager.getPlayer(guildId);
      if (!player) continue;
      bindPlayerToNode(guildId, nodeIdOf(player) ?? id);
      player.setData("monoNodeResumedAt", Date.now());
      player.setData(`failoverAttempts:${guildId}`, 0);
      clearRecovery(guildId);
    }
  });

  manager.on("trackStart", (player, track) => {
    const guildId = safeGuildId(player.guildId);
    const typedTrack = track as TrackLike;
    const state: TrackStartState = { startedAt: Date.now(), track: typedTrack, generation: ++generation };
    starts.set(guildId, state);
    failureCounts.delete(guildId);
    clearGuildTimer(guildId);
    clearRecovery(guildId);
    const activeNodeId = nodeIdOf(player);
    bindPlayerToNode(guildId, activeNodeId);
    if (activeNodeId) nodeOrchestrator.recordSuccess(activeNodeId);
    player.setData("monoCurrentTrackUri", trackUri(typedTrack));
    player.setData("monoLastTrack", typedTrack);
    player.setData("monoTrackGeneration", state.generation);
    player.setData("monoRequesterId", String((typedTrack.requester as { id?: unknown })?.id ?? "").slice(0, 64));
    player.setData("voteSkipUsers", []);
    player.setData("monoSkipped", false);
    player.setData("monoLastSuccessfulTrackAt", Date.now());
    musicLog("PLAY", { guildId, track: trackTitle(typedTrack), extra: { node: nodeIdOf(player), generation: state.generation } });
    sessionRecoveryService.capture(player);
    publishPlayerState(guildId, "TRACK_START", "trackStart");
  });

  manager.on("trackEnd", async (player, track) => {
    const guildId = safeGuildId(player.guildId);
    const typedTrack = track as TrackLike;
    const state = starts.get(guildId);
    if (state && sameTrack(state.track, typedTrack)) starts.delete(guildId);

    const requesterId = String((typedTrack.requester as { id?: unknown })?.id ?? player.getData<string>("monoRequesterId") ?? "").trim();
    if (requesterId && typedTrack.info) {
      const elapsed = state && sameTrack(state.track, typedTrack)
        ? Math.max(0, Date.now() - state.startedAt)
        : Math.max(0, Number(player.position ?? 0));
      const duration = Number(typedTrack.info.duration ?? 0);
      const msPlayed = Number.isFinite(duration) && duration > 0 ? Math.min(duration, elapsed) : elapsed;
      const skipped = Boolean(player.getData<boolean>("monoSkipped"));
      await StatsService.recordPlay({
        userDiscordId: requesterId,
        guildDiscordId: guildId,
        trackUri: trackUri(typedTrack),
        title: trackTitle(typedTrack),
        artist: String(typedTrack.info.author ?? "Unknown").replace(/[\u0000-\u001F\u007F]/g, " ").slice(0, 200),
        msPlayed,
        skipped,
      }).catch((err) => logger.error({ err: asError(err), guildId, track: trackTitle(typedTrack) }, "Failed to record playback statistics"));
    }
    player.setData("monoSkipped", false);
    musicLog("TRACK_END", { guildId, track: trackTitle(typedTrack), extra: { node: nodeIdOf(player) } });
    sessionRecoveryService.capture(player);
    publishPlayerState(guildId, "TRACK_END", "trackEnd");
  });

  const recoverFailedTrack = (player: Player, track: TrackLike, reason: string) => {
    if (!isPlayerOperational(player)) return;
    const guildId = safeGuildId(player.guildId);
    const count = Math.min(MAX_TRACK_FAILURES_PER_GUILD + 1, (failureCounts.get(guildId) ?? 0) + 1);
    failureCounts.set(guildId, count);
    if (count > MAX_TRACK_FAILURES_PER_GUILD) {
      logger.error({ guildId, reason, count, track: trackTitle(track) }, "Track failure circuit breaker opened; refusing repeated automatic recovery");
      player.setData("monoTrackRecoveryOpen", true);
      return;
    }

    clearRecovery(guildId);
    const expectedUri = trackUri(track);
    const expectedTitle = trackTitle(track);
    const timer = setTimeout(() => {
      recoveryTimers.delete(guildId);
      if (!isPlayerOperational(player)) return;
      const current = player.queue.current as unknown as TrackLike | undefined;
      const currentUri = trackUri(current);
      const currentTitle = trackTitle(current);
      const matches = expectedUri ? currentUri === expectedUri : currentTitle === expectedTitle;
      if (!matches) return;
      void recoveryLocks.runExclusive(`track-recovery:${guildId}`, async () => {
        if (!isPlayerOperational(player)) return;
        try {
          await PlaybackService.skip(guildId, 0);
          player.setData("monoLastRecoveryAt", Date.now());
          player.setData("monoTrackRecoveryOpen", false);
          musicLog("TRACK_RECOVERY", { guildId, track: expectedTitle, extra: { reason, attempt: count } });
        } catch (error) {
          logger.error({ err: asError(error), guildId, reason, track: expectedTitle }, "Failed to recover from track failure");
        }
      }).catch((error) => logger.error({ err: asError(error), guildId }, "Track recovery lock failed"));
    }, STUCK_RECOVERY_DELAY_MS);
    recoveryTimers.set(guildId, timer);
  };

  manager.on("trackError", (player, track, payload) => {
    const guildId = safeGuildId(player.guildId);
    logger.warn({ guildId, track: trackTitle(track as TrackLike), payload }, "Lavalink track error; automatic skip/recovery engaged");
    recoverFailedTrack(player, track as TrackLike, "track-error");
    publishPlayerState(guildId, "TRACK_ERROR", "trackError");
  });

  manager.on("trackStuck", (player, track, payload) => {
    const guildId = safeGuildId(player.guildId);
    logger.warn({ guildId, track: trackTitle(track as TrackLike), payload }, "Lavalink track stuck; automatic skip/recovery engaged");
    recoverFailedTrack(player, track as TrackLike, "track-stuck");
    publishPlayerState(guildId, "TRACK_STUCK", "trackStuck");
  });

  manager.on("playerQueueEmptyStart", async (player) => {
    const guildId = safeGuildId(player.guildId);
    clearGuildTimer(guildId);
    const guild = await prisma.guild.findUnique({ where: { discordId: guildId }, select: { always247: true, idleTimeoutMinutes: true } }).catch((error) => {
      logger.error({ err: asError(error), guildId }, "Failed to read guild idle policy");
      return null;
    });
    if (player.getData<boolean>("always247") || player.getData<boolean>("stayInChannel") || guild?.always247) return;

    const rawMinutes = Number(guild?.idleTimeoutMinutes ?? 5);
    const minutes = Number.isFinite(rawMinutes) ? Math.max(1, Math.min(120, Math.trunc(rawMinutes))) : 5;
    const delay = Math.max(EMPTY_TIMER_FLOOR_MS, Math.min(MAX_EMPTY_TIMER_MS, minutes * 60_000));
    const startedGeneration = Number(player.getData<number>("monoTrackGeneration") ?? 0);
    const startedNode = nodeIdOf(player);
    const handle = setTimeout(() => {
      emptyTimers.delete(guildId);
      void recoveryLocks.runExclusive(`idle:${guildId}`, async () => {
        try {
          if (!isPlayerOperational(player)) return;
          if (player.getData<boolean>("always247") || player.getData<boolean>("stayInChannel")) return;
          if (Number(player.getData<number>("monoTrackGeneration") ?? 0) !== startedGeneration) return;
          if (startedNode && nodeIdOf(player) !== startedNode) return;
          if (!player.playing && !player.queue.current && !player.queue.tracks.length) {
            sessionRecoveryService.markIntentional(guildId);
          await player.destroy("idle timeout");
          }
        } catch (error) {
          logger.error({ err: asError(error), guildId }, "Idle player cleanup failed");
        }
      }).catch((error) => logger.error({ err: asError(error), guildId }, "Idle cleanup lock failed"));
    }, delay);
    emptyTimers.set(guildId, handle);
  });

  manager.on("playerQueueEmptyCancel", (player) => {
    const guildId = safeGuildId(player.guildId);
    clearGuildTimer(guildId);
    publishPlayerState(guildId, "QUEUE_CHANGED", "queueEmptyCancel");
  });

  manager.on("queueEnd", async (player) => {
    publishPlayerState(safeGuildId(player.guildId), "QUEUE_CHANGED", "queueEnd");
    const guildId = safeGuildId(player.guildId);
    if (!Boolean(player.getData<boolean>("autoplay"))) return;
    await recoveryLocks.runExclusive(`autoplay:${guildId}`, async () => {
      if (!isPlayerOperational(player) || player.queue.tracks.length > 0 || player.playing) return;
      const current = (player.queue.current ?? player.getData<TrackLike>("monoLastTrack")) as TrackLike | undefined;
      const radioQuery = player.getData<string>("radioQuery");
      const searchModifier = player.getData<string>("searchModifier");
      const base = radioQuery || (current ? `${current.info?.author ?? ""} ${current.info?.title ?? ""}`.trim() : "music");
      const query = `${base} ${searchModifier || "mix"}`.trim().slice(0, MAX_SEARCH_LENGTH);
      try {
        const session = GuildSession.for(guildId);
        const result = await session.search(player, query, current?.requester);
        const currentUri = current ? trackUri(current) : "";
        const candidate = (result?.tracks ?? []).find((item: TrackLike) => {
          const uri = trackUri(item);
          return Boolean(uri) && uri !== currentUri;
        }) as TrackLike | undefined;
        if (!candidate) {
          logger.warn({ guildId, query }, "Autoplay produced no usable track");
          return;
        }
        if (!await session.addToQueue(player, candidate)) return;
        player.setData("monoRequesterId", String((candidate.requester as { id?: unknown })?.id ?? (current?.requester as { id?: unknown })?.id ?? "").slice(0, 64));
        if (!player.playing) await PlaybackService.play(guildId);
        musicLog("AUTOPLAY", { guildId, track: trackTitle(candidate), extra: { node: nodeIdOf(player) } });
      } catch (error) {
        logger.error({ err: asError(error), guildId, query }, "Autoplay failed");
      }
    }).catch((error) => logger.error({ err: asError(error), guildId }, "Autoplay lock failed"));
  });

  client.on(Events.VoiceStateUpdate, async (oldState: VoiceState, newState: VoiceState) => {
    const guildId = safeGuildId(newState.guild.id);
    const player = manager.getPlayer(guildId);
    if (!player) return;

    try {
      if (newState.id === client.user?.id && oldState.channelId && newState.channelId !== oldState.channelId) {
        if (player.getData<boolean>("voiceLocked")) {
          await player.changeVoiceState({ voiceChannelId: oldState.channelId });
          return;
        }
        if (!newState.channelId && player.getData<boolean>("always247")) {
          await player.changeVoiceState({ voiceChannelId: oldState.channelId });
        }
      }

      const followUser = player.getData<string>("followUser");
      if (followUser && newState.id === followUser && newState.channelId && newState.channelId !== player.voiceChannelId && !player.getData<boolean>("voiceLocked")) {
        await player.changeVoiceState({ voiceChannelId: newState.channelId });
      }
    } catch (error) {
      logger.error({ err: asError(error), guildId }, "Voice state synchronization failed");
    }
  });

  manager.on("playerDisconnect", (player, oldChannelId) => {
    const guildId = safeGuildId(player.guildId);
    sessionRecoveryService.capture(player);
    clearGuildTimer(guildId);
    const always247 = Boolean(player.getData<boolean>("always247"));
    musicLog("DISCONNECT", { guildId, extra: { oldChannelId, always247 } });
    if (always247 && oldChannelId) {
      const restore = setTimeout(() => {
        if (!isPlayerOperational(player) || player.voiceChannelId) return;
        void player.changeVoiceState({ voiceChannelId: oldChannelId }).catch((error) => logger.error({ err: asError(error), guildId }, "Failed to restore always247 voice connection"));
      }, 2_000);
      // Keep the timeout referenced through player data so repeated disconnect
      // events can be diagnosed without introducing another global registry.
      player.setData("mono247RestoreScheduledAt", Date.now());
      void restore;
    }
  });

  manager.on("playerDestroy", (player) => {
    const guildId = safeGuildId(player.guildId);
    sessionRecoveryService.capture(player);
    sessionRecoveryService.onDestroyed(guildId);
    publishPlayerState(guildId, "PLAYER_LIFECYCLE", "playerDestroy");
    clearGuildTimer(guildId);
    clearRecovery(guildId);
    clearFailoverRetry(guildId);
    starts.delete(guildId);
    failureCounts.delete(guildId);
    failoverCooldown.delete(guildId);
    for (const guilds of playersByNode.values()) guilds.delete(guildId);
    nodeOrchestrator.unbindPlayer(guildId);
    musicLog("DESTROY", { guildId });
  });

  (manager as unknown as { getNoirSessionRecoveryHealth?: () => ReturnType<typeof sessionRecoveryService.health> }).getNoirSessionRecoveryHealth = () => sessionRecoveryService.health();
  (manager as unknown as { stopNoirSessionRecovery?: () => void }).stopNoirSessionRecovery = () => {
    sessionReconciliationService.stop();
    sessionRecoveryService.stop();
  };
  (manager as unknown as { getNoirSessionControlPlaneHealth?: () => { recovery: ReturnType<typeof sessionRecoveryService.health>; reconciliation: ReturnType<typeof sessionReconciliationService.health> } }).getNoirSessionControlPlaneHealth = () => ({
    recovery: sessionRecoveryService.health(),
    reconciliation: sessionReconciliationService.health(),
  });
  (manager as unknown as { getNoirNodeTopology?: () => readonly ReturnType<LavalinkNodeOrchestrator["snapshot"]>[number][] }).getNoirNodeTopology = () => nodeOrchestrator.snapshot();
  (manager as unknown as { assertNoirNodeRuntime?: () => void }).assertNoirNodeRuntime = () => nodeOrchestrator.assertTopology(config.lavalink.nodes.map((node) => node.id));
  (manager as unknown as { getNoirHealthyNodeCount?: () => number }).getNoirHealthyNodeCount = () => nodeOrchestrator.healthyNodeCount();
  (manager as unknown as { getNoirAudioRuntimeWiring?: () => ReturnType<typeof buildAudioRuntimeWiring> }).getNoirAudioRuntimeWiring = () => buildAudioRuntimeWiring(nodeOrchestrator);
  (manager as unknown as { getNoirLavalinkHealthStop?: () => void }).getNoirLavalinkHealthStop = stopLavalinkHealthMonitor;
  return manager;
}
