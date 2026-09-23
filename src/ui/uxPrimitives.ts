/** NOIR MUSIC // GLYPH-15 UX PRIMITIVES — micro-interaction and information architecture helpers. */
import { uiText } from "./surface";
import { glyphPill, glyphProgress, glyphRule, glyphWave } from "./glyphStudio";

export type FocusState = "NONE" | "FOCUSED" | "PRESSED" | "DISABLED" | "STALE";
export type NoticeLevel = "INFO" | "SUCCESS" | "WARNING" | "ERROR";

const FOCUS_GLYPH: Record<FocusState, string> = { NONE: "·", FOCUSED: "◆", PRESSED: "█", DISABLED: "○", STALE: "◇" };
const NOTICE_GLYPH: Record<NoticeLevel, string> = { INFO: "▣", SUCCESS: "●", WARNING: "◐", ERROR: "×" };

export interface FocusableItem { id: string; label: string; state?: FocusState; hint?: string; }

export function focusRing(item: FocusableItem, width = 44): string {
  const state = item.state ?? "NONE";
  const hint = item.hint ? ` · ${uiText(item.hint, "", 18)}` : "";
  return `${FOCUS_GLYPH[state]} ${uiText(item.label, "ACTION", width - 8)}${hint}`.slice(0, width);
}

export function focusRail(items: readonly FocusableItem[], activeId?: string, width = 48): string {
  return items.slice(0, 10).map((item) => focusRing({ ...item, state: item.id === activeId ? "FOCUSED" : item.state }, width)).join("\n");
}

export function notice(level: NoticeLevel, title: string, message: string, width = 48): string {
  const glyph = NOTICE_GLYPH[level];
  return [`${glyph} ${uiText(title, level, width - 4).toUpperCase()}`, glyphRule(width - 2, "·"), uiText(message, "—", width - 4)].join("\n");
}

export function toast(level: NoticeLevel, message: string, width = 44): string {
  return `[${NOTICE_GLYPH[level]} ${level}] ${uiText(message, "", width - 10)}`;
}

export function segmentedControl(items: readonly { label: string; active?: boolean; disabled?: boolean }[], width = 48): string {
  const safe = items.slice(0, 8).map((item) => item.disabled ? `○ ${uiText(item.label, "", 12)}` : item.active ? `◆ ${uiText(item.label, "", 12)}` : `· ${uiText(item.label, "", 12)}`);
  return safe.join("  ").slice(0, width);
}

export function stepper(current: number, total: number, label = "STEP", width = 48): string {
  const count = Math.max(1, Math.trunc(total));
  const index = Math.max(1, Math.min(count, Math.trunc(current)));
  return `${glyphPill(`${label} ${index}/${count}`, index === count ? "ACTIVE" : "NEUTRAL", Math.min(width, 26))} ${glyphProgress(index / count * 100, Math.max(8, width - 30))}`;
}

export function statusStack(states: readonly { label: string; active: boolean; detail?: string }[], width = 48): string {
  return states.slice(0, 10).map((state) => `${state.active ? "●" : "○"} ${uiText(state.label, "STATE", 16).padEnd(16, " ")} ${uiText(state.detail ?? "", "", width - 20)}`).join("\n");
}

export function compareRows(rows: readonly { label: string; left: string; right: string; delta?: string }[], width = 56): string {
  const leftWidth = Math.floor(width * 0.35);
  const valueWidth = Math.floor(width * 0.23);
  return rows.slice(0, 12).map((row) => `${uiText(row.label, "METRIC", leftWidth).padEnd(leftWidth, " ")} ${uiText(row.left, "—", valueWidth).padStart(valueWidth, " ")} ${uiText(row.right, "—", valueWidth).padStart(valueWidth, " ")} ${uiText(row.delta ?? "", "", 10)}`.slice(0, width)).join("\n");
}

export function trendStrip(values: readonly number[], width = 48): string {
  return `⌁ ${glyphWave(values, Math.max(8, width - 4))}`;
}

export function emptyState(title: string, message: string, action = "ADD", width = 48): string {
  return [`○ ${uiText(title, "EMPTY", width - 4).toUpperCase()}`, uiText(message, "NOTHING TO DISPLAY", width - 4), `› ${uiText(action, "OPEN", width - 8)}`].join("\n");
}

export function errorState(code: string, message: string, retry = "RETRY", width = 48): string {
  return [`× ERROR ${uiText(code, "ERR", 16)}`, uiText(message, "AN UNKNOWN ERROR OCCURRED", width - 4), `⌁ ${uiText(retry, "RETRY", width - 8)}`].join("\n");
}
