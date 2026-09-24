import { registry } from "../registry";
import { registerCommandModule, type CommandModuleReport } from "../moduleRuntime";
import { view } from "./view";
import { volume } from "./volume";
import { autoplay } from "./autoplay";
import { default_channel } from "./default_channel";
import { prefix } from "./prefix";
import { dj } from "./dj";
import { announce } from "./announce";
import { effects } from "./effects";
import { language } from "./language";
import { playerstyle } from "./playerstyle";
import { queuelimit } from "./queuelimit";
import { permissions } from "./permissions";
import { voteskipratio } from "./voteskipratio";
import { defaultsource } from "./defaultsource";
import { explicitfilter } from "./explicitfilter";
import { maxplaylistsize } from "./maxplaylistsize";
import { idletimeout } from "./idletimeout";
import { always247 } from "./always247";
import { reset } from "./reset";
import { export_ } from "./export_";
import { import_ } from "./import_";
import { playerchannel } from "./playerchannel";
import { duplicatehandling } from "./duplicatehandling";
import { historyretention } from "./historyretention";
import { locale } from "./locale";

/** 25 commands split across two groups (25-subcommand cap per group). */


/**
 * Immutable registration contract for the settings command surface.
 *
 * expectedCommands is the number of executable command implementations this
 * module contributes; expectedTopLevelEntries is the number of Discord
 * top-level application-command entries it consumes.  Keeping both figures
 * explicit prevents a refactor from accidentally trading command depth for
 * top-level budget without the loader noticing.
 */
export const SETTINGS_MODULE = Object.freeze({
  id: "settings",
  category: "settings",
  description: "Server-wide music behavior configuration.",
  expectedCommands: 25,
  expectedTopLevelEntries: 1,
  expectedGroups: Object.freeze(['music-settings']),
});

export function registerSettingsCommands(): CommandModuleReport {
  return registerCommandModule({
    ...SETTINGS_MODULE,
    expectedGroups: SETTINGS_MODULE.expectedGroups,
  }, () => {
  registry.group("music-settings", "Configure server-wide music behavior.", "settings", [
    { name: "view", command: view },
    { name: "volume", command: volume },
    { name: "prefix", command: prefix },
    { name: "dj", command: dj },
    { name: "autoplay", command: autoplay },
    { name: "announce", command: announce },
    { name: "default-channel", command: default_channel },
    { name: "effects", command: effects },
    { name: "language", command: language },
    { name: "player-style", command: playerstyle },
    { name: "queue-limit", command: queuelimit },
    { name: "permissions", command: permissions },
    { name: "vote-skip-ratio", command: voteskipratio },
    { name: "default-source", command: defaultsource },
    { name: "explicit-filter", command: explicitfilter },
    { name: "max-playlist-size", command: maxplaylistsize },
    { name: "idle-timeout", command: idletimeout },
    { name: "always247", command: always247 },
    { name: "reset", command: reset },
    { name: "export", command: export_ },
    { name: "import", command: import_ },
    { name: "player-channel", command: playerchannel },
    { name: "duplicate-handling", command: duplicatehandling },
    { name: "history-retention", command: historyretention },
    { name: "locale", command: locale },
  ]);
  });
}
