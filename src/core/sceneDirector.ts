/**
 * NOIR MUSIC // GLYPH MATRIX SCENE DIRECTOR V62.0
 *
 * A visual-only art-direction layer. It converts runtime state into a small,
 * deterministic scene grammar: focus, energy, density and landmark rhythm.
 * No color, emoji, icons, gradients or second visual language are introduced.
 */
import { pixelBitmapComposition, pixelCell, pixelNormalize } from './pixelTypography';
import { unifiedOpticalState, unifiedOpticalRail, type UnifiedOpticalState } from './visualOrchestrator';

export type SceneMode = 'COMPACT' | 'BALANCED' | 'CINEMA';
export type SceneEnergy = 'QUIET' | 'READY' | 'ACTIVE' | 'BUSY' | 'ERROR';

export const SCENE_DIRECTOR = Object.freeze({
  minWidth: 30,
  maxWidth: 72,
  glyph: Object.freeze({ focus: '◆', quiet: '◇', active: '●', idle: '·', fill: '█', mid: '▓', empty: '░', rail: '─', tick: '┄' }),
});

const clampWidth = (width: number) => Math.max(SCENE_DIRECTOR.minWidth, Math.min(SCENE_DIRECTOR.maxWidth, Math.trunc(Number(width) || 48)));

export function sceneMode(width: number): SceneMode {
  const w = clampWidth(width);
  return w <= 38 ? 'COMPACT' : w <= 56 ? 'BALANCED' : 'CINEMA';
}

export function sceneEnergy(state: string): SceneEnergy {
  const s = pixelNormalize(state, 12, 'IDLE');
  if (s === 'ERROR') return 'ERROR';
  if (s === 'BUSY' || s === 'WARNING' || s === 'STALE') return 'BUSY';
  if (s === 'ACTIVE') return 'ACTIVE';
  if (s === 'READY' || s === 'SUCCESS') return 'READY';
  return 'QUIET';
}

export function scenePulse(energy: SceneEnergy, width: number): string {
  const w = clampWidth(width);
  const inner = Math.max(12, w - 8);
  const ratio = energy === 'ACTIVE' ? 0.82 : energy === 'READY' ? 0.62 : energy === 'BUSY' ? 0.48 : energy === 'ERROR' ? 0.28 : 0.14;
  const focus = Math.min(inner - 1, Math.max(0, Math.round(ratio * (inner - 1))));
  const body = Array.from({ length: inner }, (_, i) => i === focus ? SCENE_DIRECTOR.glyph.focus : i < focus ? (i % 3 === 0 ? SCENE_DIRECTOR.glyph.mid : SCENE_DIRECTOR.glyph.fill) : SCENE_DIRECTOR.glyph.empty).join('');
  const marker = energy === 'ACTIVE' ? SCENE_DIRECTOR.glyph.active : energy === 'ERROR' ? SCENE_DIRECTOR.glyph.focus : SCENE_DIRECTOR.glyph.quiet;
  return pixelCell(`${marker} ${body} ${SCENE_DIRECTOR.glyph.quiet}`, w, 'CENTER', '');
}

export function sceneLandmark(label: string, width: number): readonly string[] {
  const w = clampWidth(width);
  const inner = Math.max(12, w - 8);
  return Object.freeze(pixelBitmapComposition(pixelNormalize(label, 18, 'NOIR'), inner, { scale: w >= 56 ? 2 : 1, gap: 1, align: 'CENTER' }).map((row) => pixelCell(row, w, 'CENTER', '')));
}

export function sceneRule(width: number, lead = '◇'): string {
  const w = clampWidth(width);
  return pixelCell(`${lead}${SCENE_DIRECTOR.glyph.tick.repeat(Math.max(1, w - 4))}${SCENE_DIRECTOR.glyph.quiet}`, w, 'CENTER', '');
}

