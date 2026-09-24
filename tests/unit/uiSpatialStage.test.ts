import { describe, expect, it } from 'vitest';
import { composeVisualStage } from '../../src/ui/core/stageComposer';

describe('Glyph Matrix spatial stage V53.0', () => {
  const input = {
    width: 60,
    state: 'ACTIVE',
    title: 'NOIR TRACK',
    artist: 'NOIR ARTIST',
    source: 'YOUTUBE',
    queueSize: 8,
    positionRatio: 0.58,
    actions: ['PLAY', 'PAUSE', 'SKIP', 'QUEUE'],
    activeAction: 'PLAY',
    surfaces: [
      { surface: 'PLAYER', lines: ['PLAYER', 'TRACK', 'ACTIVE'], rows: 3, priority: 100 },
      { surface: 'QUEUE', lines: ['QUEUE', 'NEXT TRACK'], rows: 2, priority: 80 },
      { surface: 'TELEMETRY', lines: ['SIGNAL', 'HEALTHY'], rows: 2, priority: 40 },
    ],
  } as const;

  it('keeps one outer frame and exact cell geometry', () => {
    const lines = composeVisualStage(input);
    expect(lines[0]).toContain('╔');
    expect(lines.at(-1)).toContain('╚');
    expect(lines.every((line) => line.length === 60)).toBe(true);
  });

  it('keeps bitmap identity and landmark output', () => {
    const lines = composeVisualStage(input).join('\n');
    expect(lines).toContain('█');
    expect(lines).toContain('QUEUE');
    expect(lines).toContain('NOW PLAYING');
  });

  it('does not create nested full frames', () => {
    const lines = composeVisualStage(input).join('\n');
    expect(lines.match(/╔/g)?.length).toBe(1);
    expect(lines.match(/╚/g)?.length).toBe(1);
  });

  it('is deterministic and remains emoji-free', () => {
    const a = composeVisualStage(input);
    const b = composeVisualStage(input);
    expect(a).toEqual(b);
    expect(a.join('\n')).not.toMatch(/[😀-🙏]/u);
  });
});
