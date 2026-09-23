/**
 * NOIR MUSIC // GLYPH-11 UX STATE MACHINE
 *
 * Presentation-only interaction language. It does not execute commands. It
 * turns application state into predictable visual affordances so every
 * command can communicate what is happening, what changed, and what the
 * user can do next.
 */
import { pixelBadgeRow, pixelMeter, pixelPulse, pixelSpark, pixelStatusLine, pixelText, pixelTimeline } from "./pixel";
import { glyphPanelAdvanced, sectionRule, twoColumn, visualStack } from "./layout";
import { UI_TOKENS, type UIState, normalizeUiState, stateGlyph, stateLabel } from "./theme";
import { compactNumber, latencyLabel, uiText } from "./surface";
import { glyphLabel, pixelCaption, pixelTitle } from "./typography";

export type UXIntent = "PRIMARY" | "SECONDARY" | "NAVIGATION" | "DESTRUCTIVE" | "INFORMATION" | "WAITING" | "RETRY";
export type UXPhase = "READY" | "LOADING" | "SUCCESS" | "EMPTY" | "BLOCKED" | "FAILED" | "STALE";

export interface UXStateModel {
  phase: UXPhase;
  state?: UIState | string;
  title: string;
  message?: string;
  action?: string;
  detail?: string;
  progress?: number;
  pulse?: number;
  code?: string;
}

const phaseGlyph: Record<UXPhase, string> = {
  READY: "●", LOADING: "◐", SUCCESS: "◆", EMPTY: "○", BLOCKED: "■", FAILED: "×", STALE: "◇",
};

const phaseLabel: Record<UXPhase, string> = {
  READY: "READY", LOADING: "PROCESSING", SUCCESS: "COMPLETE", EMPTY: "EMPTY", BLOCKED: "BLOCKED", FAILED: "FAILED", STALE: "STALE",
};

export function normalizeUxPhase(value: unknown, fallback: UXPhase = "READY"): UXPhase {
  const phase = String(value ?? "").toUpperCase() as UXPhase;
  return Object.prototype.hasOwnProperty.call(phaseLabel, phase) ? phase : fallback;
}

export function uxPhaseLine(phase: UXPhase, detail = ""): string {
  const p = normalizeUxPhase(phase);
  return `${phaseGlyph[p]} ${phaseLabel[p]}${detail ? `  · ${pixelCaption(detail, 64)}` : ""}`;
}

export function uxStateBanner(model: UXStateModel, width = 52): string {
  const phase = normalizeUxPhase(model.phase);
  const state = normalizeUiState(model.state, phase === "FAILED" ? "ERROR" : phase === "LOADING" ? "BUSY" : "ONLINE");
  const body = [
    `▣ ${pixelCaption(model.title, width - 8).toUpperCase()}`,
    uxPhaseLine(phase, model.message),
    model.action ? `› NEXT  ${pixelCaption(model.action, width - 10)}` : "",
    model.detail ? `· ${pixelCaption(model.detail, width - 4)}` : "",
    model.code ? `⌘ ${pixelCaption(model.code, 24)}` : "",
  ].filter(Boolean);
  return visualStack([
    sectionRule("UX STATE", width),
    glyphPanelAdvanced(body, { width, tone: phase === "FAILED" ? "OPERATOR" : phase === "LOADING" ? "DENSE" : "PANEL", title: `${stateGlyph(state)} ${state}`, maxLines: 8 }),
    phase === "LOADING" ? pixelPulse(model.pulse ?? 0, Math.max(12, width - 12)) : "",
  ]);
}

export function uxLoading(title = "LOADING", progress = -1, width = 48): string {
  const p = Number(progress);
  const meter = Number.isFinite(p) && p >= 0 ? pixelMeter(Math.max(0, Math.min(100, p)), Math.max(12, width - 18)) : pixelPulse(0, Math.max(12, width - 12));
  return glyphPanelAdvanced([`◐ ${pixelCaption(title, width - 6).toUpperCase()}`, meter, Number.isFinite(p) && p >= 0 ? `${Math.round(p)}% · PROCESSING` : "SCANNING · PLEASE WAIT"], { width, tone: "DENSE", title: "LOADING STATE", maxLines: 6 });
}

export function uxSuccess(title: string, message: string, detail = "", width = 48): string {
  return uxStateBanner({ phase: "SUCCESS", state: "ONLINE", title, message, detail }, width);
}

export function uxEmpty(title: string, message: string, action = "ADD AUDIO", width = 48): string {
  return uxStateBanner({ phase: "EMPTY", state: "IDLE", title, message, action }, width);
}

export function uxBlocked(title: string, message: string, action = "CHECK ACCESS", width = 48): string {
  return uxStateBanner({ phase: "BLOCKED", state: "WARN", title, message, action }, width);
}

export function uxFailure(title: string, message: string, action = "RETRY", code = "ERR", width = 48): string {
  return uxStateBanner({ phase: "FAILED", state: "ERROR", title, message, action, code }, width);
}

export function uxStale(title: string, message = "SURFACE OUTDATED", action = "REFRESH", width = 48): string {
  return uxStateBanner({ phase: "STALE", state: "WARN", title, message, action }, width);
}

export function uxIntentLabel(intent: UXIntent): string {
  const labels: Record<UXIntent, string> = {
    PRIMARY: "◆ CONTINUE", SECONDARY: "· MORE", NAVIGATION: "‹ NAVIGATE", DESTRUCTIVE: "× REMOVE", INFORMATION: "▣ DETAILS", WAITING: "◐ WAIT", RETRY: "⌁ RETRY",
  };
  return labels[intent];
}

