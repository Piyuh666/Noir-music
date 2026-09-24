import { afterEach, describe, expect, it, vi } from 'vitest';
import { playerStateBusHealth, publishPlayerState, subscribePlayerState } from '../../src/events/playerStateBus';

describe('Noir Music live state projection spine', () => {
  afterEach(() => vi.restoreAllMocks());

  it('orders state signals per guild with a monotonic version', () => {
    const seen: number[] = [];
    const unsubscribe = subscribePlayerState((event) => seen.push(event.version));
    publishPlayerState('guild-live-test', 'PLAYBACK_MUTATION', 'play');
    publishPlayerState('guild-live-test', 'TRACK_START', 'trackStart');
    unsubscribe();
    expect(seen).toEqual([1, 2]);
  });

  it('never requires a subscriber to exist for publication', () => {
    const before = playerStateBusHealth().listeners;
    const event = publishPlayerState('guild-no-subscriber', 'PLAYER_LIFECYCLE', 'test');
    expect(event.version).toBeGreaterThan(0);
    expect(playerStateBusHealth().listeners).toBe(before);
  });
});
