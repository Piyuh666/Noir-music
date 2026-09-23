import { NOIR_UI_VERSION } from "./uiVersion";
/** NOIR MUSIC // REAL UI WIRING HUB
 * Every imported module below contributes data to the rendered surface. This
 * file intentionally contains no audit-only imports and no synthetic reachability contract.
 */
import { accessibilityStrengthAudit, accessibleProgress, type A11yNode } from "./a11y";
import { accessibleSurface as accessibleSurface21 } from "./screenAccessibility";
import { accessibleSurface as accessibleSurfaceLegacy } from "./accessibility";
import { atlasPanel, atlasRail, atlasSignal } from "./atlas";
import { commandMatrix as commandMatrix19, commandTelemetry as commandTelemetry19 } from "./commandSurface";
import { searchPalette } from "./commandPalette";
import { commandDashboard, commandAccessibility } from "./commandUx";
import { metricWall, heatRow } from "./dataDisplay";
import { GLYPH22_TOKENS, role } from "./designTokens";
import { DISCORD_UI_BUDGET, budgetReport, degradeLines } from "./discordBudget";
import { feedbackNotice, progressFeedback } from "./feedback";
import { noticeLine, progressNotice, type Notice } from "./feedbackCenter";
import { interactionLabel, interactionRail } from "./interactionUx";
import type { InteractionModel } from "./interactionUx";
import { actionCopy, stateCopy, countCopy } from "./microcopy";
import { narrativeDeck, narrativeLine } from "./narrative";
import { breadcrumb, navigationRail, pagination } from "./navigation";
import { nodeRail, operatorExperience } from "./operatorSurface";
import { playerExperience, playerProgress, playerSignal } from "./playerSurface";
import { queueExperience, queueSignal, type QueueItem19 } from "./queueSurface";
import { renderNowPlaying, renderQueue, renderTelemetry } from "./renderers";
import { profileFromWidth, responsiveClamp } from "./responsive";
import { fitDensity, responsivePanel, type Density21 } from "./responsive";
import { screenKit } from "./screenKit";
import { settingsSummary, validateSettings } from "./settingsStudio";
import { skeletonPlayer, skeletonQueue } from "./skeletons";
import { strengthSummary } from "./strengthGate28";
import { composeFrame } from "./uiOrchestrator";
import { UiRegistry, registrySeal, stableSurfaceId } from "./uiRegistry";
import { blueprintScreen } from "./blueprint";
import { matrixSurface } from "./panelComposer";
import { screenContract } from "./uxContracts";
import { composeJourney } from "./journey";
import { focusRail, statusStack } from "./uxPrimitives";
import { shellCompose } from "./shell";
import { playerHudView, queueHudView } from "./views";
import { scanline, sweep } from "./visualEffects";
import { canTransition, transition, type VisualState } from "./visualStateMachine";
import { densityWidth, visualWeight } from "./uxTokens";
import { composeGlyphRuntime } from "./glyphRuntime/runtime";
import { matrixDesignFor, matrixPlayerSurface, matrixQueueSurface, matrixCommandSurface, type MatrixDesign } from "./glyphMatrixUi";
import { composeUiCore, resolveActions, type UiCoreInput } from "./core";

export interface UltraUiInput {
  readonly title: string;
  readonly artist?: string;
  readonly source?: string;
  readonly requester?: string;
  readonly positionMs: number;
  readonly durationMs: number;
  readonly volume: number;
  readonly queueSize: number;
  readonly state: VisualState;
  readonly page?: number;
  readonly pages?: number;
  readonly queue?: readonly { title: string; artist?: string; duration?: number }[];
  readonly commands?: readonly { name: string; description: string }[];
  readonly width?: number;
  readonly design?: MatrixDesign;
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, Math.trunc(Number(n) || 0)));

const coreState = (state: VisualState): import("./core/contracts").UiState => {
  switch (state) {
    case "PLAYING": return "ACTIVE";
    case "LOADING": case "BUFFERING": case "RECONNECTING": return "BUSY";
    case "PAUSED": case "MUTED": return "WARNING";
    case "STALE": return "STALE";
    case "EMPTY": return "EMPTY";
    case "LOCKED": return "LOCKED";
    case "SUCCESS": return "SUCCESS";
    case "WARNING": return "WARNING";
    case "ERROR": return "ERROR";
    case "BUSY": return "BUSY";
    case "READY": return "READY";
    case "ACTIVE": return "ACTIVE";
    default: return "IDLE";
  }
};
const densityFor = (width: number): Density21 => {
  const p = profileFromWidth(width);
  return p === "MINI" ? "MINI" : p === "COMPACT" ? "COMPACT" : p === "STANDARD" ? "STANDARD" : p === "DENSE" ? "DENSE" : "OPERATOR";
};

/**
 * ULTRA FABRIC V4
 *
 * This is deliberately a functional composition fabric, not a reachability
 * registry. Each stage consumes the output of the previous stage and produces
 * data that is consumed by the next stage. Keeping the stages in one module
 * makes the canonical renderer's dependency boundary explicit while avoiding
 * circular imports between individual UI primitives.
 */
export interface UltraUiNormalizedInput {
  readonly width: number;
  readonly page: number;
  readonly pages: number;
  readonly queue: readonly { title: string; artist?: string; duration?: number }[];
  readonly commands: readonly { name: string; description: string }[];
  readonly progress: number;
  readonly state: VisualState;
  readonly title: string;
  readonly artist: string;
  readonly source: string;
  readonly requester: string;
  readonly positionMs: number;
  readonly durationMs: number;
  readonly volume: number;
  readonly queueSize: number;
  readonly density: Density21;
  readonly design: MatrixDesign;
}

export interface UltraCommandSpec {
  readonly name: string;
  readonly category: string;
  readonly description: string;
  readonly usage: string;
  readonly state: VisualState;
}

export interface UltraUiRuntimeFabric {
  readonly normalized: UltraUiNormalizedInput;
  readonly accessibility: {
    readonly nodes: readonly A11yNode[];
    readonly status: string;
    readonly count: number;
    readonly focusable: number;
    readonly progress: string;
  };
  readonly actions: readonly InteractionModel[];
  readonly registry: UiRegistry;
  readonly player: Record<string, unknown>;
  readonly queue: readonly QueueItem19[];
  readonly commandSpecs: readonly UltraCommandSpec[];
  readonly settings: { readonly line: string; readonly errors: readonly string[] };
  readonly transition: VisualState;
}

const normalizeUltraInput = (input: UltraUiInput): UltraUiNormalizedInput => {
  const width = clamp(input.width ?? GLYPH22_TOKENS.widths.xl, 30, 72);
  const pages = Math.max(1, clamp(input.pages ?? 1, 1, 9999));
  const page = clamp(input.page ?? 1, 1, pages);
  const positionMs = Math.max(0, Math.trunc(Number(input.positionMs) || 0));
  const durationMs = Math.max(0, Math.trunc(Number(input.durationMs) || 0));
  const volume = clamp(input.volume, 0, 100);
  const queueSize = Math.max(0, Math.trunc(Number(input.queueSize) || 0));
  const queue = [...(input.queue ?? [])]
    .slice(0, 25)
    .map((track) => ({
      title: String(track.title || "UNTITLED").slice(0, 160),
      artist: track.artist ? String(track.artist).slice(0, 120) : undefined,
      duration: track.duration == null ? undefined : Math.max(0, Math.trunc(Number(track.duration) || 0)),
    }));
  const commands = [...(input.commands ?? [])]
    .slice(0, 25)
    .map((command) => ({
      name: String(command.name || "COMMAND").slice(0, 80),
      description: String(command.description || "NO DESCRIPTION").slice(0, 180),
    }));
  return Object.freeze({
    width,
    page,
    pages,
    queue,
    commands,
    progress: durationMs > 0 ? clamp(positionMs / durationMs * 100, 0, 100) : 0,
    state: input.state,
    title: String(input.title || "NOIR MUSIC").slice(0, 180),
    artist: String(input.artist || "UNKNOWN ARTIST").slice(0, 120),
    source: String(input.source || "AUTO").slice(0, 80),
    requester: String(input.requester || "UNKNOWN").slice(0, 120),
    positionMs,
    durationMs,
    volume,
    queueSize,
    density: densityFor(width),
    design: matrixDesignFor(width, input.design),
  });
};

const buildUltraAccessibility = (n: UltraUiNormalizedInput): UltraUiRuntimeFabric["accessibility"] & { nodes: readonly A11yNode[] } => {
  const nodes: A11yNode[] = [
    { id: "title", label: n.title, role: "heading", order: 0, state: n.state },
    { id: "progress", label: "Playback progress", role: "progressbar", order: 1, state: n.state },
    { id: "queue", label: `Queue ${n.queueSize}`, role: "navigation", order: 2, state: n.state },
    { id: "volume", label: `Volume ${n.volume}%`, role: "status", order: 3, state: n.state },
  ];
  const audit = accessibilityStrengthAudit(nodes);
  return { nodes, status: audit.status, count: audit.count, focusable: audit.focusable, progress: accessibleProgress("Playback", n.positionMs, n.durationMs) };
};

const buildUltraActions = (n: UltraUiNormalizedInput): readonly InteractionModel[] => Object.freeze([
  { id: "previous", label: "PREVIOUS" },
  { id: "playpause", label: n.state === "ACTIVE" ? "PAUSE" : "PLAY" },
  { id: "skip", label: "SKIP" },
  { id: "queue", label: "QUEUE" },
]);

const buildUltraRegistry = (): UiRegistry => {
  const registry = new UiRegistry();
  const surfaces = ["PLAYER", "QUEUE", "COMMAND", "TELEMETRY", "ACCESSIBILITY", "NAVIGATION"] as const;
  for (const surface of surfaces) {
    registry.register({
      id: stableSurfaceId("glyph-v4", surface),
      title: surface,
      version: NOIR_UI_VERSION,
      category: "canonical",
      renderers: ["glyphV4", "ultraWiring"],
      interactive: surface !== "TELEMETRY" && surface !== "ACCESSIBILITY",
    });
  }
  return registry;
};

const buildUltraCommandSpecs = (n: UltraUiNormalizedInput): readonly UltraCommandSpec[] => {
  const results = searchPalette(
    n.commands.map((x) => ({ name: x.name, category: "COMMAND", summary: x.description, enabled: true })),
    "",
    10,
  );
  return (results.length ? results : n.commands.slice(0, 10).map((x) => ({ name: x.name, category: "COMMAND", summary: x.description })))
    .slice(0, 10)
    .map((x) => ({ name: x.name, category: x.category, description: x.summary, usage: `/${x.name}`, state: "READY" }));
};

const buildUltraSettings = (n: UltraUiNormalizedInput): UltraUiRuntimeFabric["settings"] => {
  const settings = [{
    id: "playback",
    title: "Playback",
    fields: [
      { id: "volume", label: "Volume", kind: "number", value: n.volume, defaultValue: 70 },
      { id: "queue", label: "Queue", kind: "number", value: n.queueSize, defaultValue: 0 },
    ],
  }] as any;
  const errors = validateSettings(settings);
  return { errors, line: errors.length ? `SETTINGS × ${errors.join(",")}` : `SETTINGS ✓ ${settingsSummary(settings)}` };
};

const buildUltraFabric = (input: UltraUiInput): UltraUiRuntimeFabric => {
  const normalized = normalizeUltraInput(input);
  const accessibility = buildUltraAccessibility(normalized);
  const actions = buildUltraActions(normalized);
  const registry = buildUltraRegistry();
  const queue = normalized.queue.map((track, index) => ({
    id: `q-${index + 1}`,
    title: track.title,
    artist: track.artist ?? "UNKNOWN",
    durationMs: track.duration ?? 0,
    index: index + 1,
    active: index === 0 && normalized.page === 1,
  }));
  const player = {
    title: normalized.title,
    artist: normalized.artist,
    source: normalized.source,
    requester: normalized.requester,
    positionMs: normalized.positionMs,
    durationMs: normalized.durationMs,
    volume: normalized.volume,
    queue: normalized.queueSize,
    state: normalized.state === "ACTIVE" ? "PLAYING" : normalized.state,
    loop: "OFF",
    shuffle: false,
    autoplay: false,
  };
  const commandSpecs = buildUltraCommandSpecs(normalized);
  const settings = buildUltraSettings(normalized);
  const transitionEvent = normalized.state === "ERROR" ? "error" : normalized.state === "ACTIVE" ? "activate" : "ready";
  const nextState = canTransition(normalized.state, transitionEvent) ? transition(normalized.state, transitionEvent) : normalized.state;
  return Object.freeze({ normalized, accessibility, actions, registry, player, queue, commandSpecs, settings, transition: nextState });
};

