/**
 * NOIR MUSIC // GLYPH-15 GLYPH STUDIO
 *
 * Pure presentation primitives for building dense, deterministic pixel-writing
 * surfaces. No Discord objects, no application state, and no command logic.
 */
import { compactNumber, uiText } from "./surface";
import { UI_TOKENS, type UIMode, modeTokens } from "./theme";

export type GlyphWeight = "LIGHT" | "REGULAR" | "HEAVY" | "BLOCK";
export type GlyphAlign = "LEFT" | "CENTER" | "RIGHT";
export type GlyphTone = "QUIET" | "NEUTRAL" | "ACTIVE" | "WARNING" | "DANGER";

const WEIGHTS: Record<GlyphWeight, string> = {
  LIGHT: "░",
  REGULAR: "·",
  HEAVY: "▓",
  BLOCK: "█",
};

const TONES: Record<GlyphTone, string> = {
  QUIET: "○",
  NEUTRAL: "·",
  ACTIVE: "◆",
  WARNING: "◐",
  DANGER: "×",
};

function width(value: number, fallback = 32): number {
  return Math.max(8, Math.min(72, Number.isFinite(value) ? Math.trunc(value) : fallback));
}

function align(text: string, size: number, mode: GlyphAlign): string {
  const safe = uiText(text, "", size);
  if (mode === "RIGHT") return safe.padStart(size, " ");
  if (mode === "CENTER") {
    const left = Math.floor((size - safe.length) / 2);
    return `${" ".repeat(Math.max(0, left))}${safe}`.padEnd(size, " ");
  }
  return safe.padEnd(size, " ");
}

export function glyphRule(size = 32, glyph = "─"): string {
  return glyph.repeat(width(size));
}

export function glyphDoubleRule(size = 32): string {
  return glyphRule(size, "═");
}

export function glyphCornerFrame(lines: readonly string[], size = 40, title = ""): string {
  const w = width(size);
  const body = lines.slice(0, 16).map((line) => `│${align(line, w - 2, "LEFT")}│`);
  const top = `┌${title ? ` ${uiText(title, "", w - 4)} ` : ""}${"─".repeat(Math.max(0, w - (title ? title.length + 4 : 0) - 2))}┐`;
  return [top, ...body, `└${"─".repeat(w - 2)}┘`].join("\n");
}

export function glyphBanner(label: string, size = 40, glyph = "█"): string {
  const w = width(size);
  const text = uiText(label, "NOIR MUSIC", w - 4).toUpperCase();
  return `${glyph.repeat(w)}\n${align(text, w, "CENTER")}\n${glyph.repeat(w)}`;
}

export function glyphPill(label: string, tone: GlyphTone = "NEUTRAL", size = 22): string {
  const w = width(size, 22);
  const mark = TONES[tone];
  return `[${mark} ${uiText(label, "STATE", w - 6)}]`;
}

export function glyphProgress(value: number, size = 24, weight: GlyphWeight = "HEAVY"): string {
  const w = Math.max(4, Math.min(48, Math.trunc(size)));
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const filled = Math.round((v / 100) * w);
  const glyph = WEIGHTS[weight];
  return `${glyph.repeat(filled)}${WEIGHTS.LIGHT.repeat(w - filled)} ${Math.round(v).toString().padStart(3, " ")}%`;
}

export function glyphSteps(current: number, total: number, size = 24): string {
  const count = Math.max(1, Math.min(32, Math.trunc(total)));
  const active = Math.max(0, Math.min(count, Math.trunc(current)));
  const max = Math.max(4, Math.min(48, Math.trunc(size)));
  const cells = Math.min(count, max);
  return Array.from({ length: cells }, (_, index) => index < active ? "◆" : index === active ? "◇" : "·").join("");
}

