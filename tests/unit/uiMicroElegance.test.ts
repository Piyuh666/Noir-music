import { describe, expect, it } from 'vitest';
import { pixelDivider, pixelMicroLabel, pixelPriorityLine, pixelSignalRail, polishPixelSurface, pixelOpticalGap, pixelMicroHierarchy, v61MicroHierarchy, v61PixelOpticalGap, v61PixelMicroHierarchy } from '../../src/ui/core/microElegance';

describe('Glyph Matrix micro-elegance V61.0', () => {
  it('keeps optical dividers exact-width and deterministic', () => {
    expect(pixelDivider(48)).toHaveLength(48);
    expect(pixelDivider(48)).toBe(pixelDivider(48));
  });

  it('keeps priority rails cell-perfect', () => {
    expect(pixelPriorityLine('STATE', 'ACTIVE', 56)).toHaveLength(56);
    expect(pixelPriorityLine('STATE', 'ACTIVE', 56)).toContain('◆');
  });

  it('keeps bitmap hierarchy centered and cell-locked', () => {
    const label = pixelMicroLabel('PLAYER', 56);
    expect(label.length).toBe(5);
    expect(label.every((line) => line.length === 56)).toBe(true);
  });

  it('renders signal rails without changing the visual language', () => {
    expect(pixelSignalRail(0.5, 48)).toHaveLength(48);
    expect(pixelSignalRail(0.5, 48)).toContain('█');
    expect(pixelSignalRail(0, 48)).toContain('░');
  });

  it('removes redundant blank rhythm without changing frame ownership', () => {
    const lines = polishPixelSurface(['╔══╗', '', '', '║ X ║', '╚══╝', ''], 20);
    expect(lines).toHaveLength(3);
    expect(lines.every((line) => line.length === 20)).toBe(true);
    expect(lines[0]).toContain('╔');
    expect(lines[2]).toContain('╚');
  });
});


describe('V61 optical micro-hierarchy', () => {
  it('keeps every micro-elegance primitive cell-perfect', () => {
    expect(pixelOpticalGap(48, 'FOCUS')).toHaveLength(48);
    expect(pixelMicroHierarchy('STATE', 'ACTIVE', 48, 'ACTIVE').every((line) => line.length === 48)).toBe(true);
  });
});


describe('V61 micro hierarchy grammar', () => {
  it('maps numeric priority to stable visual hierarchy', () => {
    expect(v61MicroHierarchy(90)).toBe('PRIMARY');
    expect(v61MicroHierarchy(50)).toBe('SECONDARY');
    expect(v61MicroHierarchy(10)).toBe('TERTIARY');
  });
  it('keeps the new micro primitives cell-perfect', () => {
    const hierarchy = v61MicroHierarchy(90);
    expect(v61PixelOpticalGap(48, hierarchy).length).toBeLessThanOrEqual(2);
    expect(v61PixelMicroHierarchy('STATE', 'ACTIVE', 48, hierarchy)).toHaveLength(48);
  });
});


describe('V62 unified micro surface', () => {
  it('inherits the canonical optical state machine', () => {
    const surface = unifiedMicroSurface(100, 'PLAYER', 60, true);
    expect(surface.hierarchy).toBe('PRIMARY');
    expect(surface.state.priority).toBe('FOCAL');
    expect(surface.rail).toHaveLength(60);
  });
});
