import type { UiDensity, UiViewport } from "./contracts";

export function normalizeViewport(width: number): UiViewport {
  const w = Math.max(30, Math.min(72, Math.trunc(Number(width) || 60)));
  const density: UiDensity = w < 38 ? "MINI" : w < 46 ? "COMPACT" : w < 56 ? "STANDARD" : w < 66 ? "DENSE" : "OPERATOR";
  const columns = w >= 62 ? 4 : w >= 50 ? 3 : w >= 40 ? 2 : 1;
  return Object.freeze({ width: w, maxRows: 28, density, columns });
}

export function fitText(value: unknown, width: number): string {
  const w = Math.max(1, Math.trunc(width));
  const text = String(value ?? "").replace(/[\r\n\t]+/g, " ").replace(/ {2,}/g, " ").trim();
  if (text.length <= w) return text.padEnd(w, " ");
  if (w <= 1) return text.slice(0, w);
  return `${text.slice(0, w - 1)}…`;
}

export function splitColumns(lines: readonly string[], viewport: UiViewport): readonly string[] {
  const width = Math.max(8, Math.floor((viewport.width - (viewport.columns - 1)) / viewport.columns));
  const out: string[] = [];
  for (let i = 0; i < lines.length; i += viewport.columns) {
    const row = Array.from({ length: viewport.columns }, (_, column) => fitText(lines[i + column] ?? "", width));
    out.push(row.join(" "));
  }
  return Object.freeze(out);
}
