/**
 * NOIR MUSIC — self-healing session control plane V62.
 *
 * The live player panel is only a projection. This service protects the
 * underlying session itself: before a Lavalink player disappears we retain a
 * bounded desired-state snapshot, then recreate the player and restore its
 * queue/playback when the destruction was not intentional.
 *
 * Recovery is deliberately callback-driven so this service does not import
 * GuildSession/AudioManager and create a circular dependency.
 */
import type { Player } from "lavalink-client";
import { logger } from "../utils/logger";
import { publishPlayerState } from "../events/playerStateBus";
import { durableSessionControlPlane } from "./durableSessionControlPlane";
import type { QueueTrack } from "../audio/session";

export type RecoverySnapshot = Readonly<{
  guildId: string;
  voiceChannelId: string;
  textChannelId: string;
  current?: QueueTrack;
  tracks: readonly QueueTrack[];
  volume: number;
  repeatMode: string;
  autoplay: boolean;
  always247: boolean;
  capturedAt: number;
}>;

type RecoveryAdapter = (snapshot: RecoverySnapshot) => Promise<void>;

const MAX_TRACKS = 500;
const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 1_000;
const MAX_DELAY_MS = 30_000;
const SNAPSHOT_TTL_MS = 30 * 60_000;

function safeText(value: unknown, max = 2048): string {
  return String(value ?? "").replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

function cloneTrack(track: QueueTrack | undefined): QueueTrack | undefined {
  if (!track?.info) return undefined;
  return {
    info: { ...track.info },
    requester: track.requester,
  };
}

export class SessionRecoveryService {
  private readonly snapshots = new Map<string, RecoverySnapshot>();
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly attempts = new Map<string, number>();
  private readonly intentional = new Set<string>();
  private adapter?: RecoveryAdapter;
  private recoveriesSucceeded = 0;
  private recoveriesFailed = 0;
  private lastRecoveryAt = 0;
  private lastRecoveryReason = "";

  configure(adapter: RecoveryAdapter): void {
    this.adapter = adapter;
  }

  capture(player: Player): void {
    const guildId = safeText(player.guildId, 32);
    const voiceChannelId = safeText(player.voiceChannelId, 32);
    const textChannelId = safeText(player.getData<string>("textChannelId"), 32);
    if (!guildId || !voiceChannelId || !textChannelId) return;

    const current = cloneTrack(player.queue.current as unknown as QueueTrack | undefined);
    const tracks = (player.queue.tracks as QueueTrack[])
      .slice(0, MAX_TRACKS)
      .map(cloneTrack)
      .filter((track): track is QueueTrack => Boolean(track));

    // No desired work means an idle player can safely disappear.
    if (!current && tracks.length === 0 && !player.getData<boolean>("always247")) {
      this.snapshots.delete(guildId);
      void durableSessionControlPlane.deleteSnapshot(guildId);
      return;
    }

    const snapshot = Object.freeze({
      guildId,
      voiceChannelId,
      textChannelId,
      current,
      tracks: Object.freeze(tracks),
      volume: Math.max(0, Math.min(150, Number(player.volume ?? 70))),
      repeatMode: String(player.repeatMode ?? "off"),
      autoplay: Boolean(player.getData<boolean>("autoplay")),
      always247: Boolean(player.getData<boolean>("always247")),
      capturedAt: Date.now(),
    });
    this.snapshots.set(guildId, snapshot);
    void durableSessionControlPlane.saveSnapshot(guildId, snapshot);
  }

  markIntentional(guildId: string): void {
    this.intentional.add(safeText(guildId, 32));
  }

  requestRecovery(guildId: string, reason = "reconciliation"): void {
    const id = safeText(guildId, 32);
    if (!id) return;
    const snapshot = this.snapshots.get(id);
    if (!snapshot || Date.now() - snapshot.capturedAt > SNAPSHOT_TTL_MS) {
      this.snapshots.delete(id);
      void durableSessionControlPlane.deleteSnapshot(id);
      return;
    }
    this.lastRecoveryReason = safeText(reason, 64);
    logger.debug({ guildId: id, reason }, "Session recovery requested by control plane");
    this.schedule(id, 0);
  }

  onDestroyed(guildId: string): void {
    const id = safeText(guildId, 32);
    if (this.intentional.delete(id)) {
      this.cancel(id);
      this.snapshots.delete(id);
      void durableSessionControlPlane.deleteSnapshot(id);
      return;
    }
    const snapshot = this.snapshots.get(id);
    if (!snapshot || Date.now() - snapshot.capturedAt > SNAPSHOT_TTL_MS) {
      this.snapshots.delete(id);
      void durableSessionControlPlane.deleteSnapshot(id);
      return;
    }
    this.schedule(id, 0);
  }

  private schedule(guildId: string, delay: number): void {
    const existing = this.timers.get(guildId);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      this.timers.delete(guildId);
      void this.recover(guildId);
    }, delay);
    const maybeUnref = timer as unknown as { unref?: () => void };
    maybeUnref.unref?.();
    this.timers.set(guildId, timer);
  }

  private async recover(guildId: string): Promise<void> {
    const snapshot = this.snapshots.get(guildId);
    const adapter = this.adapter;
    if (!snapshot || !adapter) return;

    const attempt = (this.attempts.get(guildId) ?? 0) + 1;
    this.attempts.set(guildId, attempt);
    if (attempt > MAX_ATTEMPTS) {
      logger.error({ guildId, attempt: attempt - 1 }, "Session self-healing circuit breaker opened");
      publishPlayerState(guildId, "PLAYER_LIFECYCLE", "recovery-exhausted");
      return;
    }

    const leased = await durableSessionControlPlane.acquireLease(guildId);
    if (!leased) {
      logger.debug({ guildId }, "Session recovery fenced by another Noir Music instance");
      return;
    }

    try {
      await adapter(snapshot);
      this.attempts.delete(guildId);
      this.snapshots.delete(guildId);
      this.recoveriesSucceeded += 1;
      this.lastRecoveryAt = Date.now();
      await durableSessionControlPlane.deleteSnapshot(guildId);
      publishPlayerState(guildId, "PLAYER_LIFECYCLE", "recovered");
      logger.info({ guildId, attempt, queueSize: snapshot.tracks.length, hasCurrent: Boolean(snapshot.current) }, "Session self-healed after player loss");
    } catch (error) {
      const delay = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * (2 ** Math.max(0, attempt - 1)));
      logger.warn({ err: error, guildId, attempt, retryInMs: delay }, "Session self-healing attempt failed");
      if (attempt < MAX_ATTEMPTS) this.schedule(guildId, delay);
      else {
        publishPlayerState(guildId, "PLAYER_LIFECYCLE", "recovery-failed");
        this.recoveriesFailed += 1;
        this.lastRecoveryAt = Date.now();
        this.attempts.delete(guildId);
      }
    } finally {
      await durableSessionControlPlane.releaseLease(guildId);
    }
  }

  async hydratePersisted(): Promise<number> {
    const rows = await durableSessionControlPlane.loadSnapshots();
    let restored = 0;
    for (const row of rows) {
      if (Date.now() - row.updatedAt > SNAPSHOT_TTL_MS) {
        void durableSessionControlPlane.deleteSnapshot(row.guildId);
        continue;
      }
      const snapshot = row.snapshot as RecoverySnapshot;
      if (!snapshot?.guildId || !snapshot.voiceChannelId || !snapshot.textChannelId) continue;
      this.snapshots.set(row.guildId, Object.freeze(snapshot));
      restored += 1;
    }
    return restored;
  }

  async start(): Promise<number> {
    await durableSessionControlPlane.start();
    return this.hydratePersisted();
  }

  recoverableGuildIds(): readonly string[] {
    return Object.freeze([...this.snapshots.keys()]);
  }

  cancel(guildId: string): void {
    const id = safeText(guildId, 32);
    const timer = this.timers.get(id);
    if (timer) clearTimeout(timer);
    this.timers.delete(id);
    this.attempts.delete(id);
  }

  stop(): void {
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
    this.attempts.clear();
    this.snapshots.clear();
    this.intentional.clear();
    this.adapter = undefined;
    void durableSessionControlPlane.stop();
  }

  health() {
    const now = Date.now();
    const oldestSnapshotAt = [...this.snapshots.values()].reduce((oldest, snapshot) => Math.min(oldest, snapshot.capturedAt), now);
    return Object.freeze({
      snapshots: this.snapshots.size,
      pending: this.timers.size,
      recovering: this.attempts.size,
      recoveriesSucceeded: this.recoveriesSucceeded,
      recoveriesFailed: this.recoveriesFailed,
      lastRecoveryAt: this.lastRecoveryAt,
      lastRecoveryReason: this.lastRecoveryReason,
      oldestSnapshotAgeMs: this.snapshots.size ? Math.max(0, now - oldestSnapshotAt) : 0,
      durable: durableSessionControlPlane.health(),
    });
  }
}

