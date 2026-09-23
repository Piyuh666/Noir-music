/**
 * NOIR MUSIC // PIXEL TYPOGRAPHY ENGINE V64.0
 *
 * Canonical text geometry for the Glyph Matrix UI. Every visible string is
 * normalized to a deterministic character-cell grid. Headings additionally
 * support a compact 3x5 bitmap alphabet; body text remains readable while
 * preserving exact cell alignment.
 */

export type PixelAlign = 'LEFT' | 'CENTER' | 'RIGHT';

const FONT: Readonly<Record<string, readonly string[]>> = Object.freeze({
  A: ['111','101','111','101','101'], B: ['110','101','110','101','110'], C: ['111','100','100','100','111'],
  D: ['110','101','101','101','110'], E: ['111','100','110','100','111'], F: ['111','100','110','100','100'],
  G: ['111','100','101','101','111'], H: ['101','101','111','101','101'], I: ['111','010','010','010','111'],
  J: ['001','001','001','101','111'], K: ['101','101','110','101','101'], L: ['100','100','100','100','111'],
  M: ['10001','11011','10101','10101','10101'], N: ['101','111','111','111','101'], O: ['111','101','101','101','111'],
  P: ['111','101','111','100','100'], Q: ['111','101','101','111','001'], R: ['111','101','110','101','101'],
  S: ['111','100','111','001','111'], T: ['111','010','010','010','010'], U: ['101','101','101','101','111'],
  V: ['101','101','101','101','010'], W: ['10101','10101','10101','11011','10001'], X: ['101','101','010','101','101'],
  Y: ['101','101','010','010','010'], Z: ['111','001','010','100','111'],
  '0': ['111','101','101','101','111'], '1': ['010','110','010','010','111'], '2': ['110','001','010','100','111'],
  '3': ['110','001','010','001','110'], '4': ['101','101','111','001','001'], '5': ['111','100','111','001','110'],
  '6': ['011','100','111','101','111'], '7': ['111','001','010','010','010'], '8': ['111','101','111','101','111'],
  '9': ['111','101','111','001','110'],
});

const GLYPH = '█';
const EMPTY = ' ';

/**
 * V59 canonical 5x7 bitmap alphabet. Unlike the legacy compact alphabet,
 * this set has a stable cap height and gives the UI enough optical mass for
 * hero/player titles without introducing a proportional font dependency.
 */
const FONT_5X7: Readonly<Record<string, readonly string[]>> = Object.freeze({
  A:['01110','10001','10001','11111','10001','10001','10001'],
  B:['11110','10001','10001','11110','10001','10001','11110'],
  C:['01111','10000','10000','10000','10000','10000','01111'],
  D:['11110','10001','10001','10001','10001','10001','11110'],
  E:['11111','10000','10000','11110','10000','10000','11111'],
  F:['11111','10000','10000','11110','10000','10000','10000'],
  G:['01111','10000','10000','10111','10001','10001','01111'],
  H:['10001','10001','10001','11111','10001','10001','10001'],
  I:['11111','00100','00100','00100','00100','00100','11111'],
  J:['00111','00010','00010','00010','10010','10010','01100'],
  K:['10001','10010','10100','11000','10100','10010','10001'],
  L:['10000','10000','10000','10000','10000','10000','11111'],
  M:['10001','11011','10101','10101','10001','10001','10001'],
  N:['10001','11001','10101','10011','10001','10001','10001'],
  O:['01110','10001','10001','10001','10001','10001','01110'],
  P:['11110','10001','10001','11110','10000','10000','10000'],
  Q:['01110','10001','10001','10001','10101','10010','01101'],
  R:['11110','10001','10001','11110','10100','10010','10001'],
  S:['01111','10000','10000','01110','00001','00001','11110'],
  T:['11111','00100','00100','00100','00100','00100','00100'],
  U:['10001','10001','10001','10001','10001','10001','01110'],
  V:['10001','10001','10001','10001','10001','01010','00100'],
  W:['10001','10001','10001','10101','10101','11011','10001'],
  X:['10001','10001','01010','00100','01010','10001','10001'],
  Y:['10001','10001','01010','00100','00100','00100','00100'],
  Z:['11111','00001','00010','00100','01000','10000','11111'],
  '0':['01110','10001','10011','10101','11001','10001','01110'],
  '1':['00100','01100','00100','00100','00100','00100','01110'],
  '2':['01110','10001','00001','00010','00100','01000','11111'],
  '3':['11110','00001','00001','01110','00001','00001','11110'],
  '4':['00010','00110','01010','10010','11111','00010','00010'],
  '5':['11111','10000','10000','11110','00001','00001','11110'],
  '6':['01110','10000','10000','11110','10001','10001','01110'],
  '7':['11111','00001','00010','00100','01000','01000','01000'],
  '8':['01110','10001','10001','01110','10001','10001','01110'],
  '9':['01110','10001','10001','01111','00001','00001','01110'],
  '-':['00000','00000','00000','11111','00000','00000','00000'],
  '_':['00000','00000','00000','00000','00000','00000','11111'],
  '.':['00000','00000','00000','00000','00000','01100','01100'],
  ':':['00000','01100','01100','00000','01100','01100','00000'],
  '/':['00001','00010','00010','00100','01000','01000','10000'],
  '·':['00000','00000','00100','00000','00100','00000','00000'],
});

