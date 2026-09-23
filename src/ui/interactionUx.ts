/** NOIR MUSIC // GLYPH-14 INTERACTION UX — safe visual action contracts. */
export type InteractionState = "IDLE" | "FOCUS" | "PRESSED" | "BUSY" | "SUCCESS" | "DISABLED" | "STALE";
export interface InteractionModel { id: string; label: string; state?: InteractionState; shortcut?: string; destructive?: boolean; }
const STATE_GLYPH: Record<InteractionState, string> = { IDLE: "·", FOCUS: "◆", PRESSED: "▶", BUSY: "◐", SUCCESS: "●", DISABLED: "○", STALE: "◇" };
function clean(value: unknown): string { return String(value ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim(); }
export function interactionGlyph(state: InteractionState = "IDLE"): string { return STATE_GLYPH[state]; }
export function interactionLabel(action: InteractionModel, width = 80): string { const state = action.state ?? "IDLE"; const danger = action.destructive ? "×" : STATE_GLYPH[state]; const shortcut = action.shortcut ? ` [${clean(action.shortcut)}]` : ""; return `${danger} ${clean(action.label)}${shortcut}`.slice(0, Math.max(4, width)); }
export function interactionRail(actions: InteractionModel[], width = 54): string { const values = actions.slice(0, 5).map(a => interactionLabel(a, 24)); const raw = values.join("  "); return raw.length <= width ? raw : `${raw.slice(0, width - 1).trimEnd()}…`; }
export function focusRing(label: string, focused = false): string { return focused ? `⟦ ◆ ${clean(label)} ⟧` : `⟪ · ${clean(label)} ⟫`; }
export function staleAction(label: string): string { return `◇ ${clean(label)} · REFRESH REQUIRED`; }
