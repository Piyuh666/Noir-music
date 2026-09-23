/** NOIR MUSIC // GLYPH-V45 ACCESSIBLE PRESENTATION */
import { uiText } from "./surface";
import type { VisualState } from "./visualGlyphs";

export interface AccessibleSurface { label: string; state: VisualState; summary: string; instructions?: string; actions?: readonly string[]; }
export interface ScreenReaderRow { label: string; value: string; state?: string; }

export function stateWords(state: VisualState): string {
  const words: Record<VisualState, string> = { IDLE: "idle", READY: "ready", ACTIVE: "active", BUSY: "busy", SUCCESS: "successful", WARNING: "warning", ERROR: "error", STALE: "stale", EMPTY: "empty", LOCKED: "locked" };
  return words[state];
}

export function accessibleState(state: VisualState, detail?: string): string { return `${stateWords(state)}${detail ? `: ${uiText(detail, "", 180)}` : ""}`; }
export function accessibleRows(rows: readonly ScreenReaderRow[]): string { return rows.slice(0, 25).map((r) => `${uiText(r.label, "item", 80)}: ${uiText(r.value, "—", 180)}${r.state ? ` (${uiText(r.state, "", 40)})` : ""}`).join(". "); }
export function accessibleSurface(surface: AccessibleSurface): string { return `${uiText(surface.label, "NOIR MUSIC", 100)}. ${accessibleState(surface.state, surface.summary)}${surface.instructions ? ` ${uiText(surface.instructions, "", 180)}` : ""}${surface.actions?.length ? ` Actions: ${surface.actions.map((a) => uiText(a, "", 60)).join(", ")}.` : ""}`; }
export function announce(message: string, state: VisualState = "READY"): string { return `[${stateWords(state).toUpperCase()}] ${uiText(message, "NOIR MUSIC", 240)}`; }
