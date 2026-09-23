import type { UiState, UiTone } from "./contracts";
import { fitText } from "./responsive";

export const GLYPH = Object.freeze({
  active: "◆", ready: "●", idle: "◇", busy: "◐", success: "◆", warning: "△", error: "×", empty: "○", locked: "▣",
  dot: "·", line: "─", heavy: "━", fill: "█", mid: "▓", light: "░", left: "│", top: "┌", right: "│", bottom: "└", arrow: "›", corner: "┼",
});

export function stateGlyph(state: UiState): string {
  return state === "ACTIVE" ? GLYPH.active : state === "READY" ? GLYPH.ready : state === "BUSY" ? GLYPH.busy : state === "SUCCESS" ? GLYPH.success : state === "WARNING" ? GLYPH.warning : state === "ERROR" ? GLYPH.error : state === "LOCKED" ? GLYPH.locked : state === "EMPTY" ? GLYPH.empty : GLYPH.idle;
}

export function toneGlyph(tone: UiTone): string { return tone === "ALERT" ? GLYPH.warning : tone === "OPERATOR" ? GLYPH.locked : tone === "SIGNAL" ? GLYPH.active : GLYPH.idle; }

export function bar(ratio: number, width: number, filled = GLYPH.fill, empty = GLYPH.light): string {
  const w = Math.max(4, Math.trunc(width));
  const r = Math.max(0, Math.min(1, Number(ratio) || 0));
  const n = Math.round(r * w);
  return filled.repeat(n) + empty.repeat(w - n);
}

export function frame(title: string, rows: readonly string[], width: number, tone: UiTone = "PANEL"): readonly string[] {
  const w = Math.max(30, Math.min(72, Math.trunc(width || 60)));
  const inner = w - 4;
  const head = `┌${GLYPH.line.repeat(w - 2)}┐`;
  const divider = `│${GLYPH.line.repeat(w - 2)}│`;
  const body = rows.slice(0, 24).map((row) => `│ ${fitText(`${toneGlyph(tone)} ${row}`, inner)} │`);
  return Object.freeze([head, `│ ${fitText(`${toneGlyph(tone)} ${title}`, inner)} │`, divider, ...body, `└${GLYPH.line.repeat(w - 2)}┘`]);
}

export function matrix(seed: number, width: number, rows = 3): readonly string[] {
  let x = (Math.trunc(seed) >>> 0) || 1;
  const w = Math.max(8, Math.min(68, Math.trunc(width)));
  const out: string[] = [];
  for (let r = 0; r < Math.max(1, Math.min(8, rows)); r++) {
    let line = "";
    for (let i = 0; i < w; i++) { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; line += x % 11 === 0 ? "█" : x % 5 === 0 ? "▓" : "·"; }
    out.push(line);
  }
  return Object.freeze(out);
}
