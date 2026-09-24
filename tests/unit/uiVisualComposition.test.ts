import { describe, expect, it } from 'vitest';
import { opticalGrid, pixelFocusRail, pixelFrame, pixelSectionHeading, pixelWordmark } from '../../src/ui/core/visualComposition';

describe('Glyph Matrix visual composition V50.0', () => {
  it('keeps wordmarks genuinely pixel-written and exact-width', () => {
    const lines = pixelWordmark('NOIR MUSIC', 56);
    expect(lines.length).toBe(5);
    expect(lines.every((line) => line.length === 56)).toBe(true);
    expect(lines.join('')).toContain('█');
  });

  it('keeps section landmarks bitmap-based and cell-locked', () => {
    const lines = pixelSectionHeading('PLAYER', 56);
    expect(lines.length).toBe(5);
    expect(lines.every((line) => line.length === 56)).toBe(true);
  });

  it('uses one canonical frame owner', () => {
    const framed = pixelFrame(['╔══╗', '║ X ║', '╚══╝'], 40);
    expect(framed).toHaveLength(3);
    expect(framed.every((line) => line.length === 40)).toBe(true);
    expect(pixelFrame(['X'], 40)[0]).toContain('╔');
  });

  it('keeps the focus rail deterministic and width exact', () => {
    expect(pixelFocusRail(0.5, 56)).toHaveLength(56);
    expect(pixelFocusRail(0.5, 56)).toBe(pixelFocusRail(0.5, 56));
    expect(pixelFocusRail(0.5, 56)).toContain('◆');
  });

  it('normalizes the final optical grid without duplicate blank rows', () => {
    const lines = opticalGrid(['A', '', '', 'B', ''], 48);
    expect(lines).toHaveLength(2);
    expect(lines.every((line) => line.length === 48)).toBe(true);
  });
});
