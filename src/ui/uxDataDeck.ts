/** NOIR MUSIC // GLYPH-18 DATA DECKS
 * High-density data presentation with explicit empty/loading/error states.
 */
import { compactNumber, latencyLabel, uiText } from "./surface";
import { kernelBar, kernelFrame, kernelHeat, kernelHistogram, kernelMetricGrid, kernelSpark, kernelWave } from "./visualKernel";

export type DeckPhase = "LIVE" | "EMPTY" | "LOADING" | "ERROR" | "STALE";
export interface DeckMetric { label: string; value: string | number; hint?: string; }

const PHASE: Record<DeckPhase, string> = { LIVE: "●", EMPTY: "○", LOADING: "◐", ERROR: "×", STALE: "◇" };
function widthOf(width: number): number { return Math.max(28, Math.min(72, Math.trunc(Number(width) || 52))); }
function text(value: unknown, width: number): string { return uiText(String(value ?? ""), "", width); }

export function deckHeader(title: string, phase: DeckPhase = "LIVE", detail = "", width = 56): string {
  const w = widthOf(width);
  return `${PHASE[phase]} ${text(title, w - 18).toUpperCase()} · ${phase}${detail ? `\n⌁ ${text(detail, w - 4)}` : ""}`;
}

export function metricDeck(metrics: readonly DeckMetric[], width = 56): string {
  const w = widthOf(width);
  return kernelFrame([kernelMetricGrid(metrics.slice(0, 12), w - 4, w >= 58 ? 3 : 2)], { width: w, title: "METRIC DECK", tone: "DENSE" });
}

export function latencyDeck(samples: readonly number[], width = 56): string {
  const clean = samples.filter(Number.isFinite).slice(-48);
  const latest = clean.at(-1) ?? 0;
  const average = clean.length ? clean.reduce((a, b) => a + b, 0) / clean.length : 0;
  const peak = clean.length ? Math.max(...clean) : 0;
  return kernelFrame([
    `LATEST  ${latencyLabel(latest)}`,
    `AVG     ${latencyLabel(average)}`,
    `PEAK    ${latencyLabel(peak)}`,
    `SAMPLES ${compactNumber(clean.length)}`,
    kernelSpark(clean, Math.max(12, widthOf(width) - 8)),
  ], { width: widthOf(width), title: "LATENCY DECK", tone: "DENSE" });
}

export function signalDeck(values: readonly number[], width = 56): string {
  const source = values.filter(Number.isFinite).slice(-64);
  const max = source.length ? Math.max(...source) : 0;
  return kernelFrame([
    `SIGNAL  ${source.length ? "LIVE" : "SILENT"}`,
    kernelSpark(source, Math.max(16, widthOf(width) - 8)),
    kernelWave(source, Math.max(16, widthOf(width) - 8)),
    kernelHeat(source, Math.max(16, widthOf(width) - 8)),
    `PEAK    ${Math.round(max)}`,
  ], { width: widthOf(width), title: "SIGNAL DECK", tone: "OPERATOR" });
}

export function distributionDeck(values: readonly number[], width = 56): string {
  const source = values.filter(Number.isFinite).slice(-128);
  const mean = source.length ? source.reduce((a, b) => a + b, 0) / source.length : 0;
  return kernelFrame([
    `COUNT   ${compactNumber(source.length)}`,
    `MEAN    ${Math.round(mean)}`,
    kernelHistogram(source, Math.max(12, widthOf(width) - 8)),
    kernelBar(source.length ? Math.min(100, Math.max(...source)) : 0, Math.max(12, widthOf(width) - 16)),
  ], { width: widthOf(width), title: "DISTRIBUTION", tone: "PANEL" });
}

export function quotaDeck(used: number, limit: number, label = "CAPACITY", width = 56): string {
  const safeLimit = Math.max(1, Number(limit) || 1);
  const safeUsed = Math.max(0, Number(used) || 0);
  const pct = Math.min(100, safeUsed / safeLimit * 100);
  return kernelFrame([
    `${text(label, 18).toUpperCase()}  ${compactNumber(safeUsed)} / ${compactNumber(safeLimit)}`,
    kernelBar(pct, Math.max(12, widthOf(width) - 18)),
    pct >= 90 ? "× CAPACITY CRITICAL" : pct >= 75 ? "◐ CAPACITY HIGH" : "● CAPACITY STABLE",
  ], { width: widthOf(width), title: "RESOURCE DECK", tone: pct >= 90 ? "ALERT" : "PANEL" });
}

export function emptyDeck(title: string, message = "NO DATA", action = "REFRESH", width = 52): string {
  return kernelFrame([`○ ${text(title, widthOf(width) - 6).toUpperCase()}`, `· ${text(message, widthOf(width) - 6)}`, `› NEXT  ${text(action, widthOf(width) - 12).toUpperCase()}`], { width: widthOf(width), title: "EMPTY SURFACE", tone: "VOID" });
}

export function loadingDeck(title = "LOADING", progress = -1, width = 52): string {
  const pct = Number(progress);
  const w = widthOf(width);
  return kernelFrame([`◐ ${text(title, w - 6).toUpperCase()}`, Number.isFinite(pct) && pct >= 0 ? kernelBar(pct, Math.max(12, w - 18)) : "⌁ SCANNING ···", Number.isFinite(pct) && pct >= 0 ? `${Math.round(Math.max(0, Math.min(100, pct)))}% · PROCESSING` : "PLEASE WAIT"], { width: w, title: "LOADING SURFACE", tone: "DENSE" });
}

export function errorDeck(title: string, message: string, retry = "RETRY", width = 52): string {
  const w = widthOf(width);
  return kernelFrame([`× ${text(title, w - 6).toUpperCase()}`, text(message, w - 6), `› ${text(retry, w - 4).toUpperCase()}`], { width: w, title: "RECOVERY SURFACE", tone: "ALERT", weight: "HEAVY" });
}