/**
 * V63 7x9 hard-pixel slab-serif typeface (legacy compatibility). Every glyph has blocky terminal
 * slabs, a fixed nine-row cap height, and zero anti-aliasing. This is the
 * canonical display alphabet for Noir Music; all visible letters/numbers
 * stay inside the Glyph Matrix cell model.
 */
const FONT_7X9_SLAB_SERIF: Readonly<Record<string, readonly string[]>> = Object.freeze({
  A:['1111111','0011100','0110110','1100011','1100011','1111111','1100011','1100011','1111111'],
  B:['1111110','1100011','1100011','1111110','1100011','1100011','1100011','1100011','1111110'],
  C:['0111111','1100000','1100000','1100000','1100000','1100000','1100000','1100000','0111111'],
  D:['1111110','1100011','1100011','1100011','1100011','1100011','1100011','1100011','1111110'],
  E:['1111111','1100000','1100000','1111110','1100000','1100000','1100000','1100000','1111111'],
  F:['1111111','1100000','1100000','1111110','1100000','1100000','1100000','1100000','1100000'],
  G:['0111111','1100000','1100000','1100111','1100011','1100011','1100011','1100011','0111111'],
  H:['1100011','1100011','1100011','1111111','1100011','1100011','1100011','1100011','1100011'],
  I:['1111111','0011100','0011100','0011100','0011100','0011100','0011100','0011100','1111111'],
  J:['0011111','0001100','0001100','0001100','0001100','0001100','1101100','1101100','0111000'],
  K:['1100011','1100110','1101100','1111000','1111000','1101100','1100110','1100011','1100011'],
  L:['1100000','1100000','1100000','1100000','1100000','1100000','1100000','1100000','1111111'],
  M:['1100011','1110111','1110111','1101011','1101011','1100011','1100011','1100011','1100011'],
  N:['1100011','1110011','1110011','1101011','1101011','1100111','1100111','1100011','1100011'],
  O:['0111110','1100011','1100011','1100011','1100011','1100011','1100011','1100011','0111110'],
  P:['1111110','1100011','1100011','1100011','1111110','1100000','1100000','1100000','1100000'],
  Q:['0111110','1100011','1100011','1100011','1100011','1101011','1100110','1100011','0111111'],
  R:['1111110','1100011','1100011','1100011','1111110','1101100','1100110','1100011','1100011'],
  S:['0111111','1100000','1100000','0111110','0000011','0000011','0000011','0000011','1111110'],
  T:['1111111','0011100','0011100','0011100','0011100','0011100','0011100','0011100','0011100'],
  U:['1100011','1100011','1100011','1100011','1100011','1100011','1100011','1100011','0111110'],
  V:['1100011','1100011','1100011','1100011','1100011','0110110','0110110','0011100','0011100'],
  W:['1100011','1100011','1100011','1101011','1101011','1110111','1110111','1100011','1100011'],
  X:['1100011','1100011','0110110','0110110','0011100','0011100','0110110','1100011','1100011'],
  Y:['1100011','1100011','0110110','0110110','0011100','0011100','0011100','0011100','0011100'],
  Z:['1111111','0000011','0000110','0001100','0011000','0110000','1100000','1100000','1111111'],
  '0':['0111110','1100011','1100111','1101011','1110011','1100011','1100011','1100011','0111110'],
  '1':['0011100','0111100','1101100','0001100','0001100','0001100','0001100','0001100','1111111'],
  '2':['0111110','1100011','0000011','0000110','0001100','0011000','0110000','1100000','1111111'],
  '3':['1111110','0000011','0000011','0011110','0000011','0000011','0000011','1100011','0111110'],
  '4':['0001110','0011110','0110110','1100110','1100011','1111111','0000011','0000011','0000011'],
  '5':['1111111','1100000','1100000','1111110','0000011','0000011','0000011','1100011','0111110'],
  '6':['0111110','1100011','1100000','1100000','1111110','1100011','1100011','1100011','0111110'],
  '7':['1111111','0000011','0000110','0001100','0011000','0011000','0110000','0110000','0110000'],
  '8':['0111110','1100011','1100011','0111110','1100011','1100011','1100011','1100011','0111110'],
  '9':['0111110','1100011','1100011','1100011','0111111','0000011','0000011','1100011','0111110'],
  '-':['0000000','0000000','0000000','0000000','1111111','0000000','0000000','0000000','0000000'],
  '_':['0000000','0000000','0000000','0000000','0000000','0000000','0000000','0000000','1111111'],
  '.':['0000000','0000000','0000000','0000000','0000000','0000000','0011100','0011100','0011100'],
  ':':['0000000','0011100','0011100','0000000','0000000','0011100','0011100','0000000','0000000'],
  '/':['0000001','0000011','0000110','0001100','0011000','0110000','1100000','1100000','1000000'],
  '·':['0000000','0000000','0011100','0011100','0000000','0011100','0011100','0000000','0000000'],
});