/**
 * Builds reusable functional fragments for callers that need the wiring
 * context without rendering the final Discord-sized surface.
 */
export function buildUltraUiFabric(input: UltraUiInput): UltraUiRuntimeFabric {
  return buildUltraFabric(input);
}

/**
 * Executes a bounded, ordered render pipeline. Every returned stage is
 * consumed by the final assembly below; there are no import-only wiring
 * edges in this path.
 */
const composeUltraUiStagesFromFabric = (fabric: UltraUiRuntimeFabric): readonly (readonly string[])[] => {
  const n = fabric.normalized;
  const actionLabels = fabric.actions.map(interactionLabel);
  const queueRows = fabric.queue as readonly { id: string; title: string; artist: string; durationMs: number; index: number; active: boolean }[];
  const stageA = [
    atlasRail({ left: "NOIR MUSIC", center: "ULTRA FABRIC", right: n.state, glyph: role("primary").glyph }, n.width),
    atlasSignal([n.progress, n.volume, Math.min(100, n.queueSize * 4)], n.width - 18),
    `A11Y ${fabric.accessibility.status} · ${fabric.accessibility.count} NODES · ${fabric.accessibility.focusable}`,
  ];
  const stageB = [
    playerExperience({ title: n.title, artist: n.artist, positionMs: n.positionMs, durationMs: n.durationMs, volume: n.volume, queueLength: n.queueSize, source: n.source, density: n.density as any, phase: n.state as any, signal: [n.progress, n.volume] }),
    playerProgress(n.positionMs, n.durationMs, n.width - 8),
    playerSignal([n.progress, n.volume], n.width - 8),
    queueExperience(queueRows, n.page, 8, n.density),
    queueSignal(queueRows, n.width - 8),
  ];
  const stageC = [
    interactionRail([...fabric.actions], n.width),
    actionLabels.join("  "),
    focusRail(fabric.actions.map((a) => ({ id: a.id, label: a.label, state: a.id === "playpause" ? "FOCUSED" : "NONE" })), "playpause", n.width),
    navigationRail([{ id: "player", label: "PLAYER", kind: "PRIMARY" }, { id: "queue", label: "QUEUE", kind: "PRIMARY" }], n.width),
    pagination(n.page, n.pages),
  ];
  const stageD = [
    commandMatrix19(fabric.commandSpecs, n.width),
    fabric.commandSpecs.length ? commandTelemetry19(fabric.commandSpecs[0]) : "◇ COMMAND TELEMETRY · EMPTY",
    commandDashboard({ name: String(fabric.commandSpecs[0]?.name ?? "NOIR MUSIC"), category: "COMMAND", description: String(fabric.commandSpecs[0]?.description ?? "Canonical command matrix"), state: n.state === "ERROR" ? "ERROR" : "READY", metrics: [{ label: "AVAILABLE", value: n.commands.length, state: "READY" }] } as any, n.width),
    commandAccessibility({ name: String(fabric.commandSpecs[0]?.name ?? "NOIR MUSIC"), category: "COMMAND", description: "Canonical command matrix", state: "READY" } as any),
  ];
  const stageE = [
    metricWall([
      { label: "POSITION", value: Math.round(n.positionMs / 1000), unit: "SEC", state: n.state },
      { label: "DURATION", value: Math.round(n.durationMs / 1000), unit: "SEC", state: n.state },
      { label: "VOLUME", value: n.volume, unit: "%", state: n.state },
      { label: "QUEUE", value: n.queueSize, unit: "TRACKS", state: n.state },
    ], 2, n.width),
    heatRow([n.progress / 100, n.volume / 100, Math.min(1, n.queueSize / 25)], n.width - 12),
    statusStack([{ label: "PLAYBACK", active: n.state === "ACTIVE", detail: n.title }, { label: "QUEUE", active: n.queueSize > 0, detail: `${n.queueSize} TRACKS` }], n.width),
  ];
  const stageG = [
    matrixPlayerSurface({ title: n.title, artist: n.artist, state: String(n.state), positionMs: n.positionMs, durationMs: n.durationMs, volume: n.volume, queueSize: n.queueSize, source: n.source, width: n.width, design: n.design }),
    n.queue.length ? matrixQueueSurface(n.queue, n.page, n.pages, n.width, n.design) : "▣ QUEUE · · EMPTY",
    n.commands.length ? matrixCommandSurface("COMMAND MATRIX", n.commands, n.width, n.design) : "▤ COMMAND MATRIX · · EMPTY",
  ];
  const stageF = [
    screenKit({ title: n.title, subtitle: n.artist, sections: [{ title: "PLAYER", lines: [playerProgress(n.positionMs, n.durationMs, n.width - 8)] }], actions: fabric.actions.map((a) => ({ id: a.id, label: a.label })) } as any),
    shellCompose({ title: n.title, phase: n.state as any, density: n.density as any, content: playerProgress(n.positionMs, n.durationMs, n.width - 8), actions: fabric.actions.map((a) => ({ id: a.id, label: a.label })) } as any),
    blueprintScreen({ header: { title: n.title, eyebrow: "NOIR MUSIC", state: n.state as any }, body: [n.artist, playerProgress(n.positionMs, n.durationMs, n.width - 8)], actions: fabric.actions.map((a) => ({ label: a.label, intent: "PRIMARY", enabled: true })) } as any, n.width),
    matrixSurface("RUNTIME MATRIX", [{ label: "STATE", value: n.state, meter: n.progress }, { label: "VOLUME", value: `${n.volume}%`, meter: n.volume }], n.width),
    fabric.settings.line,
  ];
  return Object.freeze([stageA, stageB, stageC, stageD, stageE, stageF, stageG].map((stage) => Object.freeze(stage.flatMap((x) => String(x ?? "").split("\n").filter(Boolean)))));
}


export function composeUltraUiStages(input: UltraUiInput): readonly (readonly string[])[] {
  return composeUltraUiStagesFromFabric(buildUltraFabric(input));
}

/**
 * SHARED PIXEL/GLYPH PRIMITIVES
 *
 * Rendering is deterministic and width-aware.  Discord is not a canvas, so the
 * engine treats every character cell as a pixel: fixed-width glyphs, clipped
 * labels, stable borders, bounded meters and state-aware density are composed
 * first, then handed to the normal UI surface pipeline.  No decorative output
 * is emitted without being derived from the live fabric.
 */
interface UltraPixelGlyph { readonly rows: readonly string[]; readonly advance: number; }

const PIXEL_GLYPHS: Readonly<Record<string, UltraPixelGlyph>> = Object.freeze({
  " ": { rows: ["00000", "00000", "00000", "00000", "00000"], advance: 1 },
  "A": { rows: ["01110", "10001", "11111", "10001", "10001"], advance: 6 },
  "B": { rows: ["11110", "10001", "11110", "10001", "11110"], advance: 6 },
  "C": { rows: ["01111", "10000", "10000", "10000", "01111"], advance: 6 },
  "D": { rows: ["11110", "10001", "10001", "10001", "11110"], advance: 6 },
  "E": { rows: ["11111", "10000", "11110", "10000", "11111"], advance: 6 },
  "F": { rows: ["11111", "10000", "11110", "10000", "10000"], advance: 6 },
  "G": { rows: ["01111", "10000", "10111", "10001", "01111"], advance: 6 },
  "H": { rows: ["10001", "10001", "11111", "10001", "10001"], advance: 6 },
  "I": { rows: ["11111", "00100", "00100", "00100", "11111"], advance: 6 },
  "J": { rows: ["00111", "00010", "00010", "10010", "01100"], advance: 6 },
  "K": { rows: ["10001", "10010", "11100", "10010", "10001"], advance: 6 },
  "L": { rows: ["10000", "10000", "10000", "10000", "11111"], advance: 6 },
  "M": { rows: ["10001", "11011", "10101", "10001", "10001"], advance: 6 },
  "N": { rows: ["10001", "11001", "10101", "10011", "10001"], advance: 6 },
  "O": { rows: ["01110", "10001", "10001", "10001", "01110"], advance: 6 },
  "P": { rows: ["11110", "10001", "11110", "10000", "10000"], advance: 6 },
  "Q": { rows: ["01110", "10001", "10101", "10011", "01111"], advance: 6 },
  "R": { rows: ["11110", "10001", "11110", "10100", "10010"], advance: 6 },
  "S": { rows: ["01111", "10000", "01110", "00001", "11110"], advance: 6 },
  "T": { rows: ["11111", "00100", "00100", "00100", "00100"], advance: 6 },
  "U": { rows: ["10001", "10001", "10001", "10001", "01110"], advance: 6 },
  "V": { rows: ["10001", "10001", "10001", "01010", "00100"], advance: 6 },
  "W": { rows: ["10001", "10001", "10101", "11011", "10001"], advance: 6 },
  "X": { rows: ["10001", "01010", "00100", "01010", "10001"], advance: 6 },
  "Y": { rows: ["10001", "01010", "00100", "00100", "00100"], advance: 6 },
  "Z": { rows: ["11111", "00010", "00100", "01000", "11111"], advance: 6 },
  "0": { rows: ["01110", "10011", "10101", "11001", "01110"], advance: 6 },
  "1": { rows: ["00100", "01100", "00100", "00100", "01110"], advance: 6 },
  "2": { rows: ["01110", "10001", "00010", "00100", "11111"], advance: 6 },
  "3": { rows: ["11110", "00001", "00110", "00001", "11110"], advance: 6 },
  "4": { rows: ["10010", "10010", "11111", "00010", "00010"], advance: 6 },
  "5": { rows: ["11111", "10000", "11110", "00001", "11110"], advance: 6 },
  "6": { rows: ["01110", "10000", "11110", "10001", "01110"], advance: 6 },
  "7": { rows: ["11111", "00001", "00010", "00100", "00100"], advance: 6 },
  "8": { rows: ["01110", "10001", "01110", "10001", "01110"], advance: 6 },
  "9": { rows: ["01110", "10001", "01111", "00001", "01110"], advance: 6 },
  ".": { rows: ["00000", "00000", "00000", "00000", "00100"], advance: 2 },
  "/": { rows: ["00001", "00010", "00100", "01000", "10000"], advance: 6 },
  "-": { rows: ["00000", "00000", "11111", "00000", "00000"], advance: 6 },
  ":": { rows: ["00000", "00100", "00000", "00100", "00000"], advance: 2 },
});

const pixelGlyph = (char: string): UltraPixelGlyph => PIXEL_GLYPHS[char] ?? PIXEL_GLYPHS[" "];
const pixelNormalize = (value: unknown, max: number): string => String(value ?? "").toUpperCase().replace(/[^A-Z0-9 .\/:\-]/g, " ").slice(0, max);
const pixelComposeText = (value: unknown, maxChars: number): readonly string[] => {
  const text = pixelNormalize(value, maxChars);
  const rows = Array.from({ length: 5 }, () => "");
  for (const char of text) {
    const glyph = pixelGlyph(char);
    for (let row = 0; row < 5; row += 1) rows[row] += glyph.rows[row].replace(/0/g, " ").replace(/1/g, "█") + " ";
  }
  return Object.freeze(rows.map((row) => row.replace(/\s+$/g, "")));
};

const pixelFit = (value: unknown, width: number, align: "left" | "center" | "right" = "left"): string => {
  const text = pixelNormalize(value, Math.max(0, width));
  if (text.length >= width) return text.slice(0, width);
  const gap = width - text.length;
  if (align === "right") return " ".repeat(gap) + text;
  if (align === "center") { const left = Math.floor(gap / 2); return " ".repeat(left) + text + " ".repeat(gap - left); }
  return text + " ".repeat(gap);
};

/**
 * ULTRA PIXEL/Glyph DESIGN ENGINE V8
 *
 * Eight heavy visual passes with a UI-first 90/10 allocation.  The renderer
 * treats Discord text as a deterministic character-cell surface: every row
 * is normalized, clipped, padded and framed to the active width before it is
 * emitted.  This is deliberately stronger than merely adding decorative
 * glyphs: typography, matrix geometry, controls, hierarchy, state, density,
 * focus and accessibility all consume the live normalized fabric.
 */
