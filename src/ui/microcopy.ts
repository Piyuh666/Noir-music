/** NOIR MUSIC // GLYPH-11 MICROCOPY — consistent pixel-native UX language. */
import { uiText } from "./surface";
import { UI_TOKENS } from "./theme";

export const MICROCOPY = Object.freeze({
  empty: "NO ACTIVE DATA",
  loading: "PROCESSING",
  ready: "READY",
  success: "COMPLETE",
  stale: "SURFACE OUTDATED",
  blocked: "ACTION BLOCKED",
  failed: "OPERATION FAILED",
  refresh: "RESCAN",
  close: "CLOSE",
  back: "BACK",
  next: "NEXT",
  previous: "PREVIOUS",
  retry: "RETRY",
  details: "DETAILS",
  queue: "QUEUE",
  matrix: "MATRIX",
  telemetry: "TELEMETRY",
  control: "CONTROL CENTER",
  source: "SOURCE",
  signal: "SIGNAL",
});

export function actionCopy(action: string, detail = ""): string {
  const safe = uiText(action, "ACTION", 40).toUpperCase();
  return `${UI_TOKENS.glyph.arrow} ${safe}${detail ? `  · ${uiText(detail, "", 48)}` : ""}`;
}

export function stateCopy(state: string, detail = ""): string {
  return `${UI_TOKENS.glyph.square} ${uiText(state, "STATE", 24).toUpperCase()}${detail ? `  · ${uiText(detail, "", 60)}` : ""}`;
}

export function countCopy(label: string, count: number): string {
  return `${uiText(label, "ITEMS", 24).toUpperCase()} ${Math.max(0, Math.trunc(Number(count) || 0))}`;
}

export function pageCopy(page: number, pages: number, total: number): string {
  const p = Math.max(1, Math.trunc(Number(page) || 1));
  const n = Math.max(1, Math.trunc(Number(pages) || 1));
  const t = Math.max(0, Math.trunc(Number(total) || 0));
  return `PAGE ${p}/${n}  ·  ${t} TOTAL`;
}

export function latencyCopy(ms: number): string {
  const value = Math.max(0, Number(ms) || 0);
  return value < 100 ? "SIGNAL / FAST" : value < 250 ? "SIGNAL / STABLE" : value < 500 ? "SIGNAL / DEGRADED" : "SIGNAL / SLOW";
}