/**
 * V64 Pixel Comic Sans bitmap typeface. This is an original pixel-art
 * interpretation of a playful handwritten/comic display style: rounded
 * shoulders, softened diagonals, uneven terminal rhythm, and chunky hard
 * pixels. It is intentionally not a proportional font and never uses
 * anti-aliasing.
 */
const FONT_7X9_PIXEL_COMIC_SANS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  A:['0011100','0110110','1100011','1100011','1111111','1100011','1100011','1100011','1100011'],
  B:['1111100','1100110','1100110','1111100','1100110','1100110','1100110','1100110','1111100'],
  C:['0011111','0110000','1100000','1100000','1100000','1100000','1100000','0110000','0011111'],
  D:['1111100','1100110','1100011','1100011','1100011','1100011','1100011','1100110','1111100'],
  E:['1111111','1100000','1100000','1111100','1100000','1100000','1100000','1100000','1111111'],
  F:['1111111','1100000','1100000','1111100','1100000','1100000','1100000','1100000','1100000'],
  G:['0011111','0110000','1100000','1100000','1101111','1100011','1100011','0110011','0011111'],
  H:['1100011','1100011','1100011','1111111','1100011','1100011','1100011','1100011','1100011'],
  I:['0111110','0011000','0011000','0011000','0011000','0011000','0011000','0011000','0111110'],
  J:['0001111','0000110','0000110','0000110','0000110','1100110','1100110','0110110','0011100'],
  K:['1100011','1100110','1101100','1111000','1110000','1111000','1101100','1100110','1100011'],
  L:['1100000','1100000','1100000','1100000','1100000','1100000','1100000','1100000','1111111'],
  M:['1100011','1110111','1111111','1101011','1100011','1100011','1100011','1100011','1100011'],
  N:['1100011','1110011','1111011','1101111','1100111','1100011','1100011','1100011','1100011'],
  O:['0011100','0110110','1100011','1100011','1100011','1100011','1100011','0110110','0011100'],
  P:['1111100','1100110','1100110','1111100','1100000','1100000','1100000','1100000','1100000'],
  Q:['0011100','0110110','1100011','1100011','1100011','1101011','1100110','0110110','0011101'],
  R:['1111100','1100110','1100110','1111100','1111000','1101100','1100110','1100011','1100011'],
  S:['0011111','0110000','1100000','0111100','0011110','0000011','0000011','1100110','0111100'],
  T:['1111111','0111110','0011000','0011000','0011000','0011000','0011000','0011000','0011000'],
  U:['1100011','1100011','1100011','1100011','1100011','1100011','1100011','0110110','0011100'],
  V:['1100011','1100011','1100011','1100011','1100011','0110110','0110110','0011100','0011100'],
  W:['1100011','1100011','1100011','1101011','1101011','1111111','1110111','1100011','1100011'],
  X:['1100011','1100011','0110110','0011100','0011100','0011100','0110110','1100011','1100011'],
  Y:['1100011','1100011','0110110','0110110','0011100','0011100','0011100','0011100','0011100'],
  Z:['1111111','0000011','0000110','0001100','0011000','0110000','1100000','1100000','1111111'],
  '0':['0011100','0110110','1100011','1100111','1101011','1110011','1100011','0110110','0011100'],
  '1':['0011000','0111000','1111000','0011000','0011000','0011000','0011000','0011000','1111111'],
  '2':['0011100','0110110','1100011','0000011','0000110','0001100','0011000','0110000','1111111'],
  '3':['0111100','1100110','0000011','0000110','0011100','0000110','0000011','1100110','0111100'],
  '4':['0001100','0011100','0111100','1101100','1100110','1111111','0000110','0000110','0000110'],
  '5':['1111111','1100000','1100000','1111100','0000011','0000011','0000011','1100110','0111100'],
  '6':['0011110','0110000','1100000','1111100','1100110','1100011','1100011','0110110','0011100'],
  '7':['1111111','0000011','0000110','0001100','0011000','0011000','0110000','0110000','0110000'],
  '8':['0011100','0110110','1100011','0110110','0011100','0110110','1100011','0110110','0011100'],
  '9':['0011100','0110110','1100011','1100011','0111111','0000011','0000110','0110110','0111100'],
  '-':['0000000','0000000','0000000','0011110','0111111','0011110','0000000','0000000','0000000'],
  '_':['0000000','0000000','0000000','0000000','0000000','0000000','0000000','0111111','1111111'],
  '.':['0000000','0000000','0000000','0000000','0000000','0000000','0011100','0110110','0011100'],
  ':':['0000000','0011100','0110110','0011100','0000000','0011100','0110110','0011100','0000000'],
  '/':['0000011','0000110','0000110','0001100','0011000','0011000','0110000','1100000','1100000'],
  '·':['0000000','0000000','0011100','0110110','0011100','0000000','0011100','0000000','0000000'],
});

