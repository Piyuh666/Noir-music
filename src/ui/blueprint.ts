/** NOIR MUSIC // GLYPH-15 UX BLUEPRINTS — composable screen-level presentation models. */
import { glyphBanner, glyphCornerFrame, glyphFooter, glyphKeyValue, glyphMetricGrid, glyphModeRail, glyphPill, glyphProgress, glyphRule, glyphWave } from "./glyphStudio";
import { pixelCaption, pixelTitle } from "./typography";
import { compactNumber, uiText } from "./surface";
import type { UIMode, UIState } from "./theme";
import { stateGlyph } from "./theme";

export interface BlueprintAction { label: string; shortcut?: string; enabled?: boolean; intent?: "PRIMARY" | "SECONDARY" | "DANGER" | "NAV"; }
export interface BlueprintHeader { eyebrow?: string; title: string; subtitle?: string; state?: UIState; code?: string; }
export interface BlueprintMetric { label: string; value: unknown; tone?: "QUIET" | "NEUTRAL" | "ACTIVE" | "WARNING" | "DANGER"; }
export interface BlueprintScreen { header: BlueprintHeader; body: readonly string[]; actions?: readonly BlueprintAction[]; footer?: string; mode?: UIMode; }

function actionGlyph(action: BlueprintAction): string {
  if (action.enabled === false) return "○";
  if (action.intent === "DANGER") return "×";
  if (action.intent === "NAV") return "‹";
  if (action.intent === "PRIMARY") return "◆";
  return "·";
}

export function blueprintActions(actions: readonly BlueprintAction[], width = 52): string {
  return actions.slice(0, 10).map((action, index) => {
    const shortcut = action.shortcut ? ` [${uiText(action.shortcut, "", 10)}]` : "";
    return `${actionGlyph(action)} ${(index + 1).toString().padStart(2, "0")} ${pixelCaption(action.label, Math.max(8, width - 12))}${shortcut}`;
  }).join("\n") || "○ NO ACTIONS AVAILABLE";
}

export function blueprintHeader(header: BlueprintHeader, width = 52): string {
  const state = header.state ? `${stateGlyph(header.state)} ${header.state}` : "◆ NOIR MUSIC";
  return [
    header.eyebrow ? `⌁ ${pixelCaption(header.eyebrow, width - 4).toUpperCase()}` : "",
    pixelTitle(header.title, width),
    header.subtitle ? `▣ ${pixelCaption(header.subtitle, width - 4)}` : "",
    `${state}${header.code ? `  ·  ${uiText(header.code, "", 20)}` : ""}`,
    glyphRule(width),
  ].filter(Boolean).join("\n");
}

export function blueprintScreen(screen: BlueprintScreen, width = 52): string {
  const body = screen.body.slice(0, 18).map((line) => uiText(line, "", width)).filter(Boolean);
  const sections = [blueprintHeader(screen.header, width), body.join("\n")];
  if (screen.actions?.length) sections.push(glyphRule(width, "·"), blueprintActions(screen.actions, width));
  sections.push(glyphFooter(screen.footer ?? "READY", `${screen.mode ?? "STANDARD"}`, width));
  return glyphCornerFrame(sections, width + 2);
}

export function playerBlueprint(input: {
  title: string; artist?: string; source?: string; state?: UIState; positionMs?: number; durationMs?: number; volume?: number; queueSize?: number; mode?: UIMode;
}, width = 58): string {
  const duration = Math.max(0, Number(input.durationMs) || 0);
  const position = Math.max(0, Math.min(duration || Number.MAX_SAFE_INTEGER, Number(input.positionMs) || 0));
  const percent = duration ? position / duration * 100 : 0;
  const rows = [
    `${input.state ? stateGlyph(input.state) : "◆"} ${pixelCaption(input.title, width - 6).toUpperCase()}`,
    input.artist ? `· ${pixelCaption(input.artist, width - 4)}` : "",
    input.source ? `▣ ${pixelCaption(input.source, width - 4)}` : "",
    glyphProgress(percent, Math.max(12, width - 18)),
    `TIME ${Math.round(position / 1000)}s / ${Math.round(duration / 1000)}s  ·  VOL ${Math.round(Number(input.volume) || 0)}%`,
    `QUEUE ${compactNumber(input.queueSize ?? 0)}  ·  MODE ${(input.mode ?? "standard").toUpperCase()}`,
  ].filter(Boolean);
  return glyphCornerFrame(rows, width, "NOW PLAYING");
}

