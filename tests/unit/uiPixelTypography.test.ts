import { describe, expect, it } from 'vitest';
import { pixelBitmapText, pixelCell, pixelHero, pixelSignature } from '../../src/ui/core/design';
import { pixelBitmapComposition, pixelBitmapText5x7, pixelBitmapTextSlabSerif, pixelBitmapTextPixelComicSans, pixelBitmapTextScaled, pixelBaseline, pixelMeasureExact, pixelTrimBitmap, pixelInkBounds, pixelDensity, pixelCenterBitmap, pixelOpticalLock, pixelCompositionMetrics, pixelOpticalTitle, pixelOpticalContract, pixelOpticalSurface, pixelOpticalGap } from '../../src/ui/core/pixelTypography';

describe('Glyph Matrix Pixel Typography V64 Pixel Comic Sans Engine', () => {
  it('renders deterministic bitmap text', () => {
    const a = pixelBitmapText('NOIR MUSIC', 48).join('\n');
    const b = pixelBitmapText('NOIR MUSIC', 48).join('\n');
    expect(a).toBe(b);
    expect(a).toContain('█');
  });

  it('routes canonical pixelBitmapText through Pixel Comic Sans', () => {
    expect(pixelBitmapText('NOIR 2026', 80).join('\n')).toBe(pixelBitmapTextPixelComicSans('NOIR 2026', 80).join('\n'));
  });


  it('uses the hard-pixel 7x9 Pixel Comic Sans alphabet for canonical UI text', () => {
    const rows = pixelBitmapTextPixelComicSans('NOIR 2026', 80);
    expect(rows).toHaveLength(9);
    expect(rows.every((row) => row.length <= 80)).toBe(true);
    expect(rows.join('')).toContain('█');
  });

  it('keeps Pixel Comic Sans output anti-alias free and cell deterministic', () => {
    const rows = pixelBitmapText('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 220);
    expect(rows).toHaveLength(9);
    expect(rows.join('').match(/[^█ ]/g)).toBeNull();
  });

  it('locks every cell to the requested width', () => {
    expect(pixelCell('NOIR MUSIC', 40)).toHaveLength(40);
    expect(pixelSignature(42)).toHaveLength(42);
    for (const line of pixelHero('NOIR MUSIC', 'ACTIVE · TEST', 56)) expect(line.length).toBe(56);
  });

  it('keeps the hero entirely inside the pixel grid', () => {
    const hero = pixelHero('NOIR MUSIC', 'ACTIVE · TEST', 56);
    expect(hero[0].startsWith('╔')).toBe(true);
    expect(hero.at(-1)?.startsWith('╚')).toBe(true);
    expect(hero.join('\n')).toContain('PIXEL WRITING');
  });
});


import { decorateSurface } from '../../src/ui/core/design';

describe('Glyph Matrix micro-elegance contract', () => {
  it('does not stack a second frame around an already framed surface', () => {
    const surface = { surface: 'PLAYER' as const, lines: ['╔══╗', '║ X ║', '╚══╝'], rows: 3, priority: 100 };
    const result = decorateSurface(surface, 20, 'MATRIX');
    expect(result.lines).toHaveLength(3);
    expect(result.lines[0]).toContain('╔');
    expect(result.lines[2]).toContain('╚');
  });
});


describe('V61 optical composition primitives', () => {
  it('locks composition width at both pixel scales', () => {
    expect(pixelBitmapComposition('NOIR MUSIC', 56, { scale: 1 }).every((line) => line.length === 56)).toBe(true);
    expect(pixelBitmapComposition('NOIR MUSIC', 56, { scale: 2 }).every((line) => line.length === 56)).toBe(true);
  });
  it('keeps deterministic kerning and exact measurement', () => {
    expect(pixelMeasureExact('AV')).toBeLessThan(pixelMeasureExact('A V'));
    expect(pixelMeasureExact('NOIR')).toBe(pixelMeasureExact('NOIR'));
  });
  it('locks a stable seven-row baseline', () => {
    expect(pixelBitmapText5x7('NOIR', 40)).toHaveLength(7);
    expect(pixelBitmapTextScaled('NOIR', 40, 2)).toHaveLength(18);
    expect(pixelBaseline(40, 0.5)).toHaveLength(40);
  });
  it('trims only optical whitespace', () => {
    const rows = pixelBitmapText5x7('A', 20);
    expect(pixelTrimBitmap(rows).every((line) => line.length <= 5)).toBe(true);
  });
});


describe('V61 optical typography system', () => {
  it('exposes stable composition metrics', () => {
    const metrics = pixelCompositionMetrics('NOIR MUSIC', 60, 2);
    expect(metrics.height).toBe(18);
    expect(metrics.inkWidth).toBeGreaterThan(0);
    expect(metrics.density).toBeGreaterThan(0);
  });
  it('centers and locks bitmap geometry without proportional fonts', () => {
    const rows = pixelBitmapText5x7('NOIR', 40);
    const centered = pixelCenterBitmap(rows, 40, 9);
    const locked = pixelOpticalLock(centered, 40, 8);
    expect(centered.every((row) => row.length === 40)).toBe(true);
    expect(locked.every((row) => row.length === 40)).toBe(true);
    expect(pixelInkBounds(rows).right).toBeGreaterThan(0);
  });
  it('keeps density deterministic and title output cell-perfect', () => {
    const rows = pixelBitmapText5x7('NOIR', 40);
    expect(pixelDensity(rows)).toBe(pixelDensity(rows));
    expect(pixelOpticalTitle('NOIR MUSIC', 60, 2, 'HERO').every((row) => row.length === 60)).toBe(true);
  });
});


describe('V62 unified typography contract', () => {
  it('derives one deterministic geometry contract', () => {
    const contract = pixelOpticalContract('NOIR MUSIC', 64, 'HERO');
    expect(contract.width).toBe(64);
    expect(contract.scale).toBe(2);
    expect(contract.inkWidth).toBeGreaterThan(0);
  });
  it('produces a final cell-perfect optical surface', () => {
    const rows = pixelOpticalSurface('NOIR MUSIC', 60, 'ACTIVE');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.length === 60)).toBe(true);
    expect(pixelOpticalGap(60, 0.1, 'HERO')).toBeGreaterThan(0);
  });
});
