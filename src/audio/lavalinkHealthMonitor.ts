import type { LavalinkNodeConfig } from "../config";
import { lavalinkHealthConfig } from "../config";
import { LavalinkNodeOrchestrator } from "./nodeOrchestrator";

interface LavalinkStats {
  players?: number;
  playingPlayers?: number;
  uptime?: number;
  cpu?: { cores?: number; systemLoad?: number; lavalinkLoad?: number };
  memory?: { free?: number; used?: number; reservable?: number; allocated?: number };
}

interface ProbeResult {
  readonly systemLoadPercent?: number;
  readonly lavalinkLoadPercent?: number;
  readonly memoryPercent?: number;
  readonly freeMemoryBytes?: number;
  readonly latencyMs: number;
}

function baseUrl(node: LavalinkNodeConfig): string {
  return `${node.secure ? "https" : "http"}://${node.host}:${node.port}`;
}

function finitePercent(value: unknown): number | undefined {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(100, number * 100)) : undefined;
}

function finiteBytes(value: unknown): number | undefined {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}

async function requestStats(node: LavalinkNodeConfig): Promise<ProbeResult> {
  const controller = new AbortController();
  const started = Date.now();
  const timeout = setTimeout(() => controller.abort(), Math.min(node.healthTimeoutMs, lavalinkHealthConfig.timeoutMs));
  try {
    const response = await fetch(`${baseUrl(node)}/v4/stats`, {
      method: "GET",
      headers: { Authorization: node.authorization, Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP_${response.status}`);
    const stats = await response.json() as LavalinkStats;
    const used = Number(stats.memory?.used ?? NaN);
    const reservable = Number(stats.memory?.reservable ?? NaN);
    const memoryPercent = Number.isFinite(used) && Number.isFinite(reservable) && reservable > 0
      ? Math.max(0, Math.min(100, (used / reservable) * 100))
      : undefined;
    return Object.freeze({
      systemLoadPercent: finitePercent(stats.cpu?.systemLoad),
      lavalinkLoadPercent: finitePercent(stats.cpu?.lavalinkLoad),
      memoryPercent,
      freeMemoryBytes: finiteBytes(stats.memory?.free),
      latencyMs: Math.max(0, Date.now() - started),
    });
  } finally {
    clearTimeout(timeout);
  }
}

function overloaded(node: LavalinkNodeConfig, result: ProbeResult): string | undefined {
  if (result.latencyMs > node.maxLatencyMs) return `LATENCY_${result.latencyMs}MS`;
  if (result.systemLoadPercent !== undefined && result.systemLoadPercent > node.maxSystemLoadPercent) return `SYSTEM_LOAD_${Math.round(result.systemLoadPercent)}PCT`;
  if (result.lavalinkLoadPercent !== undefined && result.lavalinkLoadPercent > node.maxLavalinkLoadPercent) return `LAVALINK_LOAD_${Math.round(result.lavalinkLoadPercent)}PCT`;
  if (result.memoryPercent !== undefined && result.memoryPercent > node.maxMemoryPercent) return `MEMORY_${Math.round(result.memoryPercent)}PCT`;
  if (result.freeMemoryBytes !== undefined && result.freeMemoryBytes < node.minFreeMemoryBytes) return `FREE_MEMORY_${result.freeMemoryBytes}`;
  return undefined;
}

async function probe(node: LavalinkNodeConfig, orchestrator: LavalinkNodeOrchestrator): Promise<void> {
  if (!node.enabled) return;
  try {
    const result = await requestStats(node);
    orchestrator.updateProbe(node.id, {
      systemLoadPercent: result.systemLoadPercent,
      lavalinkLoadPercent: result.lavalinkLoadPercent,
      memoryPercent: result.memoryPercent,
      freeMemoryBytes: result.freeMemoryBytes,
      probeLatencyMs: result.latencyMs,
    });
    const overloadReason = overloaded(node, result);
    if (overloadReason) {
      orchestrator.markError(node.id);
      orchestrator.markDisconnected(node.id, overloadReason);
      return;
    }
    orchestrator.markConnected(node.id);
    orchestrator.recordSuccess(node.id);
  } catch (error) {
    orchestrator.markDisconnected(node.id, error instanceof Error ? error.message : "HEALTH_PROBE_FAILED");
  }
}

async function runLimited(nodes: readonly LavalinkNodeConfig[], orchestrator: LavalinkNodeOrchestrator): Promise<void> {
  const concurrency = Math.max(1, Math.min(lavalinkHealthConfig.maxConcurrentProbes, nodes.length));
  let cursor = 0;
  const worker = async () => {
    while (cursor < nodes.length) {
      const index = cursor++;
      const node = nodes[index];
      if (node) await probe(node, orchestrator);
    }
  };
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
}

export function startLavalinkHealthMonitor(nodes: readonly LavalinkNodeConfig[], orchestrator: LavalinkNodeOrchestrator): () => void {
  if (!lavalinkHealthConfig.enabled) return () => undefined;
  let stopped = false;
  let running = false;
  const run = async () => {
    if (stopped || running) return;
    running = true;
    try { await runLimited(nodes, orchestrator); } finally { running = false; }
  };
  void run();
  const timer = setInterval(() => {
    if (stopped) return;
    const jitter = lavalinkHealthConfig.jitterMs > 0 ? Math.floor(Math.random() * lavalinkHealthConfig.jitterMs) : 0;
    const delayed = setTimeout(() => void run(), jitter);
    (delayed as unknown as { unref?: () => void }).unref?.();
  }, lavalinkHealthConfig.intervalMs);
  (timer as unknown as { unref?: () => void }).unref?.();
  return () => { stopped = true; clearInterval(timer); };
}
