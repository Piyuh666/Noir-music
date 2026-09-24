/**
 * NOIR MUSIC — continuous session convergence supervisor V62.
 *
 * Recovery handles an observed player-destroy event. Reconciliation handles
 * the harder class of failures where state silently drifts without producing
 * the expected event. It periodically compares the desired session snapshot
 * with the live player boundary and asks the existing recovery/control paths
 * to converge the session. This service owns no audio implementation details.
 */
import type { Player } from "lavalink-client";
import { logger } from "../utils/logger";
import { publishPlayerState } from "../events/playerStateBus";
import { sessionRecoveryService } from "./sessionRecoveryService";

const DEFAULT_INTERVAL_MS = 10_000;
const MAX_PARALLEL = 4;

function isOperational(player: Player | undefined): player is Player {
  if (!player) return false;
  const candidate = player as unknown as { destroyed?: unknown; guildId?: unknown };
  return candidate.destroyed !== true && typeof candidate.guildId === "string";
}

function always247(player: Player): boolean {
  return Boolean(player.getData<boolean>("always247"));
}

type ReconciliationAdapter = Readonly<{
  guildIds: () => readonly string[];
  getPlayer: (guildId: string) => Player | undefined;
}>;

export type ReconciliationSnapshot = Readonly<{
  running: boolean;
  intervalMs: number;
  cycles: number;
  repairsRequested: number;
  missingPlayerDetections: number;
  lastCycleAt: number;
  lastErrorAt: number;
  activeChecks: number;
  initialized: boolean;
  persistedGuilds: number;
  driftDetections: number;
  voiceDriftDetections: number;
  lastDriftAt: number;
}>;

export class SessionReconciliationService {
  private timer?: ReturnType<typeof setInterval>;
  private intervalMs = DEFAULT_INTERVAL_MS;
  private running = false;
  private cycles = 0;
  private repairsRequested = 0;
  private missingPlayerDetections = 0;
  private lastCycleAt = 0;
  private lastErrorAt = 0;
  private activeChecks = 0;
  private adapter?: ReconciliationAdapter;
  private initialized = false;
  private initializationPromise?: Promise<void>;
  private driftDetections = 0;
  private voiceDriftDetections = 0;
  private lastDriftAt = 0;

  configure(adapter: ReconciliationAdapter): void {
    this.adapter = adapter;
  }

  start(intervalMs = DEFAULT_INTERVAL_MS): void {
    if (this.running) return;
    this.intervalMs = Math.max(2_000, Math.trunc(intervalMs));
    this.running = true;
    this.timer = setInterval(() => void this.runCycle(), this.intervalMs);
    const maybeUnref = this.timer as unknown as { unref?: () => void };
    maybeUnref.unref?.();
    this.initializationPromise = sessionRecoveryService.start()
      .then(() => { this.initialized = true; })
      .catch((error) => {
        this.lastErrorAt = Date.now();
        logger.warn({ err: error }, "Session recovery persistence initialization failed; using local state");
        this.initialized = true;
      })
      .finally(() => { void this.runCycle(); });
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    this.running = false;
    this.activeChecks = 0;
    this.initialized = false;
    this.initializationPromise = undefined;
    this.adapter = undefined;
  }

  private async runCycle(): Promise<void> {
    if (!this.running || !this.initialized || this.activeChecks > 0) return;
    this.activeChecks = 1;
    this.cycles += 1;
    this.lastCycleAt = Date.now();
    try {
      const adapter = this.adapter;
      if (!adapter) return;
      const guildIds = [...new Set([...adapter.guildIds(), ...sessionRecoveryService.recoverableGuildIds()])];
      for (let offset = 0; offset < guildIds.length; offset += MAX_PARALLEL) {
        const batch = guildIds.slice(offset, offset + MAX_PARALLEL);
        await Promise.all(batch.map((guildId) => this.inspect(guildId)));
      }
    } catch (error) {
      this.lastErrorAt = Date.now();
      logger.warn({ err: error }, "Session reconciliation cycle failed");
    } finally {
      this.activeChecks = 0;
    }
  }

  private async inspect(guildId: string): Promise<void> {
    const player = this.adapter?.getPlayer(guildId);
    if (!isOperational(player)) {
      this.missingPlayerDetections += 1;
      this.driftDetections += 1;
      this.lastDriftAt = Date.now();
      this.requestRepair(guildId, "player-missing");
      return;
    }

    // Refresh the bounded recovery snapshot so an event-less failure still
    // has a recent desired state available to the recovery service.
    sessionRecoveryService.capture(player);

    // A missing player is the only repair this supervisor performs directly.
    // Playback stalls and voice disconnects already have dedicated, safer
    // Lavalink event handlers; duplicating those mutations here would risk
    // double-skips or duplicate queue restoration.
    if (always247(player) && !player.voiceChannelId) {
      this.voiceDriftDetections += 1;
      this.driftDetections += 1;
      this.lastDriftAt = Date.now();
      publishPlayerState(guildId, "PLAYER_LIFECYCLE", "reconcile-voice-drift");
    }
  }

  private requestRepair(guildId: string, reason: string): void {
    this.repairsRequested += 1;
    sessionRecoveryService.requestRecovery(guildId, reason);
  }

  health(): ReconciliationSnapshot {
    return Object.freeze({
      running: this.running,
      intervalMs: this.intervalMs,
      cycles: this.cycles,
      repairsRequested: this.repairsRequested,
      missingPlayerDetections: this.missingPlayerDetections,
      lastCycleAt: this.lastCycleAt,
      lastErrorAt: this.lastErrorAt,
      activeChecks: this.activeChecks,
      initialized: this.initialized,
      persistedGuilds: sessionRecoveryService.recoverableGuildIds().length,
      driftDetections: this.driftDetections,
      voiceDriftDetections: this.voiceDriftDetections,
      lastDriftAt: this.lastDriftAt,
    });
  }
}

export const sessionReconciliationService = new SessionReconciliationService();



export type ReconciliationVisualState = Readonly<{
  status: 'STABLE' | 'DRIFTING' | 'REPAIRING';
  intensity: 'QUIET' | 'ACTIVE' | 'ALERT';
  driftCount: number;
  repairCount: number;
  health: 'STABLE' | 'PRESSURED' | 'CRITICAL';
  ratio: number;
}>;

export function reconciliationVisualState(snapshot: ReconciliationSnapshot): ReconciliationVisualState {
  const active = snapshot.activeChecks > 0;
  const drift = snapshot.driftDetections;
  const status = active || snapshot.repairsRequested > 0 && snapshot.lastCycleAt >= snapshot.lastDriftAt ? 'REPAIRING' : drift > 0 ? 'DRIFTING' : 'STABLE';
  const intensity = snapshot.voiceDriftDetections >= 5 || snapshot.missingPlayerDetections >= 5 ? 'ALERT' : drift > 0 ? 'ACTIVE' : 'QUIET';
  const health = snapshot.missingPlayerDetections >= 10 || snapshot.voiceDriftDetections >= 10 ? 'CRITICAL' : drift > 0 ? 'PRESSURED' : 'STABLE';
  const ratio = Math.max(0, Math.min(1, drift / Math.max(1, snapshot.cycles)));
  return Object.freeze({ status, intensity, driftCount: drift, repairCount: snapshot.repairsRequested, health, ratio });
}
