/**
 * NOIR MUSIC // GLYPH MATRIX SUPREME UI V48.6
 *
 * Canonical Discord visual language.
 * - Glyph/pixel icons remain the primary visual grammar
 * - Only canonical Glyph Matrix symbols are supported
 * - Deterministic cell widths
 * - One canonical Glyph Matrix identity with width-adaptive density and composition
 * - Presentation only: no command IDs, persistence or audio mutation
 */
import { normalizeGlyphText } from "./pixel";
import { NOIR_UI_VERSION } from "./uiVersion";

export type MatrixDesign = "GRID" | "MATRIX" | "TERMINAL" | "OPERATOR" | "CIRCUIT" | "DENSE";
export type MatrixTone = "PRIMARY" | "SECONDARY" | "WARNING" | "DANGER" | "DISABLED" | "SUCCESS";

export const MATRIX_GLYPHS = Object.freeze({
  play: "▶", pause: "Ⅱ", stop: "■", previous: "◀", next: "▶", back: "‹", close: "×",
  queue: "▣", effects: "≈", autoplay: "⌁", source: "◇", matrix: "▦", dashboard: "⌘",
  refresh: "↻", search: "⌕", lyrics: "≋", favorite: "◆", volume: "◐", mute: "○", replay: "↺",
  loop: "∞", shuffle: "⤨", category: "▤", success: "✓", warning: "◐", error: "×", idle: "·",
  separator: "·", scan: "⌁", bar: "█", light: "░", mid: "▓", hollow: "□",
  tl: "╔", tr: "╗", bl: "╚", br: "╝", h: "═", v: "║", ml: "╠", mr: "╣",
  branch: "┼", arrow: "›", dot: "·", up: "↑", down: "↓", left: "‹", right: "›",
});

/** Built-in button emoji are Glyph Matrix symbols only.
 * Custom Discord emoji overrides are intentionally unsupported; the Glyph Matrix vocabulary is canonical.
 */
export type MatrixEmoji = string | { readonly id: string; readonly name?: string; readonly animated?: boolean };
export const MATRIX_EMOJIS: Readonly<Record<string, string>> = Object.freeze({
  // Unicode glyphs are the only built-in emoji layer. They intentionally match
  // the canonical Glyph Matrix vocabulary; no consumer/mobile-style emoji are used.
  previous: MATRIX_GLYPHS.left, playPause: MATRIX_GLYPHS.play, skip: MATRIX_GLYPHS.right,
  loop: MATRIX_GLYPHS.loop, shuffle: MATRIX_GLYPHS.shuffle, queue: MATRIX_GLYPHS.queue,
  lyrics: MATRIX_GLYPHS.lyrics, favorite: MATRIX_GLYPHS.favorite, refresh: MATRIX_GLYPHS.refresh,
  close: MATRIX_GLYPHS.close, dashboard: MATRIX_GLYPHS.dashboard, matrix: MATRIX_GLYPHS.matrix,
  volumeDown: MATRIX_GLYPHS.volume, volumeUp: MATRIX_GLYPHS.volume, mute: MATRIX_GLYPHS.mute,
  replay: MATRIX_GLYPHS.replay, stop: MATRIX_GLYPHS.stop, effects: MATRIX_GLYPHS.effects,
  autoplay: MATRIX_GLYPHS.autoplay, source: MATRIX_GLYPHS.source, player: MATRIX_GLYPHS.play,
  back: MATRIX_GLYPHS.back, search: MATRIX_GLYPHS.search, category: MATRIX_GLYPHS.category,
});

/** V48.6: Glyph Matrix is the only icon source. Custom Discord emoji overrides are intentionally disabled. */
export function matrixEmoji(action: string): string | undefined {
  return MATRIX_EMOJIS[action];
}

export const MATRIX_UI_VERSION = NOIR_UI_VERSION;

const LABELS: Record<string, string> = Object.freeze({
  previous: "PREV", playPause: "PLAY", skip: "NEXT", loop: "LOOP", shuffle: "SHUFFLE",
  queue: "QUEUE", lyrics: "LYRICS", favorite: "FAVORITE", refresh: "REFRESH", close: "CLOSE",
  dashboard: "CONTROL", matrix: "MATRIX", volumeDown: "VOL−", volumeUp: "VOL+", mute: "MUTE",
  replay: "REPLAY", stop: "STOP", effects: "EFFECTS", autoplay: "AUTOPLAY", source: "SOURCE",
  player: "PLAYER", back: "BACK", search: "SEARCH", category: "MODULE",
});