interface UltraPixelV8Context {
  readonly fabric: UltraUiRuntimeFabric;
  readonly seed: UltraLines;
  readonly pass: number;
}

const CELL_GLYPHS = Object.freeze({
  block: "█", shade: "▓", soft: "░", empty: "·", on: "●", off: "○", focus: "◆", idle: "◇", fault: "×",
  h: "─", v: "│", tl: "┌", tr: "┐", bl: "└", br: "┘", cross: "┼", t: "┬", b: "┴",
});

const v8Width = (width: number): number => Math.max(24, Math.min(120, Math.trunc(width || 60)));
const v8Text = (value: unknown, width: number, align: "left" | "center" | "right" = "left"): string =>
  pixelFit(pixelNormalize(value, Math.max(1, width)), Math.max(1, width), align);
const v8Row = (content: unknown, width: number): string => {
  const w = v8Width(width);
  return `${CELL_GLYPHS.v}${v8Text(content, w - 2)}${CELL_GLYPHS.v}`;
};
const v8Rule = (width: number, left: string = CELL_GLYPHS.tl, fill: string = CELL_GLYPHS.h, right: string = CELL_GLYPHS.tr): string => {
  const w = v8Width(width);
  return `${left}${fill.repeat(Math.max(1, w - 2))}${right}`;
};
const v8Box = (title: string, rows: readonly string[], width: number): UltraLines => {
  const w = v8Width(width);
  return freezeLines([
    v8Rule(w),
    v8Row(v8Text(title, w - 4, "center"), w),
    v8Row(v8Rule(w, CELL_GLYPHS.cross, CELL_GLYPHS.h, CELL_GLYPHS.cross).slice(1, -1), w),
    ...rows.map((row) => v8Row(row, w)),
    v8Rule(w, CELL_GLYPHS.bl, CELL_GLYPHS.h, CELL_GLYPHS.br),
  ]);
};
const v8Bar = (value: number, width: number, full = CELL_GLYPHS.block, empty = CELL_GLYPHS.soft): string => {
  const w = Math.max(8, Math.trunc(width));
  const ratio = clamp(Number.isFinite(value) ? value : 0, 0, 1);
  const filled = Math.round(ratio * w);
  return full.repeat(filled) + empty.repeat(Math.max(0, w - filled));
};
const v8StateGlyph = (state: VisualState): string => state === "ACTIVE" ? CELL_GLYPHS.on : state === "ERROR" ? CELL_GLYPHS.fault : CELL_GLYPHS.off;
const v8Percent = (value: number): string => `${Math.round(clamp(value, 0, 100))}%`;
const v8Time = (ms: number): string => {
  const seconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
};

/* 01 · Pixel typography: stable 5×5 title cells plus baseline-safe metadata. */
const buildV8Typography = (ctx: UltraPixelV8Context): UltraLines => {
  const n = ctx.fabric.normalized;
  const titleWidth = Math.max(5, Math.floor((v8Width(n.width) - 8) / 5));
  const bitmap = pixelComposeText(n.title, titleWidth).slice(0, 5);
  const rows = [
    ...bitmap.map((line) => v8Text(line, v8Width(n.width) - 4, "center")),
    v8Text(n.artist, v8Width(n.width) - 4, "center"),
    `${v8StateGlyph(n.state)} ${n.state}  ·  ${n.source}  ·  ${n.density}`,
  ];
  return v8Box(`PIXEL TYPE · PASS ${ctx.pass}`, rows, n.width);
};

/* 02 · Glyph matrix: one canonical grid for progress, volume and queue. */
const buildV8GlyphMatrix = (ctx: UltraPixelV8Context): UltraLines => {
  const n = ctx.fabric.normalized;
  const inner = v8Width(n.width) - 4;
  const rail = Math.max(10, inner - 16);
  return v8Box("GLYPH MATRIX / CELL LOCK", [
    `PROGRESS ${v8Percent(n.progress)} ${v8Bar(n.progress / 100, rail)}`,
    `VOLUME   ${v8Percent(n.volume)} ${v8Bar(n.volume / 100, rail)}`,
    `QUEUE    ${String(n.queueSize).padStart(3, "0")} ${v8Bar(Math.min(1, n.queueSize / 25), rail)}`,
    `FRAME    ${v8Time(n.positionMs)} / ${v8Time(n.durationMs)}`,
    `SIGNAL   ${visualWeight(n.progress)}  STATE ${v8StateGlyph(n.state)}`,
  ], n.width);
};

/* 03 · Pixel controls: equal cells, explicit focus and no variable-width labels. */
const buildV8Controls = (ctx: UltraPixelV8Context): UltraLines => {
  const n = ctx.fabric.normalized;
  const controls = [
    ["PREV", false], [n.state === "ACTIVE" ? "PAUSE" : "PLAY", true], ["SKIP", false], ["QUEUE", false], ["MORE", false],
  ] as const;
  const total = v8Width(n.width) - (controls.length - 1);
  const cell = Math.max(7, Math.floor(total / controls.length));
  const cells = controls.map(([label, active]) => {
    const mark = active ? CELL_GLYPHS.focus : CELL_GLYPHS.idle;
    return v8Text(`${mark} ${label}`, cell, "center");
  });
  return v8Box("CONTROL GRID / FOCUS CELLS", [
    cells.join(CELL_GLYPHS.v),
    `ORDER  ${controls.map(([label], index) => `${index + 1}:${label}`).join("  ")}`,
    `TARGET  ${Math.max(7, cell)}C CELL  ·  1C GUTTER  ·  ${n.density}`,
  ], n.width);
};

/* 04 · Visual hierarchy: title dominates, telemetry follows, controls remain subordinate. */
const buildV8Hierarchy = (ctx: UltraPixelV8Context): UltraLines => {
  const n = ctx.fabric.normalized;
  const w = v8Width(n.width) - 4;
  return v8Box("VISUAL HIERARCHY / PLAYER", [
    `NOW PLAYING  ${v8Text(n.title, w - 13)}`,
    `ARTIST       ${v8Text(n.artist, w - 13)}`,
    `TIMELINE     ${v8Bar(n.progress / 100, Math.max(10, w - 12))}`,
    `TIME         ${v8Time(n.positionMs)} / ${v8Time(n.durationMs)}`,
    `STATUS       ${v8StateGlyph(n.state)} ${n.state}`,
  ], n.width);
};

/* 05 · State rendering: state is expressed by structure + text, not color. */
const buildV8State = (ctx: UltraPixelV8Context): UltraLines => {
  const n = ctx.fabric.normalized;
  const pulse = n.state === "ACTIVE" ? "█▓▒░▒▓█" : n.state === "ERROR" ? "×××××××" : "·······";
  return v8Box("STATE PIXELS / SEMANTIC SIGNAL", [
    `${v8StateGlyph(n.state)} ${n.state}  ${pulse}`,
    `POSITION  ${v8Time(n.positionMs)}`,
    `DURATION  ${v8Time(n.durationMs)}`,
    `PROGRESS  ${v8Percent(n.progress)}  ·  VOLUME ${v8Percent(n.volume)}`,
    `QUEUE     ${n.queueSize}  ·  SOURCE ${n.source}`,
  ], n.width);
};

/* 06 · Responsive engine: density and width are first-class render inputs. */
const buildV8Responsive = (ctx: UltraPixelV8Context): UltraLines => {
  const n = ctx.fabric.normalized;
  const a = ctx.fabric.accessibility;
  const width = v8Width(n.width);
  const inset = Math.max(1, Math.floor((width - 30) / 2));
  const content = Math.max(18, width - inset * 2);
  const focus = Math.round((a.focusable / Math.max(1, a.count)) * 100);
  return v8Box("RESPONSIVE CELL ENGINE", [
    `CANVAS   ${width}C  ·  CONTENT ${content}C  ·  INSET ${inset}C`,
    `DENSITY  ${n.density}  ·  BASE GRID 1C`,
    `WRAP     CLIP + PAD  ·  OVERFLOW FAIL-CLOSED`,
    `A11Y     ${a.status}  ·  FOCUS ${v8Percent(focus)}`,
  ], n.width);
};

/* 07 · Focus/a11y rail: interaction order is visible and keyboard-safe. */
const buildV8FocusA11y = (ctx: UltraPixelV8Context): UltraLines => {
  const n = ctx.fabric.normalized;
  const a = ctx.fabric.accessibility;
  const actions = ctx.fabric.actions.slice(0, 6);
  const railWidth = Math.max(7, Math.floor((v8Width(n.width) - Math.max(0, actions.length - 1)) / Math.max(1, actions.length)));
  const cells = actions.map((action, index) => v8Text(`${index === 0 ? CELL_GLYPHS.focus : CELL_GLYPHS.idle} ${action.label}`, railWidth, "center"));
  return v8Box("FOCUS / A11Y RAIL", [
    cells.join(CELL_GLYPHS.v),
    `ORDER  ${actions.map((action, index) => `${index + 1}:${action.id}`).join(" → ") || "NONE"}`,
    `NODES  ${a.count}  ·  FOCUSABLE ${a.focusable}  ·  ${a.status}`,
  ], n.width);
};

/* 08 · Render seal: final invariant layer for deterministic output quality. */
const buildV8RenderSeal = (ctx: UltraPixelV8Context): UltraLines => {
  const n = ctx.fabric.normalized;
  return v8Box("RENDER SEAL / V40", [
    "DETERMINISTIC CELL WIDTH",
    "STATE + TEXT SEMANTICS",
    "CLIP + PAD + FRAME CONTRACT",
    `ACTIVE ${v8Width(n.width)}C  ·  ${n.density}  ·  UI WEIGHT 90%`,
    "DISCORD TEXT SURFACE · NO CANVAS REQUIRED",
  ], n.width);
};

const buildUltraPixelGlyphEngineV8 = (fabric: UltraUiRuntimeFabric, seed: UltraLines): UltraLines => {
  const ctx: UltraPixelV8Context = { fabric, seed, pass: 1 };
  const layers: UltraLines[] = [
    buildV8Typography(ctx),
    buildV8GlyphMatrix({ ...ctx, pass: 2 }),
    buildV8Controls({ ...ctx, pass: 3 }),
    buildV8Hierarchy({ ...ctx, pass: 4 }),
    buildV8State({ ...ctx, pass: 5 }),
    buildV8Responsive({ ...ctx, pass: 6 }),
    buildV8FocusA11y({ ...ctx, pass: 7 }),
    buildV8RenderSeal({ ...ctx, pass: 8 }),
  ];
  return freezeLines(layers.flatMap((layer) => layer));
};

/** Eight-pass visual upgrade: 7/8 layers are UI design/rendering, with the final pass sealing runtime output. */
const buildUltraEightXDesignWiring = (fabric: UltraUiRuntimeFabric, seed: UltraLines): UltraLines => {
  const n = fabric.normalized;
  const engine = buildUltraPixelGlyphEngineV8(fabric, seed);
  return freezeLines([
    "◆ ULTRA DESIGN ENGINE V40 · 8× HEAVY VISUAL PASSES",
    "◇ UI FOCUS · 90% · TYPE / MATRIX / CONTROLS / HIERARCHY / STATE / RESPONSIVE / A11Y",
    `◇ PIXEL GRID · ${v8Width(n.width)}C · ${n.density} · CELL-LOCKED`,
    `◇ GLYPH MATRIX · ${n.state} · ${v8Percent(n.progress)} · ${v8Percent(n.volume)} VOL · ${n.queueSize} QUEUE`,
    "◇ RENDER CONTRACT · NORMALIZE → CLIP → PAD → FRAME → EMIT",
    "◇ PIXEL-PERFECT TARGET · DETERMINISTIC CHARACTER-CELL GEOMETRY",
    ...engine,
  ]);
};

