/**
 * NOIR MUSIC // GLYPH-18 VISUAL KERNEL
 *
 * Low-level presentation primitives for dense, deterministic Discord surfaces.
 * This module owns visual geometry only: no commands, audio state or network
 * side effects. Every renderer is bounded so a noisy data set cannot explode
 * a Discord message.
 */
import { compactNumber, uiText } from "./surface";
import { UI_TOKENS, type UIMode, modeTokens } from "./theme";

export type KernelTone = "VOID" | "PANEL" | "DENSE" | "OPERATOR" | "ALERT";
export type KernelWeight = "LIGHT" | "REGULAR" | "HEAVY" | "BLOCK";

const TONE_GLYPH: Record<KernelTone, string> = {
  VOID: "○", PANEL: "·", DENSE: "◐", OPERATOR: "▣", ALERT: "×",
};
const WEIGHT_GLYPH: Record<KernelWeight, string> = {
  LIGHT: "░", REGULAR: "▒", HEAVY: "▓", BLOCK: "█",
};

function safeWidth(width: number, min = 16, max = 72): number {
  const n = Math.trunc(Number(width));
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : min;
}

function safeRows(rows: number, min = 1, max = 20): number {
  const n = Math.trunc(Number(rows));
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : min;
}

function trimLine(value: unknown, width: number): string {
  return uiText(String(value ?? ""), "", Math.max(1, width));
}

export function kernelRule(width = 48, glyph = "─"): string {
  const w = safeWidth(width);
  return glyph.repeat(w);
}

export function kernelDoubleRule(width = 48): string {
  return kernelRule(width, "═");
}

export function kernelScanRule(width = 48, phase = 0): string {
  const w = safeWidth(width);
  const offset = Math.abs(Math.trunc(phase)) % 4;
  const marks = ["·", "╌", "┄", "╍"];
  return Array.from({ length: w }, (_, i) => i % 4 === offset ? marks[offset] : "─").join("");
}

export function kernelFrame(lines: readonly string[], options: { width?: number; tone?: KernelTone; title?: string; weight?: KernelWeight } = {}): string {
  const width = safeWidth(options.width ?? 48);
  const tone = options.tone ?? "PANEL";
  const weight = options.weight ?? "REGULAR";
  const inner = Math.max(8, width - 4);
  const title = options.title ? ` ${trimLine(options.title, inner - 2).toUpperCase()} ` : "";
  const top = title ? `┌${title}${"─".repeat(Math.max(0, width - title.length - 2))}┐` : `┌${"─".repeat(width - 2)}┐`;
  const body = lines.slice(0, 18).map((line) => `│ ${trimLine(line, inner)} │`);
  const empty = Math.max(0, 1 - body.length);
  body.push(...Array.from({ length: empty }, () => `│ ${" ".repeat(inner)} │`));
  const bottom = `└${"─".repeat(width - 2)}┘`;
  return [`${TONE_GLYPH[tone]} ${WEIGHT_GLYPH[weight]} ${top}`, ...body, bottom].join("\n");
}

export function kernelBar(value: number, width = 24, fill = "█", empty = "░"): string {
  const w = Math.max(4, Math.min(48, Math.trunc(width)));
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  const filled = Math.round(w * safe / 100);
  return `${fill.repeat(filled)}${empty.repeat(w - filled)} ${Math.round(safe).toString().padStart(3, " ")}%`;
}

export function kernelSegmentBar(value: number, width = 24, segments = 8): string {
  const count = Math.max(2, Math.min(16, Math.trunc(segments)));
  const w = Math.max(count, Math.min(48, Math.trunc(width)));
  const active = Math.round(count * Math.max(0, Math.min(100, Number(value) || 0)) / 100);
  return Array.from({ length: count }, (_, i) => i < active ? "■" : "·").join("").padEnd(w, " ");
}

export function kernelSpark(values: readonly number[], width = 32): string {
  const source = values.filter(Number.isFinite).slice(-Math.max(4, Math.min(64, Math.trunc(width))));
  if (!source.length) return "·".repeat(Math.max(4, Math.min(64, Math.trunc(width))));
  const chars = "▁▂▃▄▅▆▇█";
  const min = Math.min(...source);
  const max = Math.max(...source);
  const span = max - min || 1;
  return source.map((v) => chars[Math.max(0, Math.min(chars.length - 1, Math.round((v - min) / span * (chars.length - 1))))]).join("");
}

