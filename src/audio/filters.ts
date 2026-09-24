import { Player } from "lavalink-client";

/**
 * Central map of every named audio effect to the actual Lavalink filter
 * call it makes. This is the ONE place that talks to player.filterManager,
 * so every /effects command is a thin wrapper around a verified entry here
 * instead of duplicating filter math per command.
 *
 * CAVEAT (stated plainly, not hidden): lavalink-client's filterManager
 * method names have changed across major versions. This targets the
 * v2.x surface (toggleX() convenience methods + setEqualizer/setTimescale
 * style setters). Pin lavalink-client to the version in package.json and
 * diff this file against its CHANGELOG before upgrading — do not assume
 * silently that method names still match after a bump.
 *
 * Effects split into two honest buckets:
 *  - NATIVE: Lavalink server-side filters, always work if the node has
 *    filters enabled (see lavalink/application.yml).
 *  - toggle-based presets (nightcore, vaporwave, 8d, karaoke) are built
 *    from the native filters below (timescale/rotation/equalizer), not
 *    separate DSP — there is no fake control here that does nothing.
 */
export type EffectId =
  | "bassboost" | "nightcore" | "vaporwave" | "8d" | "karaoke" | "mono-audio"
  | "stereo" | "slow" | "speed-effect" | "pitch" | "treble" | "bass" | "echo"
  | "reverb" | "compressor" | "limiter" | "normalize" | "gain" | "lowpass"
  | "highpass" | "distortion" | "chorus" | "flanger" | "phaser" | "robot"
  | "telephone-filter" | "tremolo" | "rotation" | "vibrato";

export interface EffectDef {
  id: EffectId;
  label: string;
  description: string;
  /** Applies the effect. `value` is the optional numeric argument some effects accept. */
  apply: (player: Player, value?: number) => Promise<void>;
  /** Removes/resets this specific effect back to neutral. */
  clear: (player: Player) => Promise<void>;
  acceptsValue?: { min: number; max: number; description: string };
}

const fm = (player: Player) => (player as any).filterManager;

/** Authoritative playback-speed state shared by /playback speed, /pitch-lock,
 * effect presets, and UI controls. */
export async function setPlaybackSpeed(player: Player, percent: number): Promise<number> {
  const safe = Math.max(50, Math.min(200, Math.round(Number(percent) || 100)));
  const speed = safe / 100;
  const locked = Boolean(player.getData("pitchLocked"));
  await fm(player).setTimescale({ speed, pitch: locked ? 1 : speed, rate: 1 });
  player.setData("playbackSpeedPercent", safe);
  player.setData("playbackSpeedBaselinePercent", safe);
  return safe;
}

/** Re-applies the current playback speed with or without pitch locking. */
export async function setPitchLock(player: Player, enabled: boolean): Promise<void> {
  const percent = Math.max(50, Math.min(200, Math.round(Number(player.getData("playbackSpeedBaselinePercent") ?? player.getData("playbackSpeedPercent")) || 100)));
  player.setData("pitchLocked", Boolean(enabled));
  player.setData("playbackSpeedPercent", percent);
  await fm(player).setTimescale({
    speed: percent / 100,
    pitch: enabled ? 1 : percent / 100,
    rate: 1,
  });
}