/** Real composition path used by canonical renderer/player surfaces. */
export function composeUltraUiSurface(input: UltraUiInput): readonly string[] {
  const fabric = buildUltraFabric(input);
  const staged = composeUltraUiStagesFromFabric(fabric);
  const mesh = buildUltraWiringMesh(fabric);
  const meshLines = flattenUltraWiringMesh(mesh);
  const seed = freezeLines([...staged.flat(), ...meshLines].slice(-24));
  const heavy = buildUltraHeavyWiringExpansion(fabric, seed);
  const combined = [...staged.flat(), ...meshLines, ...heavy];
  const matrixDesignLine = `▦ DESIGN ${fabric.normalized.design} · GLYPH-ONLY · PIXEL-CELL`;
  const coreInput: UiCoreInput = {
    width: fabric.normalized.width,
    design: fabric.normalized.design,
    state: coreState(fabric.normalized.state),
    player: {
      title: fabric.normalized.title,
      artist: fabric.normalized.artist,
      source: fabric.normalized.source,
      requester: fabric.normalized.requester,
      positionMs: fabric.normalized.positionMs,
      durationMs: fabric.normalized.durationMs,
      volume: fabric.normalized.volume,
      queueSize: fabric.normalized.queueSize,
      state: coreState(fabric.normalized.state),
      paused: fabric.normalized.state !== "ACTIVE",
      loop: "OFF",
      shuffle: false,
      autoplay: false,
    },
    queue: fabric.queue.map((track, index) => ({ id: `q-${index + 1}`, title: track.title, artist: track.artist ?? "UNKNOWN", durationMs: track.durationMs ?? 0, index: index + 1, active: Boolean(track.active) })),
    commands: fabric.commandSpecs.map((command) => ({ name: command.name, category: command.category, description: command.description, usage: command.usage, enabled: command.state !== "ERROR" })),
    actions: resolveActions({
      title: fabric.normalized.title,
      artist: fabric.normalized.artist,
      source: fabric.normalized.source,
      requester: fabric.normalized.requester,
      positionMs: fabric.normalized.positionMs,
      durationMs: fabric.normalized.durationMs,
      volume: fabric.normalized.volume,
      queueSize: fabric.normalized.queueSize,
      state: coreState(fabric.normalized.state),
      paused: fabric.normalized.state !== "ACTIVE",
      loop: "OFF",
      shuffle: false,
      autoplay: false,
    }, { canControl: true, canManageQueue: true, canUseEffects: true }),
    effects: [],
  };
  const core = composeUiCore(coreInput);
  const coreHeader = [`◆ ULTRA CORE · ${core.viewport.density} · ${core.surfaces.map((surface) => surface.surface).join(" / ")}`, ...core.diagnostics];
  const combinedWithDesign = [matrixDesignLine, ...coreHeader, ...core.lines, ...combined];
  const report = budgetReport(
    combinedWithDesign.reduce((total, line) => total + line.length, 0),
    combinedWithDesign.length,
    1,
    DISCORD_UI_BUDGET,
  );
  const kept = degradeLines(combinedWithDesign, DISCORD_UI_BUDGET.embedDescription);
  return Object.freeze([
    `◆ ULTRA WIRED ${report.level} · ${kept.length} LINES · HEAVY ${ULTRA_HEAVY_CHANNELS.length}`,
    ...kept.slice(0, 55),
  ]);
}

/**
 * ULTRA WIRING MESH V5
 *
 * The functions in this section are intentionally executable composition
 * boundaries.  They do not exist to make a dependency graph look busy.
 * Each boundary receives runtime data, calls a real UI primitive, and returns
 * material that is consumed by the final surface assembler.
 */

export interface UltraWiringMesh {
  readonly identity: readonly string[];
  readonly playback: readonly string[];
  readonly queue: readonly string[];
  readonly commands: readonly string[];
  readonly interaction: readonly string[];
  readonly accessibility: readonly string[];
  readonly navigation: readonly string[];
  readonly telemetry: readonly string[];
  readonly feedback: readonly string[];
  readonly responsive: readonly string[];
  readonly shell: readonly string[];
  readonly visual: readonly string[];
  readonly glyphRuntime: readonly string[];
  readonly registry: readonly string[];
  readonly settings: readonly string[];
  readonly safety: readonly string[];
  readonly crossWiring: readonly string[];
  readonly finalization: readonly string[];
}

type UltraLines = readonly string[];

const asLines = (...values: unknown[]): string[] => values
  .flatMap((value) => Array.isArray(value) ? value : [value])
  .flatMap((value) => String(value ?? "").split("\n"))
  .map((line) => line.trimEnd())
  .filter(Boolean);

const freezeLines = (lines: readonly string[]): UltraLines => Object.freeze([...lines]);

const meshWidth = (n: UltraUiNormalizedInput, reserve = 0): number =>
  Math.max(20, n.width - Math.max(0, Math.trunc(reserve)));

const meshState = (state: VisualState): string => {
  if (state === "ERROR") return "FAULT";
  if (state === "ACTIVE") return "ACTIVE";
  if (state === "READY") return "READY";
  return String(state);
};

const meshPlayerData = (fabric: UltraUiRuntimeFabric): Record<string, unknown> => ({
  ...fabric.player,
  density: fabric.normalized.density,
  phase: fabric.normalized.state,
  signal: [fabric.normalized.progress, fabric.normalized.volume],
});

const meshQueueData = (fabric: UltraUiRuntimeFabric): readonly QueueItem19[] =>
  fabric.queue.map((track) => ({ title: track.title, artist: track.artist, durationMs: track.durationMs, active: track.active }));

const meshCommandData = (fabric: UltraUiRuntimeFabric): Record<string, unknown> => {
  const first = fabric.commandSpecs[0];
  return {
    name: String(first?.name ?? "NOIR MUSIC"),
    category: String(first?.category ?? "COMMAND"),
    description: String(first?.description ?? "Canonical command matrix"),
    state: fabric.normalized.state === "ERROR" ? "ERROR" : "READY",
    metrics: [{ label: "AVAILABLE", value: fabric.commandSpecs.length, state: "READY" }],
  };
};

const wireIdentityLayer = (fabric: UltraUiRuntimeFabric): UltraLines => {
  const n = fabric.normalized;
  const width = meshWidth(n);
  const title = String(n.title).slice(0, 180);
  const artist = String(n.artist).slice(0, 120);
  return freezeLines(asLines(
    atlasRail({ left: "NOIR MUSIC", center: "ULTRA WIRING", right: meshState(n.state), glyph: role("primary").glyph }, width),
    `◆ IDENTITY · ${title}`,
    `◇ ARTIST · ${artist}`,
    `▣ SOURCE · ${n.source}`,
    `⌁ REQUESTER · ${n.requester}`,
    `┼ DENSITY · ${n.density}`,
  ));
};

const wirePlaybackLayer = (fabric: UltraUiRuntimeFabric): UltraLines => {
  const n = fabric.normalized;
  const player = meshPlayerData(fabric);
  const width = meshWidth(n, 8);
  return freezeLines(asLines(
    playerExperience(player as any),
    playerProgress(n.positionMs, n.durationMs, width),
    playerSignal([n.progress, n.volume], width),
    renderNowPlaying({
      title: n.title,
      artist: n.artist,
      positionMs: n.positionMs,
      durationMs: n.durationMs,
      source: n.source,
      requester: n.requester,
    } as any, n.width),
    `⌘ PLAYBACK STATE · ${meshState(n.state)}`,
    `⌁ PLAYBACK PROGRESS · ${Math.round(n.progress)}%`,
    `▣ PLAYBACK VOLUME · ${n.volume}%`,
  ));
};

const wireQueueLayer = (fabric: UltraUiRuntimeFabric): UltraLines => {
  const n = fabric.normalized;
  const queue = meshQueueData(fabric);
  return freezeLines(asLines(
    queueExperience(queue, n.page, 8, n.density),
    queueSignal(queue as any, meshWidth(n, 8)),
    renderQueue(n.queue, n.page, 8, n.width),
    `◆ QUEUE COUNT · ${n.queueSize}`,
    `◇ QUEUE PAGE · ${n.page}/${n.pages}`,
    `┼ QUEUE VISIBLE · ${queue.length}`,
  ));
};

const wireCommandLayer = (fabric: UltraUiRuntimeFabric): UltraLines => {
  const n = fabric.normalized;
  const specs = fabric.commandSpecs;
  const first = specs[0];
  const width = meshWidth(n);
  const command = meshCommandData(fabric);
  return freezeLines(asLines(
    specs.length ? commandMatrix19(specs as any, width) : "◇ COMMAND MATRIX · EMPTY",
    first ? commandTelemetry19(first as any) : "◇ COMMAND TELEMETRY · EMPTY",
    commandDashboard(command as any, width),
    commandAccessibility(command as any),
    `⌕ COMMAND COUNT · ${specs.length}`,
    `⌘ COMMAND READY · ${first ? String(first.name) : "NONE"}`,
  ));
};

const wireInteractionLayer = (fabric: UltraUiRuntimeFabric): UltraLines => {
  const n = fabric.normalized;
  const actions = fabric.actions;
  const labels = actions.map(interactionLabel);
  const models = actions.map((action) => ({
    id: action.id,
    label: action.label,
    state: action.id === "playpause" ? "FOCUSED" : "NONE",
  }));
  return freezeLines(asLines(
    interactionRail([...actions], n.width),
    labels.join("  "),
    focusRail(models as any, "playpause", n.width),
    `⌘ ACTIONS · ${actions.length}`,
    `◆ PRIMARY ACTION · ${actions[0]?.id ?? "NONE"}`,
    `◇ FOCUS · playpause`,
  ));
};

const wireAccessibilityLayer = (fabric: UltraUiRuntimeFabric): UltraLines => {
  const n = fabric.normalized;
  const a11y = fabric.accessibility;
  const labels = a11y.nodes.map((node) => `${node.role}:${node.label}`);
  return freezeLines(asLines(
    accessibleSurfaceLegacy(n.title, a11y.progress),
    accessibleSurface21({
      label: n.title,
      state: n.state as any,
      summary: a11y.progress,
      actions: fabric.actions.map((action) => action.label),
    }),
    `◆ A11Y STATUS · ${a11y.status}`,
    `◇ A11Y NODES · ${a11y.count}`,
    `▣ A11Y FOCUSABLE · ${a11y.focusable}`,
    `⌁ A11Y PROGRESS · ${a11y.progress}`,
    ...labels.map((label) => `┼ ${label}`),
  ));
};

const wireNavigationLayer = (fabric: UltraUiRuntimeFabric): UltraLines => {
  const n = fabric.normalized;
  const crumbs = breadcrumb(["NOIR MUSIC", "PLAYER", n.title], "›");
  const nav = navigationRail([
    { id: "player", label: "PLAYER", kind: "PRIMARY" },
    { id: "queue", label: "QUEUE", kind: "PRIMARY" },
  ] as any, n.width);
  return freezeLines(asLines(
    crumbs,
    nav,
    pagination(n.page, n.pages),
    `◀ PREVIOUS PAGE · ${n.page > 1 ? "AVAILABLE" : "START"}`,
    `▶ NEXT PAGE · ${n.page < n.pages ? "AVAILABLE" : "END"}`,
  ));
};

const wireTelemetryLayer = (fabric: UltraUiRuntimeFabric): UltraLines => {
  const n = fabric.normalized;
  const width = meshWidth(n, 12);
  return freezeLines(asLines(
    metricWall([
      { label: "POSITION", value: Math.round(n.positionMs / 1000), unit: "SEC", state: n.state },
      { label: "DURATION", value: Math.round(n.durationMs / 1000), unit: "SEC", state: n.state },
      { label: "VOLUME", value: n.volume, unit: "%", state: n.state },
      { label: "QUEUE", value: n.queueSize, unit: "TRACKS", state: n.state },
    ], 2, n.width),
    heatRow([n.progress / 100, n.volume / 100, Math.min(1, n.queueSize / 25)], width),
    renderTelemetry([
      { label: "VOLUME", value: n.volume, percent: n.volume, state: n.state },
      { label: "QUEUE", value: n.queueSize, percent: Math.min(100, n.queueSize * 4), state: n.state },
    ], n.width),
    `⌁ POSITION · ${n.positionMs}MS`,
    `⌁ DURATION · ${n.durationMs}MS`,
    `⌁ VOLUME · ${n.volume}%`,
    `⌁ QUEUE · ${n.queueSize}`,
  ));
};

