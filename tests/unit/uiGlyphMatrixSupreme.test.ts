import { describe, expect, it } from 'vitest';
import { designForWidth, designSignature, designControlRail, glyphMatrixHero } from '../../src/ui/core/design';
import { matrixDesignFor, matrixEmoji } from '../../src/ui/glyphMatrixUi';

describe('Glyph Matrix Supreme visual contract', () => {
  it('uses one visual identity at every width', () => {
    expect(designForWidth(30)).toBe('MATRIX');
    expect(designForWidth(72)).toBe('MATRIX');
    expect(matrixDesignFor(30, 'TERMINAL')).toBe('MATRIX');
    expect(matrixDesignFor(72, 'OPERATOR')).toBe('MATRIX');
  });

  it('renders a deterministic hero and signal signature', () => {
    const hero = glyphMatrixHero('NOIR MUSIC', 'ACTIVE · TEST TRACK', 56).join('\n');
    expect(hero).toContain('╔');
    expect(hero).toContain('◆ NOIR MUSIC');
    expect(designSignature('MATRIX', 'DENSE')).toContain('GLYPH MATRIX SUPREME');
  });

  it('uses canonical glyph icons only', () => {
    expect(matrixEmoji('playPause')).toBe('▶');
    expect(matrixEmoji('queue')).toBe('▣');
    expect(matrixEmoji('unknown-action')).toBeUndefined();
    expect(designControlRail([{ label: 'PLAY', active: true }, { label: 'STOP', enabled: false }], 40, 'MATRIX')).toContain('◆ PLAY');
  });
});
