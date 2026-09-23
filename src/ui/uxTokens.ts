import { NOIR_UI_VERSION } from "./uiVersion";
/** NOIR MUSIC // GLYPH-V48.6 UX CONTRACTS — presentation-only design tokens. */
export const UX_TOKENS = Object.freeze({
  version: NOIR_UI_VERSION,
  density: Object.freeze({ compact: 30, standard: 55, dense: 75, operator: 100 }),
  motion: Object.freeze({ idle: 0, subtle: 1, active: 2, intense: 3 }),
  hierarchy: Object.freeze({ hero: 1, section: 2, primary: 3, secondary: 4, metadata: 5 }),
  glyph: Object.freeze({ active: "◆", ready: "●", idle: "◇", warning: "◐", disabled: "○", error: "×", separator: "·", scan: "⌁" }),
  chrome: Object.freeze({ thin: "─", heavy: "═", dashed: "┄", corner: "┌┐└┘", cross: "╟╢" }),
  widths: Object.freeze({ compact: 32, standard: 46, dense: 54, operator: 62 }),
  rows: Object.freeze({ compact: 6, standard: 10, dense: 14, operator: 16 }),
});

export type UXDensityName = keyof typeof UX_TOKENS.density;

export function densityPercent(value: UXDensityName): number { return UX_TOKENS.density[value]; }
export function densityWidth(value: UXDensityName): number { return UX_TOKENS.widths[value]; }
export function densityRows(value: UXDensityName): number { return UX_TOKENS.rows[value]; }

export function glyphForState(value: string): string {
  switch (String(value).toUpperCase()) {
    case "LIVE": case "ONLINE": case "READY": case "PLAYING": case "SUCCESS": return UX_TOKENS.glyph.ready;
    case "WARN": case "WARNING": case "BUSY": case "PAUSED": return UX_TOKENS.glyph.warning;
    case "ERROR": case "OFFLINE": case "DISABLED": return UX_TOKENS.glyph.error;
    default: return UX_TOKENS.glyph.idle;
  }
}

export function visualWeight(value: number): "LOW" | "MEDIUM" | "HIGH" | "MAX" {
  const n = Math.max(0, Math.min(100, Number(value) || 0));
  return n >= 85 ? "MAX" : n >= 60 ? "HIGH" : n >= 30 ? "MEDIUM" : "LOW";
}
