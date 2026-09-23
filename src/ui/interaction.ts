/** NOIR MUSIC // GLYPH-13 INTERACTION LANGUAGE — deterministic UI state without Discord coupling. */
import { uiText } from "./surface";
import { pixelCode, pixelMeter } from "./pixel";

export type FocusMode = "NONE" | "PRIMARY" | "NAV" | "QUEUE" | "PLAYER" | "OPERATOR";
export type InteractionState = "IDLE" | "FOCUSED" | "PRESSED" | "DISABLED" | "BUSY" | "CONFIRMED";

export interface FocusItem { id: string; label: string; hint?: string; enabled?: boolean; state?: InteractionState; }
export interface InteractionModel { focus: FocusMode; index: number; count: number; state: InteractionState; nonce: string; }

export function normalizeFocus(value: unknown): FocusMode {
  const v = String(value ?? "").toUpperCase() as FocusMode;
  return ["NONE", "PRIMARY", "NAV", "QUEUE", "PLAYER", "OPERATOR"].includes(v) ? v : "NONE";
}

export function focusGlyph(state: InteractionState): string {
  return ({ IDLE: "·", FOCUSED: "◆", PRESSED: "▣", DISABLED: "○", BUSY: "◐", CONFIRMED: "●" } as Record<InteractionState,string>)[state];
}

export function focusRail(items: readonly FocusItem[], active = 0, width = 52): string {
  const w = Math.max(24, Math.min(80, Math.trunc(width)));
  return items.slice(0, 12).map((item, i) => {
    const state = item.enabled === false ? "DISABLED" : item.state ?? (i === active ? "FOCUSED" : "IDLE");
    const mark = focusGlyph(state);
    return `${mark} ${String(i + 1).padStart(2,"0")} ${uiText(item.label,"ACTION",w - 16)}${item.hint ? ` · ${uiText(item.hint,"",18)}` : ""}`.slice(0,w);
  }).join("\n");
}

export function interactionModel(focus: FocusMode, index: number, count: number, state: InteractionState = "IDLE", seed = "NOIR MUSIC"): InteractionModel {
  const safeCount = Math.max(0, Math.min(99, Math.trunc(count)));
  const safeIndex = safeCount ? Math.max(0, Math.min(safeCount - 1, Math.trunc(index))) : 0;
  return { focus: normalizeFocus(focus), index: safeIndex, count: safeCount, state, nonce: pixelCode(`${seed}:${focus}:${safeIndex}:${safeCount}`, 10) };
}

export function interactionFooter(model: InteractionModel, width = 52): string {
  const w = Math.max(24, Math.min(80, Math.trunc(width)));
  const position = model.count ? `${model.index + 1}/${model.count}` : "0/0";
  return `${focusGlyph(model.state)} ${model.focus.padEnd(9," ")} ${position.padEnd(6," ")} ${pixelMeter(model.count ? (model.index + 1) / model.count * 100 : 0, Math.max(6, Math.min(18,w - 34)))} · ${model.nonce}`.slice(0,w);
}

export function interactionHint(items: readonly FocusItem[], active = 0): string {
  const item = items[Math.max(0, Math.min(items.length - 1, Math.trunc(active)))];
  return item ? `${focusGlyph(item.state ?? "FOCUSED")} ${uiText(item.label,"ACTION",48)}${item.hint ? ` — ${uiText(item.hint,"",72)}` : ""}` : "○ NO ACTION SELECTED";
}