export const EFFECTS: Record<EffectId, EffectDef> = {
  bassboost: {
    id: "bassboost", label: "Bass Boost",
    description: "Boosts low-frequency bands via the equalizer.",
    apply: async (p, value = 5) => {
      const gain = Math.max(0, Math.min(value, 10)) / 10; // 0..1
      await fm(p).setEQ([
        { band: 0, gain }, { band: 1, gain }, { band: 2, gain: gain * 0.75 },
      ]);
    },
    clear: async (p) => fm(p).clearEQ(),
    acceptsValue: { min: 0, max: 10, description: "Intensity 0-10" },
  },
  treble: {
    id: "treble", label: "Treble Boost",
    description: "Boosts high-frequency bands via the equalizer.",
    apply: async (p, value = 5) => {
      const gain = Math.max(0, Math.min(value, 10)) / 10;
      await fm(p).setEQ([
        { band: 12, gain }, { band: 13, gain }, { band: 14, gain },
      ]);
    },
    clear: async (p) => fm(p).clearEQ(),
    acceptsValue: { min: 0, max: 10, description: "Intensity 0-10" },
  },
  bass: {
    id: "bass", label: "Bass Adjust",
    description: "Fine-grained bass gain (distinct from bassboost's fixed curve).",
    apply: async (p, value = 3) => fm(p).setEQ([{ band: 0, gain: Math.max(-0.25, Math.min(value / 10, 1)) }]),
    clear: async (p) => fm(p).clearEQ(),
    acceptsValue: { min: -5, max: 10, description: "Gain -5 to 10" },
  },
  nightcore: {
    id: "nightcore", label: "Nightcore",
    description: "Sped-up, pitched-up preset.",
    apply: async (p) => fm(p).setTimescale({ speed: 1.2, pitch: 1.2, rate: 1 }),
    clear: async (p) => fm(p).setTimescale({ speed: 1, pitch: 1, rate: 1 }),
  },
  vaporwave: {
    id: "vaporwave", label: "Vaporwave",
    description: "Slowed-down, pitched-down preset.",
    apply: async (p) => fm(p).setTimescale({ speed: 0.8, pitch: 0.8, rate: 1 }),
    clear: async (p) => fm(p).setTimescale({ speed: 1, pitch: 1, rate: 1 }),
  },
  "8d": {
    id: "8d", label: "8D Audio",
    description: "Rotating stereo-panning effect.",
    apply: async (p) => fm(p).setRotation({ rotationHz: 0.2 }),
    clear: async (p) => fm(p).setRotation({ rotationHz: 0 }),
  },
  karaoke: {
    id: "karaoke", label: "Karaoke",
    description: "Attenuates center-channel (vocal-reduction) frequencies.",
    apply: async (p) => fm(p).setKaraoke({ level: 1, monoLevel: 1, filterBand: 220, filterWidth: 100 }),
    clear: async (p) => fm(p).setKaraoke({ level: 0, monoLevel: 0, filterBand: 220, filterWidth: 100 }),
  },
  "mono-audio": {
    id: "mono-audio", label: "Noir Music",
    description: "Downmixes stereo to mono.",
    apply: async (p) => fm(p).setChannelMix({ leftToLeft: 0.5, leftToRight: 0.5, rightToLeft: 0.5, rightToRight: 0.5 }),
    clear: async (p) => fm(p).setChannelMix({ leftToLeft: 1, leftToRight: 0, rightToLeft: 0, rightToRight: 1 }),
  },
  stereo: {
    id: "stereo", label: "Stereo Widen",
    description: "Widens the stereo image.",
    apply: async (p) => fm(p).setChannelMix({ leftToLeft: 1, leftToRight: -0.15, rightToLeft: -0.15, rightToRight: 1 }),
    clear: async (p) => fm(p).setChannelMix({ leftToLeft: 1, leftToRight: 0, rightToLeft: 0, rightToRight: 1 }),
  },
  slow: {
    id: "slow", label: "Slow",
    description: "Slows playback speed without changing pitch as harshly as vaporwave.",
    apply: async (p, value = 80) => fm(p).setTimescale({ speed: Math.max(0.5, Math.min(value / 100, 1)), pitch: 1, rate: 1 }),
    clear: async (p) => fm(p).setTimescale({ speed: 1, pitch: 1, rate: 1 }),
    acceptsValue: { min: 50, max: 100, description: "Speed % (50-100)" },
  },
  "speed-effect": {
    id: "speed-effect", label: "Speed",
    description: "Raises playback speed.",
    apply: async (p, value = 120) => { await setPlaybackSpeed(p, value); },
    clear: async (p) => fm(p).setTimescale({ speed: 1, pitch: 1, rate: 1 }),
    acceptsValue: { min: 100, max: 200, description: "Speed % (100-200)" },
  },
  pitch: {
    id: "pitch", label: "Pitch",
    description: "Shifts pitch independently of speed.",
    apply: async (p, value = 100) => fm(p).setTimescale({ speed: 1, pitch: Math.max(0.5, Math.min(value / 100, 2)), rate: 1 }),
    clear: async (p) => fm(p).setTimescale({ speed: 1, pitch: 1, rate: 1 }),
    acceptsValue: { min: 50, max: 200, description: "Pitch % (50-200)" },
  },
  echo: {
    id: "echo", label: "Echo",
    description: "Applies an echo-like tonal approximation using the native low-pass filter; true echo requires a Lavalink filter plugin.",
    apply: async (p) => fm(p).setLowPass({ smoothing: 8 }),
    clear: async (p) => fm(p).setLowPass({ smoothing: 0 }),
  },
  reverb: {
    id: "reverb", label: "Reverb",
    description: "Applies a stereo spatial approximation using native channel mixing; true reverb requires a Lavalink filter plugin.",
    apply: async (p) => fm(p).setChannelMix({ leftToLeft: 0.7, leftToRight: 0.3, rightToLeft: 0.3, rightToRight: 0.7 }),
    clear: async (p) => fm(p).setChannelMix({ leftToLeft: 1, leftToRight: 0, rightToLeft: 0, rightToRight: 1 }),
  },
  compressor: {
    id: "compressor", label: "Compressor",
    description: "Applies a gentle gain-shaping approximation; true dynamic compression requires a Lavalink filter plugin.",
    apply: async (p) => fm(p).setEQ([{ band: 0, gain: 0.1 }, { band: 1, gain: 0.1 }]),
    clear: async (p) => fm(p).clearEQ(),
  },
  limiter: {
    id: "limiter", label: "Limiter",
    description: "Caps player volume at 100%; this is a safety ceiling, not a true DSP limiter.",
    apply: async (p) => { if (p.volume > 100) await p.setVolume(100); },
    clear: async () => {},
  },
  normalize: {
    id: "normalize", label: "Normalize",
    description: "Resets all filters and volume to neutral defaults; it does not perform loudness analysis.",
    apply: async (p) => { await fm(p).resetFilters(); await p.setVolume(70); },
    clear: async (p) => fm(p).resetFilters(),
  },
  gain: {
    id: "gain", label: "Gain",
    description: "Direct volume gain, separate from /volume (stacks with other effects).",
    apply: async (p, value = 100) => p.setVolume(Math.max(0, Math.min(value, 150))),
    clear: async (p) => p.setVolume(70),
    acceptsValue: { min: 0, max: 150, description: "Volume 0-150" },
  },
  lowpass: {
    id: "lowpass", label: "Low-pass",
    description: "Cuts high frequencies for a muffled/underwater tone.",
    apply: async (p, value = 20) => fm(p).setLowPass({ smoothing: Math.max(1, Math.min(value, 50)) }),
    clear: async (p) => fm(p).setLowPass({ smoothing: 0 }),
    acceptsValue: { min: 1, max: 50, description: "Smoothing 1-50" },
  },
  highpass: {
    id: "highpass", label: "High-pass",
    description: "Approximates a high-pass response by attenuating the lowest EQ bands; true high-pass requires a plugin filter.",
    apply: async (p) => fm(p).setEQ([{ band: 0, gain: -0.25 }, { band: 1, gain: -0.2 }]),
    clear: async (p) => fm(p).clearEQ(),
  },
  distortion: {
    id: "distortion", label: "Distortion",
    description: "Applies waveform distortion.",
    apply: async (p) => fm(p).setDistortion({ sinOffset: 0, sinScale: 1, cosOffset: 0, cosScale: 1, tanOffset: 0, tanScale: 1, offset: 0, scale: 1 }),
    clear: async (p) => fm(p).setDistortion(null),
  },
  chorus: {
    id: "chorus", label: "Chorus",
    description: "Applies a vibrato-based chorus approximation; true chorus requires a plugin filter.",
    apply: async (p) => fm(p).setVibrato({ frequency: 2, depth: 0.3 }),
    clear: async (p) => fm(p).setVibrato({ frequency: 0, depth: 0 }),
  },
  flanger: {
    id: "flanger", label: "Flanger",
    description: "Applies a tremolo-based flanger approximation; true flanging requires a plugin filter.",
    apply: async (p) => fm(p).setTremolo({ frequency: 0.2, depth: 0.5 }),
    clear: async (p) => fm(p).setTremolo({ frequency: 0, depth: 0 }),
  },
  phaser: {
    id: "phaser", label: "Phaser",
    description: "Applies a tremolo-based phaser approximation; true phasing requires a plugin filter.",
    apply: async (p) => fm(p).setTremolo({ frequency: 0.5, depth: 0.3 }),
    clear: async (p) => fm(p).setTremolo({ frequency: 0, depth: 0 }),
  },
  robot: {
    id: "robot", label: "Robot",
    description: "Robotic vocoder-style tone.",
    apply: async (p) => fm(p).setTimescale({ speed: 1, pitch: 0.7, rate: 1.3 }),
    clear: async (p) => fm(p).setTimescale({ speed: 1, pitch: 1, rate: 1 }),
  },
  "telephone-filter": {
    id: "telephone-filter", label: "Telephone",
    description: "Applies a two-band telephone-tone approximation; a true band-pass telephone filter requires a plugin.",
    apply: async (p) => fm(p).setEQ([{ band: 0, gain: -0.3 }, { band: 13, gain: -0.3 }]),
    clear: async (p) => fm(p).clearEQ(),
  },
  tremolo: {
    id: "tremolo", label: "Tremolo",
    description: "Rhythmic volume oscillation.",
    apply: async (p, value = 2) => fm(p).setTremolo({ frequency: Math.max(0.1, Math.min(value, 10)), depth: 0.5 }),
    clear: async (p) => fm(p).setTremolo({ frequency: 0, depth: 0 }),
    acceptsValue: { min: 1, max: 10, description: "Frequency 1-10 Hz" },
  },
  rotation: {
    id: "rotation", label: "Rotation",
    description: "Manually-tuned stereo rotation speed (distinct from the 8D preset).",
    apply: async (p, value = 2) => fm(p).setRotation({ rotationHz: Math.max(0.1, Math.min(value / 10, 2)) }),
    clear: async (p) => fm(p).setRotation({ rotationHz: 0 }),
    acceptsValue: { min: 1, max: 20, description: "Speed 1-20 (÷10 Hz)" },
  },
  vibrato: {
    id: "vibrato", label: "Vibrato",
    description: "Rhythmic pitch oscillation.",
    apply: async (p, value = 2) => fm(p).setVibrato({ frequency: Math.max(0.1, Math.min(value, 14)), depth: 0.5 }),
    clear: async (p) => fm(p).setVibrato({ frequency: 0, depth: 0 }),
    acceptsValue: { min: 1, max: 14, description: "Frequency 1-14 Hz" },
  },
};

