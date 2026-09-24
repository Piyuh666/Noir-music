import { describe, expect, it } from 'vitest';
import { pixelControlRail, pixelStatePulse, pixelWaveform, visualLandmark, visualScene, visualWordmark } from '../../src/ui/core/visualDirector';

describe('Glyph Matrix visual director V51.0', () => {
  it('renders deterministic bitmap identity at exact width', () => {
    const lines = visualWordmark('NOIR MUSIC', 56);
    expect(lines).toHaveLength(5);
    expect(lines.every((line) => line.length === 56)).toBe(true);
    expect(lines).toEqual(visualWordmark('NOIR MUSIC', 56));
  });

  it('keeps landmarks pixel-written and width locked', () => {
    const lines = visualLandmark('NOW PLAYING', 56);
    expect(lines).toHaveLength(6);
    expect(lines.every((line) => line.length === 56)).toBe(true);
  });

  it('keeps playback waveform deterministic', () => {
    expect(pixelWaveform(0.42, 56)).toBe(pixelWaveform(0.42, 56));
    expect(pixelWaveform(0.42, 56)).toHaveLength(56);
  });

  it('uses one glyph grammar for state and controls', () => {
    expect(pixelStatePulse('ACTIVE', 56)).toHaveLength(56);
    expect(pixelControlRail(['PLAY', 'PAUSE', 'SKIP'], 'PLAY', 56)).toHaveLength(56);
  });

  it('composes a complete scene without competing skins', () => {
    const scene = visualScene({ width: 56, state: 'ACTIVE', title: 'NOIR TRACK', positionRatio: 0.5, actions: ['PLAY', 'PAUSE', 'SKIP'], activeAction: 'PLAY' });
    expect(scene.length).toBeGreaterThan(10);
    expect(scene.every((line) => line.length === 56)).toBe(true);
    expect(scene[0]).toContain('╔');
    expect(scene.at(-1)).toContain('╚');
    expect(scene.join('\n')).not.toMatch(/[😀-🙏]/u);
  });
});
