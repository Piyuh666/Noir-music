/** NOIR MUSIC // GLYPH-17 FOCUS MODEL — interaction hierarchy and keyboard-like visual focus. */
import { uiText } from "./surface";

export type FocusMode = "REST" | "FOCUS" | "ACTIVE" | "BUSY" | "DISABLED" | "STALE";

export interface FocusItem {
  id: string;
  label: string;
  mode: FocusMode;
  shortcut?: string;
  destructive?: boolean;
  description?: string;
}

const GLYPH: Record<FocusMode, string> = {
  REST: "◇",
  FOCUS: "◆",
  ACTIVE: "●",
  BUSY: "◐",
  DISABLED: "○",
  STALE: "◇",
};

export function focusGlyph(mode: FocusMode): string { return GLYPH[mode]; }

export function focusLabel(item: FocusItem): string {
  const shortcut = item.shortcut ? ` [${uiText(item.shortcut, "", 8)}]` : "";
  const danger = item.destructive ? " !" : "";
  return `${GLYPH[item.mode]} ${uiText(item.label, "ACTION", 48)}${shortcut}${danger}`;
}

export function focusRail(items: FocusItem[], activeId?: string): string {
  return items.slice(0, 25).map((item) => focusLabel({ ...item, mode: item.id === activeId ? "FOCUS" : item.mode })).join("\n");
}

export function focusAnnouncement(item: FocusItem): string {
  const state = item.mode === "FOCUS" ? "focused" : item.mode.toLowerCase();
  return `${uiText(item.label, "ACTION", 80)} — ${state}${item.description ? ` — ${uiText(item.description, "", 120)}` : ""}.`;
}

export function focusIndex(items: FocusItem[]): Map<string, number> {
  return new Map(items.map((item, index) => [item.id, index]));
}
