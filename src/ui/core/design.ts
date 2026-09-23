/**
 * NOIR MUSIC // GLYPH MATRIX SUPREME UI
 *
 * V48.6: one visual language only. Every Discord surface uses the same
 * monochrome Glyph Matrix grammar; width changes density and composition,
 * never the visual identity. No generic emoji, gradients, decorative styles,
 * or competing UI skins are introduced here.
 */
import type { UiCoreSurface, UiDensity, UiState } from './contracts';
import { pixelBitmapText, pixelCell, pixelLine, pixelSignature } from './pixelTypography';
import { pixelSectionHeading, pixelFrame } from './visualComposition';

/** Kept as a compatibility type for existing callers. Visually, every value
 * resolves to the single canonical Glyph Matrix renderer. */
export type UiDesign = 'GRID' | 'MATRIX' | 'TERMINAL' | 'OPERATOR' | 'CIRCUIT' | 'DENSE';

const GLYPH = Object.freeze({
  tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║', mid: '╠',
  dot: '·', focus: '◆', active: '●', idle: '◇', busy: '◐',
  error: '×', locked: '▣', arrow: '›', fill: '█', midFill: '▓', empty: '░',
  pixel: '□', branch: '┼', scan: '⌁', play: '▶', pause: 'Ⅱ', next: '›', stop: '■',
});

const clean = (value: unknown, max: number, fallback = '—') => {
  const text = String(value ?? '').replace(/[\\r\\n\\t]+/g, ' ').replace(/ +/g, ' ').trim();
  return (text || fallback).slice(0, Math.max(1, max));
};
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, Math.trunc(Number(n) || 0)));
const fit = (value: string, width: number) => value.slice(0, Math.max(0, width)).padEnd(Math.max(0, width), ' ');

export function designForWidth(_width: number): UiDesign { return 'MATRIX'; }

/** Width affects density, not branding. */
export function designTokens(_design: UiDesign = 'MATRIX') {
  return Object.freeze({ design: 'MATRIX' as const, ...GLYPH, accent: GLYPH.focus, inactive: GLYPH.dot });
}

export function designMeter(ratio: number, width: number, _design: UiDesign = 'MATRIX'): string {
  const w = clamp(width, 4, 60);
  const n = Math.round(Math.max(0, Math.min(1, Number(ratio) || 0)) * w);
  return `${GLYPH.fill.repeat(n)}${GLYPH.empty.repeat(w - n)}`;
}

export function designControlRail(
  labels: readonly { label: string; active?: boolean; enabled?: boolean }[],
  width: number,
  _design: UiDesign = 'MATRIX',
): string {
  const w = clamp(width, 18, 72);
  const shown = labels.slice(0, 7);
  if (!shown.length) return `${GLYPH.dot} NO CONTROLS`;
  const cell = Math.max(6, Math.floor((w - Math.max(0, shown.length - 1)) / shown.length));
  return shown.map((item) => {
    const state = item.enabled === false ? GLYPH.pixel : item.active ? GLYPH.focus : GLYPH.dot;
    return fit(`${state} ${clean(item.label, cell - 2, 'ACTION')}`, cell);
  }).join(GLYPH.v);
}

export function designStateRail(state: UiState, width: number, _design: UiDesign = 'MATRIX'): string {
  const glyph = state === 'ACTIVE' || state === 'SUCCESS' ? GLYPH.focus
    : state === 'ERROR' ? GLYPH.error
    : state === 'BUSY' || state === 'WARNING' ? GLYPH.busy
    : state === 'LOCKED' ? GLYPH.locked : GLYPH.idle;
  const ratio = state === 'ACTIVE' || state === 'SUCCESS' ? 1 : state === 'ERROR' ? 0.08 : 0.55;
  const meter = designMeter(ratio, Math.max(8, width - 22));
  return `${glyph} ${state.padEnd(8)} ${meter}`;
}

/**
 * Premium hierarchy: identity → state → body → signal rail.
 * This makes every panel feel like one instrument instead of unrelated boxes.
 */
