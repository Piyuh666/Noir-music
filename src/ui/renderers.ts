/** NOIR MUSIC // GLYPH-11 RENDERER PRESETS — complete reusable UI/UX surfaces. */
import { glyphPanelAdvanced, sectionRule, visualStack, twoColumn } from "./layout";
import { pixelClock, pixelDots, pixelMeter, pixelSpark, pixelStatusLine, pixelTimeline, pixelWave } from "./pixel";
import { compactNumber, latencyLabel, uiText } from "./surface";
import { UI_TOKENS, normalizeUiState, stateGlyph } from "./theme";
import { glyphLabel, pixelCaption, pixelTitle } from "./typography";
import { uxDensityMeter, uxPhaseLine, uxQueueSummary, uxTrackTimeline } from "./ux";

export interface RenderTrack { title: string; artist?: string; source?: string; positionMs?: number; durationMs?: number; volume?: number; state?: string; }

export function renderNowPlaying(track: RenderTrack, width = 58): string {
  const w = Math.max(30, Math.min(72, Math.trunc(width)));
  const state = normalizeUiState(track.state, "PLAYING");
  const duration = Math.max(0, Number(track.durationMs) || 0);
  const position = Math.max(0, Math.min(duration || Number.MAX_SAFE_INTEGER, Number(track.positionMs) || 0));
  const volume = Math.max(0, Math.min(100, Number(track.volume) || 0));
  return visualStack([
    pixelTitle("NOW PLAYING", 18),
    sectionRule(`${stateGlyph(state)} ${state}`, w),
    glyphPanelAdvanced([
      `◆ ${pixelCaption(track.title, w - 6)}`,
      `· ${pixelCaption(track.artist ?? "UNKNOWN ARTIST", w - 6)}`,
      `⌁ ${pixelCaption(track.source ?? "AUDIO", 24)}`,
      "",
      uxTrackTimeline(position, duration, w),
      `${fmt(position)} / ${fmt(duration)}`,
      twoColumn(glyphLabel("VOLUME", `${Math.round(volume)}%`, 10), glyphLabel("STATE", state, 10), w),
      `${pixelMeter(volume, Math.max(8, Math.floor(w / 3)))}  ${pixelDots(volume, Math.max(8, Math.floor(w / 3)))}`,
    ], { width: w, tone: state === "ERROR" ? "OPERATOR" : "PANEL", title: "TRACK DECK", maxLines: 10 }),
  ]);
}

export function renderQueue(items: readonly { title: string; artist?: string; durationMs?: number }[], page = 1, pageSize = 8, width = 58): string {
  const w = Math.max(30, Math.min(72, Math.trunc(width)));
  const size = Math.max(1, Math.min(12, Math.trunc(pageSize)));
  const pages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.max(1, Math.min(pages, Math.trunc(page)));
  const start = (current - 1) * size;
  const rows = items.slice(start, start + size).map((item, index) => {
    const number = String(start + index + 1).padStart(2, "0");
    const mark = index === 0 && start === 0 ? "◆" : "·";
    const title = pixelCaption(item.title, Math.max(14, w - 20));
    const artist = item.artist ? ` · ${pixelCaption(item.artist, 16)}` : "";
    const duration = item.durationMs ? ` [${fmt(item.durationMs)}]` : "";
    return `${mark} ${number} ${title}${artist}${duration}`;
  });
  return visualStack([
    pixelTitle("QUEUE MATRIX", 18),
    glyphPanelAdvanced(rows.length ? rows : ["○ QUEUE EMPTY", "› ADD AUDIO TO INITIALIZE"], { width: w, tone: "DENSE", title: "PLAYLIST RAIL", maxLines: size }),
    uxQueueSummary(items.length, rows.length, current, pages, w),
  ]);
}

