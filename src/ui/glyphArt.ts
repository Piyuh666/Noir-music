/**
 * NOIR MUSIC // GLYPH-13 ART DIRECTOR
 *
 * Pure presentation primitives. This module intentionally owns no Discord
 * interaction, audio state, persistence, timers, or network behavior.
 * Everything is deterministic so the same view-model produces the same art.
 */
import { normalizeGlyphText, pixelBinary, pixelFramePanel, pixelGridMeter, pixelPulse, pixelSpark } from "./pixel";
import { UI_TOKENS, type UIMode, modeTokens } from "./theme";

export type ArtTone = "BLACK" | "PANEL" | "DENSE" | "OPERATOR";
export type ArtState = "LIVE" | "READY" | "PAUSED" | "WAIT" | "WARN" | "ERROR" | "OFFLINE";

const clamp = (n: unknown, min: number, max: number, fallback = min) => {
  const x = Number(n);
  return Number.isFinite(x) ? Math.max(min, Math.min(max, x)) : fallback;
};

const clean = (value: unknown, max = 64) => normalizeGlyphText(value, Math.max(1, max)).trim();
const border = (tone: ArtTone) => tone === "OPERATOR" ? "═" : tone === "DENSE" ? "┄" : tone === "BLACK" ? "·" : "─";

export function glyphRail(width = 48, glyph = "─"): string {
  const w = Math.max(8, Math.min(80, Math.trunc(width)));
  const g = String(glyph || "─").slice(0, 1);
  return `${g.repeat(w)}`;
}

export function glyphCornerFrame(title: unknown, lines: readonly unknown[] = [], opts: { width?: number; tone?: ArtTone; footer?: unknown } = {}): string {
  const width = Math.max(18, Math.min(78, Math.trunc(opts.width ?? 48)));
  const tone = opts.tone ?? "PANEL";
  const b = border(tone);
  const t = clean(title, width - 8) || "NOIR MUSIC";
  const top = `╔${b}${b} ${t} ${b.repeat(Math.max(2, width - t.length - 6))}╗`;
  const body = lines.slice(0, 16).map((line) => `║ ${clean(line, width - 4).padEnd(width - 4, " ")} ║`);
  const footer = opts.footer === undefined ? [] : [`╟${b.repeat(width)}╢`, `║ ${clean(opts.footer, width - 4).padEnd(width - 4, " ")} ║`];
  return [top, ...body, ...footer, `╚${b.repeat(width)}╝`].join("\n");
}

export function glyphStateChip(state: ArtState, detail = ""): string {
  const map: Record<ArtState, string> = { LIVE: "●", READY: "◆", PAUSED: "Ⅱ", WAIT: "◇", WARN: "◐", ERROR: "×", OFFLINE: "○" };
  return `${map[state] ?? "◇"} ${state.padEnd(7, " ")} ${clean(detail, 42)}`.trimEnd();
}

export function glyphProgress(value: number, width = 28, chars = { on: "█", mid: "▓", off: "░" }): string {
  const w = Math.max(8, Math.min(56, Math.trunc(width)));
  const p = clamp(value, 0, 100, 0);
  const exact = p / 100 * w;
  const full = Math.floor(exact);
  const partial = exact - full >= 0.5 ? 1 : 0;
  const mid = Math.min(1, Math.max(0, partial));
  return `${chars.on.repeat(full)}${mid ? chars.mid : ""}${chars.off.repeat(Math.max(0, w - full - mid))}`;
}

export function glyphProgressLabeled(label: unknown, value: number, width = 28): string {
  const name = clean(label, 14).padEnd(14, " ");
  return `${name} ${glyphProgress(value, width)} ${Math.round(clamp(value, 0, 100))}%`;
}

export function glyphTimeline(positionMs: number, durationMs: number, width = 42): string {
  const w = Math.max(10, Math.min(64, Math.trunc(width)));
  const d = Math.max(0, Number(durationMs) || 0);
  const p = d ? clamp(positionMs, 0, d, 0) : 0;
  const cursor = d ? Math.min(w - 1, Math.round(p / d * (w - 1))) : 0;
  return Array.from({ length: w }, (_, i) => i === cursor ? "◆" : i < cursor ? "━" : "─").join("");
}

