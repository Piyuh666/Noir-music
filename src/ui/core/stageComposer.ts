/**
 * NOIR MUSIC // GLYPH MATRIX VISUAL STAGE V62.0
 *
 * Spatial composition overhaul. The stage is now a visual instrument rather
 * than a stack of panels: one outer frame, one focal player window, bitmap
 * landmarks, state-driven signal geometry, and quiet surface bands. The
 * presentation layer remains deterministic, cell-locked and Glyph Matrix only.
 */
import { sceneOpticalContract, sceneEnergy, sceneLandmark, sceneMode, sceneModeSignature, scenePulse, sceneRule, sceneCadence, sceneSignature, sceneEnergyRatio, unifiedSceneContract, unifiedSceneRail } from './sceneDirector';
import { visualStageContract } from './visualDirector';
import { pixelBitmapText, pixelCell, pixelNormalize } from './pixelTypography';
import { unifiedOpticalState, unifiedOpticalRail, unifiedFocusSurface } from './visualOrchestrator';
import { pixelFocusRail, pixelSectionHeading } from './visualComposition';
import { opticalAxis, opticalCell, opticalMeter, opticalRule, opticalSignature, opticalStagger, opticalTitle, opticalTone, opticalZone, visualAxis, visualDepth, visualDensity, visualFocus, visualFrameLine, visualFrameRail, visualGap, visualLandmark, visualMeter, visualMicroLabel, visualRhythm, visualSceneSignature, visualSignalLadder, visualTitleLock, visualWeight, visualZone, opticalHeroTitle, opticalHeroComposition, opticalFrame, opticalBaseline, opticalBaselineLock, opticalPair, opticalFocusWindow } from './visualOrchestrator';

export type StageRuntimeVisualState = Readonly<{
  control: Readonly<{ availability: string; leasePressure: string; persistencePressure: string }>;
  reconciliation: Readonly<{ status: string; intensity: string; health: string; ratio: number }>;
  recovery: Readonly<{ status: string; intensity: string; health: string; ratio: number }>;
}>;