export function sceneModeSignature(mode: SceneMode, energy: SceneEnergy, width: number): string {
  const w = clampWidth(width);
  return pixelCell(`${SCENE_DIRECTOR.glyph.quiet} ${mode} ${SCENE_DIRECTOR.glyph.idle} ${energy} ${SCENE_DIRECTOR.glyph.idle} CELL-LOCKED`, w, 'CENTER', '');
}


export type SceneCadence = 'OPEN' | 'FOCUSED' | 'COMPRESSED';

export function sceneCadence(mode: SceneMode, energy: SceneEnergy): SceneCadence {
  if (mode === 'COMPACT' || energy === 'BUSY' || energy === 'ERROR') return 'COMPRESSED';
  if (mode === 'CINEMA' && (energy === 'ACTIVE' || energy === 'READY')) return 'FOCUSED';
  return 'OPEN';
}

export function sceneEnergyRatio(energy: SceneEnergy): number {
  return energy === 'ACTIVE' ? 0.84 : energy === 'READY' ? 0.62 : energy === 'BUSY' ? 0.48 : energy === 'ERROR' ? 0.22 : 0.12;
}

export function sceneSignature(mode: SceneMode, energy: SceneEnergy, width: number): string {
  const w = clampWidth(width);
  const cadence = sceneCadence(mode, energy);
  return pixelCell(`${SCENE_DIRECTOR.glyph.focus} ${mode} ${SCENE_DIRECTOR.glyph.idle} ${energy} ${SCENE_DIRECTOR.glyph.idle} ${cadence} ${SCENE_DIRECTOR.glyph.idle} PIXEL SCENE`, w, 'CENTER', '');
}



export type SceneBalance = 'FOCAL' | 'CENTERED' | 'AIRY' | 'COMPRESSED';
export type SceneTempo = 'STATIC' | 'STEADY' | 'ACTIVE';

export type SceneOpticalContract = Readonly<{
  balance: SceneBalance;
  tempo: SceneTempo;
  focalRatio: number;
  negativeSpace: number;
  cadence: number;
}>;

export function sceneOpticalContract(widthValue: number, energy: number, surfaceCount = 0): SceneOpticalContract {
  const width = Math.max(30, Math.min(72, Math.trunc(Number(widthValue) || 48)));
  const e = Math.max(0, Math.min(1, Number(energy) || 0));
  const count = Math.max(0, Math.trunc(surfaceCount));
  const balance: SceneBalance = e >= 0.72 ? 'FOCAL' : count >= 9 || width <= 38 ? 'COMPRESSED' : width >= 62 && count <= 5 ? 'AIRY' : 'CENTERED';
  const tempo: SceneTempo = e >= 0.75 ? 'ACTIVE' : e >= 0.35 ? 'STEADY' : 'STATIC';
  return Object.freeze({
    balance,
    tempo,
    focalRatio: balance === 'FOCAL' ? 0.58 : balance === 'AIRY' ? 0.5 : 0.54,
    negativeSpace: balance === 'AIRY' ? 0.22 : balance === 'COMPRESSED' ? 0.08 : 0.14,
    cadence: tempo === 'ACTIVE' ? 1 : tempo === 'STEADY' ? 2 : 3,
  });
}


export type UnifiedSceneContract = Readonly<{
  mode: SceneMode;
  energy: SceneEnergy;
  cadence: SceneCadence;
  ratio: number;
  optical: UnifiedOpticalState;
}>;

export function unifiedSceneContract(widthValue: number, state: string, surfaceCount = 0, active = false): UnifiedSceneContract {
  const width = clampWidth(widthValue);
  const mode = sceneMode(width);
  const energy = sceneEnergy(state);
  const ratio = sceneEnergyRatio(energy);
  const optical = unifiedOpticalState(100, 'PLAYER', active || energy === 'ACTIVE', width);
  return Object.freeze({ mode, energy, cadence: sceneCadence(mode, energy), ratio, optical });
}

export function unifiedSceneRail(widthValue: number, contract: UnifiedSceneContract, phase = 0): string {
  return pixelCell(unifiedOpticalRail(clampWidth(widthValue), contract.optical, phase), clampWidth(widthValue), 'CENTER', '');
}
