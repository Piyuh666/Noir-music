/** NOIR MUSIC // GLYPH-CANONICAL OPERATOR EXPERIENCE — presentation-only diagnostics. */
import { composeExperience, experienceMatrix, experienceSignal, type ExperienceDensity, type ExperiencePhase } from "./experience";
import { kernelFrame } from "./visualKernel";

export interface OperatorNode { name: string; latencyMs?: number; players?: number; connected?: boolean; phase?: ExperiencePhase; }
export interface OperatorMetric { label: string; value: string | number; ratio?: number; hint?: string; }

export function nodeRail(nodes: readonly OperatorNode[], width = 72): string {
  const lines = nodes.slice(0, 24).map((node) => {
    const phase = node.phase ?? (node.connected ? "READY" : "OFFLINE" as ExperiencePhase);
    const mark = phase === "READY" ? "●" : phase === "ERROR" ? "×" : "◐";
    return `${mark} ${node.name.slice(0, 24).padEnd(24)} ${String(node.latencyMs ?? "—").padStart(5)}ms  P:${String(node.players ?? 0).padStart(4)}  ${phase}`;
  });
  return kernelFrame(lines.length ? lines : ["○ NO NODE SIGNAL"], { width, tone: "OPERATOR", weight: "BLOCK" });
}

export function operatorExperience(nodes: readonly OperatorNode[], metrics: readonly OperatorMetric[] = [], density: ExperienceDensity = "OPERATOR"): string {
  const connected = nodes.filter((node) => node.connected).length;
  const failed = nodes.filter((node) => (node.phase ?? (node.connected ? "READY" : "OFFLINE")) === "ERROR").length;
  return composeExperience({
    title: "OPERATOR FIELD",
    eyebrow: "NOIR MUSIC // SYSTEM",
    phase: failed ? "WARNING" : connected ? "READY" : "ERROR",
    density,
    tone: failed ? "ALERT" : "OPERATOR",
    metrics: [
      { label: "NODES", value: nodes.length, ratio: nodes.length ? connected / nodes.length : 0 },
      { label: "ONLINE", value: connected },
      { label: "FAULTS", value: failed, ratio: nodes.length ? failed / nodes.length : 0 },
      ...metrics,
    ],
    sections: [{ title: "NODE FIELD", lines: nodeRail(nodes, 72).split("\n") }],
    actions: [
      { id: "refresh", label: "REFRESH", shortcut: "R" },
      { id: "details", label: "DETAILS" },
      { id: "close", label: "CLOSE", shortcut: "ESC" },
    ],
    footer: "OPERATOR SURFACE // READ-ONLY TELEMETRY",
  });
}

export function operatorSignal(nodes: readonly OperatorNode[], width = 72): string {
  const values = nodes.map((node) => node.latencyMs === undefined ? 0.25 : Math.min(1, Math.max(0, node.latencyMs / 500)));
  return `${experienceSignal(values, width)}\n${experienceMatrix(nodes.length * 41 + 19, width, 4)}`;
}
