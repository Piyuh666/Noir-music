/** NOIR MUSIC // GLYPH-18 NAVIGATION + INFORMATION ARCHITECTURE */
import { uiText } from "./surface";
import { kernelFrame, kernelRule } from "./visualKernel";

export type NavKind = "PRIMARY" | "SECONDARY" | "BACK" | "NEXT" | "REFRESH" | "SEARCH" | "CLOSE";
export type NavAvailability = "AVAILABLE" | "DISABLED" | "BUSY" | "STALE";

export interface NavItem {
  id: string;
  label: string;
  kind?: NavKind;
  availability?: NavAvailability;
  hint?: string;
  shortcut?: string;
}

const NAV_GLYPH: Record<NavKind, string> = {
  PRIMARY: "◆", SECONDARY: "·", BACK: "‹", NEXT: "›", REFRESH: "⌁", SEARCH: "⌕", CLOSE: "×",
};
const AVAIL_GLYPH: Record<NavAvailability, string> = {
  AVAILABLE: "●", DISABLED: "○", BUSY: "◐", STALE: "◇",
};

function widthOf(width: number): number { return Math.max(24, Math.min(72, Math.trunc(Number(width) || 48))); }
function clean(value: unknown, width: number): string { return uiText(String(value ?? ""), "", width); }

export function navBreadcrumb(items: readonly string[], width = 56): string {
  const w = widthOf(width);
  return items.slice(-6).map((item, i) => `${i ? " › " : ""}${clean(item, 18)}`).join("").slice(0, w);
}

export function navRail(items: readonly NavItem[], width = 56): string {
  const w = widthOf(width);
  const rows = items.slice(0, 10).map((item, index) => {
    const kind = item.kind ?? (index === 0 ? "PRIMARY" : "SECONDARY");
    const availability = item.availability ?? "AVAILABLE";
    const shortcut = item.shortcut ? ` [${clean(item.shortcut, 8)}]` : "";
    return `${AVAIL_GLYPH[availability]} ${NAV_GLYPH[kind]} ${clean(item.label, w - 18)}${shortcut}${item.hint ? ` · ${clean(item.hint, 14)}` : ""}`.slice(0, w);
  });
  return kernelFrame(rows.length ? rows : ["○ NO NAVIGATION"], { width: w, title: "NAVIGATION RAIL", tone: "PANEL" });
}

export interface PageState {
  page: number;
  pages: number;
  total: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export function pageRail(state: PageState, width = 48): string {
  const w = widthOf(width);
  const page = Math.max(1, Math.trunc(state.page));
  const pages = Math.max(1, Math.trunc(state.pages));
  const prev = state.hasPrevious ? "‹ PREV" : "○ PREV";
  const next = state.hasNext ? "NEXT ›" : "○ NEXT";
  return `${prev}   ·   PAGE ${page}/${pages}   ·   ${next}`.slice(0, w);
}

export function navHeader(title: string, context = "", width = 56): string {
  const w = widthOf(width);
  return [`◆ ${clean(title, w - 4).toUpperCase()}`, context ? `· ${clean(context, w - 2)}` : "", kernelRule(w)].filter(Boolean).join("\n");
}

export function navSection(label: string, items: readonly string[], width = 56): string {
  const w = widthOf(width);
  const rows = [kernelRule(w, "─"), `▣ ${clean(label, w - 4).toUpperCase()}`, ...items.slice(0, 12).map((x, i) => `${String(i + 1).padStart(2, "0")}  ${clean(x, w - 6)}`)];
  return rows.join("\n");
}

export function navActionSummary(item: NavItem, width = 48): string {
  const w = widthOf(width);
  const kind = item.kind ?? "SECONDARY";
  const availability = item.availability ?? "AVAILABLE";
  const status = availability === "BUSY" ? "PROCESSING" : availability === "STALE" ? "REFRESH REQUIRED" : availability;
  return `${AVAIL_GLYPH[availability]} ${NAV_GLYPH[kind]} ${clean(item.label, w - 26).toUpperCase()} · ${status}`.slice(0, w);
}