export const sessionRecoveryService = new SessionRecoveryService();



export type RecoveryVisualState = Readonly<{
  status: 'IDLE' | 'QUEUED' | 'RECOVERING' | 'FAILED';
  intensity: 'QUIET' | 'ACTIVE' | 'ALERT';
  pending: number;
  recovering: number;
  health: 'STABLE' | 'PRESSURED' | 'CRITICAL';
  ratio: number;
}>;

export function recoveryVisualState(health: ReturnType<SessionRecoveryService['health']>): RecoveryVisualState {
  const recovering = health.recovering > 0;
  const failed = health.recoveriesFailed > health.recoveriesSucceeded && health.lastRecoveryAt > 0;
  const status = failed ? 'FAILED' : recovering ? 'RECOVERING' : health.pending > 0 ? 'QUEUED' : 'IDLE';
  const intensity = failed ? 'ALERT' : recovering || health.pending > 0 ? 'ACTIVE' : 'QUIET';
  const healthState = health.recoveriesFailed >= 5 ? 'CRITICAL' : health.pending > 0 || health.recovering > 0 ? 'PRESSURED' : 'STABLE';
  const ratio = Math.max(0, Math.min(1, (health.pending + health.recovering) / Math.max(1, health.snapshots + health.pending + health.recovering)));
  return Object.freeze({ status, intensity, pending: health.pending, recovering: health.recovering, health: healthState, ratio });
}
