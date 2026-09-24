import { describe, expect, it } from 'vitest';
import { composeVisualStage, stageBlueprint } from '../../src/ui/core/stageComposer';

describe('Glyph Matrix visual stage V62.0', () => {
  const input = {
    width: 56,
    state: 'ACTIVE',
    title: 'NOIR TRACK',
    positionRatio: 0.42,
    actions: ['PLAY', 'PAUSE', 'SKIP', 'QUEUE'],
    activeAction: 'PLAY',
    runtime: { control: { availability: 'READY', leasePressure: 'LOW', persistencePressure: 'LOW' }, reconciliation: { status: 'STABLE', intensity: 'QUIET', health: 'STABLE', ratio: 0 }, recovery: { status: 'IDLE', intensity: 'QUIET', health: 'STABLE', ratio: 0 } },
    surfaces: [
      { surface: 'PLAYER', lines: ['╔════╗', '║ TRACK ║', '╚════╝'], rows: 3, priority: 100 },
      { surface: 'QUEUE', lines: ['╔════╗', '║ QUEUE ║', '╚════╝'], rows: 3, priority: 80 },
    ],
  } as const;

  it('owns exactly one outer frame and exact cell width', () => {
    const lines = composeVisualStage(input);
    expect(lines[0]).toContain('╔');
    expect(lines.at(-1)).toContain('╚');
    expect(lines.every((line) => line.length === 56)).toBe(true);
  });

  it('removes nested surface frames from the final visual scene', () => {
    const lines = composeVisualStage(input).join('\n');
    expect(lines.match(/╔/g)?.length).toBe(1);
    expect(lines.match(/╚/g)?.length).toBe(1);
  });

  it('keeps the entire stage in the Matrix glyph vocabulary', () => {
    const lines = composeVisualStage(input).join('\n');
    expect(lines).toContain('█');
    expect(lines).toContain('◆');
    expect(lines).toContain('◇');
    expect(lines).not.toMatch(/[😀-🙏]/u);
  });

  it('is deterministic for identical state', () => {
    expect(composeVisualStage(input)).toEqual(composeVisualStage(input));
  });
});


describe('V61 focal composition contract', () => {
  it('keeps the focal stage deterministic across repeated renders', () => {
    const lines = composeVisualStage(input);
    expect(lines).toEqual(composeVisualStage(input));
    expect(lines.every((line) => line.length === input.width)).toBe(true);
  });
  it('renders stronger hero typography on wide stages', () => {
    const lines = composeVisualStage({ ...input, width: 68 });
    expect(lines.join('\n')).toContain('NOIR MUSIC');
    expect(lines.every((line) => line.length === 68)).toBe(true);
  });
});


describe('V61 stage optical contract', () => {
  it('derives a deterministic focal blueprint from live energy', () => {
    const blueprint = stageBlueprint(68, 0.9, true, 4);
    expect(blueprint.balance).toBe('FOCAL');
    expect(blueprint.heroScale).toBe(2);
    expect(blueprint.focalWindow).toBeGreaterThan(12);
  });
});


describe('V62 unified stage wiring', () => {
  it('keeps the unified scene and focal state deterministic', () => {
    const lines = composeVisualStage(input);
    expect(lines).toEqual(composeVisualStage(input));
    expect(lines.every((line) => line.length === input.width)).toBe(true);
  });
});


describe('V62 runtime visual wiring', () => {
  it('projects control, reconciliation and recovery health into one stage rail', () => {
    const lines = composeVisualStage({ ...input, runtime: { control: { availability: 'READY', leasePressure: 'LOW', persistencePressure: 'LOW' }, reconciliation: { status: 'DRIFTING', intensity: 'ACTIVE', health: 'PRESSURED', ratio: 0.5 }, recovery: { status: 'RECOVERING', intensity: 'ACTIVE', health: 'PRESSURED', ratio: 0.4 } } });
    const text = lines.join('\n');
    expect(text).toContain('RUNTIME');
    expect(text).toContain('DRIFTING');
    expect(text).toContain('RECOVERING');
    expect(lines.every((line) => line.length === 56)).toBe(true);
  });
});
