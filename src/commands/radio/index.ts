import { registry } from "../registry";
import { registerCommandModule, type CommandModuleReport } from "../moduleRuntime";
import { play } from "./play";
import { stop } from "./stop";
import { stationlist } from "./stationlist";
import { artist } from "./artist";
import { song } from "./song";
import { genre } from "./genre";
import { decade } from "./decade";
import { mood } from "./mood";
import { custom } from "./custom";
import { schedule } from "./schedule";
import { duration } from "./duration";
import { favoritestation } from "./favoritestation";
import { history } from "./history";
import { nextstation } from "./nextstation";
import { info } from "./info";



/**
 * Immutable registration contract for the radio command surface.
 *
 * expectedCommands is the number of executable command implementations this
 * module contributes; expectedTopLevelEntries is the number of Discord
 * top-level application-command entries it consumes.  Keeping both figures
 * explicit prevents a refactor from accidentally trading command depth for
 * top-level budget without the loader noticing.
 */
export const RADIO_MODULE = Object.freeze({
  id: "radio",
  category: "radio",
  description: "Continuous radio stations and mixes.",
  expectedCommands: 15,
  expectedTopLevelEntries: 1,
  expectedGroups: Object.freeze(['radio']),
});

export function registerRadioCommands(): CommandModuleReport {
  return registerCommandModule({
    ...RADIO_MODULE,
    expectedGroups: RADIO_MODULE.expectedGroups,
  }, () => {
  registry.group("radio", "Continuous radio stations and mixes.", "radio", [
    { name: "play", command: play },
    { name: "stop", command: stop },
    { name: "station-list", command: stationlist },
    { name: "artist", command: artist },
    { name: "song", command: song },
    { name: "genre", command: genre },
    { name: "decade", command: decade },
    { name: "mood", command: mood },
    { name: "custom", command: custom },
    { name: "schedule", command: schedule },
    { name: "duration", command: duration },
    { name: "favorite-station", command: favoritestation },
    { name: "history", command: history },
    { name: "next-station", command: nextstation },
    { name: "info", command: info },
  ]);
  });
}
