/**
 * NOIR MUSIC // GLYPH-13 UX SYSTEM
 *
 * Converts raw presentation facts into explicit, predictable UX states.
 * It is intentionally framework-neutral: command handlers can consume the
 * strings and view-models without importing Discord interaction objects.
 */
import { compactNumber, uiText } from "./surface";
import { glyphDashboard, glyphEmptyFrame, glyphErrorFrame, glyphHero, glyphLoadingFrame, glyphMetricWall, glyphQueueRail, glyphSpectrum, glyphStateChip, glyphTimeline, glyphTelemetryRow } from "./glyphArt";
import { pixelClock, pixelMeter, pixelText } from "./pixel";
import { type UIMode, modeTokens } from "./theme";

export type UXViewPhase = "READY" | "LOADING" | "EMPTY" | "SUCCESS" | "WARNING" | "ERROR" | "STALE";
export type UXDensity = "COMPACT" | "STANDARD" | "DENSE" | "OPERATOR";

export interface UXAction {
  id: string;
  label: string;
  hint?: string;
  enabled?: boolean;
  destructive?: boolean;
}

export interface UXNotice {
  phase: UXViewPhase;
  title: string;
  detail?: string;
  action?: string;
}

export interface UXTrack {
  title: string;
  artist?: string;
  source?: string;
  positionMs?: number;
  durationMs?: number;
  volume?: number;
  state?: "PLAYING" | "PAUSED" | "IDLE";
}

export interface UXQueueItem { title: string; artist?: string; duration?: string; active?: boolean; }

export interface UXNode { name: string; state: "ONLINE" | "WARN" | "OFFLINE"; latencyMs?: number; players?: number; }

export function normalizeDensity(value: unknown, fallback: UXDensity = "STANDARD"): UXDensity {
  const v = String(value ?? "").toUpperCase() as UXDensity;
  return ["COMPACT", "STANDARD", "DENSE", "OPERATOR"].includes(v) ? v : fallback;
}

export function modeForDensity(density: UXDensity): UIMode {
  return density === "COMPACT" ? "compact" : density === "DENSE" ? "dense" : density === "OPERATOR" ? "operator" : "standard";
}

export function notice(phase: UXViewPhase, title: string, detail = "", action = ""): UXNotice {
  return { phase, title: uiText(title, "NOIR MUSIC", 96), detail: uiText(detail, "", 180), action: uiText(action, "", 64) };
}

export function noticeGlyph(phase: UXViewPhase): string {
  return ({ READY: "◆", LOADING: "◐", EMPTY: "○", SUCCESS: "●", WARNING: "◐", ERROR: "×", STALE: "◇" } as Record<UXViewPhase, string>)[phase];
}

export function noticeLine(input: UXNotice): string {
  const detail = input.detail ? ` · ${input.detail}` : "";
  const action = input.action ? ` › ${input.action}` : "";
  return `${noticeGlyph(input.phase)} ${input.title.toUpperCase()}${detail}${action}`;
}

export function actionRail(actions: readonly UXAction[], width = 52): string {
  const w = Math.max(24, Math.min(72, Math.trunc(width)));
  return actions.slice(0, 8).map((a, i) => {
    const mark = a.enabled === false ? "○" : a.destructive ? "×" : i === 0 ? "◆" : "·";
    const state = a.enabled === false ? "LOCKED" : "READY";
    return `${mark} ${String(i + 1).padStart(2, "0")} ${uiText(a.label, "ACTION", Math.max(10, w - 20))} · ${state}`;
  }).join("\n");
}

export function actionCard(title: string, actions: readonly UXAction[], width = 52): string {
  return [`▣ ${uiText(title, "ACTION FIELD", width - 4).toUpperCase()}`, actionRail(actions, width)].join("\n");
}

export function phaseSurface(input: UXNotice, frame = 0, width = 48): string {
  switch (input.phase) {
    case "LOADING": return glyphLoadingFrame(input.title, frame, width);
    case "EMPTY": return glyphEmptyFrame(input.title, input.action || "OPEN", width);
    case "ERROR": return glyphErrorFrame(input.title, input.detail || "RECOVER / REFRESH", width);
    default: return [`${noticeGlyph(input.phase)} ${input.title.toUpperCase()}`, input.detail ? `· ${input.detail}` : "", input.action ? `◆ ${input.action}` : ""].filter(Boolean).join("\n");
  }
}

