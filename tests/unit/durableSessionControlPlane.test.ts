import { describe, expect, it } from "vitest";
import { DurableSessionControlPlane } from "../../src/services/durableSessionControlPlane";

describe("durable session control plane", () => {
  it("starts in a safe, inspectable state without requiring a live database", () => {
    const service = new DurableSessionControlPlane();
    const health = service.health();
    expect(health.ready).toBe(false);
    expect(health.leases).toBe(0);
    expect(health.writes).toBe(0);
  });

  it("keeps a unique fencing owner per process instance", () => {
    const first = new DurableSessionControlPlane();
    const second = new DurableSessionControlPlane();
    expect(first.health().owner).not.toBe(second.health().owner);
  });
});
