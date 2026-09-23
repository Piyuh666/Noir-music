/**
 * NOIR MUSIC // GLYPH MATRIX VISUAL DIRECTOR V62.0
 *
 * Large visual-quality pass: one deterministic scene grammar controls identity,
 * hierarchy, state, playback focus and surface transitions. It is intentionally
 * presentation-only and uses the canonical pixel-cell / bitmap primitives.
 */
import { pixelBitmapComposition, pixelBitmapText, pixelCell, pixelNormalize } from './pixelTypography';
import { unifiedOpticalState, unifiedOpticalRail, type UnifiedOpticalState } from './visualOrchestrator';

export const VISUAL_DIRECTOR = Object.freeze({
  focus: '◆',
  quiet: '◇',
  active: '●',
  idle: '·',
  fill: '█',
  empty: '░',
  rail: '─',
  frame: Object.freeze({ tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║', mid: '╠' }),
  minWidth: 30,
  maxWidth: 72,
});

const widthOf = (width: number) => Math.max(VISUAL_DIRECTOR.minWidth, Math.min(VISUAL_DIRECTOR.maxWidth, Math.trunc(Number(width) || 48)));
const clean = (value: unknown, max: number, fallback = '—') => pixelNormalize(value, Math.max(1, max), fallback);

function frame(width: number, top = VISUAL_DIRECTOR.frame.tl, bottom = VISUAL_DIRECTOR.frame.bl): readonly string[] {
  const w = widthOf(width);
  return Object.freeze([
    `${top}${VISUAL_DIRECTOR.frame.h.repeat(w - 2)}${top === VISUAL_DIRECTOR.frame.tl ? VISUAL_DIRECTOR.frame.tr : VISUAL_DIRECTOR.frame.tr}`,
    `${bottom}${VISUAL_DIRECTOR.frame.h.repeat(w - 2)}${bottom === VISUAL_DIRECTOR.frame.bl ? VISUAL_DIRECTOR.frame.br : VISUAL_DIRECTOR.frame.br}`,
  ]);
}

/** Full-width bitmap identity block. */
export function visualWordmark(value: string, width: number): readonly string[] {
  const w = widthOf(width);
  const bitmap = pixelBitmapComposition(clean(value, 32, 'NOIR MUSIC'), Math.max(16, w - 8), { scale: w >= 56 ? 2 : 1, gap: 1, align: 'CENTER' });
  return Object.freeze(bitmap.map((row) => pixelCell(row, w, 'CENTER', '')));
}

/** Pixel-written landmark with a compact signal line beneath it. */
function visualLandmark(value: string, width: number): readonly string[] {
  const w = widthOf(width);
  const label = clean(value, 18, 'SURFACE');
  const bitmap = pixelBitmapText(label, Math.max(8, Math.min(30, w - 8)), 1);
  return Object.freeze([
    ...bitmap.map((row) => pixelCell(row, w, 'CENTER', '')),
    pixelCell(`${VISUAL_DIRECTOR.focus} ${label} ${VISUAL_DIRECTOR.focus}`, w, 'CENTER', ''),
  ]);
}

/** Deterministic waveform: variation comes from geometry, never color. */
export function pixelWaveform(ratio: number, width: number): string {
  const w = widthOf(width);
  const cells = Math.max(16, w - 8);
  const progress = Math.max(0, Math.min(1, Number(ratio) || 0));
  const cursor = Math.min(cells - 1, Math.round(progress * (cells - 1)));
  const bars = Array.from({ length: cells }, (_, index) => {
    const seed = (index * 17 + 7) % 11;
    if (index === cursor) return VISUAL_DIRECTOR.focus;
    if (index <= cursor) return seed > 6 ? '▓' : VISUAL_DIRECTOR.fill;
    return seed > 7 ? '░' : '·';
  }).join('');
  return pixelCell(`${VISUAL_DIRECTOR.quiet} ${bars} ${VISUAL_DIRECTOR.quiet}`, w);
}

/** Three-state visual pulse: active, transitional and quiet all share one grammar. */
export function pixelStatePulse(state: string, width: number): string {
  const w = widthOf(width);
  const normalized = clean(state, 12, 'IDLE');
  const active = normalized === 'ACTIVE' || normalized === 'SUCCESS';
  const warning = normalized === 'BUSY' || normalized === 'WARNING';
  const glyph = active ? VISUAL_DIRECTOR.active : warning ? VISUAL_DIRECTOR.focus : VISUAL_DIRECTOR.quiet;
  const level = active ? 1 : warning ? 0.66 : 0.28;
  const cells = Math.max(8, w - normalized.length - 8);
  const filled = Math.round(cells * level);
  return pixelCell(`${glyph} ${normalized} ${VISUAL_DIRECTOR.rail}${VISUAL_DIRECTOR.fill.repeat(filled)}${VISUAL_DIRECTOR.empty.repeat(cells - filled)}`, w);
}

/** Compact playback control rail using glyph states rather than icon fonts. */
export function pixelControlRail(actions: readonly string[], active: string, width: number): string {
  const w = widthOf(width);
  const shown = actions.slice(0, 6);
  if (!shown.length) return pixelCell(`${VISUAL_DIRECTOR.quiet} NO ACTIONS`, w);
  const cell = Math.max(7, Math.floor((w - shown.length + 1) / shown.length));
  return pixelCell(shown.map((action) => {
    const label = clean(action, Math.max(3, cell - 3), 'ACTION');
    const marker = label === clean(active, Math.max(3, cell - 3), 'ACTION') ? VISUAL_DIRECTOR.focus : VISUAL_DIRECTOR.idle;
    return `${marker} ${label}`.padEnd(cell, ' ');
  }).join(VISUAL_DIRECTOR.rail), w);
}

/** Final visual scene: identity, state, playback focus, then a clean transition. */
export function visualScene(input: {
  width: number;
  state: string;
  title: string;
  positionRatio: number;
  actions?: readonly string[];
  activeAction?: string;
}): readonly string[] {
  const w = widthOf(input.width);
  const top = frame(w)[0];
  const bottom = frame(w)[1];
  const inner = w - 4;
  return Object.freeze([
    top,
    ...visualWordmark('NOIR MUSIC', w).map((line) => `${VISUAL_DIRECTOR.frame.v} ${line.slice(1, -1)} ${VISUAL_DIRECTOR.frame.v}`),
    `${VISUAL_DIRECTOR.frame.mid}${VISUAL_DIRECTOR.frame.h.repeat(w - 2)}${VISUAL_DIRECTOR.frame.h === '═' ? '╣' : VISUAL_DIRECTOR.frame.tr}`,
    ...visualLandmark('NOW PLAYING', inner).map((line) => `${VISUAL_DIRECTOR.frame.v} ${line.slice(0, inner)}${VISUAL_DIRECTOR.frame.v}`),
    `${VISUAL_DIRECTOR.frame.v} ${pixelCell(clean(input.title, inner - 2, 'NO TRACK'), inner)} ${VISUAL_DIRECTOR.frame.v}`,
    `${VISUAL_DIRECTOR.frame.v} ${pixelStatePulse(input.state, inner)} ${VISUAL_DIRECTOR.frame.v}`,
    `${VISUAL_DIRECTOR.frame.v} ${pixelWaveform(input.positionRatio, inner)} ${VISUAL_DIRECTOR.frame.v}`,
    `${VISUAL_DIRECTOR.frame.v} ${pixelControlRail(input.actions ?? ['PLAY', 'PAUSE', 'SKIP', 'QUEUE'], input.activeAction ?? 'PLAY', inner)} ${VISUAL_DIRECTOR.frame.v}`,
    bottom,
  ].map((line) => pixelCell(line, w, 'LEFT', '')));
}


/** V61 director contract: one focal axis, one title scale, one state rail. */
export function visualCompositionContract(width: number, state: string, ratio: number): Readonly<{ width: number; scale: 1 | 2; state: string; ratio: number; axis: number }> {
  const w = widthOf(width);
  const normalized = clean(state, 12, 'IDLE');
  const active = normalized === 'ACTIVE' || normalized === 'SUCCESS';
  const scale = active && w >= 56 ? 2 : 1;
  const safeRatio = Math.max(0, Math.min(1, Number(ratio) || 0));
  return Object.freeze({ width: w, scale, state: normalized, ratio: safeRatio, axis: Math.round(safeRatio * (w - 1)) });
}

export function visualFocusWindow(width: number, state: string, ratio: number): readonly string[] {
  const contract = visualCompositionContract(width, state, ratio);
  const marker = contract.state === 'ACTIVE' ? VISUAL_DIRECTOR.active : VISUAL_DIRECTOR.focus;
  const rail = contract.state === 'ACTIVE' ? VISUAL_DIRECTOR.fill : VISUAL_DIRECTOR.rail;
  const body = Array.from({ length: contract.width - 2 }, (_, i) => i === contract.axis - 1 ? marker : rail).join('');
  return Object.freeze([pixelCell(`${VISUAL_DIRECTOR.focus} FOCUS ${VISUAL_DIRECTOR.idle}`, contract.width, 'CENTER'), pixelCell(body, contract.width, 'CENTER')]);
}



export type VisualStageContract = Readonly<{
  axisRatio: number;
  heroScale: 1 | 2;
  railWeight: 1 | 2 | 3;
  quietBand: number;
  focalWindow: number;
}>;

export function visualStageContract(widthValue: number, active: boolean, density: 'AIRY' | 'BALANCED' | 'DENSE'): VisualStageContract {
  const width = Math.max(30, Math.min(72, Math.trunc(Number(widthValue) || 48)));
  const heroScale: 1 | 2 = active && width >= 56 ? 2 : 1;
  const railWeight: 1 | 2 | 3 = active ? 3 : density === 'DENSE' ? 2 : 1;
  const quietBand = density === 'AIRY' ? 3 : density === 'BALANCED' ? 2 : 1;
  const focalWindow = Math.max(12, Math.min(width - 4, Math.round(width * (active ? 0.72 : 0.62))));
  return Object.freeze({ axisRatio: active ? 0.58 : 0.5, heroScale, railWeight, quietBand, focalWindow });
}


export type UnifiedVisualDirectorContract = Readonly<{
  width: number;
  state: UnifiedOpticalState;
  rail: string;
  axis: number;
}>;

export function unifiedVisualDirectorContract(widthValue: number, priority: number, surface: string, active = false, ratio = 0.5): UnifiedVisualDirectorContract {
  const width = widthOf(widthValue);
  const state = unifiedOpticalState(priority, surface, active, width);
  const safeRatio = Math.max(0, Math.min(1, Number(ratio) || 0));
  return Object.freeze({ width, state, rail: unifiedOpticalRail(width, state), axis: Math.round(safeRatio * (width - 1)) });
}
