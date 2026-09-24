export interface ModeDef {
  id: string;
  label: string;
  description: string;
  /** Concrete, real behavior change — not a cosmetic label. */
  volume?: number;
  effects?: string[]; // EffectId values from audio/filters.ts
  autoplay?: boolean;
  shuffle?: boolean;
  loop?: "off" | "track" | "queue";
  /** search modifier appended to autoplay/discovery queries in this mode */
  searchModifier?: string;
}

export const MODES: Record<string, ModeDef> = {
  normal: { id: "normal", label: "Normal", description: "Resets to default playback behavior.", volume: 70, effects: [], autoplay: false, shuffle: false, loop: "off" },
  radio: { id: "radio", label: "Radio", description: "Continuous autoplay of related tracks.", autoplay: true, loop: "off" },
  party: { id: "party", label: "Party", description: "Bass-boosted, shuffled, autoplay on.", volume: 85, effects: ["bassboost", "8d"], autoplay: true, shuffle: true },
  chill: { id: "chill", label: "Chill", description: "Lower volume, reverb, slowed slightly.", volume: 55, effects: ["reverb", "slow"] },
  focus: { id: "focus", label: "Focus", description: "Normalized, no shuffle, instrumental-leaning search.", volume: 50, effects: ["normalize"], shuffle: false, searchModifier: "instrumental" },
  workout: { id: "workout", label: "Workout", description: "Higher energy, bass-boosted, shuffled.", volume: 90, effects: ["bassboost"], shuffle: true, searchModifier: "workout mix" },
  sleep: { id: "sleep", label: "Sleep", description: "Very low volume, slowed, queue loop for continuity.", volume: 25, effects: ["slow"], loop: "queue", searchModifier: "sleep ambient" },
  discover: { id: "discover", label: "Discover", description: "Autoplay weighted toward unfamiliar tracks.", autoplay: true, searchModifier: "hidden gems" },
  random: { id: "random", label: "Random", description: "Shuffled queue, random-leaning autoplay.", shuffle: true, autoplay: true },
  nostalgia: { id: "nostalgia", label: "Nostalgia", description: "Search biased toward older releases.", searchModifier: "throwback classics" },
  artist: { id: "artist", label: "Artist Focus", description: "Autoplay stays within the current track's artist.", autoplay: true },
  album: { id: "album", label: "Album Focus", description: "Loop-queue behavior suited to playing one album through.", loop: "queue" },
  genre: { id: "genre", label: "Genre Focus", description: "Autoplay stays within the current track's genre.", autoplay: true },
  continuous: { id: "continuous", label: "Continuous", description: "Never stops — autoplay + queue loop combined.", autoplay: true, loop: "queue" },
};