const KERNING: Readonly<Record<string, number>> = Object.freeze({
  'AV': -1, 'AW': -1, 'AY': -1, 'TA': -1, 'TO': -1, 'VA': -1, 'WA': -1,
  'YO': -1, 'LT': -1, 'LY': -1,
});

export function pixelNormalize(value: unknown, maxWidth: number, fallback = '—'): string {
  const width = Math.max(1, Math.trunc(maxWidth));
  const text = String(value ?? '').replace(/[\\r\\n\\t]+/g, ' ').replace(/ +/g, ' ').trim().toUpperCase();
  return (text || fallback).slice(0, width);
}

export function pixelCell(value: unknown, width: number, align: PixelAlign = 'LEFT', fallback = '—'): string {
  const w = Math.max(1, Math.trunc(width));
  const text = pixelNormalize(value, w, fallback).slice(0, w);
  const pad = w - text.length;
  if (align === 'RIGHT') return ' '.repeat(pad) + text;
  if (align === 'CENTER') {
    const left = Math.floor(pad / 2);
    return ' '.repeat(left) + text + ' '.repeat(pad - left);
  }
  return text + ' '.repeat(pad);
}

/** Render the legacy compact bitmap heading. Kept for API compatibility. */
export function pixelBitmapTextCompact(value: unknown, maxColumns: number, gap = 1): readonly string[] {
  const text = pixelNormalize(value, 64, 'NOIR');
  const columns = Math.max(3, Math.trunc(maxColumns));
  const glyphs: string[][] = [];
  let used = 0;
  for (const char of text) {
    if (char === ' ') {
      if (used + 2 > columns) break;
      glyphs.push(['0','0','0','0','0']); used += 2; continue;
    }
    const glyph = FONT[char] ?? ['111','101','101','101','111'];
    const glyphWidth = glyph[0].length;
    const next = used === 0 ? glyphWidth : used + gap + glyphWidth;
    if (next > columns) break;
    glyphs.push(glyph as string[]);
    used = next;
  }
  return Object.freeze(Array.from({ length: 5 }, (_, row) => glyphs.map((glyph) => glyph[row].replace(/1/g, GLYPH).replace(/0/g, EMPTY)).join(' '.repeat(gap))));
}


