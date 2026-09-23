/** NOIR MUSIC // GLYPH-17 CINEMATIC UI — deterministic pixel composition primitives. */
import { clampInt, safeCustomId, uiText } from "./surface";

export type CinematicTone = "VOID" | "MONO" | "SIGNAL" | "ALERT" | "SUCCESS";
export type CinematicDensity = "MINI" | "COMPACT" | "STANDARD" | "DENSE" | "OPERATOR";

export interface CinematicFrame {
  title: string;
  eyebrow?: string;
  body: string[];
  footer?: string;
  tone: CinematicTone;
  density: CinematicDensity;
}

const TONE_GLYPH: Record<CinematicTone, string> = {
  VOID: "○",
  MONO: "◆",
  SIGNAL: "◐",
  ALERT: "×",
  SUCCESS: "●",
};

const DENSITY_WIDTH: Record<CinematicDensity, number> = {
  MINI: 24,
  COMPACT: 32,
  STANDARD: 42,
  DENSE: 54,
  OPERATOR: 68,
};

export function cinematicRule(width = 42, glyph = "━"): string {
  const safe = clampInt(width, 8, 80, 42);
  return glyph.repeat(safe);
}

export function cinematicHeader(title: string, tone: CinematicTone = "MONO", width = 42): string {
  const glyph = TONE_GLYPH[tone];
  const clean = uiText(title, "MONO", Math.max(4, width - 6));
  return `${glyph} ${clean}`;
}

export function cinematicFrame(frame: CinematicFrame): string {
  const width = DENSITY_WIDTH[frame.density];
  const top = cinematicRule(width);
  const head = cinematicHeader(frame.title, frame.tone, width);
  const eyebrow = frame.eyebrow ? `// ${uiText(frame.eyebrow, "", width - 4)}` : "";
  const body = frame.body.map((line) => `│ ${uiText(line, "", width - 4)}`);
  const footer = frame.footer ? `└ ${uiText(frame.footer, "", width - 4)}` : `└ ${TONE_GLYPH[frame.tone]} SIGNAL_LOCK`;
  return [top, `│ ${head}`, eyebrow ? `│ ${eyebrow}` : "", ...body, footer, top].filter(Boolean).join("\n");
}

export function cinematicMeter(value: number, width = 24, filled = "█", empty = "░"): string {
  const safeWidth = clampInt(width, 4, 64, 24);
  const safeValue = Math.max(0, Math.min(1, value));
  const filledCount = Math.round(safeWidth * safeValue);
  return `${filled.repeat(filledCount)}${empty.repeat(safeWidth - filledCount)} ${Math.round(safeValue * 100)}%`;
}

export function cinematicTimeline(position: number, duration: number, width = 30): string {
  const safeDuration = Math.max(1, duration);
  const ratio = Math.max(0, Math.min(1, position / safeDuration));
  const marker = clampInt(Math.round(ratio * (width - 1)), 0, width - 1, 0);
  return Array.from({ length: width }, (_, i) => i === marker ? "◆" : i < marker ? "━" : "·").join("");
}

export function cinematicActionId(scope: string, action: string, nonce?: string): string {
  return safeCustomId(`mono:g17:${scope}:${action}${nonce ? `:${nonce}` : ""}`);
}

export function cinematicBadge(label: string, tone: CinematicTone = "MONO"): string {
  return `[${TONE_GLYPH[tone]} ${uiText(label, "", 28)}]`;
}

export function cinematicStack(items: string[], width = 42): string {
  const safeWidth = clampInt(width, 12, 80, 42);
  return items.slice(0, 24).map((item, index) => `${String(index + 1).padStart(2, "0")} │ ${uiText(item, "", safeWidth - 7)}`).join("\n");
}