export function queueBlueprint(input: { items: readonly { title: string; artist?: string; active?: boolean }[]; page: number; pages: number; total: number; mode?: UIMode; }, width = 58): string {
  const rows = input.items.slice(0, 12).map((item, index) => {
    const mark = item.active ? "◆" : "·";
    const artist = item.artist ? ` · ${uiText(item.artist, "", 18)}` : "";
    return `${mark} ${(index + 1).toString().padStart(2, "0")} ${uiText(item.title, "UNTITLED", width - 28)}${artist}`;
  });
  rows.push(glyphRule(width - 4, "·"));
  rows.push(`PAGE ${Math.max(1, input.page)}/${Math.max(1, input.pages)}  ·  TOTAL ${compactNumber(input.total)}  ·  ${(input.mode ?? "standard").toUpperCase()}`);
  return glyphCornerFrame(rows, width, "QUEUE MATRIX");
}

export function dashboardBlueprint(input: { title?: string; metrics: readonly BlueprintMetric[]; signal?: readonly number[]; actions?: readonly BlueprintAction[]; mode?: UIMode; }, width = 62): string {
  const body = [
    input.title ? pixelTitle(input.title, width - 2) : "",
    glyphMetricGrid(input.metrics, width - 2, width >= 58 ? 3 : 2),
    input.signal?.length ? `SIGNAL\n${glyphWave(input.signal, width - 4)}` : "",
    glyphModeRail(input.mode ?? "standard"),
  ].filter(Boolean);
  return blueprintScreen({ header: { title: "OPERATOR DASHBOARD", subtitle: input.title ?? "LIVE SYSTEM SURFACE" }, body, actions: input.actions, mode: input.mode }, width);
}

export function searchBlueprint(input: { query: string; results: readonly { title: string; subtitle?: string; selected?: boolean }[]; page: number; pages: number; }, width = 58): string {
  const rows = [
    `⌕ ${uiText(input.query, "SEARCH", width - 4)}`,
    glyphRule(width - 4, "·"),
    ...input.results.slice(0, 12).map((result, index) => `${result.selected ? "◆" : "·"} ${String(index + 1).padStart(2, "0")} ${uiText(result.title, "RESULT", width - 12)}${result.subtitle ? `\n   ${uiText(result.subtitle, "", width - 8)}` : ""}`),
    `PAGE ${Math.max(1, input.page)}/${Math.max(1, input.pages)}  ·  ${compactNumber(input.results.length)} VISIBLE`,
  ];
  return glyphCornerFrame(rows, width, "SEARCH DECK");
}

export function confirmationBlueprint(input: { title: string; message: string; consequences?: readonly string[]; confirmLabel?: string; cancelLabel?: string; dangerous?: boolean; }, width = 54): string {
  const tone = input.dangerous ? "DANGER" : "WARNING";
  const rows = [glyphPill(tone === "DANGER" ? "CONFIRM DESTRUCTIVE" : "CONFIRM ACTION", tone, width - 4), uiText(input.message, "CONFIRM THIS ACTION", width - 4)];
  if (input.consequences?.length) rows.push(glyphRule(width - 4, "·"), ...input.consequences.slice(0, 6).map((item) => `› ${uiText(item, "", width - 8)}`));
  rows.push(glyphRule(width - 4, "·"), `◆ ${uiText(input.confirmLabel ?? "CONFIRM", "CONFIRM", 20)}`, `○ ${uiText(input.cancelLabel ?? "CANCEL", "CANCEL", 20)}`);
  return glyphCornerFrame(rows, width, input.title);
}

export function loadingBlueprint(title = "LOADING", value = -1, width = 48): string {
  const finite = Number.isFinite(value) && value >= 0;
  const body = [glyphPill(finite ? "PROCESSING" : "SCANNING", "WARNING", width - 4), finite ? glyphProgress(value, width - 12) : "⌁ ·░▒▓█▓▒░· ⌁", finite ? `${Math.round(value)}% COMPLETE` : "PLEASE WAIT · SURFACE IS BEING PREPARED"];
  return glyphCornerFrame(body, width, title);
}