export function renderNodeField(nodes: readonly { name: string; latencyMs?: number; players?: number; connected?: boolean }[], width = 58): string {
  const w = Math.max(30, Math.min(72, Math.trunc(width)));
  const rows = nodes.slice(0, 14).map((node) => {
    const connected = node.connected !== false;
    const latency = Math.max(0, Number(node.latencyMs) || 0);
    return pixelStatusLine(uiText(node.name, "NODE", 18), connected ? "OK" : "OFFLINE", `${latencyLabel(latency).padStart(8, " ")} P${compactNumber(node.players ?? 0).padStart(5, " ")}`);
  });
  const samples = nodes.map((n) => Number(n.latencyMs) || 0).filter(Number.isFinite);
  return visualStack([
    pixelTitle("NODE FIELD", 16),
    glyphPanelAdvanced(rows.length ? rows : ["○ NO ACTIVE NODES"], { width: w, tone: "OPERATOR", title: "NODE MATRIX", maxLines: 14 }),
    sectionRule("LATENCY WAVE", w),
    pixelSpark(samples, Math.max(16, w - 10)) || "·",
    samples.length ? `PULSE ${pixelClock(Math.round(Math.max(...samples) / 1000))}` : "PULSE · SILENT",
  ]);
}

export function renderTelemetry(metrics: readonly { label: string; value: string | number; percent?: number; state?: string }[], width = 58): string {
  const w = Math.max(30, Math.min(72, Math.trunc(width)));
  const rows = metrics.slice(0, 14).map((metric) => {
    const state = normalizeUiState(metric.state, "ONLINE");
    const meter = metric.percent === undefined ? "" : ` ${pixelMeter(metric.percent, Math.max(8, Math.floor(w / 4)))}`;
    return `${stateGlyph(state)} ${pixelCaption(metric.label, 18).padEnd(18, " ")} ${pixelCaption(metric.value, 24)}${meter}`;
  });
  return visualStack([
    pixelTitle("TELEMETRY", 14),
    glyphPanelAdvanced(rows.length ? rows : ["○ NO METRICS"], { width: w, tone: "OPERATOR", title: "METRIC GRID", maxLines: 14 }),
    sectionRule("DENSITY", w),
    uxDensityMeter(metrics.length / 14 * 100, Math.max(16, w - 18)),
  ]);
}

export function renderSpectrum(values: readonly number[], width = 58): string {
  const w = Math.max(30, Math.min(72, Math.trunc(width)));
  const clean = values.filter(Number.isFinite).slice(-64);
  return visualStack([
    pixelTitle("SIGNAL SPECTRUM", 18),
    sectionRule("WAVEFORM", w),
    pixelWave(clean, Math.max(16, w - 8), 6),
    sectionRule("ENERGY", w),
    pixelMeter(clean.length ? Math.min(100, Math.max(...clean, 0)) : 0, Math.max(12, w - 18)),
    `SAMPLES ${compactNumber(clean.length)}  ·  ${clean.length ? "ACTIVE" : "SILENT"}`,
  ]);
}

export function renderSessionOverview(data: { guilds: number; players: number; playing: number; paused: number; queue: number; latency: number }, width = 58): string {
  const w = Math.max(30, Math.min(72, Math.trunc(width)));
  const rows = [
    glyphLabel("GUILDS", compactNumber(data.guilds), 12),
    glyphLabel("PLAYERS", compactNumber(data.players), 12),
    glyphLabel("PLAYING", compactNumber(data.playing), 12),
    glyphLabel("PAUSED", compactNumber(data.paused), 12),
    glyphLabel("QUEUE", compactNumber(data.queue), 12),
    glyphLabel("LATENCY", latencyLabel(data.latency), 12),
  ];
  return visualStack([
    pixelTitle("SESSION CORE", 16),
    glyphPanelAdvanced(rows, { width: w, tone: "OPERATOR", title: "RUNTIME MATRIX", maxLines: 10 }),
    sectionRule("ACTIVITY", w),
    twoColumn(`ACTIVE ${compactNumber(data.playing)}`, `PAUSED ${compactNumber(data.paused)}`, w),
  ]);
}

export function renderCommandCard(name: string, category: string, description: string, usage = ""): string {
  return glyphPanelAdvanced([
    `◆ ${pixelCaption(name, 40)}`,
    `· ${pixelCaption(category, 24).toUpperCase()}`,
    "",
    pixelCaption(description, 72),
    usage ? `› ${pixelCaption(usage, 72)}` : "",
  ].filter(Boolean), { width: 58, tone: "PANEL", title: "COMMAND", maxLines: 8 });
}

function fmt(ms: number): string {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor(sec % 3600 / 60);
  const s = sec % 60;
  return h ? `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