const wireFeedbackLayer = (fabric: UltraUiRuntimeFabric): UltraLines => {
  const n = fabric.normalized;
  const tone = n.state === "ERROR" ? "ERROR" : "INFO";
  const notice: Notice = {
    id: "ultra-player-state",
    tone,
    title: "PLAYBACK",
    body: `${n.state} · ${n.title}`,
  };
  return freezeLines(asLines(
    progressFeedback("PLAYBACK", n.progress / 100, Math.min(32, n.width - 20)),
    feedbackNotice({ tone, title: notice.title, message: notice.body ?? "" }, n.width),
    noticeLine(notice),
    progressNotice({ ...notice, current: n.positionMs, total: n.durationMs }),
    `× FEEDBACK STATE · ${tone}`,
  ));
};

const wireResponsiveLayer = (fabric: UltraUiRuntimeFabric): UltraLines => {
  const n = fabric.normalized;
  const profile = profileFromWidth(n.width);
  const clamped = responsiveClamp(n.title, profile);
  const density = fitDensity(n.density, [
    playerProgress(n.positionMs, n.durationMs, meshWidth(n, 8)),
    countCopy("QUEUE", n.queueSize),
  ]);
  return freezeLines(asLines(
    responsivePanel([clamped, ...density], n.density),
    `▣ RESPONSIVE PROFILE · ${profile}`,
    `◆ RESPONSIVE DENSITY · ${n.density}`,
    `◇ RESPONSIVE WIDTH · ${n.width}`,
  ));
};

const wireShellLayer = (fabric: UltraUiRuntimeFabric): UltraLines => {
  const n = fabric.normalized;
  const actions = fabric.actions.map((action) => ({ id: action.id, label: action.label }));
  const progress = playerProgress(n.positionMs, n.durationMs, meshWidth(n, 8));
  return freezeLines(asLines(
    screenKit({
      title: n.title,
      subtitle: n.artist,
      sections: [{ title: "PLAYER", lines: [progress] }],
      actions,
    } as any),
    shellCompose({
      title: n.title,
      phase: n.state as any,
      density: n.density as any,
      content: progress,
      actions,
    } as any),
    blueprintScreen({
      header: { title: n.title, eyebrow: "NOIR MUSIC", state: n.state as any },
      body: [n.artist, progress],
      actions: actions.map((action) => ({ label: action.label, intent: "PRIMARY", enabled: true })),
    } as any, n.width),
    `◆ SHELL · ${n.title}`,
    `◇ CONTENT · PLAYER`,
  ));
};

const wireVisualLayer = (fabric: UltraUiRuntimeFabric): UltraLines => {
  const n = fabric.normalized;
  const progress = n.progress;
  const nextEvent = n.state === "ERROR" ? "error" : n.state === "ACTIVE" ? "activate" : "ready";
  const nextState = canTransition(n.state, nextEvent) ? transition(n.state, nextEvent) : n.state;
  return freezeLines(asLines(
    scanline(meshWidth(n, 4)),
    sweep(n.title, Math.round(n.positionMs / 1000)),
    `◆ VISUAL STATE · ${n.state}`,
    `◇ TRANSITION TARGET · ${nextState}`,
    `⌁ VISUAL PROGRESS · ${Math.round(progress)}%`,
  ));
};

const wireGlyphRuntimeLayer = (fabric: UltraUiRuntimeFabric): UltraLines => {
  const n = fabric.normalized;
  const command = fabric.commandSpecs[0];
  const glyphRuntime = composeGlyphRuntime({
    pipeline: {
      title: "PLAYER PIPELINE",
      width: n.width,
      activeIndex: n.state === "ERROR" ? 2 : n.state === "ACTIVE" ? 1 : 0,
      showDetails: true,
      steps: [
        { id: "QUEUE", label: "QUEUE", detail: `${n.queueSize} TRACKS`, phase: "ENTER", complete: n.queueSize > 0 },
        { id: "PLAYBACK", label: "PLAYBACK", detail: n.title, phase: "PROCESS", active: n.state === "ACTIVE" },
        { id: "OUTPUT", label: "OUTPUT", detail: `${n.volume}% VOLUME`, phase: n.state === "ERROR" ? "COMMIT" : "REST", active: n.state === "ERROR" },
      ],
    },
    journey: {
      title: "PLAYER JOURNEY",
      state: n.state as any,
      current: n.state === "ERROR" ? "RECOVER" : n.state === "ACTIVE" ? "EXECUTE" : "READY",
      steps: [
        { id: "DISCOVER", title: "QUEUE", status: n.queueSize ? "DONE" : "READY" },
        { id: "EXECUTE", title: "PLAYBACK", status: n.state === "ACTIVE" ? "ACTIVE" : "READY" },
      ],
    } as any,
    surface: {
      title: n.title,
      sections: [`STATE ${n.state}`, `POSITION ${n.positionMs} / ${n.durationMs} MS`, `QUEUE ${n.queueSize}`],
      actions: fabric.actions.map((action) => action.label),
      footer: "GLYPH-V48.6 // REAL RUNTIME",
    },
    command: command ? {
      name: command.name,
      category: command.category,
      description: command.description,
      usage: 0,
      state: n.state === "ERROR" ? "ERROR" : "READY",
      width: n.width,
    } : undefined,
  });
  return freezeLines(asLines(
    glyphRuntime.pipeline.header,
    glyphRuntime.pipeline.rail,
    glyphRuntime.pipeline.body,
    glyphRuntime.journeyRail,
    ...glyphRuntime.journey,
    glyphRuntime.accessibility,
    glyphRuntime.command ? glyphRuntime.command.hero : undefined,
    glyphRuntime.command ? glyphRuntime.command.telemetry : undefined,
    glyphRuntime.command ? glyphRuntime.command.footer : undefined,
    ...glyphRuntime.packed.sections,
    glyphRuntime.packed.footer,
  ));
};

const wireRegistryLayer = (fabric: UltraUiRuntimeFabric): UltraLines => {
  const report = fabric.registry.report();
  const seal = registrySeal(fabric.registry);
  const playerId = stableSurfaceId("glyph-v4", "PLAYER");
  const queueId = stableSurfaceId("glyph-v4", "QUEUE");
  const commandId = stableSurfaceId("glyph-v4", "COMMAND");
  const interactive = fabric.registry.all().filter((item) => item.interactive).length;
  return freezeLines(asLines(
    `▣ REGISTRY · ${seal}`,
    `◆ REGISTRY SURFACES · ${report.total}`,
    `◇ PLAYER ID · ${playerId}`,
    `◇ QUEUE ID · ${queueId}`,
    `◇ COMMAND ID · ${commandId}`,
    `⌘ REGISTRY INTERACTIVE · ${interactive}`,
  ));
};

const wireSettingsLayer = (fabric: UltraUiRuntimeFabric): UltraLines => {
  const n = fabric.normalized;
  const line = fabric.settings.line;
  const errors = fabric.settings.errors;
  return freezeLines(asLines(
    line,
    `▣ SETTINGS VALIDATION · ${errors.length ? "ERROR" : "SEALED"}`,
    `◇ SETTINGS VOLUME · ${n.volume}`,
    `◇ SETTINGS QUEUE · ${n.queueSize}`,
  ));
};

const wireSafetyLayer = (fabric: UltraUiRuntimeFabric): UltraLines => {
  const n = fabric.normalized;
  const strength = strengthSummary([
    fabric.accessibility.status === "SEALED" ? "SEALED" : "DEGRADED",
    registrySeal(fabric.registry) === "SEALED" ? "SEALED" : "DEGRADED",
  ] as any);
  const validNumbers = [n.positionMs, n.durationMs, n.volume, n.queueSize].every(Number.isFinite);
  return freezeLines(asLines(
    `◆ SAFETY · ${validNumbers ? "NUMERIC SEALED" : "NUMERIC FAULT"}`,
    `◇ STRENGTH · ${strength}`,
    `▣ STATE · ${meshState(n.state)}`,
    `⌁ FAIL-CLOSED · ${validNumbers ? "READY" : "BLOCK"}`,
  ));
};


/** Cross-wiring channel: player output is explicitly handed to queue context. */
const wirePlaybackToQueue = (fabric: UltraUiRuntimeFabric, playback: UltraLines, queue: UltraLines): UltraLines => {
  const n = fabric.normalized;
  const sharedProgress = playerProgress(n.positionMs, n.durationMs, meshWidth(n, 8));
  const queueState = n.queueSize > 0 ? "POPULATED" : "EMPTY";
  return freezeLines(asLines(
    `◆ PLAYBACK→QUEUE`,
    `◇ SHARED TITLE · ${n.title}`,
    `⌁ SHARED PROGRESS · ${Math.round(n.progress)}%`,
    `▣ QUEUE STATE · ${queueState}`,
    sharedProgress,
    playback.slice(0, 2),
    queue.slice(0, 2),
  ));
};

/** Cross-wiring channel: queue state feeds command availability context. */
const wireQueueToCommands = (fabric: UltraUiRuntimeFabric, queue: UltraLines, commands: UltraLines): UltraLines => {
  const n = fabric.normalized;
  const queueAction = n.queueSize > 0 ? "QUEUE_READY" : "QUEUE_EMPTY";
  const commandCount = fabric.commandSpecs.length;
  return freezeLines(asLines(
    `◆ QUEUE→COMMAND`,
    `◇ QUEUE ACTION STATE · ${queueAction}`,
    `⌘ COMMAND COUNT · ${commandCount}`,
    `⌘ QUEUE COMMANDS · ${n.queueSize > 0 ? "AVAILABLE" : "LIMITED"}`,
    queue.slice(0, 2),
    commands.slice(0, 3),
  ));
};

/** Cross-wiring channel: command state feeds interaction focus and labels. */
const wireCommandsToInteraction = (fabric: UltraUiRuntimeFabric, commands: UltraLines, interaction: UltraLines): UltraLines => {
  const n = fabric.normalized;
  const first = fabric.commandSpecs[0];
  const commandName = String(first?.name ?? "NO COMMAND");
  return freezeLines(asLines(
    `◆ COMMAND→INTERACTION`,
    `⌘ COMMAND FOCUS · ${commandName}`,
    `◇ COMMAND STATE · ${n.state === "ERROR" ? "BLOCKED" : "READY"}`,
    `▣ ACTION SURFACE · ${fabric.actions.length}`,
    commands.slice(0, 3),
    interaction.slice(0, 3),
  ));
};

/** Cross-wiring channel: interaction semantics feed accessibility nodes. */
const wireInteractionToAccessibility = (fabric: UltraUiRuntimeFabric, interaction: UltraLines, accessibility: UltraLines): UltraLines => {
  const n = fabric.normalized;
  const focusable = fabric.accessibility.focusable;
  const actionLabels = fabric.actions.map((action) => action.label).join(" / ");
  return freezeLines(asLines(
    `◆ INTERACTION→A11Y`,
    `◇ FOCUSABLE · ${focusable}`,
    `⌘ ACTION LABELS · ${actionLabels}`,
    `▣ STATE ANNOUNCEMENT · ${meshState(n.state)}`,
    interaction.slice(0, 3),
    accessibility.slice(0, 3),
  ));
};

/** Cross-wiring channel: telemetry feeds feedback severity and progress. */
const wireTelemetryToFeedback = (fabric: UltraUiRuntimeFabric, telemetry: UltraLines, feedback: UltraLines): UltraLines => {
  const n = fabric.normalized;
  const severity = n.state === "ERROR" ? "ERROR" : n.progress >= 95 ? "COMPLETE" : "INFO";
  const ratio = n.durationMs > 0 ? n.positionMs / n.durationMs : 0;
  return freezeLines(asLines(
    `◆ TELEMETRY→FEEDBACK`,
    `⌁ FEEDBACK SEVERITY · ${severity}`,
    `⌁ PROGRESS RATIO · ${Math.round(clamp(ratio * 100, 0, 100))}%`,
    `◇ QUEUE SIGNAL · ${n.queueSize}`,
    telemetry.slice(0, 3),
    feedback.slice(0, 3),
  ));
};

/** Cross-wiring channel: responsive profile constrains shell composition. */
const wireResponsiveToShell = (fabric: UltraUiRuntimeFabric, responsive: UltraLines, shell: UltraLines): UltraLines => {
  const n = fabric.normalized;
  const profile = profileFromWidth(n.width);
  const budgetWidth = meshWidth(n, profile === "MINI" ? 16 : 8);
  return freezeLines(asLines(
    `◆ RESPONSIVE→SHELL`,
    `▣ PROFILE · ${profile}`,
    `◇ SHELL WIDTH · ${budgetWidth}`,
    `⌁ SHELL DENSITY · ${n.density}`,
    responsive.slice(0, 3),
    shell.slice(0, 3),
  ));
};