export function glyphHistogram(values: readonly number[], size = 40, levels = 5): string {
  const w = width(size, 40);
  const samples = values.filter(Number.isFinite).slice(-w);
  if (!samples.length) return "·".repeat(Math.min(w, 8));
  const max = Math.max(...samples, 1);
  const rows = Math.max(2, Math.min(8, Math.trunc(levels)));
  return Array.from({ length: rows }, (_, row) => {
    const threshold = 1 - row / rows;
    return samples.map((value) => value / max >= threshold ? "█" : " ").join("");
  }).join("\n");
}

export function glyphWave(values: readonly number[], size = 44): string {
  const w = width(size, 44);
  const samples = values.filter(Number.isFinite).slice(-w);
  if (!samples.length) return "·".repeat(Math.min(w, 8));
  const chars = "▁▂▃▄▅▆▇█";
  const min = Math.min(...samples);
  const max = Math.max(...samples);
  const span = Math.max(1e-9, max - min);
  return samples.map((value) => chars[Math.min(chars.length - 1, Math.floor(((value - min) / span) * chars.length))]).join("");
}

export function glyphHeat(values: readonly number[], size = 40): string {
  const w = width(size, 40);
  const chars = " ·░▒▓█";
  return values.filter(Number.isFinite).slice(-w).map((value) => {
    const n = Math.max(0, Math.min(1, Number(value) / 100));
    return chars[Math.min(chars.length - 1, Math.round(n * (chars.length - 1)))];
  }).join("");
}

export function glyphMeter(value: number, mode: UIMode = "standard"): string {
  return glyphProgress(value, modeTokens(mode).meter, mode === "operator" ? "BLOCK" : "HEAVY");
}

export function glyphKeyValue(key: string, value: unknown, size = 40): string {
  const w = width(size, 40);
  const left = uiText(key, "KEY", Math.floor(w * 0.38)).toUpperCase();
  const right = uiText(value, "—", Math.floor(w * 0.55));
  return `${left.padEnd(Math.floor(w * 0.4), " ")} ${UI_TOKENS.glyph.arrow} ${right}`.slice(0, w);
}

export function glyphMetricGrid(metrics: readonly { label: string; value: unknown; tone?: GlyphTone }[], size = 52, columns = 2): string {
  const w = width(size, 52);
  const cols = Math.max(1, Math.min(3, Math.trunc(columns)));
  const cell = Math.max(10, Math.floor((w - (cols - 1) * 2) / cols));
  const rows: string[] = [];
  for (let i = 0; i < metrics.length; i += cols) {
    const row = metrics.slice(i, i + cols).map((metric) => {
      const pill = glyphPill(metric.label, metric.tone ?? "NEUTRAL", cell);
      return uiText(`${pill} ${compactNumber(metric.value)}`, "", cell);
    });
    rows.push(row.map((item) => item.padEnd(cell, " ")).join("  ").slice(0, w));
  }
  return rows.join("\n");
}

export function glyphModeRail(mode: UIMode): string {
  const modes: UIMode[] = ["compact", "standard", "dense", "operator"];
  return modes.map((entry) => entry === mode ? `[◆ ${entry.toUpperCase()}]` : `[· ${entry.toUpperCase()}]`).join(" ");
}

export function glyphCoordinate(row: number, column: number, size = 4): string {
  const r = Math.max(0, Math.trunc(row)).toString(36).toUpperCase().padStart(size, "0");
  const c = Math.max(0, Math.trunc(column)).toString(36).toUpperCase().padStart(size, "0");
  return `${r}:${c}`;
}

export function glyphCode(value: string, size = 18): string {
  const safe = uiText(value, "NOIR MUSIC", size).replace(/[^A-Za-z0-9:_./-]/g, "-");
  return `⌘ ${safe}`;
}

export function glyphFooter(left: string, right = "NOIR MUSIC", size = 52): string {
  const w = width(size, 52);
  const a = uiText(left, "STATUS", Math.floor(w / 2));
  const b = uiText(right, "NOIR MUSIC", Math.floor(w / 2));
  return `${a.padEnd(Math.max(1, w - b.length - 1), " ")}${b}`.slice(0, w);
}
