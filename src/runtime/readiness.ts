/** NOIR MUSIC — production readiness state machine. */
export type ReadinessComponent = "config" | "discord" | "database" | "audio" | "runtime";
export type ReadinessStatus = "starting" | "ready" | "failed" | "stopping";

interface ComponentState { status: ReadinessStatus; updatedAt: number; reason?: string; }
const states = new Map<ReadinessComponent, ComponentState>();

export function setReadiness(component: ReadinessComponent, status: ReadinessStatus, reason?: string): void {
  states.set(component, { status, updatedAt: Date.now(), reason: reason?.slice(0, 240) });
}

export function readinessSnapshot() {
  const components = Object.fromEntries([...states.entries()].map(([key, value]) => [key, Object.freeze({ ...value })]));
  const required: ReadinessComponent[] = ["config", "discord", "database", "audio", "runtime"];
  const ready = required.every((key) => states.get(key)?.status === "ready");
  return Object.freeze({ ready, components: Object.freeze(components), checkedAt: Date.now() });
}

export function resetReadinessForTests(): void { states.clear(); }
