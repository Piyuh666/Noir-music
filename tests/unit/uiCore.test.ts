import { describe, expect, it } from "vitest";
import { composeUiCore, normalizeViewport, resolveActions, type UiCoreInput } from "../../src/ui/core";

describe("canonical ultra UI core", () => {
  const base: UiCoreInput = {
    width: 60,
    state: "ACTIVE",
    player: { title: "Noir Test", artist: "Artist", source: "YOUTUBE", requester: "user", positionMs: 30_000, durationMs: 180_000, volume: 75, queueSize: 4, state: "ACTIVE", paused: false, loop: "OFF", shuffle: false, autoplay: false },
    queue: Array.from({ length: 10 }, (_, i) => ({ id: `q${i}`, title: `Track ${i}`, artist: "Artist", durationMs: 120_000, index: i + 1, active: i === 0 })),
    commands: [{ name: "play", category: "PLAYBACK", description: "Play a track", usage: "/play", enabled: true }],
    actions: [],
    effects: [{ id: "bass", label: "BASS", enabled: true, value: 50 }],
  };

  it("normalizes viewport into deterministic density buckets", () => {
    expect(normalizeViewport(30).density).toBe("MINI");
    expect(normalizeViewport(60).density).toBe("DENSE");
    expect(normalizeViewport(100).width).toBe(72);
  });

  it("resolves permission-aware actions without fake availability", () => {
    const actions = resolveActions(base.player, { canControl: true, canManageQueue: false, canUseEffects: true });
    expect(actions.find((a) => a.id === "queue")?.enabled).toBe(false);
    expect(actions.find((a) => a.id === "effects")?.enabled).toBe(true);
  });

  it("composes multiple surfaces from one state snapshot", () => {
    const result = composeUiCore({ ...base, actions: resolveActions(base.player, { canControl: true, canManageQueue: true, canUseEffects: true }) });
    expect(result.surfaces.map((s) => s.surface)).toContain("PLAYER");
    expect(result.surfaces.map((s) => s.surface)).toContain("QUEUE");
    expect(result.lines.join("\n")).toContain("NOIR TEST");
    expect(result.lines.join("\n")).not.toContain("undefined");
  });
});
