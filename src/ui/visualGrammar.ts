/** NOIR MUSIC // GLYPH-16 VISUAL GRAMMAR
 * Presentation-only primitives for building consistent high-density Discord surfaces.
 * No application state is mutated here; inputs are treated as untrusted display data.
 */
import { UI_TOKENS, UIMode, modeTokens } from "./theme";

export type VisualWeight = "QUIET" | "LIGHT" | "REGULAR" | "HEAVY" | "BLOCK";
export type VisualAlign = "LEFT" | "CENTER" | "RIGHT";
export type VisualTone = "NEUTRAL" | "ACTIVE" | "SUCCESS" | "WARNING" | "DANGER" | "MUTED";
export type SurfaceDepth = "FLAT" | "RAISED" | "DEEP" | "VOID";

const GLYPH = Object.freeze({
  block: "█", shade: "▓", medium: "▒", light: "░", dot: "·", active: "◆", on: "●", idle: "◇",
  warn: "◐", off: "○", error: "×", scan: "⌁", corner: "┌┐└┘", tee: "├┤", pipe: "│", dash: "─",
  double: "═", arrow: "›", left: "‹", up: "↑", down: "↓", diamond: "◇", square: "▣", pause: "Ⅱ",
});

function text(value: unknown, max = 180): string {
  return String(value ?? "").replace(/[\r\n\t]+/g, " ").replace(/[`]/g, "'").replace(/\s{2,}/g, " ").trim().slice(0, max);
}
function width(value: unknown, fallback = 42, min = 8, max = 64): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.floor(n))) : fallback;
}
function fit(value: unknown, size: number): string { return text(value, size).padEnd(size, " "); }
function clamp(n: number, min = 0, max = 1): number { return Math.max(min, Math.min(max, Number.isFinite(n) ? n : 0)); }
function toneGlyph(tone: VisualTone): string {
  switch (tone) { case "ACTIVE": case "SUCCESS": return GLYPH.active; case "WARNING": return GLYPH.warn; case "DANGER": return GLYPH.error; case "MUTED": return GLYPH.idle; default: return GLYPH.dot; }
}
function weightChar(weight: VisualWeight): string {
  switch (weight) { case "BLOCK": return GLYPH.block; case "HEAVY": return GLYPH.shade; case "LIGHT": return GLYPH.light; case "QUIET": return GLYPH.dot; default: return GLYPH.medium; }
}

export function glyphTitle(title: string, widthHint = 48, tone: VisualTone = "ACTIVE"): string {
  const w = width(widthHint); const label = text(title, w - 6); const left = ` ${toneGlyph(tone)} `;
  return `${left}${label}`.padEnd(w, GLYPH.dash).slice(0, w);
}

export function glyphSubtitle(label: string, value: unknown, widthHint = 48, tone: VisualTone = "NEUTRAL"): string {
  const w = width(widthHint); const left = `${toneGlyph(tone)} ${text(label, Math.floor(w * .42))}`; const right = text(value, Math.floor(w * .45));
  return `${left.padEnd(Math.max(1, w - right.length - 1), " ")}${right}`.slice(0, w);
}

export function glyphRule(widthHint = 48, weight: VisualWeight = "REGULAR"): string { return weightChar(weight).repeat(width(widthHint)); }
export function glyphDoubleRule(widthHint = 48): string { return GLYPH.double.repeat(width(widthHint)); }
export function glyphSection(title: string, widthHint = 48): string { const w = width(widthHint); return `┌─ ${text(title, w - 6)} ${"─".repeat(Math.max(1, w - text(title, w - 6).length - 5))}┐`; }
export function glyphSectionEnd(widthHint = 48): string { return `└${GLYPH.dash.repeat(Math.max(1, width(widthHint) - 2))}┘`; }

export function glyphRow(label: string, value: unknown, widthHint = 48, tone: VisualTone = "NEUTRAL"): string {
  const w = width(widthHint); const available = Math.max(4, w - 5); const l = Math.min(Math.floor(available * .52), text(label).length + 2); const r = available - l;
  return `${toneGlyph(tone)} ${fit(label, l)} ${fit(value, r)}`.slice(0, w);
}

export function glyphBadge(label: string, tone: VisualTone = "NEUTRAL", widthHint = 20): string {
  const w = width(widthHint, 20, 8, 40); const body = text(label, w - 4); return `[${toneGlyph(tone)} ${body}]`.slice(0, w);
}

export function glyphProgress(value: number, widthHint = 28, weight: VisualWeight = "HEAVY"): string {
  const w = width(widthHint, 28, 8, 60); const filled = Math.round(clamp(value) * w); const ch = weightChar(weight); return ch.repeat(filled) + GLYPH.light.repeat(Math.max(0, w - filled));
}

export function glyphPercent(value: number, widthHint = 28): string { const p = Math.round(clamp(value) * 100); return `${glyphProgress(value, widthHint)} ${String(p).padStart(3, " ")}%`; }

export function glyphSteps(current: number, total: number, widthHint = 36): string {
  const t = Math.max(1, Math.min(20, Math.floor(total))); const c = Math.max(0, Math.min(t, Math.floor(current))); const w = width(widthHint, 36, t * 2, 60);
  return Array.from({ length: t }, (_, i) => i < c ? GLYPH.block : i === c ? GLYPH.active : GLYPH.light).join(" ").slice(0, w);
}

export function glyphTimeline(positionMs: number, durationMs: number, widthHint = 44): string {
  const w = width(widthHint, 44, 12, 60); const ratio = durationMs > 0 ? clamp(positionMs / durationMs) : 0; const cursor = Math.min(w - 1, Math.round(ratio * (w - 1)));
  return Array.from({ length: w }, (_, i) => i === cursor ? GLYPH.active : i < cursor ? GLYPH.shade : GLYPH.light).join("");
}

export function glyphWave(values: readonly number[], widthHint = 44, levels = 6): string {
  const w = width(widthHint, 44, 8, 64); const h = Math.max(2, Math.min(10, Math.floor(levels))); if (!values.length) return GLYPH.light.repeat(w);
  const cols = Array.from({ length: w }, (_, i) => clamp(Number(values[Math.min(values.length - 1, Math.floor(i * values.length / w))])));
  return cols.map(v => { const level = Math.min(h - 1, Math.floor(v * h)); return "▁▂▃▄▅▆▇█"[Math.min(7, level)] ?? GLYPH.dot; }).join("");
}

export function glyphHeat(values: readonly number[], widthHint = 44): string {
  const w = width(widthHint, 44, 8, 64); const chars = " ·:+*#%@"; if (!values.length) return GLYPH.light.repeat(w);
  return Array.from({ length: w }, (_, i) => chars[Math.round(clamp(Number(values[Math.min(values.length - 1, Math.floor(i * values.length / w))])) * (chars.length - 1))] ?? GLYPH.dot).join("");
}

export function glyphHistogram(values: readonly number[], widthHint = 44, levels = 5): string[] {
  const w = width(widthHint, 44, 8, 64); const h = Math.max(2, Math.min(12, Math.floor(levels))); if (!values.length) return [GLYPH.light.repeat(w)];
  const cols = Array.from({ length: w }, (_, i) => Math.round(clamp(Number(values[Math.min(values.length - 1, Math.floor(i * values.length / w))])) * h));
  return Array.from({ length: h }, (_, row) => cols.map(v => v >= h - row ? GLYPH.block : GLYPH.light).join(""));
}

export function glyphMeter(label: string, value: number, widthHint = 44, tone: VisualTone = "ACTIVE"): string {
  const w = width(widthHint); const meterWidth = Math.max(8, w - text(label).length - 8); return `${toneGlyph(tone)} ${fit(label, Math.max(4, w - meterWidth - 7))} ${glyphProgress(value, meterWidth)} ${String(Math.round(clamp(value) * 100)).padStart(3)}%`.slice(0, w);
}

export function glyphMatrix(rows: readonly string[], widthHint = 48, maxRows = 12): string[] {
  const w = width(widthHint); return rows.slice(0, Math.max(1, maxRows)).map((row, i) => `${String(i + 1).padStart(2, "0")} ${text(row, w - 4)}`.padEnd(w, " ").slice(0, w));
}

export function glyphSignal(seed: string, widthHint = 48): string { const w = width(widthHint); let x = 2166136261; for (const ch of seed) x = Math.imul(x ^ ch.charCodeAt(0), 16777619); return Array.from({ length: w }, (_, i) => { x = Math.imul(x ^ (i + 17), 16777619); return x % 5 === 0 ? GLYPH.active : x % 3 === 0 ? GLYPH.shade : GLYPH.dot; }).join(""); }

export function glyphDepthFrame(lines: readonly string[], widthHint = 48, depth: SurfaceDepth = "RAISED"): string[] {
  const w = width(widthHint); const top = depth === "VOID" ? "╔" : "┌"; const bottom = depth === "VOID" ? "╚" : "└"; const edge = depth === "DEEP" ? "┃" : "│";
  return [`${top}${GLYPH.dash.repeat(w - 2)}${depth === "VOID" ? "╗" : "┐"}`, ...lines.slice(0, 16).map(line => `${edge} ${text(line, w - 4).padEnd(w - 4)} ${edge}`), `${bottom}${GLYPH.dash.repeat(w - 2)}${depth === "VOID" ? "╝" : "┘"}`];
}

export function glyphModeHeader(mode: UIMode, widthHint = 48): string { const t = modeTokens(mode); return `${GLYPH.square} ${mode.toUpperCase()} / ${t.width}W / ${t.rows}R / ${t.meter}M`.padEnd(width(widthHint)).slice(0, width(widthHint)); }

export function glyphCornerTitle(title: string, widthHint = 48, tone: VisualTone = "ACTIVE"): string[] { const w = width(widthHint); return [`┌─${toneGlyph(tone)} ${text(title, w - 6)}${GLYPH.dash.repeat(Math.max(1, w - text(title, w - 6).length - 5))}┐`]; }

export function glyphFooter(left: string, right = "NOIR MUSIC", widthHint = 48): string { const w = width(widthHint); const l = text(left, Math.floor(w * .62)); const r = text(right, Math.floor(w * .30)); return `${l}${" ".repeat(Math.max(1, w - l.length - r.length))}${r}`.slice(0, w); }

export function glyphDensity(mode: UIMode, value: number, widthHint = 48): string { const w = width(widthHint); const target = modeTokens(mode).meter; return `${glyphProgress(value, Math.min(target, w - 12))} ${mode.toUpperCase()}`.slice(0, w); }

export function glyphCoordinates(row: number, column: number, widthHint = 48): string { return `${GLYPH.square} R${String(Math.max(0, row)).padStart(2, "0")} · C${String(Math.max(0, column)).padStart(2, "0")}`.padEnd(width(widthHint)).slice(0, width(widthHint)); }