export function uxActionRail(actions: readonly { label: string; intent?: UXIntent; enabled?: boolean }[], width = 52): string {
  const rows = actions.slice(0, 8).map((action, index) => {
    const intent = action.intent ?? (index === 0 ? "PRIMARY" : "SECONDARY");
    const mark = action.enabled === false ? "○" : phaseGlyph[intent === "WAITING" ? "LOADING" : intent === "DESTRUCTIVE" ? "BLOCKED" : "READY"];
    return `${mark} ${pixelCaption(action.label, Math.max(8, width - 8)).toUpperCase()}  · ${intent}`;
  });
  return glyphPanelAdvanced(rows.length ? rows : ["○ NO ACTIONS"], { width, tone: "PANEL", title: "ACTION RAIL", maxLines: 8 });
}

export function uxProgressDeck(label: string, value: number, width = 52, detail = ""): string {
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  return visualStack([
    sectionRule("PROGRESS", width),
    twoColumn(glyphLabel("TASK", label, 12), glyphLabel("DONE", `${Math.round(safe)}%`, 12), width),
    pixelMeter(safe, Math.max(12, width - 18)),
    detail ? `· ${pixelCaption(detail, width - 4)}` : "",
  ]);
}

export function uxTrackTimeline(positionMs: number, durationMs: number, width = 52): string {
  const duration = Math.max(0, Number(durationMs) || 0);
  const position = Math.max(0, Math.min(duration || Number.MAX_SAFE_INTEGER, Number(positionMs) || 0));
  const percent = duration ? position / duration * 100 : 0;
  return `${pixelTimeline(position, duration, Math.max(16, width - 18))}  ${Math.round(percent)}%`;
}

export function uxQueueSummary(total: number, visible: number, page: number, pages: number, width = 52): string {
  const count = Math.max(0, Math.trunc(Number(total) || 0));
  const shown = Math.max(0, Math.trunc(Number(visible) || 0));
  return visualStack([
    sectionRule("QUEUE SUMMARY", width),
    twoColumn(`TOTAL ${compactNumber(count)}`, `VISIBLE ${compactNumber(shown)}`, width),
    twoColumn(`PAGE ${Math.max(1, page)}/${Math.max(1, pages)}`, `DENSITY ${count ? Math.round(shown / count * 100) : 0}%`, width),
    pixelMeter(count ? shown / count * 100 : 0, Math.max(12, width - 18)),
  ]);
}

export function uxNodeRow(name: string, connected: boolean, latencyMs = 0, players = 0): string {
  const status = connected ? "OK" : "OFFLINE";
  return pixelStatusLine(uiText(name, "NODE", 18), status, `${latencyLabel(latencyMs).padStart(8, " ")} P${compactNumber(players).padStart(5, " ")}`);
}

export function uxNodeGrid(nodes: readonly { name: string; connected?: boolean; latencyMs?: number; players?: number }[], width = 52): string {
  const rows = nodes.slice(0, 12).map((node) => uxNodeRow(node.name, node.connected !== false, node.latencyMs, node.players));
  return glyphPanelAdvanced(rows.length ? rows : ["○ NO NODE TELEMETRY"], { width, tone: "DENSE", title: "NODE GRID", maxLines: 12 });
}

export function uxSpectrum(values: readonly number[], width = 52): string {
  const samples = values.filter(Number.isFinite).slice(-48);
  return visualStack([
    sectionRule("SIGNAL FIELD", width),
    pixelSpark(samples, Math.max(12, width - 8)) || "·",
    pixelMeter(samples.length ? Math.min(100, Math.max(...samples, 0)) : 0, Math.max(12, width - 18)),
    `SAMPLES ${compactNumber(samples.length)}  ·  ${samples.length ? "LIVE" : "SILENT"}`,
  ]);
}

export function uxPixelHero(title: string, subtitle = "", width = 52): string {
  const w = Math.max(28, Math.min(68, Math.trunc(width)));
  return visualStack([
    pixelText(pixelCaption(title, 14), UI_TOKENS.glyph.block, " ", 14),
    subtitle ? `▣ ${pixelCaption(subtitle, w - 4).toUpperCase()}` : "",
    sectionRule("NOIR MUSIC / GLYPH-11", w),
  ]);
}

export function uxDensityMeter(value: number, width = 28): string {
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  const level = safe >= 85 ? "OPERATOR" : safe >= 65 ? "DENSE" : safe >= 35 ? "STANDARD" : "COMPACT";
  return `${pixelMeter(safe, width)}  ${level}`;
}

export function uxBadgeStrip(items: readonly { label: string; value: unknown; state?: "ON" | "OFF" | "WARN" }[], width = 52): string {
  return pixelBadgeRow(items.slice(0, 6), width);
}

export function uxCommandRow(command: string, description: string, category: string, width = 52): string {
  const left = pixelCaption(command, 24).padEnd(24, " ");
  const right = pixelCaption(description, Math.max(12, width - 29));
  return `${stateGlyph("ONLINE")} ${left} ${UI_TOKENS.glyph.arrow} ${right}  · ${pixelCaption(category, 12).toUpperCase()}`.slice(0, width);
}

export function uxCommandMatrix(commands: readonly { name: string; description: string; category: string }[], width = 60): string {
  const rows = commands.slice(0, 14).map((command) => uxCommandRow(command.name, command.description, command.category, width));
  return visualStack([
    uxPixelHero("COMMAND MATRIX", `${commands.length} REGISTERED SURFACES`, width),
    glyphPanelAdvanced(rows.length ? rows : ["○ NO COMMAND SURFACES"], { width, tone: "OPERATOR", title: "COMMAND WALL", maxLines: 14 }),
  ]);
}

export function uxPulseLine(frame = 0, width = 48): string {
  return `${UI_TOKENS.glyph.scan} SIGNAL ${pixelPulse(frame, Math.max(12, width - 10))}`;
}
