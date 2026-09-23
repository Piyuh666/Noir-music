/**
 * NOIR MUSIC // GLYPH MATRIX MICRO-ELEGANCE V62.0
 *
 * Smallest high-leverage visual overhaul: one optical rhythm system controls
 * hierarchy, spacing, focus, and surface cadence. No new skin is introduced.
 * Everything remains monochrome, Glyph Matrix, cell-locked, and deterministic.
 */
import { pixelBitmapComposition, pixelCell, pixelNormalize } from './pixelTypography';
import { unifiedOpticalState, unifiedOpticalRail, type UnifiedOpticalState } from './visualOrchestrator';

export const MICRO_ELEGANCE = Object.freeze({
  frame: '╔═╗║╠╣╚╝',
  rail: '─',
  signal: '·',
  focus: '◆',
  quiet: '◇',
  active: '●',
  idle: '○',
  gap: 1,
  maxConsecutiveBlank: 0,
});

const clean = (value: unknown) => pixelNormalize(value, 256, '').replace(/\s+$/g, '');
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, Math.trunc(Number(n) || 0)));

/** One optical divider, with a stable focus point instead of decorative noise. */
export function pixelDivider(width: number, lead = MICRO_ELEGANCE.focus): string {
  const w = Math.max(8, Math.trunc(width));
  const marker = clean(lead).slice(0, 1) || MICRO_ELEGANCE.focus;
  return `${marker}${MICRO_ELEGANCE.rail.repeat(Math.max(1, w - 1))}`.slice(0, w);
}

/**
 * Final surface pass. It removes only redundant vertical whitespace and keeps
 * every row on the exact same cell grid; frame ownership is never duplicated.
 */
export function polishPixelSurface(lines: readonly string[], width: number): readonly string[] {
  const w = Math.max(8, Math.trunc(width));
  const normalized: string[] = [];
  for (const raw of lines) {
    const line = clean(raw);
    if (!line && normalized.at(-1) === '') continue;
    normalized.push(pixelCell(line, w));
  }
  while (normalized.length && normalized.at(-1) === pixelCell('', w)) normalized.pop();
  return Object.freeze(normalized);
}

/** A balanced left/right information rail with an explicit focus marker. */
export function pixelPriorityLine(label: string, value: string, width: number): string {
  const w = Math.max(16, Math.trunc(width));
  const inner = w - 4;
  const labelWidth = clamp(Math.floor(inner * 0.34), 6, 24);
  const valueWidth = Math.max(4, inner - labelWidth - 3);
  const left = pixelNormalize(label, labelWidth, 'SIGNAL');
  const right = pixelNormalize(value, valueWidth, '—');
  return pixelCell(`${MICRO_ELEGANCE.signal} ${left.padEnd(labelWidth)} ${MICRO_ELEGANCE.focus} ${right}`, w);
}

/** Compact bitmap micro-label for high-value hierarchy anchors. */
export function pixelMicroLabel(value: string, width: number): readonly string[] {
  const w = Math.max(12, Math.trunc(width));
  const bitmap = pixelBitmapComposition(value, Math.max(8, Math.min(28, w - 2)), { scale: w >= 56 ? 2 : 1, gap: 1, align: 'CENTER' });
  return Object.freeze(bitmap.map((row) => pixelCell(row, w, 'CENTER', '')));
}

/** A quiet signal rail; visual weight changes through glyph density, not skins. */
export function pixelSignalRail(value: number, width: number): string {
  const w = Math.max(12, Math.trunc(width));
  const filled = clamp(Math.round(Math.max(0, Math.min(1, Number(value) || 0)) * (w - 4)), 0, w - 4);
  return pixelCell(`${MICRO_ELEGANCE.quiet} ${'█'.repeat(filled)}${'░'.repeat((w - 4) - filled)} ${MICRO_ELEGANCE.quiet}`, w);
}


export type MicroTone = 'FOCUS' | 'ACTIVE' | 'QUIET';

export function pixelOpticalGap(width: number, tone: MicroTone = 'QUIET'): string {
  const w = Math.max(8, Math.trunc(width));
  const marker = tone === 'ACTIVE' ? MICRO_ELEGANCE.active : tone === 'FOCUS' ? MICRO_ELEGANCE.focus : MICRO_ELEGANCE.quiet;
  const rail = tone === 'ACTIVE' ? '█' : tone === 'FOCUS' ? '▓' : '┄';
  return pixelCell(`${marker}${rail.repeat(Math.max(1, w - 2))}${marker}`, w, 'CENTER', '');
}

export function pixelMicroHierarchy(label: string, value: string, width: number, tone: MicroTone = 'QUIET'): readonly string[] {
  const w = Math.max(16, Math.trunc(width));
  const marker = tone === 'ACTIVE' ? MICRO_ELEGANCE.active : tone === 'FOCUS' ? MICRO_ELEGANCE.focus : MICRO_ELEGANCE.quiet;
  const title = pixelMicroLabel(label, w);
  const row = pixelPriorityLine(label, value, w);
  return Object.freeze([pixelCell(`${marker} ${label}`, w, 'CENTER', ''), ...title, row, pixelOpticalGap(w, tone)]);
}



export type V61MicroHierarchy = 'PRIMARY' | 'SECONDARY' | 'TERTIARY';

export function v61MicroHierarchy(priority: number): V61MicroHierarchy {
  const p = Math.max(0, Math.min(100, Math.trunc(Number(priority) || 0)));
  if (p >= 75) return 'PRIMARY';
  if (p >= 40) return 'SECONDARY';
  return 'TERTIARY';
}

export function v61PixelOpticalGap(widthValue: number, hierarchy: V61MicroHierarchy): string {
  const width = Math.max(1, Math.trunc(widthValue));
  const count = hierarchy === 'PRIMARY' ? 2 : hierarchy === 'SECONDARY' ? 1 : 0;
  return ' '.repeat(Math.min(count, Math.max(0, width - 1)));
}

export function v61PixelMicroHierarchy(label: string, value: string, widthValue: number, hierarchy: V61MicroHierarchy): string {
  const width = Math.max(12, Math.trunc(widthValue));
  const marker = hierarchy === 'PRIMARY' ? '◆' : hierarchy === 'SECONDARY' ? '◇' : '·';
  const labelWidth = Math.max(5, Math.floor(width * 0.3));
  const left = pixelCell(`${marker} ${label}`, labelWidth, 'LEFT', 'FIELD');
  const right = pixelCell(value, width - labelWidth, 'RIGHT', '—');
  return `${left}${right}`.slice(0, width);
}


export type UnifiedMicroSurface = Readonly<{
  hierarchy: V61MicroHierarchy;
  state: UnifiedOpticalState;
  gap: number;
  rail: string;
}>;

export function unifiedMicroSurface(priority: number, label: string, widthValue: number, active = false): UnifiedMicroSurface {
  const hierarchy = v61MicroHierarchy(priority);
  const state = unifiedOpticalState(priority, label, active, widthValue);
  const gap = state.priority === 'FOCAL' ? 2 : state.priority === 'ANCHOR' ? 1 : 0;
  return Object.freeze({ hierarchy, state, gap, rail: unifiedOpticalRail(Math.max(12, widthValue), state) });
}