export const VISUAL_STAGE = Object.freeze({
  minWidth: 30,
  maxWidth: 72,
  frame: Object.freeze({ tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║', mid: '╠', join: '╬' }),
  focus: '◆',
  quiet: '◇',
  active: '●',
  idle: '·',
  rail: '─',
  fill: '█',
  half: '▓',
  empty: '░',
  dot: '·',
  tick: '┄',
});

const widthOf = (width: number) => Math.max(VISUAL_STAGE.minWidth, Math.min(VISUAL_STAGE.maxWidth, Math.trunc(Number(width) || 48)));
const innerOf = (width: number) => widthOf(width) - 4;
const clean = (value: unknown, max: number, fallback = '—') => pixelNormalize(value, Math.max(1, max), fallback);

const frameTop = (w: number) => `${VISUAL_STAGE.frame.tl}${VISUAL_STAGE.frame.h.repeat(w - 2)}${VISUAL_STAGE.frame.tr}`;
const frameBottom = (w: number) => `${VISUAL_STAGE.frame.bl}${VISUAL_STAGE.frame.h.repeat(w - 2)}${VISUAL_STAGE.frame.br}`;
const divider = (w: number) => `${VISUAL_STAGE.frame.mid}${VISUAL_STAGE.frame.h.repeat(w - 2)}${VISUAL_STAGE.frame.join}`;
const hairline = (w: number, lead = '◇') => pixelCell(`${lead}${VISUAL_STAGE.tick.repeat(Math.max(1, w - 5))}◇`, w, 'LEFT', '');

function framed(value: string, width: number, align: 'LEFT' | 'CENTER' = 'LEFT'): string {
  const w = widthOf(width);
  const inner = w - 4;
  return `${VISUAL_STAGE.frame.v} ${pixelCell(value, inner, align, '')} ${VISUAL_STAGE.frame.v}`;
}

function bitmapRows(value: string, width: number): readonly string[] {
  const w = widthOf(width);
  const inner = w - 4;
  return Object.freeze(pixelBitmapText(clean(value, 24, 'SECTION'), Math.max(8, inner), 1)
    .map((row) => framed(row, w, 'CENTER')));
}

function stripChrome(lines: readonly string[], width: number): readonly string[] {
  const w = widthOf(width);
  const inner = w - 4;
  const body = lines
    .filter((line) => !line.startsWith('╔') && !line.startsWith('╚') && !line.startsWith('╠'))
    .map((line) => line.startsWith('║') ? line.slice(1, -1).trim() : line.trim())
    .map((line) => clean(line, inner, ''))
    .filter(Boolean)
    .slice(0, 6);
  return Object.freeze(body.map((line) => framed(line, w)));
}

function signalBar(ratio: number, width: number): string {
  const w = Math.max(10, width);
  const r = Math.max(0, Math.min(1, Number(ratio) || 0));
  const cursor = Math.min(w - 1, Math.max(0, Math.round(r * (w - 1))));
  return Array.from({ length: w }, (_, i) => {
    if (i === cursor) return VISUAL_STAGE.focus;
    if (i < cursor) return i % 4 === 0 ? VISUAL_STAGE.half : VISUAL_STAGE.fill;
    return VISUAL_STAGE.empty;
  }).join('');
}

function stateRail(state: string, width: number): string {
  const value = clean(state, 12, 'IDLE');
  const active = value === 'ACTIVE' || value === 'SUCCESS' || value === 'READY';
  const warning = value === 'BUSY' || value === 'WARNING' || value === 'STALE';
  const level = active ? 0.78 : warning ? 0.5 : value === 'ERROR' ? 0.25 : 0.12;
  const cells = Math.max(8, width - value.length - 7);
  return `${active ? VISUAL_STAGE.active : warning || value === 'ERROR' ? VISUAL_STAGE.focus : VISUAL_STAGE.quiet} ${value} ${signalBar(level, cells)}`;
}

function actionRail(actions: readonly string[], activeAction: string, width: number): string {
  const shown = actions.slice(0, 5);
  if (!shown.length) return `${VISUAL_STAGE.quiet} NO ACTIONS`;
  const cell = Math.max(7, Math.floor((width - Math.max(0, shown.length - 1)) / shown.length));
  return shown.map((raw) => {
    const label = clean(raw, Math.max(3, cell - 3), 'ACTION');
    const active = label === clean(activeAction, Math.max(3, cell - 3), '');
    return `${active ? VISUAL_STAGE.focus : VISUAL_STAGE.idle} ${label}`.padEnd(cell, ' ');
  }).join(VISUAL_STAGE.rail);
}

function metaRail(artist: string, source: string, queueSize: number, width: number): string {
  const inner = Math.max(12, width);
  const left = clean(artist, Math.floor(inner * 0.46), 'UNKNOWN ARTIST');
  const right = clean(source, Math.floor(inner * 0.28), 'SOURCE');
  const tail = `Q${Math.max(0, Math.trunc(queueSize))}`;
  const gap = Math.max(1, inner - left.length - right.length - tail.length - 6);
  return `${VISUAL_STAGE.quiet} ${left}${' '.repeat(gap)}${right} ${VISUAL_STAGE.dot} ${tail}`;
}

/**
 * Compose the complete visible scene. The player is the focal window; every
 * other surface becomes a quiet, bitmap-labelled band around that focal point.
 */
export function composeVisualStage(input: {
  width: number;
  state: string;
  title: string;
  artist?: string;
  source?: string;
  queueSize?: number;
  positionRatio: number;
  actions?: readonly string[];
  activeAction?: string;
  surfaces: readonly { surface: string; lines: readonly string[]; priority: number; rows?: number }[];
  runtime?: StageRuntimeVisualState;
}): readonly string[] {
  const w = widthOf(input.width);
  const inner = innerOf(w);
  const mode = sceneMode(w);
  const energy = sceneEnergy(input.state);
  const cadence = sceneCadence(mode, energy);
  const energyRatio = sceneEnergyRatio(energy);
  const density = visualDensity(w, input.surfaces.length);
  const out: string[] = [frameTop(w)];
  const unified = unifiedSceneContract(w, input.state, input.surfaces.length, input.state === 'ACTIVE');
  const focalState = unifiedOpticalState(100, 'PLAYER', input.state === 'ACTIVE', w);

  // V57 optical composition: every visible band is assigned a tone and zone.
  // The UI is deliberately treated as one pixel-written instrument, not a
  // collection of cards. Negative space, bitmap typography and signal density
  // are first-class visual primitives.
  const brandTone = opticalTone('IDENTITY', 'HERO');
  const playerTone = opticalTone('PLAYER', 'FOCAL', input.state === 'ACTIVE');
  out.push(framed(unifiedSceneRail(w, unified), w, 'CENTER'));
  out.push(framed(opticalFrame(w, brandTone), w, 'CENTER'));
  out.push(framed(unifiedOpticalRail(w, focalState, 1), w, 'CENTER'));
  out.push(...opticalHeroComposition('NOIR MUSIC', w, brandTone).map((row) => framed(row, w, 'CENTER')));
  out.push(framed(opticalPair('SCENE', `${mode} · ${cadence} · ${density}`, inner, 'HERO'), w));
  out.push(framed(opticalFrame(w, 'HERO'), w, 'CENTER'));
  out.push(framed(opticalBaselineLock(inner, input.positionRatio, playerTone), w, 'CENTER'));
  out.push(framed(opticalAxis(inner, input.positionRatio, playerTone), w, 'CENTER'));

  for (let i = 0; i < (density === 'AIRY' ? 1 : 0); i += 1) out.push(visualGap(w, density, 'HERO'));
  out.push(...unifiedFocusSurface(input.title, w, focalState).map((row) => framed(row, w, 'CENTER')));
  out.push(framed(opticalPair('ARTIST', input.artist ?? 'UNKNOWN ARTIST', inner, 'HERO'), w));
  if (mode !== 'COMPACT') out.push(framed(opticalPair('SOURCE', input.source ?? 'SOURCE', inner, 'QUIET'), w));
  out.push(framed(opticalPair('STATE', input.state, inner, input.state === 'ACTIVE' ? 'ACTIVE' : 'QUIET'), w));
  out.push(framed(opticalMeter(input.positionRatio, Math.max(12, inner - 4), playerTone), w, 'CENTER'));
  out.push(framed(opticalPair('ENERGY', `${energy} · ${Math.round(energyRatio * 100)}%`, inner, playerTone), w));
  if (input.runtime) {
    const runtimeRatio = Math.max(0, Math.min(1, Math.max(input.runtime.reconciliation.ratio, input.runtime.recovery.ratio)));
    const runtimeLabel = `${input.runtime.control.availability} · ${input.runtime.reconciliation.status} · ${input.runtime.recovery.status}`;
    out.push(framed(opticalPair('RUNTIME', runtimeLabel, inner, runtimeRatio > 0.25 ? 'ACTIVE' : 'QUIET'), w));
    out.push(framed(pixelCell(`${VISUAL_STAGE.quiet} ${input.runtime.control.leasePressure} ${VISUAL_STAGE.dot} ${input.runtime.control.persistencePressure}`, inner, 'CENTER', ''), w));
    out.push(framed(pixelCell(`${VISUAL_STAGE.focus} ${input.runtime.recovery.health} ${VISUAL_STAGE.dot} ${Math.round(runtimeRatio * 100)}%`, inner, 'CENTER', ''), w));
  }
  out.push(...opticalFocusWindow(inner, input.positionRatio, playerTone).map((row) => framed(row, w, 'CENTER')));
  out.push(framed(opticalCell('PLAYBACK', `${Math.round(Math.max(0, Math.min(1, input.positionRatio)) * 100)}%`, inner, playerTone), w));
  out.push(framed(pixelFocusRail(input.positionRatio, inner), w));
  out.push(framed(actionRail(input.actions ?? [], input.activeAction ?? 'PLAY', inner), w));
  out.push(framed(opticalFrame(w, 'ACTIVE'), w, 'CENTER'));
  out.push(framed(opticalBaselineLock(inner, input.positionRatio, 'ACTIVE'), w, 'CENTER'));

  const visible = input.surfaces.slice().sort((a, b) => b.priority - a.priority);
  for (let index = 0; index < visible.length; index += 1) {
    const surface = visible[index];
    const focus = visualFocus(surface.priority, surface.surface);
    const depth = visualDepth(surface.priority, focus);
    const weight = visualWeight(surface.priority, focus);
    const tone = opticalTone(focus, depth, focus === 'PLAYER');
    const zone = opticalZone(focus);
    const indent = opticalStagger(index, w, tone);

    if (index > 0 && density !== 'DENSE') out.push(visualRhythm(w, index + weight, tone === 'ACTIVE' ? '◆' : '◇'));
    if (mode === 'COMPACT' && index > 1) {
      out.push(framed(`${indent}${tone === 'ACTIVE' ? VISUAL_STAGE.focus : VISUAL_STAGE.quiet} ${clean(surface.surface, inner - indent.length - 4, 'SURFACE')}`, w, 'LEFT'));
    } else {
      out.push(...visualLandmark(surface.surface, w, weight).map((row) => framed(`${indent}${row}`, w, 'CENTER')));
    }
    if (depth !== 'QUIET' && mode !== 'COMPACT') {
      out.push(framed(opticalCell(zone, `${depth} · ${String(surface.priority).padStart(3, '0')}`, inner, tone), w));
    }
    const content = stripChrome(surface.lines, w);
    if (focus === 'PLAYER' && content.length) {
      out.push(framed(`${VISUAL_STAGE.active} ${opticalMeter(input.positionRatio, Math.max(10, inner - 8), tone)}`, w, 'CENTER'));
    }
    out.push(...content.map((line) => framed(`${indent}${line}`, w)));
    if (index < visible.length - 1 && density === 'AIRY') out.push(visualGap(w, density, zone as any));
  }

  out.push(framed(opticalRule(w, 'QUIET'), w, 'CENTER'));
  out.push(framed(sceneSignature(mode, energy, inner), w, 'CENTER'));
  out.push(framed(opticalSignature(opticalZone(visualFocus(100, 'PLAYER')), density, inner), w, 'CENTER'));
  out.push(framed(`${VISUAL_STAGE.quiet} PIXEL WRITING ${VISUAL_STAGE.dot} OPTICAL GRID ${VISUAL_STAGE.dot} MATRIX ONLY`, w, 'CENTER'));
  out.push(frameBottom(w));
  return Object.freeze(out.map((line) => pixelCell(line, w, 'LEFT', '')));
}



/** V61 stage blueprint: a pure, deterministic description of optical ownership. */
export type StageBlueprint = Readonly<{
  width: number;
  balance: 'FOCAL' | 'CENTERED' | 'AIRY' | 'COMPRESSED';
  axisRatio: number;
  heroScale: 1 | 2;
  focalWindow: number;
  quietBand: number;
}>;

export function stageBlueprint(widthValue: number, energy: number, active = false, surfaceCount = 0): StageBlueprint {
  const width = Math.max(30, Math.min(72, Math.trunc(Number(widthValue) || 48)));
  const scene = sceneOpticalContract(width, energy, surfaceCount);
  const density = width >= 62 && surfaceCount <= 5 ? 'AIRY' : width <= 40 || surfaceCount >= 9 ? 'DENSE' : 'BALANCED';
  const visual = visualStageContract(width, active, density);
  return Object.freeze({ width, balance: scene.balance, axisRatio: visual.axisRatio, heroScale: visual.heroScale, focalWindow: visual.focalWindow, quietBand: visual.quietBand });
}