/** Measure bitmap text using deterministic character-level spacing. */
export function pixelMeasure(value: unknown, gap = 1): number {
  const text = pixelNormalize(value, 64, 'NOIR');
  let width = 0;
  let previous = '';
  for (const char of text) {
    if (char === ' ') { width += 3; previous = char; continue; }
    const glyph = FONT_5X7[char] ?? FONT_5X7['O'];
    const glyphWidth = glyph[0].length;
    const kern = previous ? (KERNING[`${previous}${char}`] ?? 0) : 0;
    width += glyphWidth + (previous ? gap + kern : 0);
    previous = char;
  }
  return Math.max(0, width);
}

/** Render the canonical 5x7 alphabet with deterministic kerning. */
export function pixelBitmapText5x7(value: unknown, maxColumns: number, gap = 1): readonly string[] {
  const text = pixelNormalize(value, 64, 'NOIR');
  const columns = Math.max(5, Math.trunc(maxColumns));
  const rows: string[][] = Array.from({ length: 7 }, () => []);
  let used = 0;
  let previous = '';
  for (const char of text) {
    if (char === ' ') {
      const next = used === 0 ? 3 : used + 3;
      if (next > columns) break;
      for (const row of rows) row.push('   ');
      used = next; previous = char; continue;
    }
    const glyph = FONT_5X7[char] ?? FONT_5X7['O'];
    const kern = previous ? (KERNING[`${previous}${char}`] ?? 0) : 0;
    const spacing = previous ? Math.max(0, gap + kern) : 0;
    const next = used + spacing + glyph[0].length;
    if (next > columns) break;
    for (let row = 0; row < 7; row += 1) {
      if (spacing) rows[row].push(' '.repeat(spacing));
      rows[row].push(glyph[row]);
    }
    used = next; previous = char;
  }
  return Object.freeze(rows.map((row) => row.join('').replace(/1/g, GLYPH).replace(/0/g, EMPTY)));
}

/** Render the canonical V64 Pixel Comic Sans hard-pixel alphabet. */
export function pixelBitmapTextPixelComicSans(value: unknown, maxColumns: number, gap = 1): readonly string[] {
  const text = pixelNormalize(value, 64, 'NOIR');
  const columns = Math.max(7, Math.trunc(maxColumns));
  const rows: string[][] = Array.from({ length: 9 }, () => []);
  let used = 0;
  let previous = '';
  for (const char of text) {
    if (char === ' ') {
      const next = used === 0 ? 4 : used + 4;
      if (next > columns) break;
      for (const row of rows) row.push('    ');
      used = next; previous = char; continue;
    }
    const glyph = FONT_7X9_PIXEL_COMIC_SANS[char] ?? FONT_7X9_PIXEL_COMIC_SANS['O'];
    const kern = previous && previous !== ' ' ? (KERNING[`${previous}${char}`] ?? 0) : 0;
    const spacing = previous && previous !== ' ' ? Math.max(1, gap + kern) : 0;
    const next = used + spacing + glyph[0].length;
    if (next > columns) break;
    for (let row = 0; row < 9; row += 1) {
      if (spacing) rows[row].push(' '.repeat(spacing));
      rows[row].push(glyph[row]);
    }
    used = next; previous = char;
  }
  return Object.freeze(rows.map((row) => row.join('').replace(/1/g, GLYPH).replace(/0/g, EMPTY)));
}

