/**
 * NOIR MUSIC // GLYPH HUD ENGINE
 *
 * A presentation-only rendering layer for high-density Discord surfaces.
 * It deliberately contains no Discord interaction logic and no application
 * state. Inputs are treated as untrusted display data and normalized at the
 * final rendering boundary.
 */
import { matrix, pixelDots, pixelMeter, pixelSpark, pixelStatusLine, pixelText, pixelTimeline } from "./pixel";
import { compactNumber, latencyLabel, uiText } from "./surface";
import { UI_TOKENS, type UIState, normalizeUiState, stateGlyph, stateLabel } from "./theme";
import { glyphLabel, pixelCaption } from "./typography";
import { glyphPanelAdvanced, sectionRule, twoColumn } from "./layout";

export interface HudTrack {
  title: string;
  artist?: string;
  positionMs?: number;
  durationMs?: number;
  state?: UIState | string;
  source?: string;
  volume?: number;
}

export interface HudNode {
  name: string;
  latencyMs?: number;
  players?: number;
  connected?: boolean;
  state?: UIState | string;
}

export interface HudMetric {
  label: string;
  value: string | number;
  max?: number;
  state?: UIState | string;
}

const width = (value: unknown, fallback = 42, min = 18, max = 72) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.trunc(n))) : fallback;
};

const state = (value: unknown): UIState => normalizeUiState(value, "IDLE");

export function hudHeader(title: unknown, status: UIState | string = "ONLINE", seed = 0): string {
  const s = state(status);
  return [
    `▣ ${pixelCaption(title, 42).toUpperCase()}  ${stateGlyph(s)} ${s}`,
    sectionRule("GLYPH HUD", 52),
    matrix(24, 2, "·", seed),
  ].join("\n");
}

export function hudTrackDeck(track: HudTrack, opts: { width?: number; seed?: number } = {}): string {
  const w = width(opts.width, 50, 28, 68);
  const s = state(track.state ?? "PLAYING");
  const duration = Math.max(0, Number(track.durationMs) || 0);
  const position = Math.max(0, Math.min(duration || Number.MAX_SAFE_INTEGER, Number(track.positionMs) || 0));
  const percent = duration ? position / duration * 100 : 0;
  const source = pixelCaption(track.source ?? "AUDIO", 18);
  const artist = pixelCaption(track.artist ?? "UNKNOWN ARTIST", 38);
  const title = pixelCaption(track.title, 54);
  const timeline = pixelTimeline(position, duration, Math.max(16, w - 18));
  return [
    hudHeader("NOW PLAYING", s, opts.seed ?? title.length),
    glyphPanelAdvanced([
      `◆ ${title}`,
      `· ${artist}`,
      "",
      `${timeline}  ${Math.round(percent)}%`,
      `${fmt(position)} / ${fmt(duration)}`,
      "",
      twoColumn(glyphLabel("STATE", s, 10), glyphLabel("SOURCE", source, 10), w),
      `SIGNAL ${pixelMeter(percent, Math.max(8, Math.min(28, w - 22)))} ${stateLabel(s)}`,
      `VOLUME ${pixelMeter(Math.max(0, Math.min(100, Number(track.volume ?? 0))), Math.max(8, Math.min(24, w - 24)))}`,
    ], { width: w, tone: s === "ERROR" ? "OPERATOR" : "PANEL", title: "TRACK DECK", maxLines: 10 }),
  ].join("\n");
}

export function hudQueueDeck(items: readonly { title: string; artist?: string; durationMs?: number }[], opts: { page?: number; pageSize?: number; width?: number } = {}): string {
  const w = width(opts.width, 50, 28, 68);
  const pageSize = Math.max(1, Math.min(12, Math.trunc(opts.pageSize ?? 8)));
  const page = Math.max(1, Math.trunc(opts.page ?? 1));
  const start = (page - 1) * pageSize;
  const shown = items.slice(start, start + pageSize);
  const rows = shown.map((item, i) => {
    const n = String(start + i + 1).padStart(2, "0");
    const title = pixelCaption(item.title, Math.max(14, w - 18));
    const artist = item.artist ? ` · ${pixelCaption(item.artist, 16)}` : "";
    const duration = item.durationMs ? ` [${fmt(item.durationMs)}]` : "";
    return `${i === 0 && start === 0 ? "◆" : "·"} ${n} ${title}${artist}${duration}`;
  });
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  return [
    hudHeader("QUEUE DECK", shown.length ? "ONLINE" : "IDLE", items.length + page),
    glyphPanelAdvanced(rows.length ? rows : ["○ QUEUE EMPTY", "ADD AUDIO TO INITIALIZE"], { width: w, title: "PLAYLIST RAIL", maxLines: pageSize }),
    sectionRule("QUEUE TELEMETRY", w),
    twoColumn(`PAGE ${page}/${pages}`, `VISIBLE ${shown.length}/${items.length}`, w),
    `${pixelDots(items.length ? shown.length / items.length * 100 : 0, Math.max(8, Math.min(28, w - 22)))}  DENSITY`,
  ].join("\n");
}