export function trackView(track: UXTrack, density: UXDensity = "STANDARD", frame = 0): string {
  const mode = modeForDensity(density);
  const t = modeTokens(mode);
  const duration = Math.max(0, Number(track.durationMs) || 0);
  const position = duration ? Math.max(0, Math.min(duration, Number(track.positionMs) || 0)) : 0;
  const percent = duration ? position / duration * 100 : 0;
  const state = track.state === "PAUSED" ? "Ⅱ PAUSED" : track.state === "IDLE" ? "◇ IDLE" : "● PLAYING";
  const body = [
    `◆ ${uiText(track.title, "UNKNOWN TRACK", t.width - 6)}`,
    `· ${uiText(track.artist || "UNKNOWN ARTIST", "UNKNOWN ARTIST", t.width - 6)}`,
    `▣ ${uiText(track.source || "AUDIO", "AUDIO", 16)}  ${state}`,
    glyphTimeline(position, duration, Math.max(16, t.width - 8)),
    `${pixelClock(position / 1000)} / ${pixelClock(duration / 1000)}  ${Math.round(percent)}%`,
    `VOL ${pixelMeter(track.volume ?? 0, Math.max(8, Math.min(24, t.width - 24)))}`,
    `PULSE ${frame % 2 ? "▪" : "·"} ${frame.toString().padStart(4, "0")}`,
  ];
  return glyphHero("NOW PLAYING", body.join(" · "), track.title.length + frame, t.width);
}

export function queueView(items: readonly UXQueueItem[], page = 1, pageSize = 8, density: UXDensity = "STANDARD"): string {
  const mode = modeForDensity(density);
  const size = Math.max(1, Math.min(12, Math.trunc(pageSize)));
  const p = Math.max(1, Math.trunc(page));
  const start = (p - 1) * size;
  const shown = items.slice(start, start + size);
  const pages = Math.max(1, Math.ceil(items.length / size));
  const rail = glyphQueueRail(shown, modeTokens(mode).width);
  return [rail, `PAGE ${p}/${pages} · ITEMS ${compactNumber(items.length)} · VISIBLE ${shown.length}`, pixelMeter(items.length ? shown.length / items.length * 100 : 0, Math.max(8, Math.min(24, modeTokens(mode).meter)))].join("\n");
}

export function nodeView(nodes: readonly UXNode[], density: UXDensity = "DENSE"): string {
  const mode = modeForDensity(density);
  const width = modeTokens(mode).width;
  const metrics = nodes.slice(0, 12).map((n) => ({
    label: n.name,
    value: `${n.latencyMs ?? 0}ms / P${n.players ?? 0}`,
    state: n.state === "ONLINE" ? "LIVE" : n.state === "WARN" ? "WARN" : "OFFLINE",
    meter: n.latencyMs === undefined ? undefined : Math.max(0, Math.min(100, 100 - n.latencyMs / 5)),
  } as const));
  return glyphMetricWall(metrics, width);
}

export function commandMatrixView(commands: readonly { name: string; category: string; description?: string }[], page = 1, pageSize = 10, density: UXDensity = "STANDARD"): string {
  const mode = modeForDensity(density);
  const width = modeTokens(mode).width;
  const size = Math.max(1, Math.min(14, Math.trunc(pageSize)));
  const p = Math.max(1, Math.trunc(page));
  const start = (p - 1) * size;
  const shown = commands.slice(start, start + size);
  const rows = shown.map((c, i) => `${String(start + i + 1).padStart(3, "0")} · ${uiText(c.name, "COMMAND", 22).padEnd(22, " ")} · ${uiText(c.category, "MODULE", 14)}`);
  return glyphMetricWall(rows.map((row) => ({ label: "CMD", value: row })), width) + `\nPAGE ${p}/${Math.max(1, Math.ceil(commands.length / size))}`;
}

export function spectrumView(values: readonly number[], density: UXDensity = "DENSE"): string {
  return glyphSpectrum(values, modeTokens(modeForDensity(density)).width);
}

export function dashboardView(title: string, sections: readonly { label: string; value: string; meter?: number }[], density: UXDensity = "STANDARD"): string {
  return glyphDashboard(title, sections, modeForDensity(density));
}

export function uxFooter(noticeInput: UXNotice, actions: readonly UXAction[] = []): string {
  const actionText = actions.length ? ` · ACTIONS ${actions.length}` : "";
  return `${noticeGlyph(noticeInput.phase)} ${noticeInput.phase}${actionText} · NOIR MUSIC GLYPH-13`;
}

export function accessibilitySummary(input: { title: string; state?: string; detail?: string; page?: number; pages?: number }): string {
  const parts = [uiText(input.title, "NOIR MUSIC", 100)];
  if (input.state) parts.push(`State ${uiText(input.state, "", 32)}`);
  if (input.detail) parts.push(uiText(input.detail, "", 160));
  if (input.page !== undefined) parts.push(`Page ${input.page} of ${input.pages ?? input.page}`);
  return parts.join(". ") + ".";
}

export function pixelAnnouncement(text: string, width = 40): string {
  return pixelText(uiText(text, "NOIR MUSIC", 12), "█", " ", 12).slice(0, width * 6);
}

export function telemetryLine(label: string, value: string | number, meter?: number, width = 48): string {
  return glyphTelemetryRow(label, value, meter, width);
}
