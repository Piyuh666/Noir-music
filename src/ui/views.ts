/** NOIR MUSIC // HIGH-DENSITY VIEW MODELS — shared visual data for player/queue/system surfaces. */
import { pixelMeter, pixelSpark, matrix } from "./pixel";
import { glyphLabel } from "./typography";
import { sectionRule, twoColumn } from "./layout";
import { compactNumber, latencyLabel, uiText } from "./surface";

export function playerTelemetryView(opts: { positionMs: number; durationMs: number; volume: number; queue: number; latency?: number; }): string {
  const duration = Math.max(0, Number(opts.durationMs) || 0);
  const position = Math.max(0, Math.min(duration || Number.MAX_SAFE_INTEGER, Number(opts.positionMs) || 0));
  const percent = duration ? (position / duration) * 100 : 0;
  return [
    sectionRule("PLAYER TELEMETRY", 48),
    twoColumn(glyphLabel("POSITION", `${Math.round(percent)}%`), glyphLabel("VOLUME", `${Math.round(opts.volume)}%`), 48),
    twoColumn(glyphLabel("QUEUE", compactNumber(opts.queue)), glyphLabel("LATENCY", latencyLabel(opts.latency ?? 0)), 48),
    `${pixelMeter(percent, 28)}  ${pixelMeter(opts.volume, 10)}`,
  ].join("\n");
}

export function queueRail(items: readonly { title: string; artist?: string; duration?: number }[], start = 0, width = 46): string {
  const lines = items.slice(start, start + 8).map((item, index) => {
    const title = uiText(item.title, "UNTITLED", 30);
    const artist = item.artist ? ` · ${uiText(item.artist, "", 16)}` : "";
    const duration = item.duration ? ` [${Math.floor(item.duration / 60000)}:${String(Math.floor(item.duration / 1000) % 60).padStart(2, "0")}]` : "";
    return `${String(start + index + 1).padStart(2, "0")} ${title}${artist}${duration}`;
  });
  return [sectionRule("QUEUE RAIL", width), ...lines, lines.length ? "" : "01  — QUEUE EMPTY"].join("\n");
}

export function nodePulse(nodes: readonly { name: string; latency: number; connected: boolean }[], width = 46): string {
  const values = nodes.slice(0, 8).map((node) => Math.max(0, Number(node.latency) || 0));
  const rows = nodes.slice(0, 8).map((node) => `${node.connected ? "●" : "○"} ${uiText(node.name, "NODE", 18).padEnd(18, " ")} ${latencyLabel(node.latency).padStart(8, " ")}`);
  return [sectionRule("NODE PULSE", width), ...rows, "", pixelSpark(values, 32), "", matrix(16, 2, "·", values.length)].join("\n");
}

import { hudMetricDeck, hudNodeDeck, hudQueueDeck, hudSpectrum, hudTrackDeck } from "./hud";
import { composeGlyphSurface } from "./composer";

/** GLYPH-10 player HUD: a richer view model while preserving the existing API. */
export function playerHudView(opts: { title: string; artist?: string; positionMs: number; durationMs: number; volume: number; queue: number; latency?: number; state?: string; source?: string }): string {
  return hudTrackDeck({ title: opts.title, artist: opts.artist, positionMs: opts.positionMs, durationMs: opts.durationMs, volume: opts.volume, state: opts.state, source: opts.source }, { width: 54 });
}

export function queueHudView(items: readonly { title: string; artist?: string; durationMs?: number }[], page = 1, pageSize = 8): string {
  return hudQueueDeck(items, { page, pageSize, width: 54 });
}

export function nodeHudView(nodes: readonly { name: string; latencyMs?: number; players?: number; connected?: boolean; state?: string }[]): string {
  return hudNodeDeck(nodes, { width: 54, seed: nodes.length * 97 });
}

export function metricsHudView(metrics: readonly { label: string; value: string | number; max?: number; state?: string }[], title = "TELEMETRY"): string {
  return hudMetricDeck(metrics, { width: 54, title });
}

export function spectrumHudView(values: readonly number[], title = "SIGNAL SPECTRUM"): string {
  return hudSpectrum(values, { width: 54, title });
}

export function uxEmptyState(title: string, message: string, action = "ADD AUDIO"): string {
  return composeGlyphSurface([
    `▣ ${title.toUpperCase()}`,
    "",
    "○ NO ACTIVE DATA",
    message,
    "",
    `› NEXT ACTION  ${action}`,
  ], { width: 48, maxBlocks: 8 });
}