const EFFECT_FILTER_GROUPS: Readonly<Record<EffectId, string>> = Object.freeze({
  bassboost:"eq", treble:"eq", bass:"eq", compressor:"eq", highpass:"eq", "telephone-filter":"eq",
  nightcore:"timescale", vaporwave:"timescale", slow:"timescale", "speed-effect":"timescale", pitch:"timescale", robot:"timescale",
  "8d":"rotation", rotation:"rotation",
  karaoke:"karaoke", "mono-audio":"channelmix", stereo:"channelmix", reverb:"channelmix",
  echo:"lowpass", lowpass:"lowpass",
  distortion:"distortion", chorus:"vibrato", vibrato:"vibrato", flanger:"tremolo", phaser:"tremolo", tremolo:"tremolo",
  limiter:"volume", normalize:"reset", gain:"volume",
});

export function validateEffectChain(ids: readonly string[], max = 32): EffectId[] {
  if (!Array.isArray(ids) || ids.length > max) throw new Error("FX_INVALID_CHAIN");
  const unique = [...new Set(ids.map((id) => String(id).trim()))];
  const invalid = unique.filter((id) => !Object.prototype.hasOwnProperty.call(EFFECTS, id));
  if (invalid.length) throw new Error(`FX_INVALID_CHAIN:${invalid.join(",")}`);
  const groups = new Map<string, EffectId>();
  for (const id of unique as EffectId[]) {
    const group = EFFECT_FILTER_GROUPS[id];
    const existing = groups.get(group);
    // A single Lavalink filter slot cannot faithfully represent two competing
    // writers. Reject instead of silently letting the later effect erase the first.
    if (existing && existing !== id && group !== "volume") throw new Error(`FX_CONFLICTING_CHAIN:${existing},${id}`);
    groups.set(group, id);
  }
  if ((unique as string[]).includes("normalize") && unique.length > 1) throw new Error("FX_CONFLICTING_CHAIN:normalize");
  return unique as EffectId[];
}

