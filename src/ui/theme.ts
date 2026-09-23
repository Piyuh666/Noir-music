import { NOIR_UI_VERSION } from "./uiVersion";
/**
 * NOIR MUSIC // GLYPH-09 VISUAL TOKENS
 *
 * The UI layer is deliberately tokenized: every panel, meter, label and
 * component can share the same visual grammar without duplicating magic
 * numbers throughout command code.  Tokens are presentation-only and carry
 * no user data or application state.
 */
export const MONO_UI_VERSION = NOIR_UI_VERSION;

export const UI_TOKENS = Object.freeze({
  glyph: Object.freeze({
    block: "█", light: "░", dot: "·", square: "▣", on: "●", off: "○",
    active: "◆", idle: "◇", warn: "◐", arrow: "›", left: "‹", right: "›",
    up: "↑", down: "↓", cross: "×", bullet: "•", scan: "⌁", search: "⌕",
    play: "▶", pause: "Ⅱ", stop: "■", next: "»", previous: "«",
  }),
  width: Object.freeze({ compact: 18, standard: 32, wide: 46, ultra: 58 }),
  rows: Object.freeze({ compact: 4, standard: 8, dense: 12, ultra: 16 }),
  spacing: Object.freeze({ none: 0, tight: 1, normal: 2, wide: 3 }),
  palette: Object.freeze({
    black: 0x050505, panel: 0x0b0b0b, panel2: 0x121212, panel3: 0x191919,
    line: 0x2a2a2a, soft: 0x3a3a3a, white: 0xf4f4f4, muted: 0xa4a4a4,
  }),
  limits: Object.freeze({ title: 256, line: 180, panelLines: 16, matrixWidth: 48 }),
});

export type UIState = "ONLINE" | "PLAYING" | "PAUSED" | "IDLE" | "BUSY" | "WARN" | "ERROR" | "OFFLINE";

export function stateGlyph(state: UIState): string {
  switch (state) {
    case "ONLINE": case "PLAYING": return UI_TOKENS.glyph.on;
    case "BUSY": case "WARN": case "PAUSED": return UI_TOKENS.glyph.warn;
    case "ERROR": case "OFFLINE": return UI_TOKENS.glyph.off;
    default: return UI_TOKENS.glyph.idle;
  }
}

export function stateLabel(state: UIState): string {
  return `${stateGlyph(state)} ${state}`;
}

export function normalizeUiState(value: unknown, fallback: UIState = "IDLE"): UIState {
  const state = String(value ?? "").toUpperCase() as UIState;
  return ["ONLINE", "PLAYING", "PAUSED", "IDLE", "BUSY", "WARN", "ERROR", "OFFLINE"].includes(state) ? state : fallback;
}

export const UI_MODES = Object.freeze({
  compact: Object.freeze({ width: 32, rows: 6, meter: 12 }),
  standard: Object.freeze({ width: 46, rows: 10, meter: 18 }),
  dense: Object.freeze({ width: 54, rows: 12, meter: 24 }),
  operator: Object.freeze({ width: 62, rows: 14, meter: 28 }),
});

export type UIMode = keyof typeof UI_MODES;

export function modeTokens(mode: UIMode = "standard") {
  return UI_MODES[mode] ?? UI_MODES.standard;
}

export function modeFromDensity(value: unknown): UIMode {
  const n = Number(value);
  if (Number.isFinite(n) && n >= 90) return "operator";
  if (Number.isFinite(n) && n >= 65) return "dense";
  if (Number.isFinite(n) && n <= 30) return "compact";
  return "standard";
}

/** GLYPH-11 responsive visual contracts. */
export const UI_LAYOUT = Object.freeze({
  compact: Object.freeze({ width: 32, maxLines: 6, columns: 1, density: 30 }),
  standard: Object.freeze({ width: 46, maxLines: 10, columns: 2, density: 55 }),
  dense: Object.freeze({ width: 54, maxLines: 14, columns: 2, density: 75 }),
  operator: Object.freeze({ width: 62, maxLines: 16, columns: 2, density: 100 }),
});

export type UIIntentTone = "PRIMARY" | "SECONDARY" | "INFO" | "WARNING" | "DANGER" | "DISABLED";

export const UI_INTENT = Object.freeze({
  PRIMARY: Object.freeze({ glyph: "◆", label: "CONTINUE" }),
  SECONDARY: Object.freeze({ glyph: "·", label: "OPEN" }),
  INFO: Object.freeze({ glyph: "▣", label: "DETAILS" }),
  WARNING: Object.freeze({ glyph: "◐", label: "CHECK" }),
  DANGER: Object.freeze({ glyph: "×", label: "REMOVE" }),
  DISABLED: Object.freeze({ glyph: "○", label: "UNAVAILABLE" }),
});

export function intentGlyph(intent: UIIntentTone): string { return UI_INTENT[intent].glyph; }
export function intentLabel(intent: UIIntentTone): string { return `${UI_INTENT[intent].glyph} ${UI_INTENT[intent].label}`; }


/** GLYPH-27 strength hardening: finite, canonical token/state guards. */
export function strengthFinite(value: unknown, fallback = 0, min = -100000, max = 100000): number {
  const n = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.max(min, Math.min(max, n));
}
export function strengthText(value: unknown, max = 200): string {
  const n = Math.max(0, Math.min(1000, Number.isFinite(max) ? Math.floor(max) : 200));
  return String(value ?? "").replace(/[\r\n]+/g, " ").replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
}
export function strengthState(value: unknown): UIState {
  return normalizeUiState(typeof value === "string" ? value : "IDLE");
}
