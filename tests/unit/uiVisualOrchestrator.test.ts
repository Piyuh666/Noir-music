import { describe, expect, it } from "vitest";
import { pixelBitmapText5x7, pixelBitmapTextScaled, pixelMeasure } from "../../src/ui/core/pixelTypography";
import { visualFocus, visualMeter, visualRhythm, visualLandmark, visualTitleLock, visualSignalLadder, visualDensity, opticalHeroTitle, opticalFrame, opticalBaseline, opticalPair, opticalScale, opticalHeroComposition, opticalFocusWindow, opticalBaselineLock, opticalIntensity, opticalGrammar, opticalCompositionRail, opticalFocusFrame, unifiedOpticalState, unifiedOpticalRail, unifiedFocusSurface } from "../../src/ui/core/visualOrchestrator";

describe("Glyph Matrix visual orchestrator V61", () => {
  it("assigns visual focus from live priority", () => {
    expect(visualFocus(100, "PLAYER")).toBe("PLAYER");
    expect(visualFocus(20, "TELEMETRY")).toBe("SYSTEM");
  });
  it("builds deterministic optical hierarchy primitives", () => {
    expect(visualTitleLock("NOIR MUSIC", 48, "PLAYER").every((x) => x.length === 48)).toBe(true);
    expect(visualSignalLadder([0.2, 0.5, 1], 48)).toHaveLength(48);
    expect(visualDensity(68, 4)).toBe("AIRY");
  });
  it("keeps meters and rhythm exact-width", () => {
    expect(visualMeter(0.5, 40)).toHaveLength(40);
    expect(visualRhythm(48)).toHaveLength(48);
  });
  it("renders landmarks as multiple deterministic pixel rows", () => {
    const a = visualLandmark("PLAYER", 48);
    expect(a.length).toBeGreaterThan(0);
    expect(a).toEqual(visualLandmark("PLAYER", 48));
    expect(a.every((x) => x.length === 48)).toBe(true);
  });
});


describe("Glyph Matrix optical composition V61", () => {
  it("keeps the optical axis and meter cell-locked", () => {
    expect(opticalAxis(48, 0.5, "ACTIVE")).toHaveLength(48);
    expect(opticalMeter(0.73, 40, "ACTIVE")).toHaveLength(40);
  });
  it("renders bitmap titles deterministically", () => {
    const a = opticalTitle("NOIR MUSIC", 60, "HERO");
    expect(a).toEqual(opticalTitle("NOIR MUSIC", 60, "HERO"));
    expect(a.every((x) => x.length === 60)).toBe(true);
  });
  it("seals hero typography and optical framing to exact cells", () => {
    expect(opticalScale(60, "HERO")).toBe(2);
    expect(opticalScale(40, "HERO")).toBe(1);
    expect(opticalHeroTitle("NOIR MUSIC", 60, "HERO").every((x) => x.length === 60)).toBe(true);
    expect(opticalFrame(48, "ACTIVE")).toHaveLength(48);
    expect(opticalHeroComposition('NOIR MUSIC', 60, 'HERO').every((x) => x.length === 60)).toBe(true);
    expect(opticalFocusWindow(48, 'ACTIVE', 0.5).every((x) => x.length === 48)).toBe(true);
    expect(opticalBaselineLock(48, 0.5, 'ACTIVE')).toHaveLength(48);
    expect(opticalIntensity('ACTIVE', 'PLAYER')).toBe('PRIMARY');
    expect(opticalBaseline(48, 0.4, "ACTIVE")).toHaveLength(48);
    expect(opticalPair("STATE", "ACTIVE", 48, "ACTIVE")).toHaveLength(48);
  });
  it("uses a stable 5x7 alphabet, kerning and deterministic 2x scaling", () => {
    expect(pixelBitmapText5x7("AVATAR 2026", 64).length).toBe(7);
    expect(pixelBitmapText5x7("AVATAR 2026", 64)).toEqual(pixelBitmapText5x7("AVATAR 2026", 64));
    expect(pixelMeasure("AV", 1)).toBeLessThan(pixelMeasure("A V", 1));
    expect(pixelBitmapTextScaled("NOIR", 60, 2).length).toBe(14);
  });
  it("keeps micro cells bounded and normalized", () => {
    expect(opticalCell("STATE", "ACTIVE", 48, "ACTIVE")).toHaveLength(48);
  });
});


describe('V61 optical grammar', () => {
  it('collapses focus, depth, tone and scale into one deterministic contract', () => {
    const grammar = opticalGrammar(100, 'PLAYER', true);
    expect(grammar.focus).toBe('PLAYER');
    expect(grammar.priority).toBe('FOCAL');
    expect(grammar.motion).toBe('PULSE');
    expect([1, 2]).toContain(grammar.scale);
  });
  it('keeps optical rails and focus frames cell-locked', () => {
    const grammar = opticalGrammar(90, 'PLAYER', true);
    expect(opticalCompositionRail(48, grammar)).toHaveLength(48);
    expect(opticalFocusFrame(48, grammar).every((row) => row.length === 48)).toBe(true);
  });
});


describe('V62 unified optical state machine', () => {
  it('wires focus, scale, motion and cadence into one state', () => {
    const state = unifiedOpticalState(100, 'PLAYER', true, 64);
    expect(state.focus).toBe('PLAYER');
    expect(state.priority).toBe('FOCAL');
    expect(state.motion).toBe('PULSE');
    expect(state.scale).toBe(2);
  });
  it('keeps the unified rail and focus surface exact-width', () => {
    const state = unifiedOpticalState(100, 'PLAYER', true, 64);
    expect(unifiedOpticalRail(64, state)).toHaveLength(64);
    expect(unifiedFocusSurface('NOIR MUSIC', 64, state).every((row) => row.length === 64)).toBe(true);
  });
});
