/**
 * NOIR MUSIC // GLYPH MATRIX VISUAL COMPOSITION V50.0
 *
 * High-leverage visual system: every major UI landmark is composed from the
 * same pixel geometry, frame ownership, optical gutters and signal language.
 * This is presentation-only; it does not alter command or playback semantics.
 */
import { pixelBitmapText, pixelCell, pixelNormalize } from './pixelTypography';

export const MATRIX_COMPOSITION = Object.freeze({
  frame: Object.freeze({ tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║', mid: '╠' }),
  marker: '◆',
  quiet: '◇',
  active: '●',
  rail: '─',
  fill: '█',
  empty: '░',
  tick: '·',
  gutter: 2,
});

const clampWidth = (width: number) => Math.max(30, Math.min(72, Math.trunc(Number(width) || 48)));

/** Five-row bitmap wordmark with an optical center, never normal text. */
export function pixelWordmark(value: string, width: number): readonly string[] {
  const w = clampWidth(width);
  const bitmap = pixelBitmapText(pixelNormalize(value, 32, 'NOIR MUSIC'), Math.max(12, w - 8), 1);
  return Object.freeze(bitmap.map((row) => pixelCell(row, w, 'CENTER', '')));
}

/** Compact bitmap section landmark. It intentionally remains five rows so the
 * typography is genuinely pixel-written rather than merely monospace text. */
export function pixelSectionHeading(value: string, width: number): readonly string[] {
  const w = clampWidth(width);
  const label = pixelNormalize(value, 18, 'SURFACE');
  const bitmap = pixelBitmapText(label, Math.max(8, Math.min(24, w - 8)), 1);
  return Object.freeze(bitmap.map((row) => pixelCell(row, w, 'CENTER', '')));
}

/** A balanced, deterministic signal rail with a center focus marker. */
export function pixelFocusRail(value: number, width: number): string {
  const w = clampWidth(width);
  const usable = Math.max(8, w - 6);
  const ratio = Math.max(0, Math.min(1, Number(value) || 0));
  const filled = Math.round(ratio * usable);
  const left = Math.floor((usable - 1) / 2);
  const focus = Math.min(usable - 1, Math.max(0, Math.round(ratio * (usable - 1))));
  const rail = Array.from({ length: usable }, (_, i) => {
    if (i === focus) return MATRIX_COMPOSITION.marker;
    return i < filled ? MATRIX_COMPOSITION.fill : MATRIX_COMPOSITION.empty;
  }).join('');
  return pixelCell(`${MATRIX_COMPOSITION.quiet} ${rail} ${MATRIX_COMPOSITION.quiet}`, w);
}

/** Canonical one-owner frame. Existing framed surfaces are returned unchanged. */
export function pixelFrame(lines: readonly string[], width: number): readonly string[] {
  const w = clampWidth(width);
  const top = `${MATRIX_COMPOSITION.frame.tl}${MATRIX_COMPOSITION.frame.h.repeat(w - 2)}${MATRIX_COMPOSITION.frame.tr}`;
  const bottom = `${MATRIX_COMPOSITION.frame.bl}${MATRIX_COMPOSITION.frame.h.repeat(w - 2)}${MATRIX_COMPOSITION.frame.br}`;
  if (lines.length >= 2 && lines[0]?.startsWith(MATRIX_COMPOSITION.frame.tl) && lines.at(-1)?.startsWith(MATRIX_COMPOSITION.frame.bl)) {
    return Object.freeze(lines.map((line) => pixelCell(line, w)));
  }
  const body = lines.slice(0, 14).map((line) => {
    const text = pixelNormalize(line, w - 4, '');
    return pixelCell(`${MATRIX_COMPOSITION.frame.v} ${text} ${MATRIX_COMPOSITION.frame.v}`, w, 'LEFT', '');
  });
  return Object.freeze([top, ...body, bottom]);
}

/** Optical spacing pass: removes accidental empty rows and keeps all lines on
 * the same cell grid without introducing a second decorative language. */
export function opticalGrid(lines: readonly string[], width: number): readonly string[] {
  const w = clampWidth(width);
  const out: string[] = [];
  for (const raw of lines) {
    const line = pixelNormalize(raw, w, '');
    if (!line && out.at(-1) === pixelCell('', w, 'LEFT', '')) continue;
    out.push(pixelCell(line, w, 'LEFT', ''));
  }
  while (out.length && out.at(-1) === pixelCell('', w, 'LEFT', '')) out.pop();
  return Object.freeze(out);
}