/** Render the canonical 7x9 hard-pixel slab-serif alphabet. */
export function pixelBitmapTextSlabSerif(value: unknown, maxColumns: number, gap = 1): readonly string[] {
  const text = pixelNormalize(value, 64, 'NOIR');
  const columns = Math.max(7, Math.trunc(maxColumns));
  const rows: string[][] = Array.from({ length: 9 }, () => []);
  let used = 0;
  let previous = '';
  for (const char of text) {
    if (char === ' ') {
      const next = used === 0 ? 4 : used + 4;
      if (next > columns) break;
      for (const row of rows) row.push('    ');
      used = next; previous = char; continue;
    }
    const glyph = FONT_7X9_SLAB_SERIF[char] ?? FONT_7X9_SLAB_SERIF['O'];
    const kern = previous && previous !== ' ' ? (KERNING[`${previous}${char}`] ?? 0) : 0;
    const spacing = previous && previous !== ' ' ? Math.max(1, gap + kern) : 0;
    const next = used + spacing + glyph[0].length;
    if (next > columns) break;
    for (let row = 0; row < 9; row += 1) {
      if (spacing) rows[row].push(' '.repeat(spacing));
      rows[row].push(glyph[row]);
    }
    used = next; previous = char;
  }
  return Object.freeze(rows.map((row) => row.join('').replace(/1/g, GLYPH).replace(/0/g, EMPTY)));
}

/** Scale a bitmap without changing its pixel identity or cell-locking. */
export function pixelBitmapTextScaled(value: unknown, maxColumns: number, scale: 1 | 2 = 1, gap = 1): readonly string[] {
  const safeScale = scale === 2 ? 2 : 1;
  const base = pixelBitmapTextPixelComicSans(value, Math.max(7, Math.floor(maxColumns / safeScale)), gap);
  if (safeScale === 1) return base;
  return Object.freeze(base.flatMap((row) => {
    const expanded = Array.from(row, (cell) => cell === ' ' ? '  ' : `${cell}${cell}`).join('');
    return [expanded, expanded];
  }));
}

/** V64 optical measurement: returns the exact rendered width after kerning. */
export function pixelMeasureExact(value: unknown, gap = 1): number {
  const text = pixelNormalize(value, 64, 'NOIR');
  let total = 0;
  let previous = '';
  for (const char of text) {
    if (char === ' ') {
      total += previous ? gap + 4 : 4;
      previous = char;
      continue;
    }
    const glyph = FONT_7X9_PIXEL_COMIC_SANS[char] ?? FONT_7X9_PIXEL_COMIC_SANS['O'];
    const kern = previous && previous !== ' ' ? (KERNING[`${previous}${char}`] ?? 0) : 0;
    total += (previous && previous !== ' ' ? gap : 0) + kern + glyph[0].length;
    previous = char;
  }
  return Math.max(0, total);
}

/** V61 optical centering trims bitmap whitespace before cell alignment. */
export function pixelTrimBitmap(rows: readonly string[]): readonly string[] {
  if (!rows.length) return Object.freeze([]);
  let left = Number.POSITIVE_INFINITY;
  let right = -1;
  for (const row of rows) {
    const l = row.search(/[^ ]/);
    const r = row.search(/\s*$/);
    if (l >= 0) {
      left = Math.min(left, l);
      right = Math.max(right, r - 1);
    }
  }
  if (right < 0 || left === Number.POSITIVE_INFINITY) return Object.freeze(rows.map(() => ''));
  return Object.freeze(rows.map((row) => row.slice(left, right + 1)));
}

/** V61 baseline-locks a bitmap to a fixed row count without proportional fonts. */
export function pixelBaselineLock(rows: readonly string[], height = 7): readonly string[] {
  const h = Math.max(1, Math.trunc(height));
  const source = rows.slice(0, h);
  const out = source.slice();
  while (out.length < h) out.push('');
  return Object.freeze(out.map((row) => row));
}

/** V61 renders a bitmap into an exact cell width with optical centering. */
export function pixelBitmapComposition(
  value: unknown,
  maxColumns: number,
  options: Readonly<{ scale?: 1 | 2; gap?: number; align?: PixelAlign }> = {},
): readonly string[] {
  const scale = options.scale === 2 ? 2 : 1;
  const gap = Math.max(0, Math.trunc(options.gap ?? 1));
  const rows = pixelBitmapTextScaled(value, maxColumns, scale, gap);
  const trimmed = pixelTrimBitmap(rows);
  const width = Math.max(1, Math.trunc(maxColumns));
  const align = options.align ?? 'CENTER';
  return Object.freeze(trimmed.map((row) => pixelCell(row, width, align, '')));
}

