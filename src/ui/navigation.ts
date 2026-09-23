/** NOIR MUSIC // GLYPH-14 NAVIGATION — focused, predictable Discord navigation UX. */
export type NavigationKind = "PRIMARY" | "SECONDARY" | "BACK" | "NEXT" | "REFRESH" | "CLOSE" | "SEARCH" | "MORE";
export interface NavigationItem { id: string; label: string; kind?: NavigationKind; active?: boolean; disabled?: boolean; hint?: string; }
export interface NavigationModel { title: string; items: NavigationItem[]; selected?: string; page?: number; pages?: number; }

const GLYPH: Record<NavigationKind, string> = { PRIMARY: "◆", SECONDARY: "·", BACK: "‹", NEXT: "›", REFRESH: "↻", CLOSE: "×", SEARCH: "⌕", MORE: "⋮" };
function text(value: unknown): string { return String(value ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim(); }

export function navigationGlyph(kind: NavigationKind = "SECONDARY"): string { return GLYPH[kind]; }
export function navigationItem(item: NavigationItem): string {
  const marker = item.disabled ? "○" : item.active ? "◆" : GLYPH[item.kind ?? "SECONDARY"];
  const hint = item.hint ? ` · ${text(item.hint)}` : "";
  return `${marker} ${text(item.label)}${hint}`;
}
export function navigationRail(items: NavigationItem[], width = 54): string {
  const parts = items.slice(0, 8).map(navigationItem);
  const raw = parts.join("  ·  ");
  return raw.length <= width ? raw : `${raw.slice(0, Math.max(1, width - 1)).trimEnd()}…`;
}
export function breadcrumb(items: string[], separator = "›"): string {
  return items.map(text).filter(Boolean).slice(0, 8).join(` ${separator} `);
}
export function pagination(page: number, pages: number): string {
  const p = Math.max(1, Math.floor(page || 1)); const total = Math.max(1, Math.floor(pages || 1));
  return `‹ ${p > 1 ? "PREV" : "────"}   ${p}/${total}   ${p < total ? "NEXT" : "────"} ›`;
}
export function navigationModel(model: NavigationModel): string[] {
  const lines = [`◆ ${text(model.title)}`, navigationRail(model.items)];
  if (model.page !== undefined || model.pages !== undefined) lines.push(pagination(model.page ?? 1, model.pages ?? 1));
  return lines;
}
