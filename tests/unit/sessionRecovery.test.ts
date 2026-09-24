import { describe, expect, it, vi } from "vitest";
import { SessionRecoveryService } from "../../src/services/sessionRecoveryService";

describe("SessionRecoveryService", () => {
  it("captures desired playback state and exposes recovery health", () => {
    const service = new SessionRecoveryService();
    const player = {
      guildId: "123456789012345",
      voiceChannelId: "223456789012345",
      volume: 82,
      repeatMode: "queue",
      queue: {
        current: { info: { identifier: "current-1", title: "Current" } },
        tracks: [{ info: { identifier: "next-1", title: "Next" } }],
      },
      getData: (key: string) => ({ textChannelId: "323456789012345", autoplay: true, always247: true } as Record<string, unknown>)[key],
    } as never;

    service.capture(player);
    expect(service.health().snapshots).toBe(1);
    expect(service.health().pending).toBe(0);
    expect(service.health().recovering).toBe(0);
  });

  it("does not recover an explicitly intentional destroy", () => {
    vi.useFakeTimers();
    const service = new SessionRecoveryService();
    const adapter = vi.fn(async () => undefined);
    service.configure(adapter);
    const player = {
      guildId: "123456789012345",
      voiceChannelId: "223456789012345",
      volume: 70,
      repeatMode: "off",
      queue: { current: { info: { identifier: "current-1" } }, tracks: [] },
      getData: (key: string) => ({ textChannelId: "323456789012345", always247: true } as Record<string, unknown>)[key],
    } as never;

    service.capture(player);
    service.markIntentional("123456789012345");
    service.onDestroyed("123456789012345");
    vi.runAllTimers();

    expect(adapter).not.toHaveBeenCalled();
    expect(service.health().snapshots).toBe(0);
    expect(service.health().pending).toBe(0);
    expect(service.health().recovering).toBe(0);
    service.stop();
    vi.useRealTimers();
  });
});
