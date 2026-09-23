/** NOIR MUSIC // GLYPH-V48.6 INTERACTION JOURNEY */
import { uiText, clampInt } from "./surface";
import { pixelFrame, pixelSteps, glyphState, type VisualState } from "./visualGlyphs";

export type JourneyStage = "DISCOVER" | "REVIEW" | "CONFIRM" | "EXECUTE" | "RESULT" | "RECOVER";
export type JourneyStatus = "READY" | "ACTIVE" | "DONE" | "BLOCKED" | "FAILED" | "STALE";
export interface JourneyStep { id: JourneyStage; title: string; status: JourneyStatus; detail?: string; }
export interface JourneyModel { title: string; state: VisualState; current: JourneyStage; steps: readonly JourneyStep[]; next?: string; back?: string; cancel?: string; }

const STAGE_GLYPH: Record<JourneyStage, string> = { DISCOVER: "⌕", REVIEW: "▣", CONFIRM: "?", EXECUTE: "◆", RESULT: "●", RECOVER: "↻" };
const STATUS_GLYPH: Record<JourneyStatus, string> = { READY: "·", ACTIVE: "◐", DONE: "◆", BLOCKED: "▣", FAILED: "×", STALE: "◇" };

export function journeyStageLine(step: JourneyStep, width = 48): string {
  const status = STATUS_GLYPH[step.status]; const stage = STAGE_GLYPH[step.id];
  return uiText(`${status} ${stage} ${step.title}${step.detail ? ` // ${step.detail}` : ""}`, "· STEP", clampInt(width, 20, 72, 48));
}

export function journeyRail(model: JourneyModel, width = 48): string {
  const currentIndex = Math.max(0, model.steps.findIndex((s) => s.id === model.current));
  return pixelSteps(currentIndex, Math.max(1, model.steps.length), width);
}

export function composeJourney(model: JourneyModel, width = 52): string {
  const w = clampInt(width, 24, 72, 52);
  const lines = [`${glyphState(model.state)} ${uiText(model.title, "JOURNEY", w - 8).toUpperCase()}`, journeyRail(model, w - 4), ...model.steps.slice(0, 8).map((s) => journeyStageLine(s, w - 4))];
  if (model.next) lines.push(`◆ NEXT // ${uiText(model.next, "CONTINUE", w - 12)}`);
  if (model.back) lines.push(`‹ BACK // ${uiText(model.back, "BACK", w - 12)}`);
  if (model.cancel) lines.push(`× CANCEL // ${uiText(model.cancel, "CANCEL", w - 13)}`);
  return pixelFrame(lines, w, model.state === "ERROR" ? "ALERT" : "PANEL", "HEAVY");
}

export function journeyAccessibility(model: JourneyModel): string {
  const current = model.steps.find((s) => s.id === model.current);
  return `${uiText(model.title, "NOIR MUSIC", 100)}. ${model.state.toLowerCase()}. Current step: ${current?.title ?? model.current}. ${current?.detail ?? ""}`.trim();
}