export function glyphWave(values: readonly number[], width = 42, height = 7): string {
  const w = Math.max(8, Math.min(64, Math.trunc(width)));
  const h = Math.max(3, Math.min(11, Math.trunc(height)));
  const data = values.filter(Number.isFinite).slice(-w);
  if (!data.length) return Array.from({ length: h }, () => "·".repeat(w)).join("\n");
  const max = Math.max(1, ...data.map((v) => Math.abs(v)));
  const rows = Array.from({ length: h }, () => Array.from({ length: w }, () => "·"));
  data.forEach((v, x) => {
    const y = Math.round((1 - clamp(v / max, -1, 1, 0)) / 2 * (h - 1));
    rows[Math.max(0, Math.min(h - 1, y))][x] = "█";
  });
  return rows.map((row) => row.join("")).join("\n");
}

export function glyphHeat(values: readonly number[], width = 32, height = 4): string {
  const w = Math.max(8, Math.min(64, Math.trunc(width)));
  const h = Math.max(2, Math.min(8, Math.trunc(height)));
  const data = values.filter(Number.isFinite).slice(-w);
  const max = Math.max(1, ...data.map((v) => Math.abs(v)));
  return Array.from({ length: h }, (_, row) => {
    const threshold = 1 - row / Math.max(1, h - 1);
    return Array.from({ length: w }, (_, col) => {
      const n = Math.abs(data[col] ?? 0) / max;
      return n >= threshold ? "█" : n >= threshold - 0.2 ? "▪" : n >= threshold - 0.4 ? "·" : " ";
    }).join("");
  }).join("\n");
}

export function glyphMatrix(width = 28, height = 5, seed = 0, density = 0.18): string {
  const w = Math.max(8, Math.min(64, Math.trunc(width)));
  const h = Math.max(2, Math.min(12, Math.trunc(height)));
  let state = (Number(seed) >>> 0) || 0x4d4f4e4f;
  const next = () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return state >>> 0; };
  const d = clamp(density, 0, 1, 0.18);
  return Array.from({ length: h }, () => Array.from({ length: w }, () => {
    const n = next() / 0xffffffff;
    if (n < d * 0.12) return "▣";
    if (n < d) return "▪";
    return "·";
  }).join(" ")).join("\n");
}

export function glyphSignal(values: readonly number[], width = 42): string {
  const spark = pixelSpark(values, width);
  const heat = glyphHeat(values, width, 3);
  return [spark || "·", heat].join("\n");
}

export function glyphBinaryPanel(value: unknown, width = 42): string {
  const binary = pixelBinary(value, width);
  return glyphCornerFrame("IDENTITY", [binary, `CODE ${clean(value, 24) || "EMPTY"}`], { width, tone: "DENSE" });
}

export function glyphPulseRail(frame = 0, width = 42): string {
  return `${pixelPulse(frame, width)}  ${String(Math.max(0, Math.trunc(frame))).padStart(4, "0")}`;
}

export function glyphModeHeader(title: unknown, mode: UIMode = "standard", state: ArtState = "READY"): string {
  const tokens = modeTokens(mode);
  return [
    `▣ ${clean(title, tokens.width - 16).toUpperCase()}`,
    `${glyphStateChip(state, mode.toUpperCase())}`,
    glyphRail(Math.min(tokens.width, 62), state === "LIVE" ? "━" : "─"),
  ].join("\n");
}

export function glyphTelemetryRow(label: unknown, value: unknown, meter?: number, width = 48): string {
  const w = Math.max(24, Math.min(76, Math.trunc(width)));
  const left = clean(label, 14).padEnd(14, " ");
  const right = clean(value, Math.max(8, w - 18));
  const bar = meter === undefined ? "" : ` ${glyphProgress(meter, Math.min(20, Math.max(8, w - 34)))} ${Math.round(clamp(meter, 0, 100))}%`;
  return `│ ${left} ${right}${bar}`.slice(0, w);
}

