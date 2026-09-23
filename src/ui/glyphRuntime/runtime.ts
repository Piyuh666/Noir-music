import { NOIR_UI_VERSION } from "../uiVersion";
/**
 * NOIR MUSIC // GLYPH-V48.6 RUNTIME BRIDGE
 *
 * This is the missing runtime integration boundary for the GLYPH-V48.6 family.
 * It does not execute Discord/audio/database work. It composes the four
 * GLYPH-V48.6 presentation modules into bounded surfaces consumed by canonical
 * UI renderers. No command IDs, interaction IDs, or domain state are changed.
 */
import { commandFooter, commandHero, commandTelemetry, type CommandExperienceSpec } from "./commandExperience";
import { packSurface, type SurfacePayload } from "./surfaceBudget";
import { composePipeline, type PipelineSpec } from "./visualPipeline";
import { journey, journeyAccessibility, journeyRail, type JourneySpec } from "./uxJourney";

export interface GlyphRuntimeSurface {
  readonly pipeline: ReturnType<typeof composePipeline>;
  readonly journeyRail: string;
  readonly journey: readonly string[];
  readonly accessibility: string;
  readonly command?: {
    readonly hero: string;
    readonly telemetry: string;
    readonly footer: string;
  };
  readonly packed: ReturnType<typeof packSurface>;
}

export interface GlyphRuntimeSpec {
  readonly pipeline: PipelineSpec;
  readonly journey: JourneySpec;
  readonly surface: SurfacePayload;
  readonly command?: CommandExperienceSpec;
}

export function composeGlyphRuntime(spec: GlyphRuntimeSpec): GlyphRuntimeSurface {
  const pipeline = composePipeline(spec.pipeline);
  const journeyRailValue = journeyRail(spec.journey);
  const journeyRows = journey(spec.journey);
  const accessibility = journeyAccessibility(spec.journey);
  const command = spec.command
    ? Object.freeze({
        hero: commandHero(spec.command),
        telemetry: commandTelemetry(spec.command),
        footer: commandFooter(spec.command),
      })
    : undefined;
  const packed = packSurface(
    {
      title: spec.surface.title,
      sections: [
        ...spec.surface.sections,
        pipeline.rail,
        journeyRailValue,
        ...journeyRows,
        accessibility,
        ...(command ? [command.telemetry, command.footer] : []),
      ],
      actions: spec.surface.actions,
      footer: spec.surface.footer ?? pipeline.footer,
    },
    "DENSE",
  );
  return Object.freeze({
    pipeline,
    journeyRail: journeyRailValue,
    journey: Object.freeze([...journeyRows]),
    accessibility,
    command,
    packed,
  });
}

export const GLYPH_RUNTIME_CONTRACT = Object.freeze({
  boundary: "src/ui/glyphRuntime/runtime.ts",
  version: NOIR_UI_VERSION,
  modules: Object.freeze(["visualPipeline", "uxJourney", "surfaceBudget", "commandExperience"]),
  execution: "presentation-only",
  mutationPolicy: "deny",
  failurePolicy: "fail-closed",
  dependencyDirection: "glyph-runtime-modules -> runtime-bridge -> canonical-ui",
} as const);

export function glyphRuntimeAudit(): boolean {
  return GLYPH_RUNTIME_CONTRACT.modules.length === 4
    && GLYPH_RUNTIME_CONTRACT.execution === "presentation-only"
    && GLYPH_RUNTIME_CONTRACT.mutationPolicy === "deny"
    && GLYPH_RUNTIME_CONTRACT.failurePolicy === "fail-closed";
}

if (!glyphRuntimeAudit()) throw new Error("NOIR MUSIC GLYPH-V48.6 runtime bridge audit failed");
