import { registry } from "../registry";
import { registerCommandModule, type CommandModuleReport } from "../moduleRuntime";
import { join } from "./join";
import { leave } from "./leave";
import { move } from "./move";
import { always247 } from "./always247";
import { connect } from "./connect";
import { disconnect } from "./disconnect";
import { follow } from "./follow";
import { stay } from "./stay";
import { idletimeout } from "./idletimeout";
import { voicestatus } from "./voicestatus";
import { voicelock } from "./voicelock";
import { voiceunlock } from "./voiceunlock";
import { voiceregion } from "./voiceregion";
import { reconnect } from "./reconnect";
import { voicequality } from "./voicequality";
import { afkchannelbehavior } from "./afkchannelbehavior";
import { afkbehavior } from "./afkbehavior";
import { voicediagnostics } from "./voicediagnostics";
import { soundcheck } from "./soundcheck";
import { latency } from "./latency";
import { voicelog } from "./voicelog";

/** 4 standalone (high-frequency) + a 17-command /voice group = 21. */


/**
 * Immutable registration contract for the voice command surface.
 *
 * expectedCommands is the number of executable command implementations this
 * module contributes; expectedTopLevelEntries is the number of Discord
 * top-level application-command entries it consumes.  Keeping both figures
 * explicit prevents a refactor from accidentally trading command depth for
 * top-level budget without the loader noticing.
 */
export const VOICE_MODULE = Object.freeze({
  id: "voice",
  category: "voice",
  description: "Voice connection, resilience, diagnostics, and policy controls.",
  expectedCommands: 21,
  expectedTopLevelEntries: 4,
  expectedGroups: Object.freeze(['voice']),
});

export function registerVoiceCommands(): CommandModuleReport {
  return registerCommandModule({
    ...VOICE_MODULE,
    expectedGroups: VOICE_MODULE.expectedGroups,
  }, () => {
  registry.standalone("join", join);
  registry.standalone("leave", leave);
  registry.standalone("always247", always247);
  registry.group("voice", "Voice-connection controls.", "voice", [
    { name: "move", command: move },
    { name: "connect", command: connect },
    { name: "disconnect", command: disconnect },
    { name: "follow", command: follow },
    { name: "stay", command: stay },
    { name: "idle-timeout", command: idletimeout },
    { name: "status", command: voicestatus },
    { name: "lock", command: voicelock },
    { name: "unlock", command: voiceunlock },
    { name: "region", command: voiceregion },
    { name: "reconnect", command: reconnect },
    { name: "quality", command: voicequality },
    { name: "afk-behavior", command: afkchannelbehavior },
    { name: "afk-behavior-legacy", command: afkbehavior },
    { name: "diagnostics", command: voicediagnostics },
    { name: "soundcheck", command: soundcheck },
    { name: "latency", command: latency },
    { name: "log", command: voicelog },
  ]);
  });
}