const DESIGN_GLYPHS: Record<MatrixDesign, { tl: string; tr: string; bl: string; br: string; h: string; v: string; mid: string; accent: string }> = {
  GRID: { tl: "┌", tr: "┐", bl: "└", br: "┘", h: "─", v: "│", mid: "┄", accent: "·" },
  MATRIX: { tl: "╔", tr: "╗", bl: "╚", br: "╝", h: "═", v: "║", mid: "╠", accent: "◆" },
  TERMINAL: { tl: "╭", tr: "╮", bl: "╰", br: "╯", h: "─", v: "│", mid: "┄", accent: "›" },
  OPERATOR: { tl: "╔", tr: "╗", bl: "╚", br: "╝", h: "═", v: "║", mid: "╠", accent: "▣" },
  CIRCUIT: { tl: "┌", tr: "┐", bl: "└", br: "┘", h: "━", v: "┃", mid: "╋", accent: "┼" },
  DENSE: { tl: "╓", tr: "╖", bl: "╙", br: "╜", h: "─", v: "║", mid: "╫", accent: "◇" },
};

export const MATRIX_DESIGNS = Object.freeze(Object.keys(DESIGN_GLYPHS) as MatrixDesign[]);

export interface MatrixLayoutProfile {
  readonly design: MatrixDesign;
  readonly titleGlyph: string;
  readonly rowGlyph: string;
  readonly controlGlyph: string;
  readonly meterFull: string;
  readonly meterEmpty: string;
}

export function matrixLayoutProfile(design: MatrixDesign): MatrixLayoutProfile {
  const d = DESIGN_GLYPHS[design];
  return Object.freeze({
    design,
    titleGlyph: d.accent,
    rowGlyph: design === "CIRCUIT" ? d.accent : MATRIX_GLYPHS.dot,
    controlGlyph: design === "TERMINAL" ? MATRIX_GLYPHS.arrow : MATRIX_GLYPHS.favorite,
    meterFull: design === "DENSE" ? MATRIX_GLYPHS.mid : MATRIX_GLYPHS.bar,
    meterEmpty: design === "GRID" ? MATRIX_GLYPHS.hollow : MATRIX_GLYPHS.light,
  });
}


function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.trunc(Number(value) || 0)));
}

function clean(value: unknown, max = 80, fallback = "—"): string {
  const text = normalizeGlyphText(value, Math.max(1, max)).replace(/\s+/g, " ").trim();
  return text || fallback;
}

/** Preserve canonical box-drawing/pixel glyphs already emitted by this module. */
function cell(value: unknown, max = 80, fallback = "—"): string {
  const raw = String(value ?? "").replace(/[\r\n\t]+/g, " ").replace(/ +/g, " ").trim();
  const allowed = /[^A-Z0-9 ./:_!?+\-═║╔╗╚╝╠╣─│┌┐└┘┄╭╮╰╯━┃╋╫█░▓·◆◇◐●○›‹↑↓×▶Ⅱ■◀▣≈⌁⌘⌕≋↺∞⤨▤✓□┼]/gi;
  const text = raw.toUpperCase().replace(allowed, " ").replace(/ +/g, " ").trim().slice(0, Math.max(1, max));
  return text || fallback;
}

function fit(text: string, width: number, align: "left" | "right" = "left"): string {
  const w = Math.max(0, width);
  const clipped = text.slice(0, w);
  return align === "right" ? clipped.padStart(w, " ") : clipped.padEnd(w, " ");
}

function line(design: MatrixDesign, width: number, left: string, right = ""): string {
  const d = DESIGN_GLYPHS[design];
  const inner = Math.max(4, width - 2);
  const safeRight = cell(right, Math.max(0, Math.min(20, right.length)), "");
  const leftBudget = Math.max(1, inner - safeRight.length - (safeRight ? 3 : 1));
  const safeLeft = cell(left, leftBudget, "");
  const gap = Math.max(1, inner - safeLeft.length - safeRight.length);
  return `${d.v}${fit(` ${safeLeft}${" ".repeat(gap)}${safeRight ? `${safeRight} ` : ""}`, inner)}${d.v}`;
}

export function matrixIcon(name: string): string {
  return MATRIX_GLYPHS[name as keyof typeof MATRIX_GLYPHS] ?? MATRIX_GLYPHS.dot;
}

/** One icon per action label. This is the canonical button vocabulary. */
export function matrixLabel(action: string, active = false): string {
  const icon = active ? MATRIX_GLYPHS.favorite : matrixIcon(action);
  const label = LABELS[action] ?? clean(action, 18, "ACTION").toUpperCase();
  return `${icon} ${label}`;
}

export function matrixButtonLabel(action: string, state: { paused?: boolean; muted?: boolean; loop?: string } = {}): string {
  switch (action) {
    case "playPause": return `${state.paused ? MATRIX_GLYPHS.play : MATRIX_GLYPHS.pause} ${state.paused ? "RESUME" : "PAUSE"}`;
    case "mute": return `${state.muted ? MATRIX_GLYPHS.volume : MATRIX_GLYPHS.mute} ${state.muted ? "UNMUTE" : "MUTE"}`;
    case "loop": return `${MATRIX_GLYPHS.loop} ${clean(state.loop ?? "OFF", 10).toUpperCase()}`;
    default: return matrixLabel(action);
  }
}