export function hudNodeDeck(nodes: readonly HudNode[], opts: { width?: number; seed?: number } = {}): string {
  const w = width(opts.width, 50, 28, 68);
  const rows = nodes.slice(0, 12).map((node) => {
    const s = state(node.state ?? (node.connected === false ? "OFFLINE" : "ONLINE"));
    const players = compactNumber(node.players ?? 0).padStart(5, " ");
    const latency = latencyLabel(node.latencyMs ?? 0).padStart(8, " ");
    return pixelStatusLine(uiText(node.name, "NODE", 16), s === "ONLINE" ? "OK" : s === "WARN" || s === "BUSY" ? "WARN" : "OFFLINE", `${latency} P${players}`);
  });
  const samples = nodes.map((node) => Number(node.latencyMs) || 0).filter(Number.isFinite);
  return [
    hudHeader("NODE FIELD", nodes.length ? "ONLINE" : "OFFLINE", opts.seed ?? samples.length),
    glyphPanelAdvanced(rows.length ? rows : ["○ NO NODES VISIBLE"], { width: w, tone: "DENSE", title: "NODE STATUS", maxLines: 12 }),
    sectionRule("LATENCY SIGNAL", w),
    pixelSpark(samples, Math.max(12, Math.min(42, w - 8))) || "—",
    matrix(Math.max(12, Math.min(24, Math.floor(w / 2))), 2, "·", opts.seed ?? samples.reduce((a, b) => a + b, 0)),
  ].join("\n");
}

export function hudMetricDeck(metrics: readonly HudMetric[], opts: { width?: number; title?: string } = {}): string {
  const w = width(opts.width, 50, 28, 68);
  const rows = metrics.slice(0, 12).map((metric) => {
    const s = state(metric.state ?? "ONLINE");
    const numeric = Number(metric.value);
    const hasMeter = Number.isFinite(numeric) && metric.max !== undefined;
    const meter = hasMeter ? ` ${pixelMeter(Math.max(0, Math.min(100, numeric / Math.max(1, Number(metric.max)) * 100)), 14)}` : "";
    return `${stateGlyph(s)} ${pixelCaption(metric.label, 18).padEnd(18, " ")} ${pixelCaption(metric.value, 28)}${meter}`;
  });
  return [
    hudHeader(opts.title ?? "TELEMETRY", "ONLINE", metrics.length),
    glyphPanelAdvanced(rows.length ? rows : ["○ NO METRICS"], { width: w, tone: "OPERATOR", title: "METRIC GRID", maxLines: 12 }),
    sectionRule("FIELD", w),
    matrix(Math.max(12, Math.min(28, Math.floor(w / 2))), 3, "·", metrics.length * 31),
  ].join("\n");
}

export function hudSpectrum(values: readonly number[], opts: { width?: number; title?: string } = {}): string {
  const w = width(opts.width, 50, 28, 68);
  const clean = values.filter(Number.isFinite).slice(-48);
  const spark = pixelSpark(clean, Math.max(12, Math.min(44, w - 8)));
  return [
    sectionRule(opts.title ?? "SPECTRUM", w),
    `▣ ${pixelCaption(opts.title ?? "SIGNAL", 28)}`,
    spark || "·",
    pixelMeter(clean.length ? Math.min(100, Math.max(...clean, 0)) : 0, Math.max(10, Math.min(28, w - 18))),
    matrix(Math.max(12, Math.min(24, Math.floor(w / 2))), 2, "·", clean.length),
  ].join("\n");
}

export function hudPixelTitle(title: string, subtitle = "", width = 46): string {
  const w = Math.max(24, Math.min(68, Math.trunc(width)));
  const art = pixelText(pixelCaption(title, 12), UI_TOKENS.glyph.block, " ", 12);
  return [art, subtitle ? `▣ ${pixelCaption(subtitle, w - 4)}` : "", sectionRule("", w)].filter(Boolean).join("\n");
}

function fmt(ms: number): string {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor(sec % 3600 / 60);
  const s = sec % 60;
  return h ? `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
