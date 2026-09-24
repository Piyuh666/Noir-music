/**
 * NOIR MUSIC // AUDIO RUNTIME WIRING V43
 *
 * One read-only integration boundary for the real audio subsystems. This does
 * not import every command file (that would create a dependency cycle); it
 * consumes the canonical registries/services already used by those modules.
 * The result is intended for dashboards, diagnostics, UI telemetry and health
 * decisions, not as a fake execution layer.
 */
import type { LavalinkNodeOrchestrator } from "./nodeOrchestrator";
import { EFFECTS } from "./filters";
import { timerStats } from "./timers";
import { PlaybackService, type PlaybackSnapshot } from "./playbackService";

export interface AudioRuntimeWiringSnapshot {
  readonly version: "NOIR-AUDIO-WIRING-V43";
  readonly effects: {
    readonly count: number;
    readonly ids: readonly string[];
  };
  readonly automation: ReturnType<typeof timerStats>;
  readonly nodes: ReturnType<LavalinkNodeOrchestrator["snapshot"]>;
  readonly healthyNodes: number;
  readonly playback: { readonly liveSessions: number; readonly snapshots: readonly PlaybackSnapshot[] };
  readonly capacity: {
    readonly total: number;
    readonly used: number;
    readonly remaining: number;
    readonly percent: number;
  };
}

export function buildAudioRuntimeWiring(orchestrator: LavalinkNodeOrchestrator): AudioRuntimeWiringSnapshot {
  const nodes = orchestrator.snapshot();
  const total = nodes.reduce((sum, node) => sum + node.capacityPlayers, 0);
  const used = nodes.reduce((sum, node) => sum + node.capacityUsed, 0);
  const remaining = Math.max(0, total - used);
  const percent = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const guildIds = [...new Set(orchestrator.snapshot().flatMap((node) => node.playerGuildIds))];
  const snapshots = guildIds.map((guildId) => PlaybackService.snapshot(guildId));
  return Object.freeze({
    version: "NOIR-AUDIO-WIRING-V43",
    effects: Object.freeze({ count: Object.keys(EFFECTS).length, ids: Object.freeze(Object.keys(EFFECTS).sort()) }),
    automation: timerStats(),
    nodes,
    playback: Object.freeze({ liveSessions: snapshots.length, snapshots: Object.freeze(snapshots) }),
    healthyNodes: orchestrator.healthyNodeCount(),
    capacity: Object.freeze({ total, used, remaining, percent }),
  });
}

export function assertAudioRuntimeWiring(orchestrator: LavalinkNodeOrchestrator): void {
  const snapshot = buildAudioRuntimeWiring(orchestrator);
  if (!snapshot.nodes.length) throw new Error("AUDIO_RUNTIME_NO_NODES");
  if (!snapshot.effects.count) throw new Error("AUDIO_RUNTIME_NO_FILTERS");
  if (snapshot.capacity.used > snapshot.capacity.total) throw new Error("AUDIO_RUNTIME_CAPACITY_OVERFLOW");
  if (snapshot.playback.snapshots.some((p) => p.queueLength < 0 || p.positionMs < 0 || p.volume < 0 || p.volume > 150)) throw new Error("AUDIO_RUNTIME_PLAYBACK_SNAPSHOT_INVALID");
}
