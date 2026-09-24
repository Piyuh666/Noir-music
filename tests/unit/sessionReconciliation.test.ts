import { describe, expect, it, afterEach } from "vitest";
import { sessionReconciliationService } from "../../src/services/sessionReconciliationService";

describe("session reconciliation control plane", () => {
  afterEach(() => sessionReconciliationService.stop());

  it("exposes a bounded, stopped control-plane health snapshot", () => {
    const health = sessionReconciliationService.health();
    expect(health.running).toBe(false);
    expect(health.intervalMs).toBeGreaterThanOrEqual(2_000);
    expect(health.activeChecks).toBe(0);
    expect(health.initialized).toBe(false);
    expect(health.persistedGuilds).toBe(0);
  });

  it("does not run a cycle without an audio adapter", async () => {
    sessionReconciliationService.start(2_000);
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(sessionReconciliationService.health().running).toBe(true);
    sessionReconciliationService.stop();
    expect(sessionReconciliationService.health().running).toBe(false);
  });
});
