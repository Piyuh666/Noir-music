import { NOIR_UI_VERSION } from "./uiVersion";
/** NOIR MUSIC // GLYPH-14 ATLAS — visual composition primitives. */
import { UI_TOKENS, type UIMode, modeTokens } from "./theme";
import { glyphForState } from "./uxTokens";

export type AtlasTone = "NEUTRAL" | "PRIMARY" | "INFO" | "WARNING" | "DANGER" | "SUCCESS";
export type AtlasDensity = UIMode;

export interface AtlasCell { label: string; value: string; tone?: AtlasTone; hint?: string; }
export interface AtlasPanel { title: string; eyebrow?: string; cells: AtlasCell[]; footer?: string; }
export interface AtlasRail { left: string; center?: string; right?: string; glyph?: string; }

const toneGlyph: Record<AtlasTone, string> = { NEUTRAL: "◇", PRIMARY: "◆", INFO: "▣", WARNING: "◐", DANGER: "×", SUCCESS: "●" };

function clean(value: unknown, fallback = ""): string {
  return String(value ?? fallback).replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
}

export function atlasToneGlyph(tone: AtlasTone = "NEUTRAL"): string { return toneGlyph[tone]; }
export function atlasStateGlyph(state: string): string { return glyphForState(state); }

export function atlasRail(rail: AtlasRail, width = 54): string {
  const left = clean(rail.left);
  const center = clean(rail.center);
  const right = clean(rail.right);
  const glyph = clean(rail.glyph, "·");
  const usable = Math.max(8, width);
  const middle = center ? ` ${glyph} ${center} ` : ` ${glyph} `;
  const budget = Math.max(0, usable - left.length - right.length - middle.length);
  return `${left}${" ".repeat(budget)}${middle}${right}`.slice(0, usable);
}

export function atlasRule(width = 54, heavy = false): string {
  const glyph = heavy ? "═" : "─";
  return glyph.repeat(Math.max(1, Math.min(width, 96)));
}

export function atlasPanel(panel: AtlasPanel, density: AtlasDensity = "standard"): string[] {
  const mode = modeTokens(density);
  const width = mode.width;
  const title = clean(panel.title, "NOIR MUSIC").slice(0, width - 4);
  const lines = [`┌${atlasRule(width - 2, true)}┐`, `│ ${title.padEnd(width - 4)} │`];
  if (panel.eyebrow) lines.push(`│ ${clean(panel.eyebrow).slice(0, width - 4).padEnd(width - 4)} │`);
  lines.push(`├${atlasRule(width - 2)}┤`);
  for (const cell of panel.cells.slice(0, mode.rows - 5)) {
    const prefix = `${atlasToneGlyph(cell.tone)} ${clean(cell.label)}:`;
    const value = clean(cell.value);
    const body = `${prefix} ${value}`.slice(0, width - 4).padEnd(width - 4);
    lines.push(`│ ${body} │`);
    if (cell.hint) lines.push(`│   ${clean(cell.hint).slice(0, width - 6).padEnd(width - 6)} │`);
  }
  if (panel.footer) lines.push(`├${atlasRule(width - 2)}┤`, `│ ${clean(panel.footer).slice(0, width - 4).padEnd(width - 4)} │`);
  lines.push(`└${atlasRule(width - 2, true)}┘`);
  return lines;
}

export function atlasGrid(cells: AtlasCell[], columns = 2, width = 54): string[] {
  const safeColumns = Math.max(1, Math.min(4, Math.floor(columns)));
  const cellWidth = Math.max(8, Math.floor((width - safeColumns - 1) / safeColumns));
  const rows: string[] = [];
  for (let i = 0; i < cells.length; i += safeColumns) {
    const row = cells.slice(i, i + safeColumns).map((cell) => {
      const text = `${atlasToneGlyph(cell.tone)} ${clean(cell.label)} ${clean(cell.value)}`.slice(0, cellWidth - 2);
      return ` ${text.padEnd(cellWidth - 2)} `;
    });
    while (row.length < safeColumns) row.push(" ".repeat(cellWidth));
    rows.push(`│${row.join("│")}│`);
  }
  return rows;
}

export function atlasMeter(value: number, width = 24, filled = "█", empty = "░"): string {
  const safeWidth = Math.max(4, Math.min(64, Math.floor(width)));
  const ratio = Math.max(0, Math.min(1, Number(value) || 0));
  const count = Math.round(ratio * safeWidth);
  return `${filled.repeat(count)}${empty.repeat(safeWidth - count)} ${Math.round(ratio * 100)}%`;
}

export function atlasSignal(samples: number[], width = 32): string {
  const glyphs = "▁▂▃▄▅▆▇█";
  const safeWidth = Math.max(4, Math.min(64, Math.floor(width)));
  if (!samples.length) return "·".repeat(safeWidth);
  const stride = Math.max(1, Math.ceil(samples.length / safeWidth));
  return Array.from({ length: safeWidth }, (_, i) => {
    const value = Number(samples[Math.min(samples.length - 1, i * stride)] ?? 0);
    const index = Math.max(0, Math.min(glyphs.length - 1, Math.round(Math.max(0, Math.min(1, value)) * (glyphs.length - 1))));
    return glyphs[index];
  }).join("");
}

export const ATLAS = Object.freeze({ version: NOIR_UI_VERSION, maxWidth: 96, defaultWidth: UI_TOKENS.width.ultra });