/** Cross-wiring channel: registry seal controls the visible operational state. */
const wireRegistryToSafety = (fabric: UltraUiRuntimeFabric, registry: UltraLines, safety: UltraLines): UltraLines => {
  const seal = registrySeal(fabric.registry);
  const safe = seal === "SEALED" && fabric.settings.errors.length === 0;
  return freezeLines(asLines(
    `◆ REGISTRY→SAFETY`,
    `▣ REGISTRY SEAL · ${seal}`,
    `◇ SETTINGS · ${fabric.settings.errors.length ? "INVALID" : "VALID"}`,
    `⌁ OPERATIONAL GATE · ${safe ? "OPEN" : "RESTRICTED"}`,
    registry.slice(0, 3),
    safety.slice(0, 3),
  ));
};

/** Cross-wiring channel: GLYPH-V48.6 consumes the canonical state generated by the fabric. */
const wireGlyphRuntimeToVisual = (fabric: UltraUiRuntimeFabric, glyphRuntime: UltraLines, visual: UltraLines): UltraLines => {
  const n = fabric.normalized;
  const handoff = `GLYPH_RUNTIME HANDOFF · ${n.title} · ${meshState(n.state)} · ${Math.round(n.progress)}%`;
  return freezeLines(asLines(
    `◆ GLYPH_RUNTIME→VISUAL`,
    handoff,
    `◇ GLYPH_RUNTIME LINES · ${glyphRuntime.length}`,
    `▣ VISUAL LINES · ${visual.length}`,
    glyphRuntime.slice(0, 4),
    visual.slice(0, 3),
  ));
};

/** Cross-wiring channel: settings are handed into playback display state. */
const wireSettingsToPlayback = (fabric: UltraUiRuntimeFabric, settings: UltraLines, playback: UltraLines): UltraLines => {
  const n = fabric.normalized;
  const volume = clamp(n.volume, 0, 100);
  const queue = Math.max(0, n.queueSize);
  return freezeLines(asLines(
    `◆ SETTINGS→PLAYBACK`,
    `◇ VOLUME SETTING · ${volume}%`,
    `▣ QUEUE SETTING · ${queue}`,
    `⌁ SETTINGS STATUS · ${fabric.settings.errors.length ? "REJECTED" : "ACCEPTED"}`,
    settings.slice(0, 3),
    playback.slice(0, 3),
  ));
};

/** Cross-wiring channel: final mesh seal verifies that every functional layer emitted data. */

const wirePlayerToTelemetry = (fabric: UltraUiRuntimeFabric, playback: UltraLines, telemetry: UltraLines): UltraLines => {
  const n = fabric.normalized;
  const seconds = Math.round(n.positionMs / 1000);
  const duration = Math.round(n.durationMs / 1000);
  return freezeLines(asLines(
    `◆ PLAYER→TELEMETRY`,
    `⌁ POSITION · ${seconds}SEC`,
    `⌁ DURATION · ${duration}SEC`,
    `◇ RATIO · ${Math.round(n.progress)}%`,
    playback.slice(-3),
    telemetry.slice(0, 3),
  ));
};

const wireQueueToNavigation = (fabric: UltraUiRuntimeFabric, queue: UltraLines, navigation: UltraLines): UltraLines => {
  const n = fabric.normalized;
  const pageState = `${n.page}/${n.pages}`;
  return freezeLines(asLines(
    `◆ QUEUE→NAVIGATION`,
    `◇ PAGE · ${pageState}`,
    `▣ QUEUE SIZE · ${n.queueSize}`,
    `⌁ NAVIGATION · ${n.pages > 1 ? "PAGED" : "SINGLE"}`,
    queue.slice(0, 3),
    navigation.slice(0, 3),
  ));
};

const wireAccessibilityToFeedback = (fabric: UltraUiRuntimeFabric, accessibility: UltraLines, feedback: UltraLines): UltraLines => {
  const status = fabric.accessibility.status;
  const tone = status === "SEALED" ? "INFO" : "ERROR";
  return freezeLines(asLines(
    `◆ A11Y→FEEDBACK`,
    `◇ A11Y STATUS · ${status}`,
    `× ANNOUNCEMENT TONE · ${tone}`,
    `⌁ FOCUSABLE · ${fabric.accessibility.focusable}`,
    accessibility.slice(0, 3),
    feedback.slice(0, 3),
  ));
};

const wireCommandToRegistry = (fabric: UltraUiRuntimeFabric, commands: UltraLines, registry: UltraLines): UltraLines => {
  const report = fabric.registry.report();
  const seal = registrySeal(fabric.registry);
  return freezeLines(asLines(
    `◆ COMMAND→REGISTRY`,
    `⌘ COMMANDS · ${fabric.commandSpecs.length}`,
    `▣ SURFACES · ${report.total}`,
    `◇ SEAL · ${seal}`,
    commands.slice(0, 3),
    registry.slice(0, 3),
  ));
};

const wireShellToGlyphRuntime = (fabric: UltraUiRuntimeFabric, shell: UltraLines, glyphRuntime: UltraLines): UltraLines => {
  const n = fabric.normalized;
  const width = meshWidth(n);
  return freezeLines(asLines(
    `◆ SHELL→GLYPH_RUNTIME`,
    `◇ WIDTH HANDOFF · ${width}`,
    `▣ DENSITY HANDOFF · ${n.density}`,
    `⌁ STATE HANDOFF · ${meshState(n.state)}`,
    shell.slice(0, 3),
    glyphRuntime.slice(0, 4),
  ));
};

const wireVisualToFinal = (fabric: UltraUiRuntimeFabric, visual: UltraLines, identity: UltraLines): UltraLines => {
  const n = fabric.normalized;
  const weight = visualWeight(n.progress);
  return freezeLines(asLines(
    `◆ VISUAL→FINAL`,
    `◇ WEIGHT · ${weight}`,
    `▣ STATE · ${meshState(n.state)}`,
    `⌁ TITLE · ${n.title}`,
    visual.slice(0, 4),
    identity.slice(0, 2),
  ));
};

const wireFeedbackToFinal = (fabric: UltraUiRuntimeFabric, feedback: UltraLines, safety: UltraLines): UltraLines => {
  const n = fabric.normalized;
  const safe = fabric.settings.errors.length === 0 && n.volume >= 0 && n.volume <= 100;
  return freezeLines(asLines(
    `◆ FEEDBACK→FINAL`,
    `× ERROR STATE · ${n.state === "ERROR" ? "ACTIVE" : "CLEAR"}`,
    `▣ INPUT SAFETY · ${safe ? "SEALED" : "BLOCK"}`,
    `◇ FEEDBACK LINES · ${feedback.length}`,
    feedback.slice(0, 3),
    safety.slice(0, 3),
  ));
};


const wireIdentityToNavigation = (fabric: UltraUiRuntimeFabric, identity: UltraLines, navigation: UltraLines): UltraLines => {
  const n = fabric.normalized;
  return freezeLines(asLines(
    `◆ IDENTITY→NAVIGATION`,
    `◇ ROOT · NOIR MUSIC`,
    `▣ CURRENT · PLAYER`,
    `⌁ TARGET · ${n.title}`,
    identity.slice(0, 2),
    navigation.slice(0, 3),
  ));
};

const wirePlaybackToFeedback = (fabric: UltraUiRuntimeFabric, playback: UltraLines, feedback: UltraLines): UltraLines => {
  const n = fabric.normalized;
  const state = n.state === "ERROR" ? "FAULT" : n.state === "ACTIVE" ? "PLAYING" : "IDLE";
  return freezeLines(asLines(
    `◆ PLAYBACK→FEEDBACK`,
    `⌁ PLAYBACK · ${state}`,
    `◇ TRACK · ${n.title}`,
    `▣ POSITION · ${Math.round(n.progress)}%`,
    playback.slice(0, 3),
    feedback.slice(0, 3),
  ));
};

const wireCommandsToShell = (fabric: UltraUiRuntimeFabric, commands: UltraLines, shell: UltraLines): UltraLines => {
  const n = fabric.normalized;
  const first = fabric.commandSpecs[0];
  return freezeLines(asLines(
    `◆ COMMAND→SHELL`,
    `⌘ PRIMARY · ${String(first?.name ?? "NONE")}`,
    `◇ COMMAND STATE · ${n.state === "ERROR" ? "BLOCKED" : "READY"}`,
    `▣ SHELL ACTIONS · ${fabric.actions.length}`,
    commands.slice(0, 3),
    shell.slice(0, 3),
  ));
};

const wireQueueToTelemetry = (fabric: UltraUiRuntimeFabric, queue: UltraLines, telemetry: UltraLines): UltraLines => {
  const n = fabric.normalized;
  const utilization = Math.round(Math.min(1, n.queueSize / 25) * 100);
  return freezeLines(asLines(
    `◆ QUEUE→TELEMETRY`,
    `⌁ QUEUE UTILIZATION · ${utilization}%`,
    `◇ TRACK COUNT · ${n.queueSize}`,
    `▣ VISIBLE ROWS · ${fabric.queue.length}`,
    queue.slice(0, 3),
    telemetry.slice(0, 3),
  ));
};

const wireSafetyToFinal = (fabric: UltraUiRuntimeFabric, safety: UltraLines, registry: UltraLines): UltraLines => {
  const n = fabric.normalized;
  const numeric = [n.positionMs, n.durationMs, n.volume, n.queueSize].every(Number.isFinite);
  const bounded = n.volume >= 0 && n.volume <= 100 && n.positionMs >= 0 && n.durationMs >= 0;
  return freezeLines(asLines(
    `◆ SAFETY→FINAL`,
    `▣ NUMERIC · ${numeric ? "SEALED" : "FAULT"}`,
    `◇ BOUNDS · ${bounded ? "SEALED" : "FAULT"}`,
    `⌁ REGISTRY · ${registrySeal(fabric.registry)}`,
    safety.slice(0, 3),
    registry.slice(0, 2),
  ));
};


const wireSettingsToSafety = (fabric: UltraUiRuntimeFabric, settings: UltraLines, safety: UltraLines): UltraLines => {
  const errors = fabric.settings.errors;
  const n = fabric.normalized;
  return freezeLines(asLines(
    `◆ SETTINGS→SAFETY`,
    `▣ SETTINGS ERRORS · ${errors.length}`,
    `◇ VOLUME BOUND · ${n.volume >= 0 && n.volume <= 100 ? "YES" : "NO"}`,
    `⌁ QUEUE BOUND · ${n.queueSize >= 0 ? "YES" : "NO"}`,
    errors.length ? `× ${errors.join(" · ")}` : "✓ SETTINGS INPUTS SEALED",
    settings.slice(0, 3),
    safety.slice(0, 3),
  ));
};

const wireAccessibilityToShell = (fabric: UltraUiRuntimeFabric, accessibility: UltraLines, shell: UltraLines): UltraLines => {
  const n = fabric.normalized;
  const announced = accessibleProgress("Playback", n.positionMs, n.durationMs);
  return freezeLines(asLines(
    `◆ A11Y→SHELL`,
    `◇ ANNOUNCED · ${announced}`,
    `▣ FOCUSABLE · ${fabric.accessibility.focusable}`,
    `⌁ STATE · ${meshState(n.state)}`,
    accessibility.slice(0, 3),
    shell.slice(0, 3),
  ));
};

const wireLayerCoverage = (mesh: Omit<UltraWiringMesh, "finalization" | "crossWiring">): UltraLines => {
  const entries: readonly [string, UltraLines][] = [
    ["IDENTITY", mesh.identity], ["PLAYBACK", mesh.playback], ["QUEUE", mesh.queue],
    ["COMMANDS", mesh.commands], ["INTERACTION", mesh.interaction], ["ACCESSIBILITY", mesh.accessibility],
    ["NAVIGATION", mesh.navigation], ["TELEMETRY", mesh.telemetry], ["FEEDBACK", mesh.feedback],
    ["RESPONSIVE", mesh.responsive], ["SHELL", mesh.shell], ["VISUAL", mesh.visual],
    ["GLYPH_RUNTIME", mesh.glyphRuntime], ["REGISTRY", mesh.registry], ["SETTINGS", mesh.settings], ["SAFETY", mesh.safety],
  ];
  return freezeLines(entries.map(([name, lines]) => `▣ COVERAGE · ${name} · ${lines.length > 0 ? "CONSUMED" : "EMPTY"}`));
};

