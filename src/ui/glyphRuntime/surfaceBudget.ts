/** NOIR MUSIC // GLYPH-V48.6 SURFACE BUDGET — Discord-safe visual packing and degradation. */
export interface SurfaceBudget { width: number; maxLines: number; maxSections: number; maxActions: number; maxFields: number; maxChars: number; }
export interface SurfacePayload { title: string; sections: readonly string[]; actions: readonly string[]; footer?: string; }
export interface PackedSurface { title: string; sections: string[]; actions: string[]; footer: string; truncated: boolean; usedChars: number; }
const LIMITS: Record<"MINI" | "COMPACT" | "STANDARD" | "DENSE" | "OPERATOR", SurfaceBudget> = {
  MINI: { width: 32, maxLines: 5, maxSections: 2, maxActions: 3, maxFields: 4, maxChars: 900 },
  COMPACT: { width: 40, maxLines: 7, maxSections: 4, maxActions: 5, maxFields: 6, maxChars: 1600 },
  STANDARD: { width: 52, maxLines: 10, maxSections: 6, maxActions: 6, maxFields: 10, maxChars: 2800 },
  DENSE: { width: 60, maxLines: 14, maxSections: 8, maxActions: 8, maxFields: 16, maxChars: 4200 },
  OPERATOR: { width: 70, maxLines: 18, maxSections: 10, maxActions: 10, maxFields: 20, maxChars: 5600 },
};
const clean = (s: string, n: number) => s.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
export function budgetFor(mode: keyof typeof LIMITS): SurfaceBudget { return { ...LIMITS[mode] }; }
export function packSurface(payload: SurfacePayload, mode: keyof typeof LIMITS = "STANDARD"): PackedSurface {
  const b = LIMITS[mode]; let used = 0; let truncated = false;
  const title = clean(payload.title, Math.min(160, b.width * 3)); used += title.length;
  const sections: string[] = [];
  for (const raw of payload.sections.slice(0, b.maxSections)) {
    const line = clean(raw, b.width * 2);
    if (used + line.length + 1 > b.maxChars) { truncated = true; break; }
    sections.push(line); used += line.length + 1;
  }
  if (payload.sections.length > sections.length) truncated = true;
  const actions = payload.actions.slice(0, b.maxActions).map((x) => clean(x, Math.min(80, b.width)));
  if (payload.actions.length > actions.length) truncated = true;
  let footer = clean(payload.footer ?? "", b.width * 2);
  if (footer && used + footer.length + 1 > b.maxChars) { footer = "⌁ MORE DATA AVAILABLE"; truncated = true; }
  used += footer.length;
  return { title, sections, actions, footer, truncated, usedChars: used };
}
export function budgetAudit(surface: PackedSurface, mode: keyof typeof LIMITS): string[] {
  const b = LIMITS[mode]; const issues: string[] = [];
  if (surface.sections.length > b.maxSections) issues.push("sections");
  if (surface.actions.length > b.maxActions) issues.push("actions");
  if (surface.usedChars > b.maxChars) issues.push("chars");
  return issues;
}
