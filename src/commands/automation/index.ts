import { registry } from "../registry";
import { registerCommandModule, type CommandModuleReport } from "../moduleRuntime";
import { sleep } from "./sleep";
import { sleepcancel } from "./sleepcancel";
import { stopat } from "./stopat";
import { pauseat } from "./pauseat";
import { fadeouttimer } from "./fadeouttimer";
import { playlistschedule } from "./playlistschedule";
import { radioduration } from "./radioduration";
import { autodisconnecttimer } from "./autodisconnecttimer";
import { scheduledplay } from "./scheduledplay";
import { timerstatus } from "./timerstatus";



/**
 * Immutable registration contract for the automation command surface.
 *
 * expectedCommands is the number of executable command implementations this
 * module contributes; expectedTopLevelEntries is the number of Discord
 * top-level application-command entries it consumes.  Keeping both figures
 * explicit prevents a refactor from accidentally trading command depth for
 * top-level budget without the loader noticing.
 */
export const AUTOMATION_MODULE = Object.freeze({
  id: "automation",
  category: "automation",
  description: "Scheduled and timer-based playback controls.",
  expectedCommands: 10,
  expectedTopLevelEntries: 1,
  expectedGroups: Object.freeze(['automation']),
});

export function registerAutomationCommands(): CommandModuleReport {
  return registerCommandModule({
    ...AUTOMATION_MODULE,
    expectedGroups: AUTOMATION_MODULE.expectedGroups,
  }, () => {
  registry.group("automation", "Scheduled and timer-based playback controls.", "automation", [
    { name: "sleep", command: sleep },
    { name: "sleep-cancel", command: sleepcancel },
    { name: "stop-at", command: stopat },
    { name: "pause-at", command: pauseat },
    { name: "fade-out-timer", command: fadeouttimer },
    { name: "playlist-schedule", command: playlistschedule },
    { name: "radio-duration", command: radioduration },
    { name: "auto-disconnect-timer", command: autodisconnecttimer },
    { name: "scheduled-play", command: scheduledplay },
    { name: "timer-status", command: timerstatus },
  ]);
  });
}
