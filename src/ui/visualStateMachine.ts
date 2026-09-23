/** NOIR MUSIC // GLYPH-17 VISUAL STATE MACHINE — predictable state transitions for UI surfaces. */
export type VisualState = "IDLE" | "LOADING" | "READY" | "ACTIVE" | "PLAYING" | "PAUSED" | "BUFFERING" | "BUSY" | "SUCCESS" | "WARNING" | "ERROR" | "EMPTY" | "STALE" | "LOCKED" | "MUTED" | "RECONNECTING";

export interface VisualTransition { from: VisualState; event: string; to: VisualState; }

const GRAPH: readonly VisualTransition[] = [
  { from: "IDLE", event: "load", to: "LOADING" },
  { from: "LOADING", event: "ready", to: "READY" },
  { from: "READY", event: "activate", to: "ACTIVE" },
  { from: "ACTIVE", event: "complete", to: "SUCCESS" },
  { from: "ACTIVE", event: "warn", to: "WARNING" },
  { from: "ACTIVE", event: "error", to: "ERROR" },
  { from: "READY", event: "empty", to: "EMPTY" },
  { from: "READY", event: "stale", to: "STALE" },
  { from: "ACTIVE", event: "lock", to: "LOCKED" },
  { from: "LOCKED", event: "unlock", to: "READY" },
  { from: "ERROR", event: "retry", to: "LOADING" },
  { from: "STALE", event: "refresh", to: "LOADING" },
  { from: "SUCCESS", event: "reset", to: "READY" },
  { from: "WARNING", event: "resolve", to: "READY" },
  { from: "PLAYING", event: "pause", to: "PAUSED" },
  { from: "PAUSED", event: "resume", to: "PLAYING" },
  { from: "PLAYING", event: "buffer", to: "BUFFERING" },
  { from: "BUFFERING", event: "ready", to: "PLAYING" },
  { from: "PLAYING", event: "reconnect", to: "RECONNECTING" },
  { from: "RECONNECTING", event: "ready", to: "PLAYING" },
  { from: "PLAYING", event: "busy", to: "BUSY" },
  { from: "PAUSED", event: "busy", to: "BUSY" },
  { from: "BUSY", event: "ready", to: "READY" },
];

export function transition(state: VisualState, event: string): VisualState {
  return GRAPH.find((edge) => edge.from === state && edge.event === event)?.to ?? state;
}

export function canTransition(state: VisualState, event: string): boolean {
  return GRAPH.some((edge) => edge.from === state && edge.event === event);
}

export function transitionGraph(): readonly VisualTransition[] { return GRAPH; }

export function visualStatePriority(state: VisualState): number {
  return ({ ERROR: 100, LOCKED: 95, RECONNECTING: 90, BUFFERING: 80, WARNING: 75, STALE: 70, LOADING: 65, BUSY: 60, PLAYING: 55, ACTIVE: 50, PAUSED: 45, MUTED: 40, SUCCESS: 35, READY: 30, EMPTY: 20, IDLE: 10 })[state];
}
