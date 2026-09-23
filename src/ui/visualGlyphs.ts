import { NOIR_UI_VERSION } from "./uiVersion";
/**
 * NOIR MUSIC // GLYPH-V48.6 VISUAL CORE
 * A presentation-only pixel compositor for dense Discord surfaces.
 * It owns no application state and never performs side effects.
 */
import { divider, fitFieldValue, uiText, clampInt } from "./surface";
import { pixelMeter, pixelSpark, matrix, normalizeGlyphText } from "./pixel";

export type VisualWeight = "LIGHT" | "REGULAR" | "HEAVY" | "BLOCK";
export type VisualTone = "VOID" | "PANEL" | "DENSE" | "SIGNAL" | "ALERT" | "OPERATOR";
export type VisualState = "IDLE" | "READY" | "ACTIVE" | "BUSY" | "SUCCESS" | "WARNING" | "ERROR" | "STALE" | "EMPTY" | "LOCKED";

export const GLYPH_MATRIX = Object.freeze({
  version: NOIR_UI_VERSION,
  glyphs: Object.freeze({ active: "◆", ready: "●", idle: "◇", busy: "◐", success: "◆", warning: "△", error: "×", empty: "○", locked: "▣", scan: "⌁", dot: "·", block: "█", light: "░", rail: "─", corner: "┌", end: "┘", arrow: "›" }),
  tones: Object.freeze({ VOID: "VOID", PANEL: "PANEL", DENSE: "DENSE", SIGNAL: "SIGNAL", ALERT: "ALERT", OPERATOR: "OPERATOR" }),
  limits: Object.freeze({ widthMin: 16, widthMax: 72, rowsMax: 28, columnsMax: 4 }),
});

const STATE_GLYPH: Record<VisualState, string> = {
  IDLE: "◇", READY: "●", ACTIVE: "◆", BUSY: "◐", SUCCESS: "◆", WARNING: "△", ERROR: "×", STALE: "◇", EMPTY: "○", LOCKED: "▣",
};

export function glyphState(state: VisualState): string { return STATE_GLYPH[state] ?? "◇"; }

export function visualStateLine(state: VisualState, message: string = state, width: number = 48): string {
  const w = clampInt(width, 16, 72, 48);
  return uiText(`${glyphState(state)} ${message}`.toUpperCase(), `${glyphState(state)} ${state}`, w);
}

export function pixelRule(width = 48, glyph = "─", weight: VisualWeight = "REGULAR"): string {
  const w = clampInt(width, 16, 72, 48);
  const g = weight === "BLOCK" ? "█" : weight === "HEAVY" ? "━" : weight === "LIGHT" ? "┄" : glyph;
  return g.repeat(w);
}

export function pixelFrame(lines: readonly string[], width = 48, tone: VisualTone = "PANEL", weight: VisualWeight = "REGULAR"): string {
  const w = clampInt(width, 16, 72, 48);
  const safe = lines.slice(0, 28).map((line) => uiText(normalizeGlyphText(line), "", w - 4));
  const edge = weight === "BLOCK" ? "█" : weight === "HEAVY" ? "┃" : "│";
  const head = weight === "BLOCK" ? "╔" : "┌";
  const tail = weight === "BLOCK" ? "╚" : "└";
  const title = `${glyphState(tone === "ALERT" ? "WARNING" : tone === "OPERATOR" ? "LOCKED" : "READY")} ${tone}`;
  return [
    `${head}${pixelRule(w - 2, "─", weight)}${weight === "BLOCK" ? "╗" : "┐"}`,
    `${edge} ${uiText(title, "NOIR MUSIC", w - 4).padEnd(w - 4)} ${edge}`,
    `${edge}${pixelRule(w - 2, "─", "LIGHT")}${edge}`,
    ...safe.map((line) => `${edge} ${line.padEnd(w - 4)} ${edge}`),
    `${tail}${pixelRule(w - 2, "─", weight)}${weight === "BLOCK" ? "╝" : "┘"}`,
  ].join("\n");
}

export function pixelRail(value: number, width = 32, filled = "█", empty = "░"): string {
  const w = clampInt(width, 8, 48, 32);
  const ratio = Math.max(0, Math.min(1, Number(value) || 0));
  const n = Math.round(ratio * w);
  return `${filled.repeat(n)}${empty.repeat(w - n)} ${Math.round(ratio * 100)}%`;
}

