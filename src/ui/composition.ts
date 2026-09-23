/** NOIR MUSIC // GLYPH-18 COMPOSITION ENGINE */
import { uiText } from "./surface";
import { kernelFrame, kernelModeHeader, kernelRule } from "./visualKernel";
import { navBreadcrumb, pageRail, type PageState } from "./uxNavigation";

export type CompositionDensity = "MINI" | "COMPACT" | "STANDARD" | "DENSE" | "OPERATOR";
export interface CompositionSpec {
  title: string;
  subtitle?: string;
  breadcrumb?: readonly string[];
  density?: CompositionDensity;
  width?: number;
  sections?: readonly CompositionSection[];
  page?: PageState;
  footer?: string;
}
export interface CompositionSection {
  title: string;
  lines: readonly string[];
  tone?: "VOID" | "PANEL" | "DENSE" | "OPERATOR" | "ALERT";
}

const DENSITY: Record<CompositionDensity, { width: number; lines: number; gap: number }> = {
  MINI: { width: 30, lines: 4, gap: 0 },
  COMPACT: { width: 38, lines: 6, gap: 1 },
  STANDARD: { width: 50, lines: 9, gap: 1 },
  DENSE: { width: 58, lines: 13, gap: 1 },
  OPERATOR: { width: 68, lines: 16, gap: 0 },
};

function widthOf(spec: CompositionSpec): number {
  const d = DENSITY[spec.density ?? "STANDARD"];
  return Math.max(24, Math.min(72, Math.trunc(spec.width ?? d.width)));
}

function densityFor(width: number): CompositionDensity {
  if (width <= 32) return "MINI";
  if (width <= 42) return "COMPACT";
  if (width <= 52) return "STANDARD";
  if (width <= 62) return "DENSE";
  return "OPERATOR";
}

export function composition(spec: CompositionSpec): string {
  const width = widthOf(spec);
  const density = spec.density ?? densityFor(width);
  const d = DENSITY[density];
  const blocks: string[] = [kernelModeHeader(density === "MINI" ? "compact" : density === "OPERATOR" ? "operator" : density === "DENSE" ? "dense" : "standard", spec.title, spec.subtitle ?? "")];
  if (spec.breadcrumb?.length) blocks.push(navBreadcrumb(spec.breadcrumb, width));
  blocks.push(kernelRule(width));
  for (const section of (spec.sections ?? []).slice(0, 8)) {
    const lines = section.lines.slice(0, d.lines).map((line) => uiText(line, "", width - 6));
    blocks.push(kernelFrame(lines.length ? lines : ["○ EMPTY"], { width, title: section.title, tone: section.tone ?? "PANEL" }));
  }
  if (spec.page) blocks.push(pageRail(spec.page, width));
  if (spec.footer) blocks.push(`· ${uiText(spec.footer, "", width - 4)}`);
  return blocks.filter(Boolean).join("\n\n");
}

export function stackSurfaces(surfaces: readonly string[], width = 52, gap = 1): string {
  const w = Math.max(24, Math.min(72, Math.trunc(width)));
  const spacer = " ".repeat(Math.max(0, Math.min(2, Math.trunc(gap))));
  return surfaces.slice(0, 8).map((surface) => uiText(surface, "", w * 8)).join(`\n${spacer}\n`);
}

export function twoPane(left: readonly string[], right: readonly string[], width = 56): string {
  const w = Math.max(32, Math.min(72, Math.trunc(width)));
  const cell = Math.max(12, Math.floor((w - 3) / 2));
  const rows = Math.max(left.length, right.length, 1);
  return Array.from({ length: Math.min(rows, 16) }, (_, i) => {
    const a = uiText(left[i] ?? "", "", cell).padEnd(cell, " ");
    const b = uiText(right[i] ?? "", "", cell).padEnd(cell, " ");
    return `│${a}│${b}│`;
  }).join("\n");
}

export function operatorStrip(items: readonly string[], width = 62): string {
  const w = Math.max(32, Math.min(72, Math.trunc(width)));
  const cells = items.slice(0, 6).map((x) => ` ${uiText(x, "", Math.floor(w / Math.max(1, Math.min(6, items.length))) - 2)} `);
  return `▣ ${cells.join("│")}`.slice(0, w);
}

export function visualDivider(label = "", width = 52): string {
  const w = Math.max(24, Math.min(72, Math.trunc(width)));
  const text = label ? ` ${uiText(label, "", Math.max(4, w - 8)).toUpperCase()} ` : "";
  const remain = Math.max(0, w - text.length);
  return `${"═".repeat(Math.floor(remain / 2))}${text}${"═".repeat(Math.ceil(remain / 2))}`;
}
