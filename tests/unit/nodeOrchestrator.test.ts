import { describe, expect, it } from "vitest";
import { LavalinkNodeOrchestrator } from "../../src/audio/nodeOrchestrator";
import type { LavalinkNodeConfig } from "../../src/config";

const node = (id: string, priority = 10): LavalinkNodeConfig => ({
  id, host: "127.0.0.1", port: id === "a" ? 2333 : 2334, authorization: "test", secure: false,
  priority, weight: 100, role: "PRIMARY", region: "test", resumeTimeoutMs: 300000,
  capacityPlayers: 4, reservedCapacityPlayers: 1, healthIntervalMs: 2000, healthTimeoutMs: 500,
  healthStaleAfterMs: 10000, failureThreshold: 3, recoveryThreshold: 2,
  maxSystemLoadPercent: 85, maxLavalinkLoadPercent: 85, maxMemoryPercent: 90,
  minFreeMemoryBytes: 0, maxLatencyMs: 1500, connectGraceMs: 1000, selectionCooldownMs: 0,
  enabled: true, allowNewPlayers: true,
});

describe("Lavalink node orchestrator", () => {
  it("selects a connected node and enforces reserved capacity", () => {
    const o = new LavalinkNodeOrchestrator([node("a", 1), node("b", 2)]);
    o.markConnected("a"); o.markConnected("b");
    expect(o.choose()).toBe("a");
    o.bindPlayer("g1", "a"); o.bindPlayer("g2", "a"); o.bindPlayer("g3", "a");
    expect(o.bindPlayer("g4", "a")).toThrowError(/CAPACITY/);
    expect(o.choose()).toBe("b");
  });

  it("opens a circuit after repeated failures and recovers", () => {
    const o = new LavalinkNodeOrchestrator([node("a")]);
    o.markConnected("a");
    o.markDisconnected("a", "timeout");
    o.markDisconnected("a", "timeout");
    o.markDisconnected("a", "timeout");
    expect(o.snapshot("a").circuitOpen).toBe(true);
    o.markConnected("a");
    expect(o.snapshot("a").healthy).toBe(true);
    expect(o.snapshot("a").consecutiveFailures).toBe(0);
  });
});