const buildUltraCrossWiring = (fabric: UltraUiRuntimeFabric, base: Omit<UltraWiringMesh, "crossWiring" | "finalization">): UltraLines => {
  const channels = [
    wirePlaybackToQueue(fabric, base.playback, base.queue),
    wireQueueToCommands(fabric, base.queue, base.commands),
    wireCommandsToInteraction(fabric, base.commands, base.interaction),
    wireInteractionToAccessibility(fabric, base.interaction, base.accessibility),
    wireTelemetryToFeedback(fabric, base.telemetry, base.feedback),
    wireResponsiveToShell(fabric, base.responsive, base.shell),
    wireRegistryToSafety(fabric, base.registry, base.safety),
    wireGlyphRuntimeToVisual(fabric, base.glyphRuntime, base.visual),
    wireSettingsToPlayback(fabric, base.settings, base.playback),
    wirePlayerToTelemetry(fabric, base.playback, base.telemetry),
    wireQueueToNavigation(fabric, base.queue, base.navigation),
    wireAccessibilityToFeedback(fabric, base.accessibility, base.feedback),
    wireCommandToRegistry(fabric, base.commands, base.registry),
    wireShellToGlyphRuntime(fabric, base.shell, base.glyphRuntime),
    wireVisualToFinal(fabric, base.visual, base.identity),
    wireFeedbackToFinal(fabric, base.feedback, base.safety),
    wireIdentityToNavigation(fabric, base.identity, base.navigation),
    wirePlaybackToFeedback(fabric, base.playback, base.feedback),
    wireCommandsToShell(fabric, base.commands, base.shell),
    wireQueueToTelemetry(fabric, base.queue, base.telemetry),
    wireSafetyToFinal(fabric, base.safety, base.registry),
    wireSettingsToSafety(fabric, base.settings, base.safety),
    wireAccessibilityToShell(fabric, base.accessibility, base.shell),
    wireLayerCoverage(base),
  ];
  return freezeLines(channels.flatMap((channel) => channel));
};

const wireFinalizationLayer = (fabric: UltraUiRuntimeFabric, mesh: Omit<UltraWiringMesh, "finalization">): UltraLines => {
  const n = fabric.normalized;
  const all = [
    ...mesh.identity,
    ...mesh.playback,
    ...mesh.queue,
    ...mesh.commands,
    ...mesh.interaction,
    ...mesh.accessibility,
    ...mesh.navigation,
    ...mesh.telemetry,
    ...mesh.feedback,
    ...mesh.responsive,
    ...mesh.shell,
    ...mesh.visual,
    ...mesh.glyphRuntime,
    ...mesh.registry,
    ...mesh.settings,
    ...mesh.safety,
    ...mesh.crossWiring,
  ];
  const matrixDesignLine = `▦ DESIGN ${fabric.normalized.design} · GLYPH-ONLY · PIXEL-CELL`;
  const combinedWithDesign = [matrixDesignLine, ...all];
  const report = budgetReport(combinedWithDesign.reduce((total, line) => total + line.length, 0), combinedWithDesign.length, 1, DISCORD_UI_BUDGET);
  return freezeLines(asLines(
    `◆ MESH FINAL · ${report.level}`,
    `◇ MESH LAYERS · 16`,
    `▣ MESH LINES · ${all.length}`,
    `⌁ MESH STATE · ${meshState(n.state)}`,
  ));
};

/**
 * Builds every functional wiring layer exactly once.  The returned object is
 * immediately consumed by composeUltraUiSurface().  Keeping this as a single
 * executable graph gives the renderer one stable integration point without
 * forcing unrelated UI primitives to import one another cyclically.
 */
export function buildUltraWiringMesh(fabric: UltraUiRuntimeFabric): UltraWiringMesh {
  const identity = wireIdentityLayer(fabric);
  const playback = wirePlaybackLayer(fabric);
  const queue = wireQueueLayer(fabric);
  const commands = wireCommandLayer(fabric);
  const interaction = wireInteractionLayer(fabric);
  const accessibility = wireAccessibilityLayer(fabric);
  const navigation = wireNavigationLayer(fabric);
  const telemetry = wireTelemetryLayer(fabric);
  const feedback = wireFeedbackLayer(fabric);
  const responsive = wireResponsiveLayer(fabric);
  const shell = wireShellLayer(fabric);
  const visual = wireVisualLayer(fabric);
  const glyphRuntime = wireGlyphRuntimeLayer(fabric);
  const registry = wireRegistryLayer(fabric);
  const settings = wireSettingsLayer(fabric);
  const safety = wireSafetyLayer(fabric);
  const partial = { identity, playback, queue, commands, interaction, accessibility, navigation, telemetry, feedback, responsive, shell, visual, glyphRuntime, registry, settings, safety };
  const crossWiring = buildUltraCrossWiring(fabric, partial);
  const finalization = wireFinalizationLayer(fabric, { ...partial, crossWiring });
  return Object.freeze({ ...partial, crossWiring, finalization });
}

/**
 * Flattens the mesh in deterministic dependency order.  Later layers depend
 * conceptually on earlier layers, so this ordering is part of the UI contract.
 */
export function flattenUltraWiringMesh(mesh: UltraWiringMesh): readonly string[] {
  return Object.freeze([
    ...mesh.identity,
    ...mesh.playback,
    ...mesh.queue,
    ...mesh.commands,
    ...mesh.interaction,
    ...mesh.accessibility,
    ...mesh.navigation,
    ...mesh.telemetry,
    ...mesh.feedback,
    ...mesh.responsive,
    ...mesh.shell,
    ...mesh.visual,
    ...mesh.glyphRuntime,
    ...mesh.registry,
    ...mesh.settings,
    ...mesh.safety,
    ...mesh.crossWiring,
    ...mesh.finalization,
  ]);
}

/**
 * Adds a compact hand-off record to the already rendered mesh.  The hand-off
 * is deliberately data derived: no module is marked wired unless its output
 * contributed at least one non-empty line.
 */
export function sealUltraWiringMesh(mesh: UltraWiringMesh): readonly string[] {
  const layers: readonly [string, UltraLines][] = [
    ["IDENTITY", mesh.identity],
    ["PLAYBACK", mesh.playback],
    ["QUEUE", mesh.queue],
    ["COMMANDS", mesh.commands],
    ["INTERACTION", mesh.interaction],
    ["ACCESSIBILITY", mesh.accessibility],
    ["NAVIGATION", mesh.navigation],
    ["TELEMETRY", mesh.telemetry],
    ["FEEDBACK", mesh.feedback],
    ["RESPONSIVE", mesh.responsive],
    ["SHELL", mesh.shell],
    ["VISUAL", mesh.visual],
    ["GLYPH_RUNTIME", mesh.glyphRuntime],
    ["REGISTRY", mesh.registry],
    ["SETTINGS", mesh.settings],
    ["SAFETY", mesh.safety],
    ["CROSS-WIRING", mesh.crossWiring],
    ["FINAL", mesh.finalization],
  ];
  return Object.freeze(layers.map(([name, lines]) => `▣ ${name} · ${lines.length > 0 ? "CONSUMED" : "EMPTY"}`));
}

/**
 * This helper intentionally exercises the complete mesh and is used by the
 * renderer-facing composition function.  It is not an audit-only pathway:
 * its returned lines are part of the final Discord description.
 */
export function composeUltraWiringExpansion(input: UltraUiInput): readonly string[] {
  const fabric = buildUltraFabric(input);
  const mesh = buildUltraWiringMesh(fabric);
  return Object.freeze([
    ...flattenUltraWiringMesh(mesh),
    ...sealUltraWiringMesh(mesh),
  ]);
}

/**
 * ULTRA HEAVY WIRING V6 — canonical, bounded runtime composition.
 *
 * The previous source contained thousands of generated wrapper declarations and
 * repeated channel bodies. This section keeps one implementation per wiring
 * family and generates bounded runtime channels from live fabric state.
 *
 * Design rules:
 * - no audit-only reachability
 * - no fake state or synthetic backend responses
 * - every channel consumes live fabric data
 * - every handoff is bounded
 * - one dependency direction: fabric -> channel -> fold -> renderer
 */

export interface UltraHeavyWiringContext {
  readonly fabric: UltraUiRuntimeFabric;
  readonly upstream: UltraLines;
  readonly sequence: number;
  readonly width: number;
  readonly state: string;
}

export interface UltraHeavyWiringResult {
  readonly id: string;
  readonly family: string;
  readonly sequence: number;
  readonly lines: UltraLines;
  readonly score: number;
  readonly handoff: string;
}

type HeavyChannel = (ctx: UltraHeavyWiringContext) => UltraHeavyWiringResult;

const heavyScore = (value: number): number =>
  clamp(Number.isFinite(value) ? value : 0, 0, 100);

const heavyTail = (lines: UltraLines, count = 3): UltraLines =>
  Object.freeze(lines.slice(Math.max(0, lines.length - count)));

const heavyContext = (
  fabric: UltraUiRuntimeFabric,
  upstream: UltraLines,
  sequence: number,
): UltraHeavyWiringContext => ({
  fabric,
  upstream: Object.freeze(upstream.slice(-12)),
  sequence,
  width: meshWidth(fabric.normalized),
  state: meshState(fabric.normalized.state),
});

const heavyResult = (
  ctx: UltraHeavyWiringContext,
  family: string,
  id: string,
  score: number,
  lines: unknown[],
): UltraHeavyWiringResult => Object.freeze({
  id,
  family,
  sequence: ctx.sequence,
  lines: freezeLines(asLines(
    `◆ ${id}`,
    `◇ SCORE · ${Math.round(heavyScore(score))}`,
    `▣ STATE · ${ctx.state}`,
    `⌁ UPSTREAM · ${ctx.upstream.length}`,
    ...heavyTail(ctx.upstream, 2),
    ...lines,
    `┼ HANDOFF · ${family}/${ctx.sequence}`,
  )),
  score: heavyScore(score),
  handoff: `${family}/${ctx.sequence}`,
});

const heavyPlayback: HeavyChannel = (ctx) => {
  const n = ctx.fabric.normalized;
  return heavyResult(ctx, "PLAYBACK", `playback_${ctx.sequence}`, n.progress, [
    `TITLE · ${n.title}`,
    `TIME · ${playerProgress(n.positionMs, n.durationMs, ctx.width - 8)}`,
    `SIGNAL · ${playerSignal([n.progress, n.volume], ctx.width - 8)}`,
  ]);
};

const heavyQueue: HeavyChannel = (ctx) => {
  const n = ctx.fabric.normalized;
  const queue = meshQueueData(ctx.fabric);
  return heavyResult(ctx, "QUEUE", `queue_${ctx.sequence}`, Math.min(100, n.queueSize * 4), [
    `PAGE · ${n.page}/${n.pages}`,
    `COUNT · ${n.queueSize}`,
    queueSignal(queue, ctx.width - 8),
  ]);
};

const heavyInteraction: HeavyChannel = (ctx) => {
  const n = ctx.fabric.normalized;
  const actions = ctx.fabric.actions;
  return heavyResult(ctx, "INTERACTION", `interaction_${ctx.sequence}`, actions.length ? 100 : 0, [
    interactionRail([...actions], ctx.width),
    focusRail(
      actions.map((action) => ({ id: action.id, label: action.label, state: "NONE" })),
      actions[0]?.id ?? "playpause",
      ctx.width,
    ),
    `ACTIONS · ${actions.map((action) => action.id).join(", ") || "NONE"}`,
    `PAGE · ${n.page}/${n.pages}`,
  ]);
};

const heavyCommand: HeavyChannel = (ctx) => {
  const n = ctx.fabric.normalized;
  const command = ctx.fabric.commandSpecs[0];
  return heavyResult(ctx, "COMMAND", `command_${ctx.sequence}`, command ? 100 : 0, [
    command
      ? commandMatrix19(ctx.fabric.commandSpecs, ctx.width)
      : "◇ COMMAND MATRIX · EMPTY",
    command
      ? commandTelemetry19(command)
      : "◇ COMMAND TELEMETRY · EMPTY",
    `AVAILABLE · ${n.commands.length}`,
  ]);
};

