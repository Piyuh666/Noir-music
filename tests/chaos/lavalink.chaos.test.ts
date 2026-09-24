import { describe, expect, it } from "vitest";
import { createServer } from "node:http";
import { LavalinkNodeOrchestrator } from "../../src/audio/nodeOrchestrator";
import type { LavalinkNodeConfig } from "../../src/config";

const base = (port: number): LavalinkNodeConfig => ({
  id: "chaos", host: "127.0.0.1", port, authorization: "test", secure: false, priority: 1, weight: 100,
  role: "PRIMARY", resumeTimeoutMs: 300000, capacityPlayers: 10, reservedCapacityPlayers: 1,
  healthIntervalMs: 2000, healthTimeoutMs: 500, healthStaleAfterMs: 10000, failureThreshold: 3, recoveryThreshold: 2,
  maxSystemLoadPercent: 85, maxLavalinkLoadPercent: 85, maxMemoryPercent: 90, minFreeMemoryBytes: 0,
  maxLatencyMs: 1500, connectGraceMs: 1000, selectionCooldownMs: 0, enabled: true, allowNewPlayers: true,
});

describe("Lavalink chaos/failure behavior", () => {
  it("recovers a node after disconnect/reconnect storms", () => {
    const o = new LavalinkNodeOrchestrator([base(2444)]);
    o.markConnected("chaos");
    for (let i = 0; i < 12; i++) o.markDisconnected("chaos", `chaos-${i}`);
    expect(o.snapshot("chaos").healthy).toBe(false);
    o.markConnected("chaos");
    expect(o.snapshot("chaos").healthy).toBe(true);
    expect(o.snapshot("chaos").consecutiveFailures).toBe(0);
  });

  it("models an HTTP failure source without hanging the test process", async () => {
    const server = createServer((_req, res) => { res.statusCode = 503; res.end("down"); });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
    const address = server.address();
    expect(address && typeof address === "object").toBe(true);
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
});
