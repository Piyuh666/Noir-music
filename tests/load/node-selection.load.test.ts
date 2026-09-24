import { describe, expect, it } from "vitest";
import { LavalinkNodeOrchestrator } from "../../src/audio/nodeOrchestrator";
import type { LavalinkNodeConfig } from "../../src/config";

const makeNode = (i: number): LavalinkNodeConfig => ({
  id: `load-${i}`, host: "127.0.0.1", port: 2300 + i, authorization: "test", secure: false,
  priority: i, weight: 100, role: "EDGE", resumeTimeoutMs: 300000, capacityPlayers: 10000,
  reservedCapacityPlayers: 100, healthIntervalMs: 2000, healthTimeoutMs: 500, healthStaleAfterMs: 10000,
  failureThreshold: 3, recoveryThreshold: 2, maxSystemLoadPercent: 95, maxLavalinkLoadPercent: 95,
  maxMemoryPercent: 95, minFreeMemoryBytes: 0, maxLatencyMs: 5000, connectGraceMs: 1000,
  selectionCooldownMs: 0, enabled: true, allowNewPlayers: true,
});

describe("node selection load", () => {
  it("sustains 100k deterministic selection decisions", () => {
    const o = new LavalinkNodeOrchestrator(Array.from({ length: 8 }, (_, i) => makeNode(i)));
    for (let i = 0; i < 8; i++) o.markConnected(`load-${i}`);
    const start = performance.now();
    let selected = 0;
    for (let i = 0; i < 100_000; i++) if (o.choose()) selected++;
    const elapsed = performance.now() - start;
    expect(selected).toBe(100_000);
    expect(elapsed).toBeLessThan(5000);
  });
});
