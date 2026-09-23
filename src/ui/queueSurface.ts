/** NOIR MUSIC // GLYPH-CANONICAL QUEUE EXPERIENCE — visual composition only. */
import { composeExperience, experienceMatrix, experienceSignal, type ExperienceDensity, type ExperiencePhase } from "./experience";
import { kernelFrame } from "./visualKernel";
import { uiPage, compactNumber } from "./surface";

export type QueueItem19 = QueueItem;

export interface QueueItem { title: string; artist?: string; durationMs?: number; active?: boolean; state?: ExperiencePhase; }

function duration(ms?: number): string {
  if (!Number.isFinite(ms) || !ms || ms <= 0) return "--:--";
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

export function queueRail(items: readonly QueueItem[], page = 1, pageSize = 8, width = 64): string {
  const p = uiPage(items, page, pageSize);
  const lines = p.items.map((item, i) => `${item.active ? "◆" : "◇"} ${(p.start + i + 1).toString().padStart(3, "0")} ${item.title.slice(0, Math.max(10, width - 22)).padEnd(Math.max(10, width - 22))} ${duration(item.durationMs).padStart(5)}`);
  if (!lines.length) lines.push("○ QUEUE EMPTY // ADD A TRACK TO BEGIN");
  return kernelFrame(lines, { width, tone: "DENSE", weight: "HEAVY" });
}

export function queueExperience(items: readonly QueueItem[], page = 1, pageSize = 8, density: ExperienceDensity = "STANDARD"): string {
  const p = uiPage(items, page, pageSize);
  return composeExperience({
    title: "QUEUE MATRIX",
    eyebrow: "NOIR MUSIC // QUEUE",
    phase: items.length ? "READY" : "EMPTY",
    density,
    tone: "DENSE",
    metrics: [
      { label: "TOTAL", value: compactNumber(p.total) },
      { label: "PAGE", value: `${p.page}/${p.pages}` },
      { label: "VISIBLE", value: p.items.length, ratio: p.total ? p.items.length / p.total : 0 },
    ],
    sections: [{ title: "RAIL", lines: queueRail(items, page, pageSize, density === "OPERATOR" ? 72 : 56).split("\n") }],
    actions: [
      { id: "back", label: "PREVIOUS", disabled: !p.hasPrevious },
      { id: "next", label: "NEXT", disabled: !p.hasNext },
      { id: "refresh", label: "REFRESH" },
      { id: "clear", label: "CLEAR", destructive: true },
    ],
    footer: `PAGE ${p.page} // ${p.start + 1}-${p.end} OF ${p.total}`,
  });
}

export function queueSignal(items: readonly QueueItem[], width = 64): string {
  const values = items.slice(-32).map((item) => item.active ? 1 : item.state === "ERROR" ? 0 : 0.5);
  return `${experienceSignal(values, width)}\n${experienceMatrix(items.length * 23 + 11, width, 3)}`;
}
