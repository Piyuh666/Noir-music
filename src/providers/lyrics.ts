import { logger } from "../utils/logger";
import { fetchJsonBounded } from "../utils/runtimeGuard";

export interface LyricsResult {
  title: string;
  artist: string;
  plainLyrics: string | null;
  syncedLyrics: string | null; // LRC format: [mm:ss.xx] line
  source: "lrclib";
}

/**
 * Real HTTP integration against lrclib.net's public, keyless API. This is
 * the ONE place lyrics are fetched from — every /lyrics command goes
 * through this function, so swapping providers later is a one-file change.
 *
 * Honest note: this sandbox has no network access to actually exercise
 * this call, so treat it as reviewed-by-eye against lrclib's documented
 * REST shape (GET /api/search?track_name=&artist_name=), not
 * live-verified. Wrap in try/catch at the call site regardless — a
 * lyrics provider being down should degrade gracefully, not crash a command.
 */
export async function fetchLyrics(title: string, artist: string): Promise<LyricsResult | null> {
  const url = `https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`;
  try {
    const results = await fetchJsonBounded<Array<{
      trackName: string; artistName: string; plainLyrics: string | null; syncedLyrics: string | null;
    }>>(url, { headers: { "User-Agent": "NOIR MUSIC-Discord-Bot v0.1.0" } }, { timeoutMs: 8_000, maxBytes: 2 * 1024 * 1024 });
    if (!Array.isArray(results) || !results.length) return null;
    const best = results[0];
    return {
      title: best.trackName,
      artist: best.artistName,
      plainLyrics: best.plainLyrics,
      syncedLyrics: best.syncedLyrics,
      source: "lrclib",
    };
  } catch (err) {
    logger.warn({ err }, "Lyrics fetch failed");
    return null;
  }
}

/** Parses LRC-format synced lyrics into [{ ms, line }] for scroll/highlight use. */
export function parseLrc(lrc: string): { ms: number; line: string }[] {
  const lines: { ms: number; line: string }[] = [];
  for (const raw of lrc.split("\n")) {
    const match = raw.match(/^\[(\d+):(\d+(?:\.\d+)?)\](.*)$/);
    if (!match) continue;
    const minutes = Number(match[1]);
    const seconds = Number(match[2]);
    lines.push({ ms: (minutes * 60 + seconds) * 1000, line: match[3].trim() });
  }
  return lines;
}
