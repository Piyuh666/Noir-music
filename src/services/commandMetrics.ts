import { logger } from "../utils/logger";

export type CommandMetricSnapshot = {
  commandId: string;
  calls: number;
  failures: number;
  timeouts: number;
  totalMs: number;
  maxMs: number;
  averageMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  lastAt: number;
  lastFailureAt: number;
};

type Metric = {
  calls: number;
  failures: number;
  timeouts: number;
  totalMs: number;
  maxMs: number;
  lastAt: number;
  lastFailureAt: number;
  samples: number[];
};

const metrics = new Map<string, Metric>();
const MAX_KEYS = 1000;
const MAX_SAMPLES = 256;

function normalizeCommandId(value: string): string {
  const id = String(value ?? "").trim();
  if (!id || id.length > 128 || /[\u0000-\u001F\u007F]/.test(id)) throw new TypeError("Invalid command metric id");
  return id;
}

function percentile(samples: readonly number[], ratio: number): number {
  if (!samples.length) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(ratio * sorted.length) - 1));
  return sorted[index] ?? 0;
}

export function recordCommandMetric(commandId: string, durationMs: number, failed: boolean, timeout = false): void {
  const id = normalizeCommandId(commandId);
  const safe = Number.isFinite(durationMs) ? Math.max(0, Math.round(durationMs)) : 0;
  const current = metrics.get(id) ?? {
    calls: 0,
    failures: 0,
    timeouts: 0,
    totalMs: 0,
    maxMs: 0,
    lastAt: 0,
    lastFailureAt: 0,
    samples: [],
  };

  current.calls += 1;
  current.failures += failed ? 1 : 0;
  current.timeouts += timeout ? 1 : 0;
  current.totalMs += safe;
  current.maxMs = Math.max(current.maxMs, safe);
  current.lastAt = Date.now();
  if (failed) current.lastFailureAt = current.lastAt;
  current.samples.push(safe);
  if (current.samples.length > MAX_SAMPLES) current.samples.splice(0, current.samples.length - MAX_SAMPLES);
  metrics.set(id, current);

  if (metrics.size > MAX_KEYS) {
    const oldest = [...metrics.entries()].sort((a, b) => a[1].lastAt - b[1].lastAt)[0]?.[0];
    if (oldest) metrics.delete(oldest);
  }
  if (safe >= 3000) logger.warn({ commandId: id, durationMs: safe, failed, timeout }, "Slow NOIR MUSIC command");
}

export function commandMetricsSnapshot(): CommandMetricSnapshot[] {
  return [...metrics.entries()]
    .sort((a, b) => b[1].lastAt - a[1].lastAt)
    .map(([commandId, m]) => ({
      commandId,
      calls: m.calls,
      failures: m.failures,
      timeouts: m.timeouts,
      totalMs: m.totalMs,
      maxMs: m.maxMs,
      averageMs: m.calls ? Math.round(m.totalMs / m.calls) : 0,
      p50Ms: percentile(m.samples, 0.50),
      p95Ms: percentile(m.samples, 0.95),
      p99Ms: percentile(m.samples, 0.99),
      lastAt: m.lastAt,
      lastFailureAt: m.lastFailureAt,
    }));
}

export function clearCommandMetrics(): void {
  metrics.clear();
}
