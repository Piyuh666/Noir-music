/** NOIR MUSIC // GLYPH-V48.6 VISUAL PIPELINE — deterministic composition primitives. */
import { uiText } from "../surface";
import { pixelMeter, pixelSpark, normalizeGlyphText } from "../pixel";
import { glyphPanelAdvanced } from "../layout";

export type PipelineTone = "VOID" | "PANEL" | "DENSE" | "OPERATOR" | "ALERT";
export type PipelinePhase = "ENTER" | "FOCUS" | "PROCESS" | "COMMIT" | "REST";
export interface PipelineStep { id: string; label: string; detail?: string; phase?: PipelinePhase; complete?: boolean; active?: boolean; tone?: PipelineTone; }
export interface PipelineSpec { title: string; steps: readonly PipelineStep[]; width?: number; activeIndex?: number; showDetails?: boolean; }

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, Math.trunc(n)));
const width = (n = 56) => clamp(n, 28, 72);
const phaseGlyph: Record<PipelinePhase, string> = { ENTER: "◇", FOCUS: "◆", PROCESS: "◐", COMMIT: "●", REST: "○" };

export function pipelineRail(spec: PipelineSpec): string {
  const w = width(spec.width);
  const active = spec.activeIndex ?? spec.steps.findIndex((s) => s.active);
  const cells = spec.steps.slice(0, 8).map((step, i) => {
    const done = step.complete || (active >= 0 && i < active);
    const glyph = done ? "●" : i === active ? "◆" : phaseGlyph[step.phase ?? "REST"];
    return `${glyph}${normalizeGlyphText(step.label).slice(0, 10)}`;
  });
  return uiText(cells.join("  "), "○", w);
}

export function pipeline(spec: PipelineSpec): string {
  const w = width(spec.width);
  const active = spec.activeIndex ?? spec.steps.findIndex((s) => s.active);
  const rows = spec.steps.slice(0, 8).map((step, i) => {
    const glyph = step.complete || (active >= 0 && i < active) ? "●" : i === active ? "◆" : phaseGlyph[step.phase ?? "REST"];
    const detail = spec.showDetails && step.detail ? ` — ${step.detail}` : "";
    return `${glyph} ${String(i + 1).padStart(2, "0")} ${uiText(step.label, "", w - 10)}${detail}`;
  });
  return glyphPanelAdvanced([pipelineRail(spec), ...rows], { width: w, title: spec.title, tone: "OPERATOR", maxLines: 10 });
}

export interface TimelinePoint { label: string; value: number; glyph?: string; }
export function timeline(points: readonly TimelinePoint[], width = 56): string {
  const w = widthClamp(width);
  if (!points.length) return "○ NO TIMELINE DATA";
  const max = Math.max(1, ...points.map((p) => p.value));
  const cells = points.slice(0, 24).map((p) => {
    const level = clamp(Math.round((p.value / max) * 8), 0, 8);
    return (p.glyph ?? "▮").repeat(Math.max(1, level));
  });
  return uiText(cells.join(" "), "○", w);
}
function widthClamp(n: number) { return clamp(n, 24, 72); }

export function signalDeck(values: readonly number[], width = 56): string {
  const w = widthClamp(width);
  const safe = values.slice(-32).map((v) => clamp(v, 0, 100));
  const spark = pixelSpark(safe, Math.max(8, Math.floor(w / 2)));
  return glyphPanelAdvanced([`SIGNAL ${spark}`, pixelMeter(safe.at(-1) ?? 0, Math.max(8, w - 10))], { width: w, title: "SIGNAL FIELD", tone: "DENSE", maxLines: 4 });
}

export interface VisualPipelineResult { header: string; rail: string; body: string; footer: string; }
export function composePipeline(spec: PipelineSpec, footer = "GLYPH-V48.6 // PIPELINE"): VisualPipelineResult {
  const w = width(spec.width);
  return { header: `◆ ${uiText(spec.title, "", w - 4)}`, rail: pipelineRail(spec), body: pipeline(spec), footer: uiText(footer, "", w) };
}