export function glyphMetricWall(metrics: readonly { label: unknown; value: unknown; meter?: number; state?: ArtState }[], width = 52): string {
  const rows = metrics.slice(0, 14).map((m) => `${m.state ? glyphStateChip(m.state).slice(0, 2) : "·"} ${glyphTelemetryRow(m.label, m.value, m.meter, width).replace(/^│ /, "")}`);
  return glyphCornerFrame("METRIC WALL", rows, { width, tone: "OPERATOR", footer: `FIELDS ${Math.min(metrics.length, 14)}/${metrics.length}` });
}

export function glyphQueueRail(items: readonly { title: unknown; artist?: unknown; active?: boolean; duration?: string }[], width = 52): string {
  const rows = items.slice(0, 12).map((item, i) => {
    const mark = item.active ? "◆" : "·";
    const number = String(i + 1).padStart(2, "0");
    const title = clean(item.title, Math.max(12, width - 28));
    const artist = item.artist ? ` · ${clean(item.artist, 12)}` : "";
    const duration = item.duration ? ` [${clean(item.duration, 8)}]` : "";
    return `${mark} ${number} ${title}${artist}${duration}`;
  });
  return glyphCornerFrame("QUEUE RAIL", rows.length ? rows : ["○ QUEUE EMPTY", "ADD AUDIO TO INITIALIZE"], { width, tone: "DENSE" });
}

export function glyphDashboard(title: unknown, sections: readonly { label: unknown; value: unknown; state?: ArtState; meter?: number }[], mode: UIMode = "standard"): string {
  const tokens = modeTokens(mode);
  const rows = sections.slice(0, tokens.rows).map((s) => `${s.state ? glyphStateChip(s.state).slice(0, 2) : "·"} ${glyphTelemetryRow(s.label, s.value, s.meter, tokens.width)}`);
  return [glyphModeHeader(title, mode, "LIVE"), glyphCornerFrame("CONTROL FIELD", rows, { width: tokens.width, tone: mode === "operator" ? "OPERATOR" : "PANEL" })].join("\n");
}

export function glyphSpectrum(values: readonly number[], width = 52): string {
  const w = Math.max(24, Math.min(72, Math.trunc(width)));
  return glyphCornerFrame("SPECTRUM", [glyphWave(values, w - 4, 7), glyphSignal(values, w - 4)], { width: w, tone: "DENSE" });
}

export function glyphHero(title: unknown, subtitle: unknown, seed = 0, width = 52): string {
  const w = Math.max(24, Math.min(72, Math.trunc(width)));
  return [
    `╔${"═".repeat(w - 2)}╗`,
    `║ ${clean(title, w - 4).padEnd(w - 4, " ")} ║`,
    `║ ${clean(subtitle, w - 4).padEnd(w - 4, " ")} ║`,
    `╟${"─".repeat(w - 2)}╢`,
    glyphMatrix(w - 4, 3, seed, 0.22).split("\n").map((line) => `║ ${line.slice(0, w - 4).padEnd(w - 4, " ")} ║`).join("\n"),
    `╚${"═".repeat(w - 2)}╝`,
  ].join("\n");
}

export function glyphLoadingFrame(label = "LOADING", frame = 0, width = 44): string {
  return glyphCornerFrame(label, [glyphPulseRail(frame, width - 4), "SCANNING VISUAL STATE", "PLEASE WAIT"], { width, tone: "DENSE" });
}

export function glyphEmptyFrame(label = "NOTHING HERE", action = "ADD CONTENT", width = 44): string {
  return glyphCornerFrame("EMPTY FIELD", ["○", clean(label, width - 4), glyphRail(width - 4, "·"), `◆ ${clean(action, width - 8)}`], { width, tone: "PANEL" });
}

export function glyphErrorFrame(label = "UI ERROR", detail = "RENDER RECOVERY REQUIRED", width = 44): string {
  return glyphCornerFrame("FAULT FIELD", ["× ERROR", clean(label, width - 8), `· ${clean(detail, width - 8)}`, "RECOVER / REFRESH"], { width, tone: "OPERATOR" });
}

export function glyphPixelMeterWall(values: readonly number[], width = 48): string {
  return glyphCornerFrame("LEVEL FIELD", [pixelGridMeter(values, width - 4, 5), glyphRail(width - 4, "·")], { width, tone: "DENSE" });
}