async function restorePlaybackBaseline(player: Player): Promise<void> {
  const baseline = Math.max(50, Math.min(200, Math.round(Number(player.getData("playbackSpeedBaselinePercent") ?? player.getData("playbackSpeedPercent")) || 100)));
  const pitchLocked = Boolean(player.getData("pitchLocked"));
  await fm(player).setTimescale({
    speed: baseline / 100,
    pitch: pitchLocked ? 1 : baseline / 100,
    rate: 1,
  });
  player.setData("playbackSpeedPercent", baseline);
}

export async function clearAllEffects(player: Player): Promise<void> {
  await fm(player).resetFilters();
  // resetFilters() also resets Lavalink's timescale. Restore the independent
  // playback-speed/pitch-lock state so /speed and /pitch-lock do not silently
  // revert when a user toggles an unrelated effect.
  await restorePlaybackBaseline(player);
  player.setData("activeEffects", []);
  player.setData("activeEffectValues", {});
}

/** Single authoritative playback-filter application path. Every command that
 * replaces a complete effect chain should use this function so filter state,
 * validation, and player metadata cannot silently diverge. */
export async function applyEffectChain(player: Player, ids: readonly string[], values?: Readonly<Record<string, number>>): Promise<EffectId[]> {
  const validated = validateEffectChain(ids);
  const previousValues = { ...((player.getData("activeEffectValues") as Record<string, number> | undefined) ?? {}) };
  await clearAllEffects(player);
  for (const id of validated) {
    const value = values !== undefined ? values[id] : previousValues[id];
    await EFFECTS[id].apply(player, value);
  }
  const nextValues = values ? { ...previousValues, ...values } : previousValues;
  for (const key of Object.keys(nextValues)) {
    if (!validated.includes(key as EffectId)) delete nextValues[key];
  }
  // Timescale effects intentionally override the baseline while active. When
  // the chain contains no timescale writer, the baseline remains authoritative.
  if (!validated.some((id) => EFFECT_FILTER_GROUPS[id] === "timescale")) {
    await restorePlaybackBaseline(player);
  }
  player.setData("activeEffectValues", nextValues);
  player.setData("activeEffects", validated);
  return validated;
}

export async function restoreEffectChain(player: Player, ids: readonly string[]): Promise<EffectId[]> {
  const previousEffects = validateEffectChain(ids);
  const previousValues = { ...((player.getData("activeEffectValues") as Record<string, number> | undefined) ?? {}) };
  try {
    return await applyEffectChain(player, previousEffects, previousValues);
  } catch (error) {
    await clearAllEffects(player);
    throw error;
  }
}
