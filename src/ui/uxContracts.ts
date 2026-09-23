/** NOIR MUSIC // GLYPH-16 UX CONTRACTS — predictable, bounded presentation behavior. */
import { ExperienceDensity, ExperienceState } from "./experience";

export interface ViewportContract { density: ExperienceDensity; width: number; maxLines: number; maxActions: number; maxItems: number; }
export interface InteractionContract { id: string; label: string; shortcut?: string; destructive?: boolean; disabled?: boolean; stale?: boolean; reason?: string; }
export interface ScreenContract { id: string; title: string; state: ExperienceState; density: ExperienceDensity; actions: readonly InteractionContract[]; announced: string; }

const CONTRACTS: Readonly<Record<ExperienceDensity, ViewportContract>> = Object.freeze({
  MINI: Object.freeze({ density: "MINI", width: 28, maxLines: 5, maxActions: 3, maxItems: 5 }),
  COMPACT: Object.freeze({ density: "COMPACT", width: 36, maxLines: 7, maxActions: 4, maxItems: 7 }),
  STANDARD: Object.freeze({ density: "STANDARD", width: 48, maxLines: 10, maxActions: 6, maxItems: 10 }),
  DENSE: Object.freeze({ density: "DENSE", width: 56, maxLines: 14, maxActions: 8, maxItems: 16 }),
  OPERATOR: Object.freeze({ density: "OPERATOR", width: 62, maxLines: 16, maxActions: 10, maxItems: 20 }),
});

export function viewportContract(density: ExperienceDensity = "STANDARD"): ViewportContract { return CONTRACTS[density] ?? CONTRACTS.STANDARD; }
export function boundedDensity(value: unknown, fallback: ExperienceDensity = "STANDARD"): ExperienceDensity { const v = String(value ?? "").toUpperCase() as ExperienceDensity; return CONTRACTS[v] ? v : fallback; }
export function fitViewportLines(lines: readonly string[], density: ExperienceDensity = "STANDARD"): string[] { const c = viewportContract(density); return lines.slice(0, c.maxLines).map(x => String(x ?? "").slice(0, c.width)); }
export function interactionLabel(action: InteractionContract): string { const marker = action.disabled ? "○" : action.stale ? "◇" : action.destructive ? "×" : "◆"; const suffix = action.shortcut ? ` [${action.shortcut}]` : ""; return `${marker} ${action.label}${suffix}`.slice(0, 80); }
export function interactionReason(action: InteractionContract): string { if (action.reason) return String(action.reason).replace(/[\r\n]+/g, " ").slice(0, 120); if (action.disabled) return "ACTION UNAVAILABLE"; if (action.stale) return "SURFACE IS STALE · REFRESH BEFORE ACTION"; if (action.destructive) return "DESTRUCTIVE ACTION · CONFIRM INTENT"; return "READY"; }
export function screenContract(input: Omit<ScreenContract, "announced">): ScreenContract { const c = viewportContract(input.density); const actions = input.actions.slice(0, c.maxActions).map(a => Object.freeze({ ...a, label: String(a.label).slice(0, 64) })); return Object.freeze({ ...input, actions, announced: `${input.title} · ${input.state} · ${input.density}` }); }
export function validateScreenContract(screen: ScreenContract): string[] { const errors: string[] = []; const c = viewportContract(screen.density); if (!screen.id.trim()) errors.push("SCREEN_ID_EMPTY"); if (!screen.title.trim()) errors.push("SCREEN_TITLE_EMPTY"); if (screen.actions.length > c.maxActions) errors.push("ACTION_LIMIT_EXCEEDED"); if (screen.announced.length > 180) errors.push("ANNOUNCEMENT_TOO_LONG"); const seen = new Set<string>(); for (const action of screen.actions) { if (seen.has(action.id)) errors.push(`DUPLICATE_ACTION:${action.id}`); seen.add(action.id); if (!action.id.trim()) errors.push("ACTION_ID_EMPTY"); } return errors; }
export function focusOrder(actions: readonly InteractionContract[]): string[] { return actions.filter(a => !a.disabled).map(a => a.id).slice(0, 25); }
export function staleAction(action: InteractionContract, stale: boolean, reason?: string): InteractionContract { return Object.freeze({ ...action, stale, reason: stale ? (reason ?? "SURFACE IS STALE") : action.reason }); }
export function actionSet(actions: readonly InteractionContract[], max = 10): InteractionContract[] { const seen = new Set<string>(); const result: InteractionContract[] = []; for (const action of actions) { if (!action.id || seen.has(action.id)) continue; seen.add(action.id); result.push(Object.freeze({ ...action })); if (result.length >= max) break; } return result; }
export function densityFromWidth(width: number): ExperienceDensity { const w = Number(width); if (!Number.isFinite(w) || w <= 30) return "MINI"; if (w <= 38) return "COMPACT"; if (w <= 50) return "STANDARD"; if (w <= 58) return "DENSE"; return "OPERATOR"; }
export function contractSnapshot(): Readonly<Record<ExperienceDensity, ViewportContract>> { return CONTRACTS; }