/** V61 creates a compact pixel baseline carrying one deterministic focus point. */
export function pixelBaseline(width: number, ratio = 0.5, active = true): string {
  const w = Math.max(1, Math.trunc(width));
  const r = Math.max(0, Math.min(1, Number(ratio) || 0));
  const cursor = Math.max(0, Math.min(w - 1, Math.round(r * (w - 1))));
  return Array.from({ length: w }, (_, i) => i === cursor ? (active ? GLYPH : '·') : (active ? '─' : '┄')).join('');
}

/**
 * Canonical V61 bitmap writer. All heading/label callers now receive the
 * stable 5x7 Glyph Matrix alphabet by default; the compact writer remains
 * available only for compatibility with older compositions.
 */
export function pixelBitmapText(value: unknown, maxColumns: number, gap = 1): readonly string[] {
  return pixelBitmapTextPixelComicSans(value, maxColumns, gap);
}

/** Pixel-writing rule: never emit a line outside the requested cell width. */
export function pixelLine(value: unknown, width: number, align: PixelAlign = 'LEFT'): string {
  return pixelCell(value, width, align);
}

export function pixelSignature(width: number): string {
  return pixelCell('PIXEL GRID · 1 CELL · GLYPH MATRIX ONLY', width);
}



/** V61 optical typography contract: one measurable grid, one baseline, one visual mass. */
export type PixelTone = 'HERO' | 'ACTIVE' | 'QUIET' | 'MUTED';
export type PixelScale = 1 | 2;

export type PixelCompositionMetrics = Readonly<{
  width: number;
  height: number;
  inkWidth: number;
  inkHeight: number;
  scale: PixelScale;
  baseline: number;
  density: number;
}>;