export function decorateSurface(surface: UiCoreSurface, width: number, _design: UiDesign = 'MATRIX'): UiCoreSurface {
  const w = clamp(width, 30, 72);
  // Pixel-elegance rule: never stack a second frame around a surface that
  // already owns a canonical Glyph Matrix frame. One surface = one frame.
  // This tiny boundary rule removes visual noise without changing semantics.
  if (surface.lines.length >= 2 && surface.lines[0]?.startsWith('╔') && surface.lines.at(-1)?.startsWith('╚')) {
    return Object.freeze({ ...surface, lines: Object.freeze(surface.lines.map((line) => pixelLine(line, w))), rows: surface.lines.length });
  }
  const inner = w - 4;
  const title = clean(surface.surface, 18, 'SURFACE').toUpperCase();
  const titleBlock = pixelSectionHeading(title, w);
  const divider = `${GLYPH.mid}${GLYPH.h.repeat(w - 2)}${GLYPH.mid}`;
  const body = surface.lines.slice(0, 14).map((line) => `${GLYPH.v} ${fit(clean(line, inner), inner)} ${GLYPH.v}`);
  const signal = `${GLYPH.v} ${fit(`${GLYPH.scan} SIGNAL ${surface.priority.toString().padStart(3, '0')} ${GLYPH.dot} ${surface.rows.toString().padStart(2, '0')} ROWS`, inner)} ${GLYPH.v}`;
  const top = `${GLYPH.tl}${GLYPH.h.repeat(w - 2)}${GLYPH.tr}`;
  const composed = [top, ...titleBlock.map((line) => `${GLYPH.v} ${fit(line, inner)} ${GLYPH.v}`), divider, ...body, signal, `${GLYPH.bl}${GLYPH.h.repeat(w - 2)}${GLYPH.br}`];
  const lines = pixelFrame(composed, w);
  return Object.freeze({ ...surface, lines: Object.freeze(lines), rows: lines.length });
}

/** Hero header used by the player/dashboard compositor. */
export function glyphMatrixHero(title: string, subtitle: string, width: number): readonly string[] {
  const w = clamp(width, 30, 72);
  const inner = w - 4;
  return Object.freeze([
    `${GLYPH.tl}${GLYPH.h.repeat(w - 2)}${GLYPH.tr}`,
    `${GLYPH.v} ${fit(`${GLYPH.focus} ${clean(title, inner - 2, 'NOIR MUSIC').toUpperCase()}`, inner)} ${GLYPH.v}`,
    `${GLYPH.v} ${fit(`${GLYPH.arrow} ${clean(subtitle, inner - 2, 'GLYPH MATRIX')}`, inner)} ${GLYPH.v}`,
    `${GLYPH.mid}${GLYPH.h.repeat(w - 2)}${GLYPH.mid}`,
  ]);
}

export function glyphMatrixSignal(label: string, value: string, width: number): string {
  const w = clamp(width, 30, 72);
  const inner = w - 4;
  const right = clean(value, Math.min(18, inner - 8));
  const left = clean(label, Math.max(4, inner - right.length - 5)).toUpperCase();
  return `${GLYPH.v} ${fit(`${GLYPH.dot} ${left}${' '.repeat(Math.max(1, inner - left.length - right.length - 4))}${right} ${GLYPH.v}`, inner)} ${GLYPH.v}`;
}

export function designSignature(_design: UiDesign, density: UiDensity): string {
  return `${GLYPH.focus} ${pixelSignature(42)} ${GLYPH.dot} ${density}`;
}

/**
 * V48.7 pixel-writing contract. The heading is a true bitmap grid; every
 * surrounding label is cell-locked so wrapping can never break the visual
 * geometry. This is presentation-only and does not alter command semantics.
 */
export function pixelHero(title: string, subtitle: string, width: number): readonly string[] {
  const w = clamp(width, 30, 72);
  const inner = w - 4;
  const bitmap = pixelBitmapText(title, Math.max(12, inner - 2));
  const frame = `${GLYPH.tl}${GLYPH.h.repeat(w - 2)}${GLYPH.tr}`;
  const divider = `${GLYPH.mid}${GLYPH.h.repeat(w - 2)}${GLYPH.mid}`;
  const body = bitmap.map((row) => `${GLYPH.v} ${pixelCell(row, inner)} ${GLYPH.v}`);
  return Object.freeze([
    frame,
    ...body,
    divider,
    `${GLYPH.v} ${pixelLine(`${GLYPH.arrow} ${subtitle}`, inner)} ${GLYPH.v}`,
    `${GLYPH.v} ${pixelLine(`${GLYPH.dot} PIXEL WRITING · MATRIX ONLY`, inner)} ${GLYPH.v}`,
    `${GLYPH.bl}${GLYPH.h.repeat(w - 2)}${GLYPH.br}`,
  ]);
}

export function pixelSurfaceLine(value: unknown, width: number): string {
  return pixelLine(value, clamp(width, 8, 72));
}
