import { describe, expect, it } from 'vitest';
import { decorateSurface, designControlRail, designForWidth, designMeter, designSignature } from '../../src/ui/core/design';

describe('Noir Music V48 visual design overhaul', () => {
  it('selects deterministic design profiles by viewport', () => {
    expect(designForWidth(28)).toBe('GRID');
    expect(designForWidth(44)).toBe('MATRIX');
    expect(designForWidth(52)).toBe('TERMINAL');
    expect(designForWidth(72)).toBe('OPERATOR');
  });

  it('renders deterministic glyph meters and control rails', () => {
    expect(designMeter(0.5, 10, 'MATRIX')).toBe('█████░░░░░');
    expect(designControlRail([
      { label: 'PREV' }, { label: 'PLAY', active: true }, { label: 'NEXT' },
    ], 48, 'OPERATOR')).toContain('◆ PLAY');
  });

  it('applies unified chrome to real UI surfaces', () => {
    const result = decorateSurface({ surface: 'PLAYER', lines: ['NOW PLAYING', 'TRACK'], rows: 2, priority: 100 }, 60, 'OPERATOR');
    expect(result.lines[0]).toMatch(/^╔/);
    expect(result.lines.join('\n')).toContain('PLAYER');
    expect(result.lines.at(-1)).toMatch(/╝$/);
    expect(result.rows).toBe(result.lines.length);
  });

  it('exposes one design signature for the complete composition', () => {
    expect(designSignature('CIRCUIT', 'DENSE')).toContain('CIRCUIT');
    expect(designSignature('CIRCUIT', 'DENSE')).toContain('GLYPH MATRIX');
  });
});