export function matrixDesignFor(_width = 60, _preferred?: MatrixDesign): MatrixDesign {
  // V48.6: one visual identity only. Legacy design arguments remain accepted
  // for API compatibility, but every renderer resolves to the canonical MATRIX skin.
  return "MATRIX";
}

export function matrixChrome(design: MatrixDesign, width = 58): { top: string; mid: string; bottom: string } {
  const w = clamp(width, 18, 72);
  const d = DESIGN_GLYPHS[design];
  return {
    top: `${d.tl}${d.h.repeat(w - 2)}${d.tr}`,
    mid: `${d.mid}${d.h.repeat(w - 2)}${d.mid}`,
    bottom: `${d.bl}${d.h.repeat(w - 2)}${d.br}`,
  };
}

export function matrixPanel(title: string, lines: readonly unknown[], width = 58, design?: MatrixDesign): string {
  const w = clamp(width, 18, 72);
  const d = matrixDesignFor(w, design);
  const c = matrixChrome(d, w);
  const inner = w - 2;
  const titleText = `${MATRIX_GLYPHS.matrix} ${clean(title, inner - 4, "NOIR MUSIC").toUpperCase()}`;
  const body = lines.slice(0, 12).map((value, i) => {
    const prefix = i === 0 ? matrixLayoutProfile(d).titleGlyph : matrixLayoutProfile(d).rowGlyph;
    return line(d, w, `${prefix} ${cell(value, inner - 7)}`, "");
  });
  return [c.top, line(d, w, titleText, ""), c.mid, ...(body.length ? body : [line(d, w, `${MATRIX_GLYPHS.idle} NO DATA`, "")]), c.bottom].join("\n");
}

export function matrixProgress(value: number, width = 24, design: MatrixDesign = "MATRIX"): string {
  const w = clamp(width, 8, 40);
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const profile = matrixLayoutProfile(design);
  const filled = Math.round(v / 100 * w);
  return `${profile.meterFull.repeat(filled)}${profile.meterEmpty.repeat(w - filled)} ${String(Math.round(v)).padStart(3, "0")}%`;
}

export function matrixStatus(state: string, tone: MatrixTone = "PRIMARY", design: MatrixDesign = "MATRIX"): string {
  return `${matrixToneGlyph(tone)} ${clean(state, 18, "READY").toUpperCase()} ${DESIGN_GLYPHS[design].accent}`;
}

export function matrixHeader(title: string, meta = "", width = 58, design?: MatrixDesign): string {
  const w = clamp(width, 18, 72);
  const d = matrixDesignFor(w, design);
  const p = matrixLayoutProfile(d);
  return line(d, w, `${p.titleGlyph} ${clean(title, w - 12).toUpperCase()}`, meta);
}

export function matrixControlRail(actions: readonly string[], width = 58, design?: MatrixDesign): string {
  const w = clamp(width, 18, 72);
  const d = matrixDesignFor(w, design);
  const p = matrixLayoutProfile(d);
  const count = Math.max(1, Math.min(actions.length, 8));
  const usable = Math.max(count * 6, w - 2);
  const cellWidth = Math.max(6, Math.floor((usable - (count - 1)) / count));
  const cells = actions.slice(0, count).map((action, i) => fit(`${i + 1} ${p.controlGlyph} ${clean(action, cellWidth - 4)}`, cellWidth, "left"));
  return line(d, w, cells.join(`${DESIGN_GLYPHS[d].v}`));
}


export function matrixPulse(seed: number | string, width = 24): string {
  const w = clamp(width, 8, 48);
  let hash = 2166136261 >>> 0;
  for (const c of String(seed)) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619) >>> 0;
  const cells = [MATRIX_GLYPHS.light, MATRIX_GLYPHS.mid, MATRIX_GLYPHS.bar, MATRIX_GLYPHS.mid];
  return Array.from({ length: w }, (_, i) => cells[(hash + i * 7) % cells.length]).join("");
}

