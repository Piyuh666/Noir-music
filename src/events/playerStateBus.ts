/**
 * NOIR MUSIC — canonical player state signal bus.
 *
 * This is deliberately domain-neutral: audio/runtime code publishes signals;
 * UI and other projections subscribe without importing one another. A
 * monotonically increasing per-guild version makes stale refreshes detectable
 * and gives every consumer one ordering primitive.
 */
export type PlayerStateSignal =
  | "PLAYBACK_MUTATION"
  | "TRACK_START"
  | "TRACK_END"
  | "TRACK_ERROR"
  | "TRACK_STUCK"
  | "QUEUE_CHANGED"
  | "PLAYER_LIFECYCLE";

export interface PlayerStateEvent {
  readonly guildId: string;
  readonly signal: PlayerStateSignal;
  readonly operation?: string;
  readonly at: number;
  readonly version: number;
}

type Listener = (event: PlayerStateEvent) => void;

const listeners = new Set<Listener>();
const versions = new Map<string, number>();

export function publishPlayerState(guildId: string, signal: PlayerStateSignal, operation?: string): PlayerStateEvent {
  const id = String(guildId ?? "").trim();
  if (!id) throw new TypeError("guildId is required");
  const version = (versions.get(id) ?? 0) + 1;
  versions.set(id, version);
  const event = Object.freeze({ guildId: id, signal, operation, at: Date.now(), version });
  for (const listener of [...listeners]) {
    try { listener(event); } catch { /* projections must never break playback */ }
  }
  return event;
}

export function subscribePlayerState(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function playerStateVersion(guildId: string): number {
  return versions.get(String(guildId ?? "").trim()) ?? 0;
}

export function clearPlayerStateVersion(guildId: string): void {
  versions.delete(String(guildId ?? "").trim());
}

export function playerStateBusHealth() {
  return Object.freeze({ listeners: listeners.size, guilds: versions.size });
}