/** Returns the ink bounds without changing the source bitmap. */
export function pixelInkBounds(rows: readonly string[]): Readonly<{ left: number; right: number; top: number; bottom: number }> {
  if (!rows.length) return Object.freeze({ left: 0, right: 0, top: 0, bottom: 0 });
  let left = Number.POSITIVE_INFINITY;
  let right = -1;
  let top = Number.POSITIVE_INFINITY;
  let bottom = -1;
  for (let y = 0; y < rows.length; y += 1) {
    const row = rows[y] ?? '';
    for (let x = 0; x < row.length; x += 1) {
      if (row[x] !== ' ') {
        left = Math.min(left, x); right = Math.max(right, x);
        top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
    }
  }
  if (right < 0) return Object.freeze({ left: 0, right: 0, top: 0, bottom: 0 });
  return Object.freeze({ left, right, top, bottom });
}

/** Deterministic optical density of a bitmap; useful for hierarchy decisions. */
export function pixelDensity(rows: readonly string[]): number {
  const area = rows.reduce((sum, row) => sum + row.length, 0);
  if (!area) return 0;
  const ink = rows.reduce((sum, row) => sum + Array.from(row).filter((cell) => cell !== ' ').length, 0);
  return ink / area;
}

/** Centers a bitmap on a fixed character-cell canvas without proportional-font behavior. */
export function pixelCenterBitmap(rows: readonly string[], width: number, height = rows.length): readonly string[] {
  const w = Math.max(1, Math.trunc(width));
  const h = Math.max(1, Math.trunc(height));
  const trimmed = pixelTrimBitmap(rows);
  const left = Math.max(0, Math.floor((w - (trimmed[0]?.length ?? 0)) / 2));
  const top = Math.max(0, Math.floor((h - trimmed.length) / 2));
  return Object.freeze(Array.from({ length: h }, (_, y) => {
    if (y < top || y >= top + trimmed.length) return ' '.repeat(w);
    const row = trimmed[y - top] ?? '';
    return ' '.repeat(left) + row.slice(0, Math.max(0, w - left)) + ' '.repeat(Math.max(0, w - left - row.length));
  }));
}

/** Locks a composition to an exact width and stable baseline while preserving bitmap pixels. */
export function pixelOpticalLock(rows: readonly string[], width: number, baseline = rows.length - 1): readonly string[] {
  const w = Math.max(1, Math.trunc(width));
  const h = Math.max(1, rows.length);
  const safeBaseline = Math.max(0, Math.min(h - 1, Math.trunc(baseline)));
  const top = Math.max(0, safeBaseline - Math.max(0, rows.length - 1));
  const normalized = rows.slice(0, h).map((row) => row.slice(0, w));
  const padded = Array.from({ length: h }, (_, i) => {
    const source = normalized[i] ?? '';
    return source + ' '.repeat(Math.max(0, w - source.length));
  });
  if (top === 0) return Object.freeze(padded);
  return Object.freeze([...Array.from({ length: top }, () => ' '.repeat(w)), ...padded].slice(0, h));
}

/** Produces a complete, inspectable metric contract for a pixel composition. */
export function pixelCompositionMetrics(value: unknown, maxColumns: number, scale: PixelScale = 1, gap = 1): PixelCompositionMetrics {
  const safeScale: PixelScale = scale === 2 ? 2 : 1;
  const rows = pixelBitmapTextScaled(value, Math.max(5, Math.floor(maxColumns / safeScale)), safeScale, gap);
  const bounds = pixelInkBounds(rows);
  const inkWidth = bounds.right >= bounds.left ? bounds.right - bounds.left + 1 : 0;
  const inkHeight = bounds.bottom >= bounds.top ? bounds.bottom - bounds.top + 1 : 0;
  return Object.freeze({
    width: rows.reduce((m, row) => Math.max(m, row.length), 0),
    height: rows.length,
    inkWidth,
    inkHeight,
    scale: safeScale,
    baseline: Math.max(0, rows.length - 1),
    density: pixelDensity(rows),
  });
}

/** High-level title primitive: bitmap + optical trim + exact canvas + baseline lock. */
export function pixelOpticalTitle(value: unknown, width: number, scale: PixelScale = 1, tone: PixelTone = 'HERO'): readonly string[] {
  const w = Math.max(12, Math.trunc(width));
  const preferred = tone === 'ACTIVE' || tone === 'HERO' ? scale : 1;
  const rows = pixelBitmapTextScaled(value, Math.max(5, Math.floor((w - 2) / preferred)), preferred, tone === 'ACTIVE' ? 1 : 1);
  const trimmed = pixelTrimBitmap(rows);
  const centered = pixelCenterBitmap(trimmed, Math.max(1, w - 2), trimmed.length);
  return Object.freeze(centered.map((row) => pixelCell(row, w, 'CENTER', '')));
}


/** V64 unified optical cell contract. The typography engine owns the final
 * geometry so directors do not need to duplicate centering, baseline or scale logic. */
export type PixelOpticalContract = Readonly<{
  width: number;
  height: number;
  scale: PixelScale;
  tone: PixelTone;
  baseline: number;
  inkWidth: number;
  inkHeight: number;
  density: number;
}>;

export function pixelOpticalContract(value: unknown, width: number, tone: PixelTone = 'HERO', requestedScale?: PixelScale): PixelOpticalContract {
  const w = Math.max(12, Math.trunc(width));
  const scale: PixelScale = requestedScale ?? ((tone === 'HERO' || tone === 'ACTIVE') && w >= 56 ? 2 : 1);
  const rows = pixelOpticalTitle(value, w, scale, tone);
  const bounds = pixelInkBounds(rows);
  const inkWidth = bounds.right >= bounds.left ? bounds.right - bounds.left + 1 : 0;
  const inkHeight = bounds.bottom >= bounds.top ? bounds.bottom - bounds.top + 1 : 0;
  return Object.freeze({ width: w, height: rows.length, scale, tone, baseline: Math.max(0, rows.length - 1), inkWidth, inkHeight, density: pixelDensity(rows) });
}

/** One canonical final title surface. Every row is exact-width and baseline locked. */
export function pixelOpticalSurface(value: unknown, width: number, tone: PixelTone = 'HERO', requestedScale?: PixelScale): readonly string[] {
  const contract = pixelOpticalContract(value, width, tone, requestedScale);
  return Object.freeze(pixelOpticalLock(pixelOpticalTitle(value, contract.width, contract.scale, tone), contract.width, contract.baseline));
}

/** Deterministic optical gap derived from ink mass rather than arbitrary spacing. */
export function pixelOpticalGap(width: number, density: number, tone: PixelTone = 'QUIET'): number {
  const w = Math.max(1, Math.trunc(width));
  const d = Math.max(0, Math.min(1, Number(density) || 0));
  const base = tone === 'HERO' || tone === 'ACTIVE' ? 2 : tone === 'MUTED' ? 0 : 1;
  return Math.max(0, Math.min(3, base + (d < 0.18 ? 1 : 0) - (w < 36 ? 1 : 0)));
}
