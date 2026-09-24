/** NOIR MUSIC RUNTIME HEALTH CORE
 *
 * Small, dependency-free runtime counters. The module intentionally stores no
 * user content and no secrets. It exists to make process health measurable,
 * bounded, and easy to expose to operators without coupling health logic to
 * Discord, Lavalink, Prisma, or Redis implementations.
 */
export interface RuntimeHealthSnapshot {
  startedAt: number;
  uptimeMs: number;
  eventLoopSamples: number;
  lastEventLoopLagMs: number;
  maxEventLoopLagMs: number;
  heapUsedBytes: number;
  rssBytes: number;
  externalBytes: number;
  counters: Readonly<Record<string, number>>;
}

const startedAt = Date.now();
const counters = new Map<string, number>();
let eventLoopSamples = 0;
let lastEventLoopLagMs = 0;
let maxEventLoopLagMs = 0;
let heapUsedBytes = 0;
let rssBytes = 0;
let externalBytes = 0;
let loopHandle: ReturnType<typeof setTimeout> | undefined;
let running = false;

function safeCounterName(name: string): string {
  const value = String(name ?? "").trim();
  if (!/^[a-zA-Z0-9._:-]{1,64}$/.test(value)) throw new TypeError("Invalid runtime counter name");
  return value;
}

export function incrementRuntimeCounter(name: string, amount = 1): number {
  const key = safeCounterName(name);
  const delta = Number.isFinite(amount) ? Math.trunc(amount) : 0;
  const next = (counters.get(key) ?? 0) + delta;
  counters.set(key, next);
  return next;
}

export function startRuntimeHealthSampler(intervalMs = 5_000): void {
  if (running) return;
  running = true;
  const interval = Math.max(1_000, Math.min(60_000, Math.trunc(intervalMs)));
  let expected = Date.now() + interval;
  const sample = () => {
    if (!running) return;
    const now = Date.now();
    const lag = Math.max(0, now - expected);
    lastEventLoopLagMs = lag;
    maxEventLoopLagMs = Math.max(maxEventLoopLagMs, lag);
    const memory = process.memoryUsage();
    heapUsedBytes = memory.heapUsed;
    rssBytes = memory.rss;
    externalBytes = memory.external;
    eventLoopSamples += 1;
    expected = now + interval;
    loopHandle = setTimeout(sample, interval);
    if (typeof loopHandle.unref === "function") loopHandle.unref();
  };
  loopHandle = setTimeout(sample, interval);
  if (typeof loopHandle.unref === "function") loopHandle.unref();
}

export function stopRuntimeHealthSampler(): void {
  running = false;
  if (loopHandle) clearTimeout(loopHandle);
  loopHandle = undefined;
}

export function runtimeHealth(): RuntimeHealthSnapshot {
  return Object.freeze({
    startedAt,
    uptimeMs: Math.max(0, Date.now() - startedAt),
    eventLoopSamples,
    lastEventLoopLagMs,
    maxEventLoopLagMs,
    heapUsedBytes,
    rssBytes,
    externalBytes,
    counters: Object.freeze(Object.fromEntries(counters.entries())),
  });
}

export function resetRuntimeHealthForTests(): void {
  counters.clear();
  eventLoopSamples = 0;
  lastEventLoopLagMs = 0;
  maxEventLoopLagMs = 0;
  heapUsedBytes = 0;
  rssBytes = 0;
  externalBytes = 0;
}
