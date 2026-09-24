import { registry } from "../registry";
import { registerCommandModule, type CommandModuleReport } from "../moduleRuntime";
import { play } from "./play";
import { pause } from "./pause";
import { resume } from "./resume";
import { stop } from "./stop";
import { skip } from "./skip";
import { previous } from "./previous";
import { nowplaying } from "./nowplaying";
import { volume } from "./volume";
import { seek } from "./seek";
import { loop } from "./loop";
import { shuffle } from "./shuffle";
import { autoplay } from "./autoplay";
import { mute } from "./mute";
import { unmute } from "./unmute";
import { playnext } from "./playnext";
import { playnow } from "./playnow";
import { skipto } from "./skipto";
import { replay } from "./replay";
import { restart } from "./restart";
import { rewind } from "./rewind";
import { forward } from "./forward";
import { fadein } from "./fadein";
import { fadeout } from "./fadeout";
import { crossfade } from "./crossfade";
import { stopafter } from "./stopafter";
import { pauseafter } from "./pauseafter";
import { resumeafter } from "./resumeafter";
import { playat } from "./playat";
import { insert } from "./insert";
import { swapsource } from "./swapsource";
import { reload } from "./reload";
import { ttsannounce } from "./ttsannounce";
import { speed } from "./speed";
import { pitchlock } from "./pitchlock";
import { gapless } from "./gapless";
import { normalizevolume } from "./normalizevolume";
import { lockplayback } from "./lockplayback";
import { unlockplayback } from "./unlockplayback";

/**
 * 14 high-frequency commands stay standalone (muscle-memory UX for the
 * ones people type constantly). The other 24 move under /playback-more —
 * same top-level-cap reasoning as effects (see effects/index.ts).
 */


/**
 * Immutable registration contract for the playback command surface.
 *
 * expectedCommands is the number of executable command implementations this
 * module contributes; expectedTopLevelEntries is the number of Discord
 * top-level application-command entries it consumes.  Keeping both figures
 * explicit prevents a refactor from accidentally trading command depth for
 * top-level budget without the loader noticing.
 */
export const PLAYBACK_MODULE = Object.freeze({
  id: "playback",
  category: "playback",
  description: "High-frequency playback controls and advanced playback operations.",
  expectedCommands: 38,
  expectedTopLevelEntries: 15,
  expectedGroups: Object.freeze(['playback-more']),
});

export function registerPlaybackCommands(): CommandModuleReport {
  return registerCommandModule({
    ...PLAYBACK_MODULE,
    expectedGroups: PLAYBACK_MODULE.expectedGroups,
  }, () => {
  registry.standalone("play", play);
  registry.standalone("pause", pause);
  registry.standalone("resume", resume);
  registry.standalone("stop", stop);
  registry.standalone("skip", skip);
  registry.standalone("previous", previous);
  registry.standalone("nowplaying", nowplaying);
  registry.standalone("volume", volume);
  registry.standalone("seek", seek);
  registry.standalone("loop", loop);
  registry.standalone("shuffle", shuffle);
  registry.standalone("autoplay", autoplay);
  registry.standalone("mute", mute);
  registry.standalone("unmute", unmute);

  registry.group("playback-more", "Additional playback controls.", "playback", [
    { name: "playnext", command: playnext },
    { name: "playnow", command: playnow },
    { name: "skipto", command: skipto },
    { name: "replay", command: replay },
    { name: "restart", command: restart },
    { name: "rewind", command: rewind },
    { name: "forward", command: forward },
    { name: "fade-in", command: fadein },
    { name: "fade-out", command: fadeout },
    { name: "crossfade", command: crossfade },
    { name: "stopafter", command: stopafter },
    { name: "pauseafter", command: pauseafter },
    { name: "resumeafter", command: resumeafter },
    { name: "playat", command: playat },
    { name: "insert", command: insert },
    { name: "swap-source", command: swapsource },
    { name: "reload", command: reload },
    { name: "tts-announce", command: ttsannounce },
    { name: "speed", command: speed },
    { name: "pitch-lock", command: pitchlock },
    { name: "gapless", command: gapless },
    { name: "normalize-volume", command: normalizevolume },
    { name: "lock-playback", command: lockplayback },
    { name: "unlock-playback", command: unlockplayback },
  ]);
  });
}
