import type { UiCoreInput, UiCoreResult, UiCoreSurface } from './contracts';
import { normalizeViewport } from './responsive';
import { playerSurface } from './player';
import { queueSurface } from './queue';
import { commandSurface } from './command';
import { effectsSurface } from './effects';
import { telemetrySurface } from './telemetry';
import { dashboardSurface } from './dashboard';
import { navigationSurface } from './navigation';
import { accessibilitySurface } from './accessibility';
import { planLayout } from './layout';
import { motionFrame } from './motion';
import { decorateSurface, designForWidth, type UiDesign } from './design';
import { opticalGrid } from './visualComposition';
import { composeVisualStage } from './stageComposer';

export * from './contracts';
export * from './responsive';
export * from './glyph';
export * from './actions';
export * from './player';
export * from './queue';
export * from './command';
export * from './effects';
export * from './telemetry';
export * from './state';
export * from './layout';
export * from './navigation';
export * from './accessibility';
export * from './motion';
export * from './dashboard';
export * from './interaction';
export * from './design';
export * from './microElegance';
export * from './visualComposition';
export * from './visualDirector';
export * from './stageComposer';
export * from './sceneDirector';
export * from './visualOrchestrator';

/**
 * V48.7 Pixel Matrix Core: one normalized state feeds every surface and every visible line is cell-locked. Layout,
 * navigation, accessibility and motion are computed from the same snapshot,
 * then the final Discord budget selects a coherent subset.
 */
export function composeUiCore(input: UiCoreInput): UiCoreResult {
  const viewport = normalizeViewport(input.width);
  const design: UiDesign = input.design ?? designForWidth(viewport.width);
  const motion = motionFrame(input.state, input.player.positionMs, viewport);
  const navigation = navigationSurface([
    { route: 'PLAYER', label: 'PLAYER', enabled: true, active: true },
    { route: 'QUEUE', label: 'QUEUE', enabled: true, active: false, badge: String(input.player.queueSize) },
    { route: 'COMMANDS', label: 'COMMANDS', enabled: input.commands.length > 0, active: false, badge: String(input.commands.length) },
    { route: 'EFFECTS', label: 'EFFECTS', enabled: input.effects.length > 0, active: false, badge: String(input.effects.filter((x) => x.enabled).length) },
    { route: 'TELEMETRY', label: 'TELEMETRY', enabled: true, active: false },
  ], 'PLAYER', viewport);
  const accessibility = accessibilitySurface(input, viewport);
  const surfaces: UiCoreSurface[] = [
    dashboardSurface(input, viewport),
    playerSurface(input.player, viewport, input.actions, design),
    queueSurface(input.queue, viewport),
    commandSurface(input.commands, viewport),
    effectsSurface(input.effects, viewport),
    telemetrySurface(input),
    { surface: 'NAVIGATION', lines: navigation.lines, rows: navigation.lines.length, priority: 70 },
    { surface: 'ACCESSIBILITY', lines: accessibility.lines, rows: accessibility.lines.length, priority: 30 },
  ];
  const layout = planLayout(viewport, surfaces.map((surface) => ({ id: surface.surface, minWidth: viewport.width, preferredRows: surface.rows, priority: surface.priority, collapsible: true })));
  const diagnostics: string[] = [
    `LAYOUT ${layout.density} · ${layout.columns} COL · ${layout.rows} ROWS`,
    `MOTION ${motion.mode} · PHASE ${motion.phase} · INTENSITY ${motion.intensity}`,
    `A11Y ${accessibility.focusable} FOCUSABLE`,
    ...layout.deferred.map((id) => `DEFERRED ${id} · BUDGET ${viewport.maxRows}`),
  ];
  const selected = surfaces.filter((surface) => layout.blocks.includes(surface.surface));
  const designed = selected.map((surface) => decorateSurface(surface, viewport.width, design));
  const stageLines = composeVisualStage({
    width: viewport.width,
    state: input.player.state,
    title: input.player.title,
    artist: input.player.artist,
    source: input.player.source,
    queueSize: input.player.queueSize,
    positionRatio: input.player.durationMs > 0 ? input.player.positionMs / input.player.durationMs : 0,
    actions: input.actions.map((action) => action.label),
    activeAction: input.player.state === 'ACTIVE' ? 'PLAY' : 'PAUSE',
    surfaces: designed,
  });
  const polishedLines = opticalGrid(stageLines, viewport.width);
  return Object.freeze({ viewport, surfaces: Object.freeze(designed), lines: polishedLines, diagnostics: Object.freeze([...diagnostics, `DESIGN ${design} · ${designed.length} SURFACES · SINGLE VISUAL STAGE`, 'PIXEL TYPOGRAPHY · CELL-LOCKED · BITMAP LANDMARKS', 'GLYPH MATRIX COMPOSITION · OUTER FRAME OWNERSHIP · OPTICAL GRID', 'V54.0 · SCENE DIRECTOR · ADAPTIVE PIXEL COMPOSITION · ZERO COMPETING SKINS']) });
}
