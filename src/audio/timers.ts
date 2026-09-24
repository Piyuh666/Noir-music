import { logger } from "../utils/logger";
import { GuildSession } from "./session";

export interface ActiveTimer {
  id: string;
  guildId: string;
  kind: string;
  createdAt: number;
  fireAt: number;
  handle: NodeJS.Timeout;
}

export interface TimerSnapshot {
  id: string;
  guildId: string;
  kind: string;
  createdAt: number;
  fireAt: number;
  remainingMs: number;
}

export interface TimerStats {
  guilds: number;
  activeTimers: number;
  capacity: number;
  capacityUsed: number;
  capacityRemaining: number;
}

const MAX_DELAY_MS = 2 ** 31 - 1;
const MAX_TIMERS_PER_GUILD = 32;
const MAX_TOTAL_TIMERS = 10_000;
const timers = new Map<string, Map<string, ActiveTimer>>();
let sequence = 0;

function normalize(value: string, field: string, max = 64): string {
  const text = String(value ?? "").trim();
  if (!text || text.length > max || /[\u0000-\u001F\u007F]/.test(text)) throw new TypeError(`Invalid timer ${field}`);
  return text;
}

function activeTimerCount(): number {
  let total = 0;
  for (const guildTimers of timers.values()) total += guildTimers.size;
  return total;
}

function removeTimer(timer: ActiveTimer): void {
  const guildTimers = timers.get(timer.guildId);
  if (!guildTimers) return;
  guildTimers.delete(timer.id);
  if (guildTimers.size === 0) timers.delete(timer.guildId);
}

export function registerTimer(
  guildId: string,
  kind: string,
  delayMs: number,
  action: () => void | Promise<void>,
): ActiveTimer {
  const safeGuild = normalize(guildId, "guildId", 64);
  const safeKind = normalize(kind, "kind");
  if (!Number.isFinite(delayMs) || delayMs < 1) throw new RangeError("Timer delay must be a finite positive number");
  if (typeof action !== "function") throw new TypeError("Timer action must be a function");
  const safeDelay = Math.min(Math.floor(delayMs), MAX_DELAY_MS);

  const currentTotal = activeTimerCount();
  if (currentTotal >= MAX_TOTAL_TIMERS) throw new Error("TIMER_CAPACITY");
  const guildTimers = timers.get(safeGuild) ?? new Map<string, ActiveTimer>();
  if (guildTimers.size >= MAX_TIMERS_PER_GUILD) throw new Error("TIMER_GUILD_CAPACITY");

  sequence = (sequence + 1) % 1_000_000_000;
  const id = `${safeGuild}:${Date.now().toString(36)}:${sequence.toString(36)}`;
  const createdAt = Date.now();
  let timer!: ActiveTimer;

  const handle = setTimeout(() => {
    removeTimer(timer);
    Promise.resolve()
      .then(() => action())
      .catch((error) => logger.error({ err: error, guildId: safeGuild, timerId: id, kind: safeKind }, "Scheduled timer action failed"));
  }, safeDelay);

  if (typeof handle.unref === "function") handle.unref();
  timer = { id, guildId: safeGuild, kind: safeKind, createdAt, fireAt: createdAt + safeDelay, handle };
  guildTimers.set(id, timer);
  timers.set(safeGuild, guildTimers);
  return timer;
}

/** Execute a timer callback inside the same per-guild audio mutex used by commands.
 * This closes the race between delayed automation and live skip/play/queue/filter
 * interactions without holding the lock across the timer's own scheduling delay. */
export async function runGuildTimerAction<T>(guildId: string, action: () => Promise<T> | T): Promise<T> {
  const session = GuildSession.for(guildId);
  return session.withLock(async () => action());
}

export function cancelTimer(guildId: string, timerId: string): boolean {
  const safeGuild = normalize(guildId, "guildId", 64);
  const id = normalize(timerId, "timerId", 160);
  const timer = timers.get(safeGuild)?.get(id);
  if (!timer) return false;
  clearTimeout(timer.handle);
  removeTimer(timer);
  return true;
}

export function clearTimersOfKind(guildId: string, kind: string): number {
  const safeGuild = normalize(guildId, "guildId", 64);
  const safeKind = normalize(kind, "kind");
  const guildTimers = timers.get(safeGuild);
  if (!guildTimers) return 0;
  let removed = 0;
  for (const timer of [...guildTimers.values()]) {
    if (timer.kind !== safeKind) continue;
    clearTimeout(timer.handle);
    guildTimers.delete(timer.id);
    removed++;
  }
  if (!guildTimers.size) timers.delete(safeGuild);
  return removed;
}

export function clearGuildTimers(guildId: string): number {
  const safeGuild = normalize(guildId, "guildId", 64);
  const guildTimers = timers.get(safeGuild);
  if (!guildTimers) return 0;
  for (const timer of guildTimers.values()) clearTimeout(timer.handle);
  const count = guildTimers.size;
  timers.delete(safeGuild);
  return count;
}

export function listTimers(guildId: string): TimerSnapshot[] {
  const safeGuild = normalize(guildId, "guildId", 64);
  const now = Date.now();
  return [...(timers.get(safeGuild)?.values() ?? [])]
    .sort((a, b) => a.fireAt - b.fireAt)
    .map((timer) => ({
      id: timer.id,
      guildId: timer.guildId,
      kind: timer.kind,
      createdAt: timer.createdAt,
      fireAt: timer.fireAt,
      remainingMs: Math.max(0, timer.fireAt - now),
    }));
}

export function timerStats(): TimerStats {
  const activeTimers = activeTimerCount();
  return {
    guilds: timers.size,
    activeTimers,
    capacity: MAX_TOTAL_TIMERS,
    capacityUsed: activeTimers,
    capacityRemaining: Math.max(0, MAX_TOTAL_TIMERS - activeTimers),
  };
}
