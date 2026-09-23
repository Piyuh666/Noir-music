/**
 * NOIR MUSIC // GLYPH MATRIX VISUAL ORCHESTRATOR V62.0
 *
 * The highest-level visual-quality layer. It does not add another skin.
 * It composes a single monochrome character-cell scene using three ideas:
 * focal hierarchy, optical depth, and deterministic rhythm.
 *
 * Every visible primitive remains pixel-written or Glyph Matrix geometry.
 */
import { pixelBitmapComposition, pixelBitmapText, pixelBitmapTextScaled, pixelCell, pixelNormalize, pixelBaseline, pixelOpticalContract, pixelOpticalSurface } from './pixelTypography';
import type { PixelTone } from './pixelTypography';

export type VisualFocus = 'IDENTITY' | 'PLAYER' | 'CONTROL' | 'QUEUE' | 'SYSTEM';
export type VisualDepth = 'HERO' | 'FOCAL' | 'SUPPORT' | 'QUIET';

export const VISUAL_ORCHESTRATOR = Object.freeze({
  glyph: Object.freeze({ focus: '◆', active: '●', quiet: '◇', rail: '─', hair: '┄', solid: '█', mid: '▓', soft: '░', dot: '·' }),
  frame: Object.freeze({ tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║', mid: '╠', join: '╬' }),
  minWidth: 30,
  maxWidth: 72,
});

const width = (value: number) => Math.max(30, Math.min(72, Math.trunc(Number(value) || 48)));
const clean = (value: unknown, max: number, fallback = '') => pixelNormalize(value, Math.max(1, max), fallback);

export function visualFocus(priority: number, surface: string): VisualFocus {
  const p = Math.max(0, Math.trunc(priority));
  const s = clean(surface, 20, 'SYSTEM');
  if (s === 'PLAYER' || p >= 90) return 'PLAYER';
  if (s === 'QUEUE' || p >= 70) return 'QUEUE';
  if (s === 'NAVIGATION' || s === 'COMMAND' || p >= 50) return 'CONTROL';
  if (s === 'TELEMETRY' || s === 'ACCESSIBILITY' || p < 35) return 'SYSTEM';
  return 'IDENTITY';
}

export function visualDepth(priority: number, focus: VisualFocus): VisualDepth {
  if (focus === 'PLAYER' || priority >= 90) return 'FOCAL';
  if (focus === 'IDENTITY') return 'HERO';
  if (priority >= 60) return 'SUPPORT';
  return 'QUIET';
}

export function visualWeight(priority: number, focus: VisualFocus): number {
  const base = focus === 'PLAYER' ? 4 : focus === 'CONTROL' ? 3 : focus === 'QUEUE' ? 2 : focus === 'IDENTITY' ? 4 : 1;
  return Math.max(1, Math.min(5, base + (priority >= 85 ? 1 : 0) - (priority < 25 ? 1 : 0)));
}

export function visualMeter(ratio: number, widthValue: number, weight = 3): string {
  const w = Math.max(8, Math.trunc(widthValue));
  const r = Math.max(0, Math.min(1, Number(ratio) || 0));
  const cursor = Math.min(w - 1, Math.max(0, Math.round(r * (w - 1))));
  return Array.from({ length: w }, (_, i) => {
    if (i === cursor) return VISUAL_ORCHESTRATOR.glyph.focus;
    if (i > cursor) return VISUAL_ORCHESTRATOR.glyph.soft;
    if (weight >= 4) return VISUAL_ORCHESTRATOR.glyph.solid;
    if (weight === 3) return i % 3 === 0 ? VISUAL_ORCHESTRATOR.glyph.mid : VISUAL_ORCHESTRATOR.glyph.solid;
    return i % 2 === 0 ? VISUAL_ORCHESTRATOR.glyph.mid : VISUAL_ORCHESTRATOR.glyph.solid;
  }).join('');
}

export function visualRhythm(widthValue: number, phase = 0, lead = '◇'): string {
  const w = width(widthValue);
  const body = Math.max(1, w - 5);
  const pattern = Array.from({ length: body }, (_, i) => ((i + phase) % 4 === 0 ? '┄' : '─')).join('');
  return pixelCell(`${lead}${pattern}${VISUAL_ORCHESTRATOR.glyph.quiet}`, w, 'CENTER', '');
}

export function visualLandmark(label: string, widthValue: number, weight = 3): readonly string[] {
  const w = width(widthValue);
  const inner = Math.max(8, w - 6);
  const scale = 1;
  return Object.freeze(pixelBitmapText(clean(label, 18, 'NOIR'), inner, scale)
    .map((line) => pixelCell(line, w, 'CENTER', '')));
}

export function visualFrameLine(widthValue: number, type: 'TOP' | 'MID' | 'BOTTOM' = 'MID'): string {
  const w = width(widthValue);
  const f = VISUAL_ORCHESTRATOR.frame;
  if (type === 'TOP') return `${f.tl}${f.h.repeat(w - 2)}${f.tr}`;
  if (type === 'BOTTOM') return `${f.bl}${f.h.repeat(w - 2)}${f.br}`;
  return `${f.mid}${f.h.repeat(w - 2)}${f.join}`;
}


export type VisualDensity = 'AIRY' | 'BALANCED' | 'DENSE';
export type VisualZone = 'IDENTITY' | 'HERO' | 'CONTROL' | 'QUEUE' | 'TELEMETRY' | 'FOOTER';

/**
 * V59 visual quality model. The scene is composed as a single optical grid:
 * one focal axis, one baseline rhythm, and controlled negative space. These
 * helpers deliberately return character-cell geometry only.
 */
export const VISUAL_QUALITY = Object.freeze({
  axis: Object.freeze({ left: '│', center: '◆', right: '│' }),
  density: Object.freeze({ airy: 2, balanced: 1, dense: 0 }),
  glyph: Object.freeze({ major: '◆', minor: '◇', active: '●', quiet: '·', bar: '─', fill: '█', half: '▓', empty: '░', cut: '┄' }),
  spacing: Object.freeze({ hero: 2, section: 1, quiet: 1 }),
});


export type OpticalTone = 'HERO' | 'ACTIVE' | 'QUIET' | 'MUTED';
export type OpticalZone = 'BRAND' | 'PLAYER' | 'CONTROL' | 'QUEUE' | 'SYSTEM';

export const OPTICAL_COMPOSITION = Object.freeze({
  grid: Object.freeze({ min: 30, max: 72, inset: 2, gutter: 1 }),
  glyph: Object.freeze({
    anchor: '◆', active: '●', quiet: '◇', muted: '·',
    solid: '█', mid: '▓', soft: '░', rail: '─', cut: '┄',
    left: '│', right: '│', cap: '┬', foot: '┴', cross: '┼',
  }),
  cadence: Object.freeze({ hero: 2, focal: 1, support: 1, quiet: 0 }),
});

export function opticalTone(focus: VisualFocus, depth: VisualDepth, active = false): OpticalTone {
  if (active || focus === 'PLAYER' && depth === 'FOCAL') return 'ACTIVE';
  if (focus === 'IDENTITY' || depth === 'HERO') return 'HERO';
  if (depth === 'SUPPORT') return 'QUIET';
  return 'MUTED';
}

export function opticalZone(focus: VisualFocus): OpticalZone {
  if (focus === 'IDENTITY') return 'BRAND';
  if (focus === 'PLAYER') return 'PLAYER';
  if (focus === 'CONTROL') return 'CONTROL';
  if (focus === 'QUEUE') return 'QUEUE';
  return 'SYSTEM';
}

export function opticalInset(widthValue: number, tone: OpticalTone): number {
  const w = width(widthValue);
  const base = tone === 'HERO' || tone === 'ACTIVE' ? 2 : 1;
  return Math.min(4, Math.max(1, Math.floor(w / 22) + base));
}

export function opticalRule(widthValue: number, tone: OpticalTone = 'QUIET'): string {
  const w = width(widthValue);
  const g = OPTICAL_COMPOSITION.glyph;
  const lead = tone === 'ACTIVE' || tone === 'HERO' ? g.anchor : tone === 'QUIET' ? g.quiet : g.muted;
  const unit = tone === 'ACTIVE' ? g.solid : tone === 'HERO' ? g.mid : tone === 'QUIET' ? g.rail : g.cut;
  return pixelCell(`${lead}${unit.repeat(Math.max(1, w - 2))}${lead}`, w, 'CENTER', '');
}

export function opticalAxis(widthValue: number, ratio = 0.5, tone: OpticalTone = 'ACTIVE'): string {
  const w = width(widthValue);
  const g = OPTICAL_COMPOSITION.glyph;
  const cursor = Math.max(2, Math.min(w - 3, Math.round(Math.max(0, Math.min(1, ratio)) * (w - 1))));
  const unit = tone === 'ACTIVE' ? g.solid : tone === 'HERO' ? g.mid : tone === 'QUIET' ? g.rail : g.cut;
  const row = Array.from({ length: w }, (_, i) => i === cursor ? g.anchor : unit).join('');
  return row.slice(0, w);
}

export function opticalMeter(ratio: number, widthValue: number, tone: OpticalTone = 'ACTIVE'): string {
  const w = Math.max(8, Math.trunc(widthValue));
  const r = Math.max(0, Math.min(1, Number(ratio) || 0));
  const cursor = Math.min(w - 1, Math.max(0, Math.round(r * (w - 1))));
  const g = OPTICAL_COMPOSITION.glyph;
  const filled = tone === 'ACTIVE' ? g.solid : tone === 'HERO' ? g.mid : tone === 'QUIET' ? g.rail : g.cut;
  return Array.from({ length: w }, (_, i) => i === cursor ? g.anchor : i < cursor ? filled : g.soft).join('');
}

export function opticalCell(label: string, value: string, widthValue: number, tone: OpticalTone = 'QUIET'): string {
  const w = width(widthValue);
  const marker = tone === 'ACTIVE' ? OPTICAL_COMPOSITION.glyph.active : tone === 'HERO' ? OPTICAL_COMPOSITION.glyph.anchor : tone === 'QUIET' ? OPTICAL_COMPOSITION.glyph.quiet : OPTICAL_COMPOSITION.glyph.muted;
  const left = clean(label, Math.max(4, Math.floor(w * 0.32)), 'FIELD');
  const right = clean(value, Math.max(4, w - left.length - 5), '—');
  const gap = Math.max(1, w - left.length - right.length - 4);
  return pixelCell(`${marker} ${left}${' '.repeat(gap)}${right}`, w, 'LEFT', '');
}

export function opticalTitle(title: string, widthValue: number, tone: OpticalTone = 'HERO'): readonly string[] {
  const w = width(widthValue);
  const inner = Math.max(12, w - 4 - opticalInset(w, tone) * 2);
  const scale = opticalScale(w, tone);
  const rows = pixelBitmapComposition(clean(title, 20, 'NOIR MUSIC'), inner, { scale: scale, gap: 1, align: 'CENTER' });
  const marker = tone === 'ACTIVE' ? OPTICAL_COMPOSITION.glyph.active : tone === 'HERO' ? OPTICAL_COMPOSITION.glyph.anchor : OPTICAL_COMPOSITION.glyph.quiet;
  return Object.freeze(rows.map((row) => pixelCell(`${marker} ${row} ${marker}`, w, 'CENTER', '')));
}

export function opticalStagger(index: number, widthValue: number, tone: OpticalTone): string {
  const w = width(widthValue);
  const amount = Math.min(4, Math.max(0, (index % 3) + (tone === 'ACTIVE' ? 0 : tone === 'HERO' ? 1 : 0)));
  return ' '.repeat(Math.min(amount, Math.max(0, w - 1)));
}

export function opticalSignature(zone: OpticalZone, density: VisualDensity, widthValue: number): string {
  return pixelCell(`${OPTICAL_COMPOSITION.glyph.quiet} ${zone} ${OPTICAL_COMPOSITION.glyph.cut} ${density} ${OPTICAL_COMPOSITION.glyph.cut} CELL-LOCKED`, width(widthValue), 'CENTER', '');
}

export function visualDensity(widthValue: number, surfaceCount = 0): VisualDensity {
  const w = width(widthValue);
  const count = Math.max(0, Math.trunc(surfaceCount));
  if (w >= 62 && count <= 5) return 'AIRY';
  if (w <= 40 || count >= 9) return 'DENSE';
  return 'BALANCED';
}

export function visualZone(focus: VisualFocus): VisualZone {
  if (focus === 'IDENTITY') return 'IDENTITY';
  if (focus === 'PLAYER') return 'HERO';
  if (focus === 'CONTROL') return 'CONTROL';
  if (focus === 'QUEUE') return 'QUEUE';
  return 'TELEMETRY';
}

export function visualGap(widthValue: number, density: VisualDensity, zone: VisualZone = 'CONTROL'): string {
  const w = width(widthValue);
  const base = density === 'AIRY' ? 2 : density === 'BALANCED' ? 1 : 0;
  const extra = zone === 'HERO' || zone === 'IDENTITY' ? 1 : 0;
  return ' '.repeat(Math.min(3, base + extra)).slice(0, Math.max(0, Math.min(3, w - 1)));
}

export function visualAxis(widthValue: number, focus: VisualFocus, state = 'READY'): string {
  const w = width(widthValue);
  const f = focus === 'PLAYER' ? VISUAL_QUALITY.glyph.major : VISUAL_QUALITY.glyph.minor;
  const stateGlyph = clean(state, 10, 'READY');
  const left = Math.max(4, Math.floor((w - stateGlyph.length - 5) / 2));
  const right = Math.max(4, w - left - stateGlyph.length - 3);
  return `${VISUAL_QUALITY.axis.left}${VISUAL_QUALITY.glyph.bar.repeat(left)}${f}${VISUAL_QUALITY.glyph.bar.repeat(right)}${VISUAL_QUALITY.axis.right}`.slice(0, w);
}

export function visualTitleLock(title: string, widthValue: number, focus: VisualFocus = 'PLAYER'): readonly string[] {
  const w = width(widthValue);
  const inner = Math.max(12, w - 8);
  const rows = pixelBitmapText(clean(title, 20, 'NOIR MUSIC'), inner, focus === 'PLAYER' ? 1 : 1);
  const marker = focus === 'PLAYER' ? VISUAL_QUALITY.glyph.major : VISUAL_QUALITY.glyph.minor;
  return Object.freeze(rows.map((row) => pixelCell(`${marker} ${row} ${marker}`, w, 'CENTER', '')));
}

export function visualMicroLabel(label: string, value: string, widthValue: number, active = false): string {
  const w = width(widthValue);
  const left = clean(label, Math.max(4, Math.floor(w * 0.28)), 'STATE');
  const right = clean(value, Math.max(4, w - left.length - 6), '—');
  const glyph = active ? VISUAL_QUALITY.glyph.active : VISUAL_QUALITY.glyph.quiet;
  return pixelCell(`${glyph} ${left} ${VISUAL_QUALITY.glyph.cut} ${right}`, w, 'LEFT', '');
}

export function visualSignalLadder(values: readonly number[], widthValue: number): string {
  const w = width(widthValue);
  const count = Math.max(1, values.length);
  const cell = Math.max(5, Math.floor((w - (count - 1)) / count));
  const cells = values.slice(0, 8).map((value) => {
    const ratio = Math.max(0, Math.min(1, Number(value) || 0));
    const filled = Math.max(1, Math.round(ratio * Math.max(2, cell - 2)));
    return `${VISUAL_QUALITY.glyph.quiet}${VISUAL_QUALITY.glyph.fill.repeat(filled)}${VISUAL_QUALITY.glyph.empty.repeat(Math.max(0, cell - filled - 1))}`.slice(0, cell);
  });
  return pixelCell(cells.join(VISUAL_QUALITY.glyph.cut), w, 'CENTER', '');
}

export function visualFrameRail(widthValue: number, emphasis: 'HERO' | 'QUIET' = 'QUIET'): string {
  const w = width(widthValue);
  const glyph = emphasis === 'HERO' ? VISUAL_QUALITY.glyph.major : VISUAL_QUALITY.glyph.minor;
  const repeat = Math.max(1, w - 4);
  return pixelCell(`${glyph}${VISUAL_QUALITY.glyph.bar.repeat(repeat)}${glyph}`, w, 'CENTER', '');
}



/**
 * V59 TYPOGRAPHIC COMPOSITION SEAL
 *
 * The visual system now treats the bitmap alphabet itself as the primary
 * layout primitive. Hero text receives a deterministic 2x cell scale when
 * the viewport can afford it; narrow scenes fall back to the compact 1x
 * alphabet. No proportional-font assumptions are introduced.
 */
export type OpticalScale = 1 | 2;

export function opticalScale(widthValue: number, tone: OpticalTone): OpticalScale {
  const w = width(widthValue);
  return (tone === 'ACTIVE' || tone === 'HERO') && w >= 56 ? 2 : 1;
}

function scaledBitmapRows(value: string, maxColumns: number, scale: OpticalScale): readonly string[] {
  return pixelBitmapTextScaled(value, Math.max(8, maxColumns), scale, 1);
}

export function opticalHeroTitle(title: string, widthValue: number, tone: OpticalTone = 'HERO'): readonly string[] {
  const w = width(widthValue);
  const scale = opticalScale(w, tone);
  const inset = opticalInset(w, tone);
  const inner = Math.max(12, w - inset * 2 - 4);
  const marker = tone === 'ACTIVE' ? OPTICAL_COMPOSITION.glyph.active : OPTICAL_COMPOSITION.glyph.anchor;
  return Object.freeze(scaledBitmapRows(clean(title, 20, 'NOIR MUSIC'), inner, scale)
    .map((row) => pixelCell(`${marker} ${row} ${marker}`, w, 'CENTER', '')));
}

export function opticalFrame(widthValue: number, emphasis: OpticalTone = 'QUIET'): string {
  const w = width(widthValue);
  const g = OPTICAL_COMPOSITION.glyph;
  const anchor = emphasis === 'ACTIVE' || emphasis === 'HERO' ? g.anchor : g.quiet;
  const rail = emphasis === 'ACTIVE' ? g.solid : emphasis === 'HERO' ? g.mid : g.rail;
  const inner = Math.max(1, w - 2);
  const center = Math.floor(inner / 2);
  const body = Array.from({ length: inner }, (_, i) => i === center ? anchor : rail).join('');
  return pixelCell(`${g.left}${body}${g.right}`, w, 'CENTER', '');
}

export function opticalBaseline(widthValue: number, ratio = 0.5, tone: OpticalTone = 'QUIET'): string {
  const w = width(widthValue);
  const g = OPTICAL_COMPOSITION.glyph;
  const cursor = Math.max(1, Math.min(w - 2, Math.round(Math.max(0, Math.min(1, ratio)) * (w - 1))));
  const rail = tone === 'ACTIVE' ? g.solid : tone === 'HERO' ? g.mid : g.rail;
  return Array.from({ length: w }, (_, i) => i === cursor ? g.anchor : rail).join('');
}

export function opticalPair(label: string, value: string, widthValue: number, tone: OpticalTone = 'QUIET'): string {
  const w = width(widthValue);
  const labelWidth = Math.max(6, Math.floor(w * 0.28));
  const marker = tone === 'ACTIVE' ? OPTICAL_COMPOSITION.glyph.active : tone === 'HERO' ? OPTICAL_COMPOSITION.glyph.anchor : OPTICAL_COMPOSITION.glyph.quiet;
  const left = pixelCell(`${marker} ${clean(label, labelWidth - 2, 'FIELD')}`, labelWidth, 'LEFT', '');
  const right = pixelCell(clean(value, Math.max(4, w - labelWidth - 1), '—'), Math.max(4, w - labelWidth - 1), 'RIGHT', '');
  return `${left}${OPTICAL_COMPOSITION.glyph.cut}${right}`.slice(0, w);
}

export function visualSceneSignature(mode: string, focus: VisualFocus, energy: string, widthValue: number): string {
  const w = width(widthValue);
  return pixelCell(`${VISUAL_ORCHESTRATOR.glyph.quiet} ${clean(mode, 10, 'BALANCED')} ${VISUAL_ORCHESTRATOR.glyph.dot} ${focus} ${VISUAL_ORCHESTRATOR.glyph.dot} ${clean(energy, 10, 'QUIET')} ${VISUAL_ORCHESTRATOR.glyph.dot} PIXEL SCENE`, w, 'CENTER', '');
}


/**
 * V61 OPTICAL COMPOSITION SYSTEM
 * A single deterministic contract for hero, focus, rhythm and live-state
 * geometry. These functions deliberately expose no second visual language.
 */
export type OpticalIntensity = 'PRIMARY' | 'SECONDARY' | 'TERTIARY';

export function opticalIntensity(tone: OpticalTone, focus: VisualFocus): OpticalIntensity {
  if (tone === 'ACTIVE' || focus === 'PLAYER') return 'PRIMARY';
  if (tone === 'HERO' || focus === 'IDENTITY') return 'SECONDARY';
  return 'TERTIARY';
}

export function opticalBaselineLock(widthValue: number, ratio = 0.5, tone: OpticalTone = 'QUIET'): string {
  const w = width(widthValue);
  return pixelCell(pixelBaseline(w, ratio, tone === 'ACTIVE' || tone === 'HERO'), w, 'CENTER', '');
}

export function opticalHeroComposition(title: string, widthValue: number, tone: OpticalTone = 'HERO'): readonly string[] {
  const w = width(widthValue);
  const scale = opticalScale(w, tone);
  const inset = opticalInset(w, tone);
  const inner = Math.max(12, w - inset * 2 - 4);
  const marker = tone === 'ACTIVE' ? OPTICAL_COMPOSITION.glyph.active : tone === 'HERO' ? OPTICAL_COMPOSITION.glyph.anchor : OPTICAL_COMPOSITION.glyph.quiet;
  const bitmap = pixelBitmapComposition(clean(title, 20, 'NOIR MUSIC'), inner, { scale, gap: 1, align: 'CENTER' });
  return Object.freeze(bitmap.map((row) => pixelCell(`${marker} ${row.trimEnd()} ${marker}`, w, 'CENTER', '')));
}

export function opticalFocusWindow(widthValue: number, ratio = 0.5, tone: OpticalTone = 'ACTIVE'): readonly string[] {
  const w = width(widthValue);
  const marker = tone === 'ACTIVE' ? OPTICAL_COMPOSITION.glyph.active : OPTICAL_COMPOSITION.glyph.anchor;
  return Object.freeze([
    opticalFrame(w, tone),
    opticalBaselineLock(w, ratio, tone),
    pixelCell(`${marker} FOCUS ${OPTICAL_COMPOSITION.glyph.cut} ${Math.round(Math.max(0, Math.min(1, ratio)) * 100).toString().padStart(3, '0')}%`, w, 'CENTER', ''),
    opticalBaselineLock(w, ratio, 'QUIET'),
  ]);
}



/** V61: optical grammar makes state, scale, density and focus one deterministic decision. */
export type OpticalPriority = 'ANCHOR' | 'FOCAL' | 'SUPPORT' | 'QUIET';
export type OpticalMotion = 'STILL' | 'PULSE' | 'FLOW';

export type OpticalGrammar = Readonly<{
  focus: VisualFocus;
  depth: VisualDepth;
  tone: OpticalTone;
  priority: OpticalPriority;
  scale: OpticalScale;
  motion: OpticalMotion;
  inset: number;
  cadence: number;
}>;

export function opticalPriority(focus: VisualFocus, depth: VisualDepth, active = false): OpticalPriority {
  if (active || focus === 'PLAYER' && depth === 'FOCAL') return 'FOCAL';
  if (focus === 'IDENTITY' || depth === 'HERO') return 'ANCHOR';
  if (depth === 'SUPPORT') return 'SUPPORT';
  return 'QUIET';
}

export function opticalMotion(focus: VisualFocus, active = false): OpticalMotion {
  if (active && focus === 'PLAYER') return 'PULSE';
  if (focus === 'QUEUE' || focus === 'CONTROL') return 'FLOW';
  return 'STILL';
}

export function opticalGrammar(priority: number, surface: string, active = false): OpticalGrammar {
  const focus = visualFocus(priority, surface);
  const depth = visualDepth(priority, focus);
  const tone = opticalTone(focus, depth, active);
  const opticalPriorityValue = opticalPriority(focus, depth, active);
  const scale = opticalScale(64, tone);
  const motion = opticalMotion(focus, active);
  const cadence = opticalPriorityValue === 'FOCAL' ? 1 : opticalPriorityValue === 'ANCHOR' ? 2 : opticalPriorityValue === 'SUPPORT' ? 1 : 0;
  return Object.freeze({ focus, depth, tone, priority: opticalPriorityValue, scale, motion, inset: opticalInset(64, tone), cadence });
}

export function opticalCompositionRail(widthValue: number, grammar: OpticalGrammar, phase = 0): string {
  const w = width(widthValue);
  const g = OPTICAL_COMPOSITION.glyph;
  const activeGlyph = grammar.priority === 'FOCAL' ? g.anchor : grammar.priority === 'ANCHOR' ? g.quiet : g.muted;
  const unit = grammar.priority === 'FOCAL' ? g.solid : grammar.priority === 'ANCHOR' ? g.mid : grammar.priority === 'SUPPORT' ? g.rail : g.cut;
  return Array.from({ length: w }, (_, i) => ((i + phase) % Math.max(1, grammar.cadence + 3) === 0 ? activeGlyph : unit)).join('');
}

export function opticalFocusFrame(widthValue: number, grammar: OpticalGrammar): readonly string[] {
  const w = width(widthValue);
  const rail = opticalCompositionRail(Math.max(1, w - 2), grammar);
  const cap = grammar.priority === 'FOCAL' ? '╬' : grammar.priority === 'ANCHOR' ? '◆' : '◇';
  return Object.freeze([`${cap}${rail}${cap}`, opticalCompositionRail(w, grammar, 1), `${cap}${rail}${cap}`].map((row) => pixelCell(row, w, 'CENTER', '')));
}


/** V62: the single visual state machine consumed by scene, stage and micro layers. */
export type UnifiedOpticalState = Readonly<{
  focus: VisualFocus;
  depth: VisualDepth;
  tone: OpticalTone;
  priority: OpticalPriority;
  scale: OpticalScale;
  motion: OpticalMotion;
  cadence: number;
  intensity: 'PRIMARY' | 'SECONDARY' | 'TERTIARY' | 'QUIET';
  axisRatio: number;
  inset: number;
}>;

export function unifiedOpticalState(priority: number, surface: string, active = false, widthValue = 48): UnifiedOpticalState {
  const w = width(widthValue);
  const grammar = opticalGrammar(priority, surface, active);
  const focus = grammar.focus;
  const depth = grammar.depth;
  const tone = grammar.tone;
  const pixelTone: PixelTone = tone === 'ACTIVE' ? 'ACTIVE' : tone === 'HERO' ? 'HERO' : tone === 'QUIET' ? 'QUIET' : 'MUTED';
  const contract = pixelOpticalContract(surface, Math.max(12, w - 8), pixelTone);
  const intensity = opticalIntensity(pixelTone, focus);
  const axisRatio = focus === 'PLAYER' ? 0.58 : focus === 'IDENTITY' ? 0.5 : 0.5;
  return Object.freeze({
    focus, depth, tone, priority: grammar.priority, scale: contract.scale, motion: grammar.motion,
    cadence: Math.max(1, grammar.cadence), intensity, axisRatio, inset: opticalInset(w, tone),
  });
}

/** Canonical final optical rail. All directors call this instead of inventing their own. */
export function unifiedOpticalRail(widthValue: number, state: UnifiedOpticalState, phase = 0): string {
  const w = width(widthValue);
  const glyph = OPTICAL_COMPOSITION.glyph;
  const lead = state.priority === 'FOCAL' ? glyph.anchor : state.priority === 'ANCHOR' ? glyph.quiet : glyph.muted;
  const body = state.priority === 'FOCAL' ? glyph.solid : state.priority === 'ANCHOR' ? glyph.mid : state.priority === 'SUPPORT' ? glyph.rail : glyph.cut;
  const period = Math.max(2, state.cadence + 2);
  return Array.from({ length: w }, (_, i) => (i + phase) % period === 0 ? lead : body).join('');
}

export function unifiedFocusSurface(title: string, widthValue: number, state: UnifiedOpticalState): readonly string[] {
  const w = width(widthValue);
  const tone = state.tone === 'ACTIVE' || state.tone === 'HERO' ? state.tone : 'QUIET';
  const rows = pixelOpticalSurface(title, Math.max(12, w - state.inset * 2), tone, state.scale);
  return Object.freeze([
    pixelCell(`${OPTICAL_COMPOSITION.glyph.anchor} ${unifiedOpticalRail(w, state)} ${OPTICAL_COMPOSITION.glyph.anchor}`, w, 'CENTER', ''),
    ...rows.map((row) => pixelCell(`${OPTICAL_COMPOSITION.glyph.active} ${row.trimEnd()} ${OPTICAL_COMPOSITION.glyph.active}`, w, 'CENTER', '')),
    unifiedOpticalRail(w, state, 1),
  ]);
}