export function kernelWave(values: readonly number[], width = 40): string {
  const w = Math.max(8, Math.min(64, Math.trunc(width)));
  if (!values.length) return "·".repeat(w);
  const step = Math.max(1, Math.ceil(values.length / w));
  const sampled: number[] = [];
  for (let i = 0; i < values.length && sampled.length < w; i += step) sampled.push(Number(values[i]) || 0);
  const mean = sampled.reduce((a, b) => a + b, 0) / Math.max(1, sampled.length);
  return sampled.map((v) => v >= mean ? "╱" : "╲").join("").padEnd(w, "─");
}

export function kernelHeat(values: readonly number[], width = 40): string {
  const w = Math.max(8, Math.min(64, Math.trunc(width)));
  const source = values.filter(Number.isFinite).slice(-w);
  if (!source.length) return "·".repeat(w);
  const max = Math.max(...source.map(Math.abs)) || 1;
  const glyphs = ["·", "░", "▒", "▓", "█"];
  return source.map((v) => glyphs[Math.min(4, Math.round(Math.abs(v) / max * 4))]).join("").padEnd(w, "·");
}

export function kernelHistogram(values: readonly number[], width = 40, bins = 8): string {
  const source = values.filter(Number.isFinite);
  if (!source.length) return "·".repeat(Math.max(8, Math.min(64, Math.trunc(width))));
  const count = Math.max(2, Math.min(12, Math.trunc(bins)));
  const max = Math.max(...source, 1);
  const buckets = Array.from({ length: count }, () => 0);
  source.forEach((v) => buckets[Math.min(count - 1, Math.max(0, Math.floor((Math.max(0, v) / max) * count))) ]++);
  const peak = Math.max(...buckets, 1);
  return buckets.map((v) => "▁▂▃▄▅▆▇█"[Math.min(7, Math.round(v / peak * 7))]).join("");
}

export function kernelMatrix(seed = 0, width = 40, rows = 4): string {
  const w = safeWidth(width, 8, 64);
  const r = safeRows(rows, 1, 8);
  let state = (Math.trunc(seed) >>> 0) || 1;
  const next = () => { state = (Math.imul(state ^ (state >>> 16), 0x45d9f3b) + 0x1f123bb5) >>> 0; return state; };
  return Array.from({ length: r }, () => Array.from({ length: w }, () => (next() & 3) === 0 ? "·" : (next() & 1) ? "░" : "▒").join("")).join("\n");
}

export function kernelCode(value: string, width = 24): string {
  const normalized = String(value ?? "").replace(/[^A-Za-z0-9._:/-]/g, "-").toUpperCase();
  return `[${normalized.slice(0, Math.max(4, width - 2)).padEnd(Math.max(4, width - 2), " ")}]`;
}

export function kernelBadge(label: string, value: unknown, tone: KernelTone = "PANEL", width = 28): string {
  const w = safeWidth(width, 12, 44);
  const text = `${TONE_GLYPH[tone]} ${trimLine(label, Math.floor(w / 2)).toUpperCase()} ${trimLine(value, Math.floor(w / 2) - 2)}`;
  return `‹ ${text} ›`.slice(0, w);
}

export function kernelMetricGrid(metrics: readonly { label: string; value: unknown; hint?: string }[], width = 54, columns = 2): string {
  const w = safeWidth(width);
  const cols = Math.max(1, Math.min(3, Math.trunc(columns)));
  const cell = Math.max(10, Math.floor((w - cols - 1) / cols));
  const rows: string[] = [];
  for (let i = 0; i < metrics.length; i += cols) {
    const row = metrics.slice(i, i + cols).map((m) => {
      const value = compactNumber(Number(m.value)) !== "0" || m.value === 0 ? String(m.value) : String(m.value ?? "—");
      return trimLine(`${m.label.toUpperCase()}  ${value}${m.hint ? ` · ${m.hint}` : ""}`, cell).padEnd(cell, " ");
    });
    rows.push(`│${row.join("│")}│`);
  }
  return rows.join("\n");
}

export function kernelModeHeader(mode: UIMode, title: string, subtitle = ""): string {
  const t = modeTokens(mode);
  return `${UI_TOKENS.glyph.active} ${trimLine(title, t.width - 10).toUpperCase()}  · ${mode.toUpperCase()}${subtitle ? `\n${UI_TOKENS.glyph.scan} ${trimLine(subtitle, t.width - 4)}` : ""}`;
}

export function kernelDensity(value: number): string {
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  if (safe >= 85) return "OPERATOR";
  if (safe >= 65) return "DENSE";
  if (safe >= 35) return "STANDARD";
  return "COMPACT";
}

export function kernelStateLine(state: string, detail = "", width = 48): string {
  return `${TONE_GLYPH[state === "ERROR" ? "ALERT" : state === "BUSY" ? "DENSE" : "PANEL"]} ${trimLine(state, 16).toUpperCase()}${detail ? `  · ${trimLine(detail, width - 22)}` : ""}`;
}