export function matrixPixelClock(ms: number): string {
  const seconds = Math.floor(Math.max(0, Number(ms) || 0) / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function matrixPlayerSurface(input: {
  title: string; artist: string; state: string; positionMs: number; durationMs: number; volume: number;
  queueSize: number; source: string; design?: MatrixDesign; width?: number; requester?: string;
}): string {
  const width = clamp(input.width ?? 58, 18, 72);
  const d = matrixDesignFor(width, input.design);
  const pct = input.durationMs > 0 ? input.positionMs / input.durationMs * 100 : 0;
  const rows = [
    `${MATRIX_GLYPHS.play} ${clean(input.title, width - 8).toUpperCase()}`,
    `${MATRIX_GLYPHS.arrow} ${clean(input.artist, width - 8).toUpperCase()}`,
    `${MATRIX_GLYPHS.source} SRC ${clean(input.source, 14).toUpperCase()} ${MATRIX_GLYPHS.branch} ${clean(input.state, 12).toUpperCase()}`,
    `${matrixPixelClock(input.positionMs)} ${MATRIX_GLYPHS.arrow} ${matrixProgress(pct, Math.max(8, Math.min(30, width - 30)), d)} ${MATRIX_GLYPHS.arrow} ${matrixPixelClock(input.durationMs)}`,
    `${MATRIX_GLYPHS.volume} VOL ${matrixProgress(input.volume, 12, d)} ${MATRIX_GLYPHS.queue} Q ${Math.max(0, Math.trunc(input.queueSize))}`,
  ];
  if (input.requester) rows.push(`${MATRIX_GLYPHS.category} REQ ${clean(input.requester, width - 9)}`);
  return [matrixPanel("NOW PLAYING", rows, width, d), matrixPulse(`${input.title}:${input.positionMs}:${input.volume}`, Math.min(48, width))].join("\n");
}

export function matrixQueueSurface(items: readonly { title: string; artist?: string; duration?: number }[], page: number, pages: number, width = 58, design?: MatrixDesign): string {
  const safePage = clamp(page, 1, Math.max(1, pages));
  const safePages = Math.max(1, Math.trunc(pages) || 1);
  const rows = items.slice(0, 10).map((item, i) => {
    const duration = item.duration === undefined ? "" : ` ${MATRIX_GLYPHS.dot} ${matrixPixelClock(item.duration)}`;
    return `${i === 0 ? MATRIX_GLYPHS.favorite : MATRIX_GLYPHS.dot} ${String(i + 1).padStart(2, "0")} ${MATRIX_GLYPHS.arrow} ${clean(item.title, 28)}${item.artist ? ` ${MATRIX_GLYPHS.separator} ${clean(item.artist, 14)}` : ""}${duration}`;
  });
  return matrixPanel(`QUEUE ${safePage}/${safePages}`, rows.length ? rows : [`${MATRIX_GLYPHS.idle} EMPTY`], width, design);
}

export function matrixCommandSurface(category: string, commands: readonly { name: string; description: string }[], width = 58, design?: MatrixDesign): string {
  const rows = commands.slice(0, 10).map((command, i) => `${i === 0 ? MATRIX_GLYPHS.category : MATRIX_GLYPHS.dot} ${String(i + 1).padStart(2, "0")} ${MATRIX_GLYPHS.arrow} /${clean(command.name, 22)} ${MATRIX_GLYPHS.separator} ${clean(command.description, Math.max(10, width - 40))}`);
  return matrixPanel(category, rows.length ? rows : [`${MATRIX_GLYPHS.idle} NO COMMANDS`], width, design);
}

export function matrixDesignShowcase(width = 58): string {
  const w = clamp(width, 18, 72);
  return MATRIX_DESIGNS.map((design) => {
    const d = DESIGN_GLYPHS[design];
    const profile = matrixLayoutProfile(design);
    const rail = `${d.tl}${d.h.repeat(Math.max(8, Math.min(w - 4, 30)))}${d.tr}`;
    return `${profile.titleGlyph} ${design.padEnd(8, " ")} ${MATRIX_GLYPHS.arrow} ${rail}`;
  }).join("\n");
}

export function matrixDesignLegend(width = 58, design?: MatrixDesign): string {
  const w = clamp(width, 18, 72);
  const d = matrixDesignFor(w, design);
  const p = matrixLayoutProfile(d);
  return matrixPanel("DESIGN PROFILE", [
    `${p.titleGlyph} STYLE ${d}`,
    `${p.rowGlyph} FRAME ${DESIGN_GLYPHS[d].tl}${DESIGN_GLYPHS[d].h.repeat(10)}${DESIGN_GLYPHS[d].tr}`,
    `${p.controlGlyph} CONTROLS CELL-LOCKED`,
    `${MATRIX_GLYPHS.bar} METER ${p.meterFull} / ${p.meterEmpty}`,
    `${MATRIX_GLYPHS.scan} WIDTH ${w}C`,
  ], w, d);
}


export function matrixToneGlyph(tone: MatrixTone): string {
  switch (tone) {
    case "PRIMARY": return MATRIX_GLYPHS.favorite;
    case "WARNING": return MATRIX_GLYPHS.warning;
    case "DANGER": return MATRIX_GLYPHS.error;
    case "SUCCESS": return MATRIX_GLYPHS.success;
    case "DISABLED": return MATRIX_GLYPHS.idle;
    default: return MATRIX_GLYPHS.dot;
  }
}
