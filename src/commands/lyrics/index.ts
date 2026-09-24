import { registry } from "../registry";
import { registerCommandModule, type CommandModuleReport } from "../moduleRuntime";
import { base } from "./base";
import { current } from "./current";
import { search } from "./search";
import { synced } from "./synced";
import { unsynced } from "./unsynced";
import { translate } from "./translate";
import { romanize } from "./romanize";
import { source } from "./source";
import { hide } from "./hide";
import { show } from "./show";
import { fullscreen } from "./fullscreen";
import { fontsize } from "./fontsize";
import { autoscroll } from "./autoscroll";
import { export_ } from "./export_";
import { reporterror } from "./reporterror";

/**
 * 15 commands: /lyrics is standalone (no-argument, current track — Discord
 * doesn't allow a command to both take subcommands AND be invoked bare),
 * the other 14 live under /lyrics-tools.
 */


/**
 * Immutable registration contract for the lyrics command surface.
 *
 * expectedCommands is the number of executable command implementations this
 * module contributes; expectedTopLevelEntries is the number of Discord
 * top-level application-command entries it consumes.  Keeping both figures
 * explicit prevents a refactor from accidentally trading command depth for
 * top-level budget without the loader noticing.
 */
export const LYRICS_MODULE = Object.freeze({
  id: "lyrics",
  category: "lyrics",
  description: "Lyrics search, display, synchronization, and export.",
  expectedCommands: 15,
  expectedTopLevelEntries: 2,
  expectedGroups: Object.freeze(['lyrics-tools']),
});

export function registerLyricsCommands(): CommandModuleReport {
  return registerCommandModule({
    ...LYRICS_MODULE,
    expectedGroups: LYRICS_MODULE.expectedGroups,
  }, () => {
  registry.standalone("lyrics", base);
  registry.group("lyrics-tools", "Lyrics search, display, and export tools.", "lyrics", [
    { name: "current", command: current },
    { name: "search", command: search },
    { name: "synced", command: synced },
    { name: "unsynced", command: unsynced },
    { name: "translate", command: translate },
    { name: "romanize", command: romanize },
    { name: "source", command: source },
    { name: "hide", command: hide },
    { name: "show", command: show },
    { name: "fullscreen", command: fullscreen },
    { name: "font-size", command: fontsize },
    { name: "autoscroll", command: autoscroll },
    { name: "export", command: export_ },
    { name: "report-error", command: reporterror },
  ]);
  });
}
