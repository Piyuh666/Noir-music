import { describe, expect, it } from 'vitest';
import { sceneEnergy, sceneLandmark, sceneMode, sceneModeSignature, scenePulse, sceneRule } from '../../src/ui/core/sceneDirector';

describe('Glyph Matrix scene director V54.0', () => {
  it('selects deterministic art direction by viewport width', () => {
    expect(sceneMode(34)).toBe('COMPACT');
    expect(sceneMode(48)).toBe('BALANCED');
    expect(sceneMode(70)).toBe('CINEMA');
  });
  it('maps runtime state to a stable visual energy', () => {
    expect(sceneEnergy('ACTIVE')).toBe('ACTIVE');
    expect(sceneEnergy('BUSY')).toBe('BUSY');
    expect(sceneEnergy('ERROR')).toBe('ERROR');
  });
  it('keeps every scene primitive exact-width', () => {
    expect(scenePulse('ACTIVE', 48)).toHaveLength(48);
    expect(sceneRule(48)).toHaveLength(48);
    expect(sceneModeSignature('BALANCED', 'READY', 48)).toHaveLength(48);
    expect(sceneLandmark('PLAYER', 48).every(line => line.length === 48)).toBe(true);
  });
  it('uses bitmap landmarks rather than ordinary heading glyphs', () => {
    const rows = sceneLandmark('QUEUE', 48);
    expect(rows).toHaveLength(5);
    expect(rows.join('')).toContain('█');
  });
});
