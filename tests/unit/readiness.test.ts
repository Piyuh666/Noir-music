import { describe, expect, it, beforeEach } from "vitest";
import { readinessSnapshot, resetReadinessForTests, setReadiness } from "../../src/runtime/readiness";

describe("production readiness", () => {
  beforeEach(() => resetReadinessForTests());

  it("is not ready until every required component is ready", () => {
    setReadiness("config", "ready");
    setReadiness("runtime", "ready");
    expect(readinessSnapshot().ready).toBe(false);
    for (const component of ["discord", "database", "audio"] as const) setReadiness(component, "ready");
    expect(readinessSnapshot().ready).toBe(true);
  });

  it("fails closed when a component fails", () => {
    for (const component of ["config", "discord", "database", "audio", "runtime"] as const) setReadiness(component, "ready");
    setReadiness("database", "failed", "database_unreachable");
    expect(readinessSnapshot().ready).toBe(false);
    expect(readinessSnapshot().components.database.reason).toBe("database_unreachable");
  });
});
