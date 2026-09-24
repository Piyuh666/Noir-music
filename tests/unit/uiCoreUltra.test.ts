import { describe, expect, it } from 'vitest';
import { composeUiCore, guardInteraction, motionFrame, planLayout, type UiCoreInput } from '../../src/ui/core';

const input: UiCoreInput = {
  width: 72,
  state: 'ACTIVE',
  player: { title: 'Noir Track', artist: 'Artist', source: 'youtube', requester: 'DJ', positionMs: 30000, durationMs: 180000, volume: 80, queueSize: 4, state: 'ACTIVE', paused: false, loop: 'OFF', shuffle: false, autoplay: true },
  queue: Array.from({ length: 12 }, (_, i) => ({ id: String(i), title: `Track ${i}`, artist: 'Artist', durationMs: 120000, index: i + 1, active: i === 0 })),
  commands: [{ name: 'play', category: 'PLAYBACK', description: 'Play', usage: '/play', enabled: true }],
  actions: [{ id: 'skip', label: 'SKIP', enabled: true }, { id: 'stop', label: 'STOP', enabled: false, destructive: true, reason: 'PERMISSION REQUIRED' }],
  effects: [{ id: 'bass', label: 'BASS BOOST', enabled: true, value: 140 }, { id: 'nightcore', label: 'NIGHTCORE', enabled: false, value: 0 }],
};

describe('Ultra UI Core V47', () => {
  it('composes all major UI domains from one state snapshot', () => {
    const result = composeUiCore(input);
    expect(result.surfaces.length).toBeGreaterThanOrEqual(3);
    expect(result.lines.join('\n')).toContain('NOW PLAYING');
    expect(result.diagnostics.join('\n')).toContain('LAYOUT');
    expect(result.diagnostics.join('\n')).toContain('DESIGN OPERATOR');
    expect(result.lines[0]).toContain('NOIR UI');
    expect(result.lines.join('\n')).toContain('CONTROL');
    expect(result.lines.join('\n')).toContain('SKIP');
    expect(result.lines.join('\n')).toContain('STOP');
  });

  it('rejects stale interactions and disabled actions', () => {
    expect(guardInteraction(input.actions[0], { state: 'ACTIVE', version: 3, actorId: 'u', issuedAt: 1 }, 2).accepted).toBe(false);
    expect(guardInteraction(input.actions[1], { state: 'ACTIVE', version: 2, actorId: 'u', issuedAt: 1 }, 2).accepted).toBe(false);
  });

  it('honors reduced motion and state-aware motion', () => {
    expect(motionFrame('ACTIVE', 100, { width: 72, maxRows: 40, density: 'OPERATOR', columns: 4 }, true).mode).toBe('STILL');
    expect(motionFrame('ERROR', 100, { width: 72, maxRows: 40, density: 'OPERATOR', columns: 4 }).mode).toBe('ALERT');
  });

  it('plans deterministic priority-aware layout', () => {
    const plan = planLayout({ width: 50, maxRows: 10, density: 'STANDARD', columns: 2 }, [
      { id: 'PLAYER', minWidth: 20, preferredRows: 7, priority: 100, collapsible: true },
      { id: 'QUEUE', minWidth: 20, preferredRows: 7, priority: 80, collapsible: true },
      { id: 'TELEMETRY', minWidth: 20, preferredRows: 2, priority: 10, collapsible: false },
    ]);
    expect(plan.blocks).toContain('PLAYER');
    expect(plan.deferred.length).toBeGreaterThan(0);
  });
});
