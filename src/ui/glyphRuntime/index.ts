import { NOIR_UI_VERSION } from "../uiVersion";
/** NOIR MUSIC // GLYPH-V48.6 PUBLIC UI MODULE */
export * from "./visualPipeline";
export * from "./uxJourney";
export * from "./surfaceBudget";
export * from "./commandExperience";
export * from "./runtime";


/** Deterministic public-surface integrity for the Glyph-20 module. */
export const GLYPH_RUNTIME_INDEX_CONTRACT = Object.freeze({
  boundary: "src/ui/glyphRuntime/index.ts",
  version: NOIR_UI_VERSION,
  mutationPolicy: "deny",
  exportPolicy: "preserve",
  failClosed: true,
} as const);

export const GLYPH_RUNTIME_INDEX_EXPORTS = Object.freeze([
  "visualPipeline",
  "uxJourney",
  "surfaceBudget",
  "commandExperience",
  "runtime",
] as const);

export function glyphRuntimeIndexIntegrity(): {
  readonly exportCount: number;
  readonly unique: boolean;
  readonly immutable: boolean;
  readonly sealed: boolean;
} {
  const unique = new Set(GLYPH_RUNTIME_INDEX_EXPORTS).size === GLYPH_RUNTIME_INDEX_EXPORTS.length;
  const immutable = Object.isFrozen(GLYPH_RUNTIME_INDEX_EXPORTS) && Object.isFrozen(GLYPH_RUNTIME_INDEX_CONTRACT);
  const sealed = unique && immutable && GLYPH_RUNTIME_INDEX_CONTRACT.failClosed;
  if (!sealed) throw new Error("NOIR MUSIC GLYPH-V48.6 index integrity failed");
  return Object.freeze({ exportCount: GLYPH_RUNTIME_INDEX_EXPORTS.length, unique, immutable, sealed });
}

export const GLYPH_RUNTIME_INDEX_INTEGRITY = Object.freeze(glyphRuntimeIndexIntegrity());