export function pixelSteps(current: number, total: number, width = 48): string {
  const t = clampInt(total, 1, 24, 1);
  const c = clampInt(current, 0, t, 0);
  const w = clampInt(width, 16, 72, 48);
  const slots = Math.min(t, Math.max(3, Math.floor((w - 2) / 3)));
  return Array.from({ length: slots }, (_, i) => i < c ? "◆" : i === c ? "◐" : "·").join("─");
}

export function pixelWave(values: readonly number[], width = 48): string {
  const chars = "▁▂▃▄▅▆▇█";
  const w = clampInt(width, 8, 64, 48);
  const source = values.filter((v) => Number.isFinite(v)).slice(-w);
  if (!source.length) return "·".repeat(w);
  const min = Math.min(...source); const max = Math.max(...source); const span = max - min || 1;
  return source.map((v) => chars[Math.max(0, Math.min(chars.length - 1, Math.round(((v - min) / span) * (chars.length - 1))))]).join("").padStart(w, "·");
}

export function pixelHistogram(values: readonly number[], width = 48): string {
  const w = clampInt(width, 8, 64, 48);
  const source = values.filter((v) => Number.isFinite(v)).slice(-w);
  if (!source.length) return "·".repeat(w);
  const max = Math.max(1, ...source.map((v) => Math.abs(v)));
  return source.map((v) => {
    const level = Math.round((Math.abs(v) / max) * 7);
    return "▁▂▃▄▅▆▇█"[Math.min(7, level)];
  }).join("").padStart(w, "·");
}

export function pixelHeat(values: readonly number[], width = 48): string {
  const glyphs = "·░▒▓█";
  const w = clampInt(width, 8, 64, 48);
  return values.filter(Number.isFinite).slice(-w).map((v) => glyphs[Math.max(0, Math.min(4, Math.round(Math.max(0, Math.min(100, v)) / 25))) ]).join("").padStart(w, "·");
}

export function pixelSparkline(values: readonly number[], width = 48): string { return pixelSpark(values.slice(-clampInt(width, 8, 64, 48)), clampInt(width, 8, 64, 48)); }

export function pixelMatrix(seed: number, width = 48, height = 5): string {
  const w = clampInt(width, 16, 64, 48); const h = clampInt(height, 1, 10, 5);
  return matrix(w, h, "·", Math.max(1, Math.trunc(seed))).split("\n").map((line) => line.slice(0, w)).join("\n");
}

export interface VisualMetric { label: string; value: string | number; ratio?: number; state?: VisualState; hint?: string; }
export function metricWall(metrics: readonly VisualMetric[], width = 56): string {
  const w = clampInt(width, 24, 72, 56); const labelW = Math.floor(w * .38); const valueW = Math.floor(w * .25);
  return metrics.slice(0, 16).map((m) => {
    const left = uiText(m.label, "—", labelW).padEnd(labelW);
    const value = uiText(String(m.value), "—", valueW).padStart(valueW);
    const glyph = m.state ? glyphState(m.state) : "·";
    const meter = m.ratio === undefined ? "" : ` ${pixelMeter(Math.max(0, Math.min(100, m.ratio * 100)), 8)}`;
    const hint = m.hint ? ` // ${uiText(m.hint, "", 22)}` : "";
    return `${glyph} ${left} ${value}${meter}${hint}`.slice(0, w);
  }).join("\n");
}

export function signalDeck(values: readonly number[], width = 56): string {
  const w = clampInt(width, 24, 72, 56);
  return pixelFrame([`WAVE  ${pixelWave(values, w - 8)}`, `HEAT  ${pixelHeat(values, w - 8)}`, `HIST  ${pixelHistogram(values, w - 8)}`], w, "SIGNAL", "HEAVY");
}

export function matrixDeck(seed: number, width = 56, height = 6): string {
  const w = clampInt(width, 24, 72, 56);
  return pixelFrame([pixelMatrix(seed, w - 8, height)], w, "OPERATOR", "LIGHT");
}

export function visualFooter(state: VisualState, detail = "NOIR MUSIC // END", width = 48): string {
  const w = clampInt(width, 16, 72, 48);
  return `${pixelRule(w, "·", "LIGHT")}\n${visualStateLine(state, fitFieldValue(detail).toUpperCase(), w)}`;
}