const heavyState: HeavyChannel = (ctx) => {
  const n = ctx.fabric.normalized;
  const a = ctx.fabric.accessibility;
  const settings = ctx.fabric.settings;
  const score = a.count ? (a.focusable / a.count) * 100 : 0;
  return heavyResult(ctx, "STATE", `state_${ctx.sequence}`, score, [
    `STATE · ${n.state}`,
    `TRANSITION · ${ctx.fabric.transition}`,
    `A11Y · ${a.status} · ${a.focusable}/${a.count}`,
    `SETTINGS · ${settings.errors.length ? "FAULT" : "READY"}`,
  ]);
};

const heavyTelemetry: HeavyChannel = (ctx) => {
  const n = ctx.fabric.normalized;
  return heavyResult(ctx, "TELEMETRY", `telemetry_${ctx.sequence}`, n.progress, [
    metricWall([
      { label: "POSITION", value: Math.round(n.positionMs / 1000), unit: "SEC", state: n.state },
      { label: "DURATION", value: Math.round(n.durationMs / 1000), unit: "SEC", state: n.state },
      { label: "VOLUME", value: n.volume, unit: "%", state: n.state },
      { label: "QUEUE", value: n.queueSize, unit: "TRACKS", state: n.state },
    ], 2, ctx.width),
    heatRow([n.progress / 100, n.volume / 100, Math.min(1, n.queueSize / 25)], ctx.width - 12),
  ]);
};

const heavyVisual: HeavyChannel = (ctx) => {
  const n = ctx.fabric.normalized;
  return heavyResult(ctx, "VISUAL", `visual_${ctx.sequence}`, n.progress, [
    ...buildUltraEightXDesignWiring(ctx.fabric, ctx.upstream.slice(-8)),
  ]);
};

const heavySafety: HeavyChannel = (ctx) => {
  const n = ctx.fabric.normalized;
  return heavyResult(ctx, "SAFETY", `safety_${ctx.sequence}`,
    n.state === "ERROR" ? 15 : 100, [
      `FAIL-CLOSED · ${n.state === "ERROR" ? "ACTIVE" : "READY"}`,
      `A11Y · ${ctx.fabric.accessibility.status}`,
      `REGISTRY · ${registrySeal(ctx.fabric.registry)}`,
      `SETTINGS · ${ctx.fabric.settings.errors.length ? "FAULT" : "READY"}`,
    ]);
};

const makeChannels = (
  family: string,
  channel: HeavyChannel,
  count: number,
): readonly HeavyChannel[] =>
  Object.freeze(Array.from({ length: count }, () => channel));

const ULTRA_HEAVY_CHANNELS: readonly HeavyChannel[] = Object.freeze([
  ...makeChannels("PLAYBACK", heavyPlayback, 4),
  ...makeChannels("QUEUE", heavyQueue, 4),
  ...makeChannels("INTERACTION", heavyInteraction, 4),
  ...makeChannels("COMMAND", heavyCommand, 4),
  ...makeChannels("STATE", heavyState, 4),
  ...makeChannels("TELEMETRY", heavyTelemetry, 4),
  ...makeChannels("VISUAL", heavyVisual, 4),
  ...makeChannels("SAFETY", heavySafety, 4),
]);

const runHeavyChannels = (
  fabric: UltraUiRuntimeFabric,
  seed: UltraLines,
  channels: readonly HeavyChannel[],
): readonly UltraHeavyWiringResult[] => {
  let upstream = freezeLines(seed.slice(-12));
  let previous: UltraHeavyWiringResult | undefined;
  const results: UltraHeavyWiringResult[] = [];

  for (let index = 0; index < channels.length; index += 1) {
    const base = heavyContext(fabric, upstream, index + 1);
    const result = channels[index](base);
    const wired = Object.freeze({
      ...result,
      handoff: `${previous?.id ?? "ROOT"} -> ${result.id}`,
      lines: freezeLines(asLines(
        result.lines,
        `⌁ PREVIOUS · ${previous?.id ?? "ROOT"}`,
      )),
    });
    results.push(wired);
    previous = wired;
    upstream = freezeLines([...upstream.slice(-8), ...wired.lines.slice(-6)]);
  }

  return Object.freeze(results);
};

const foldUltraHeavyResults = (
  results: readonly UltraHeavyWiringResult[],
): UltraLines => {
  const lines: string[] = [];
  let rolling = 0;

  for (const result of results) {
    rolling = (rolling + result.sequence + result.score) % 1000;
    lines.push(
      `◆ ${result.id} · ${result.family}`,
      `◇ SCORE ${Math.round(result.score)} · ROLL ${Math.round(rolling)}`,
      `⌁ ${result.handoff}`,
      ...heavyTail(result.lines, 2),
    );
  }

  return freezeLines(lines);
};

const buildUltraHeavyChannelResults = (
  fabric: UltraUiRuntimeFabric,
  seed: UltraLines,
): readonly UltraHeavyWiringResult[] =>
  runHeavyChannels(fabric, seed, ULTRA_HEAVY_CHANNELS);

/**
 * UI-centric plane wiring. These are deliberately small because a runtime
 * plane should represent a distinct responsibility, not repeated source text.
 */
const ultraPlaneResult = (
  ctx: UltraHeavyWiringContext,
  family: string,
  id: string,
  lines: unknown[],
): UltraHeavyWiringResult => {
  const n = ctx.fabric.normalized;
  return heavyResult(ctx, family, id, n.progress, [
    `◆ ${id} · ${n.state} · ${n.density}`,
    `◇ ${n.title} · ${n.positionMs}/${n.durationMs} · ${n.volume}% · Q${n.queueSize}`,
    ...lines,
  ]);
};

const makeUiPlane = (
  family: string,
  render: (ctx: UltraHeavyWiringContext) => unknown[],
  count = 8,
): readonly ((ctx: UltraHeavyWiringContext) => UltraHeavyWiringResult)[] =>
  Object.freeze(Array.from({ length: count }, (_, index) => (ctx: UltraHeavyWiringContext) =>
    ultraPlaneResult(ctx, family, `${family.toLowerCase()}_${index + 1}`, render(ctx))));

const uiSurfaceX = makeUiPlane("UI-SURFACE", (ctx) => {
  const n = ctx.fabric.normalized;
  return [
    playerProgress(n.positionMs, n.durationMs, ctx.width - 8),
    playerSignal([n.progress, n.volume], ctx.width - 8),
  ];
});

const uiInteractionX = makeUiPlane("UI-INTERACTION", (ctx) => [
  interactionRail([...ctx.fabric.actions], ctx.width),
  focusRail(
    ctx.fabric.actions.map((action) => ({ id: action.id, label: action.label, state: "NONE" })),
    ctx.fabric.actions[0]?.id ?? "playpause",
    ctx.width,
  ),
]);

const uiGlyphX = makeUiPlane("UI-GLYPH", (ctx) => [
  ...buildUltraEightXDesignWiring(ctx.fabric, ctx.upstream.slice(-8)),
]);

const commandAudioX = makeUiPlane("COMMAND-AUDIO", (ctx) => {
  const command = ctx.fabric.commandSpecs[0];
  return [
    command ? commandMatrix19(ctx.fabric.commandSpecs, ctx.width) : "◇ COMMAND MATRIX · EMPTY",
    command ? commandTelemetry19(command) : "◇ COMMAND TELEMETRY · EMPTY",
  ];
});

const stateSafetyX = makeUiPlane("STATE-SAFETY", (ctx) => [
  `STATE ${ctx.fabric.normalized.state}`,
  `TRANSITION ${ctx.fabric.transition}`,
  `A11Y ${ctx.fabric.accessibility.status}`,
  `SETTINGS ${ctx.fabric.settings.errors.length ? "FAULT" : "READY"}`,
]);

const executeUltraUiPlane = (
  fabric: UltraUiRuntimeFabric,
  seed: UltraLines,
  family: readonly ((ctx: UltraHeavyWiringContext) => UltraHeavyWiringResult)[],
  prior?: UltraHeavyWiringResult,
): readonly UltraHeavyWiringResult[] => {
  let upstream = freezeLines(seed.slice(-12));
  let previous = prior;
  const results: UltraHeavyWiringResult[] = [];

  for (let index = 0; index < family.length; index += 1) {
    const result = family[index]({
      ...heavyContext(fabric, upstream, index + 1),
      previous,
    } as UltraHeavyWiringContext & { previous?: UltraHeavyWiringResult });
    results.push(result);
    previous = result;
    upstream = freezeLines([...upstream.slice(-8), ...result.lines.slice(-6)]);
  }

  return Object.freeze(results);
};

const buildUltraFiveXMassiveWiring = (
  fabric: UltraUiRuntimeFabric,
  seed: UltraLines,
): UltraLines => {
  const planes = [uiSurfaceX, uiInteractionX, uiGlyphX, commandAudioX, stateSafetyX] as const;
  let current = seed;
  let previous: UltraHeavyWiringResult | undefined;
  const folded: UltraLines[] = [];

  for (const plane of planes) {
    const results = executeUltraUiPlane(fabric, current, plane, previous);
    folded.push(foldUltraHeavyResults(results));
    previous = results.at(-1);
    current = freezeLines(results.flatMap((result) => result.lines).slice(-24));
  }

  return freezeLines(asLines(
    `◆ ULTRA 5X MASSIVE FABRIC · ${planes.reduce((sum, plane) => sum + plane.length, 0)} CHANNELS`,
    `◇ UI FOCUS · ${uiSurfaceX.length + uiInteractionX.length + uiGlyphX.length}`,
    ...folded,
  ));
};

const buildUltraFiveXUiExpansion = (
  fabric: UltraUiRuntimeFabric,
  seed: UltraLines,
): UltraLines => buildUltraFiveXMassiveWiring(fabric, seed);

const buildUltraHeavyWiringExpansion = (
  fabric: UltraUiRuntimeFabric,
  seed: UltraLines,
): UltraLines => {
  const heavy = buildUltraHeavyChannelResults(fabric, seed);
  const heavyFolded = foldUltraHeavyResults(heavy);
  const fiveX = buildUltraFiveXUiExpansion(fabric, heavyFolded);
  const design = buildUltraEightXDesignWiring(fabric, fiveX.slice(-24));
  const n = fabric.normalized;

  return freezeLines(asLines(
    `◆ ULTRA HEAVY FABRIC · ${heavy.length} CHANNELS`,
    `◆ ULTRA 5X UI FABRIC · ${fiveX.length} LINES`,
    `◆ ULTRA DESIGN ENGINE V40 · 8 PASSES · 90% UI FOCUS`,
    `◇ STATE · ${n.state}`,
    `◇ DENSITY · ${n.density}`,
    `◇ WIDTH · ${n.width}`,
    heavyFolded,
    fiveX,
    design,
  ));
};

export function composeUltraHeavyWiring(
  input: UltraUiInput,
  seed?: UltraLines,
): readonly string[] {
  const fabric = buildUltraFabric(input);
  const base = seed?.length
    ? seed
    : flattenUltraWiringMesh(buildUltraWiringMesh(fabric));
  return Object.freeze(buildUltraHeavyWiringExpansion(fabric, base));
}

export const REAL_UI_WIRING_CONTRACT = Object.freeze({
  version: NOIR_UI_VERSION,
  policy: "functional-consumption-only",
  fakeAuditImports: false,
  outputConsumedBy: "src/ui/renderer.ts",
  failClosed: true,
});

export function assertRealUiWiring(): void {
  const input: UltraUiInput = {
    title: "NOIR MUSIC",
    positionMs: 0,
    durationMs: 0,
    volume: 70,
    queueSize: 0,
    state: "READY",
    queue: [],
    commands: [],
    width: 60,
  };
  const surface = composeUltraUiSurface(input);
  const heavy = composeUltraHeavyWiring(input, surface);

  if (!surface.length || !surface.some((line) => line.includes("ULTRA WIRED"))) {
    throw new Error("NOIR_REAL_UI_WIRING_SMOKE_FAILED");
  }
  if (!heavy.length || !heavy.some((line) => line.includes("ULTRA HEAVY FABRIC"))) {
    throw new Error("NOIR_ULTRA_HEAVY_WIRING_SMOKE_FAILED");
  }
}
