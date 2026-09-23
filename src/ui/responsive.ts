/** NOIR MUSIC // GLYPH-V48.6 RESPONSIVE COMPOSITION */
import { clampInt, packVisualBlocks } from "./surface";
import { pixelFrame } from "./visualGlyphs";

export type Density21 = "MINI" | "COMPACT" | "STANDARD" | "DENSE" | "OPERATOR";
export interface ResponsiveContract { width: number; maxLines: number; columns: number; actions: number; fields: number; }
export const RESPONSIVE_PROFILES: Readonly<Record<Density21, ResponsiveContract>> = Object.freeze({
  MINI: { width: 26, maxLines: 5, columns: 1, actions: 2, fields: 4 },
  COMPACT: { width: 38, maxLines: 7, columns: 1, actions: 3, fields: 6 },
  STANDARD: { width: 50, maxLines: 10, columns: 2, actions: 5, fields: 10 },
  DENSE: { width: 60, maxLines: 15, columns: 2, actions: 7, fields: 16 },
  OPERATOR: { width: 70, maxLines: 20, columns: 3, actions: 10, fields: 25 },
});

export function contract(mode: Density21): ResponsiveContract { return RESPONSIVE_PROFILES[mode]; }
export function fitDensity(mode: Density21, lines: readonly string[]): string[] { const c = contract(mode); return lines.slice(0, c.maxLines).map((line) => line.slice(0, c.width - 4)); }
export function responsivePanel(lines: readonly string[], mode: Density21 = "STANDARD"): string { const c = contract(mode); return pixelFrame(fitDensity(mode, lines), clampInt(c.width, 16, 72, 50), mode === "OPERATOR" ? "OPERATOR" : mode === "DENSE" ? "DENSE" : "PANEL", mode === "OPERATOR" ? "BLOCK" : "REGULAR"); }
export function responsivePages(blocks: readonly string[], mode: Density21 = "STANDARD"): string[][] { const c = contract(mode); return packVisualBlocks(blocks, 4096, Math.max(3, c.maxLines)); }


export type ResponsiveProfile = Density21;
export interface ResponsiveSpec { width: number; maxLines: number; columns: number; fields: number; controlsPerRow: number; }
export function responsiveSpec(profile: ResponsiveProfile): ResponsiveSpec { const c = contract(profile); return { width: c.width, maxLines: c.maxLines, columns: c.columns, fields: c.fields, controlsPerRow: c.actions }; }
export function profileFromWidth(width: number): ResponsiveProfile { const n = Number(width) || 0; if (n < 28) return "MINI"; if (n < 40) return "COMPACT"; if (n < 50) return "STANDARD"; if (n < 58) return "DENSE"; return "OPERATOR"; }
export function responsiveClamp(value: string, profile: ResponsiveProfile, suffix = "…"): string { const limit = Math.max(4, responsiveSpec(profile).width - 4); return value.length <= limit ? value : `${value.slice(0, Math.max(1, limit - suffix.length))}${suffix}`; }
export function responsiveColumns<T>(items: readonly T[], profile: ResponsiveProfile): T[][] { const columns = responsiveSpec(profile).columns; const result: T[][] = Array.from({ length: columns }, () => [] as T[]); items.forEach((item, index) => result[index % columns].push(item)); return result; }
