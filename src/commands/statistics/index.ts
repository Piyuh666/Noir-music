import { registry } from "../registry";
import { registerCommandModule, type CommandModuleReport } from "../moduleRuntime";
import { me } from "./me";
import { server } from "./server";
import { track } from "./track";
import { artist } from "./artist";
import { album } from "./album";
import { playlist } from "./playlist";
import { compare } from "./compare";
import { leaderboard } from "./leaderboard";
import { peakhours } from "./peakhours";
import { skiprate } from "./skiprate";
import { sessionlength } from "./sessionlength";
import { export_ } from "./export_";
import { weeklyrecap } from "./weeklyrecap";
import { yearlyrecap } from "./yearlyrecap";
import { serverleaderboard } from "./serverleaderboard";
import { djactivity } from "./djactivity";
import { listeningtime } from "./listeningtime";
import { toptracks } from "./toptracks";
import { topartists } from "./topartists";
import { topalbums } from "./topalbums";
import { topgenres } from "./topgenres";
import { history } from "./history";
import { recent } from "./recent";
import { streak } from "./streak";
import { musicprofile } from "./musicprofile";



/**
 * Immutable registration contract for the statistics command surface.
 *
 * expectedCommands is the number of executable command implementations this
 * module contributes; expectedTopLevelEntries is the number of Discord
 * top-level application-command entries it consumes.  Keeping both figures
 * explicit prevents a refactor from accidentally trading command depth for
 * top-level budget without the loader noticing.
 */
export const STATISTICS_MODULE = Object.freeze({
  id: "statistics",
  category: "statistics",
  description: "Listening statistics, rankings, and recaps.",
  expectedCommands: 25,
  expectedTopLevelEntries: 10,
  expectedGroups: Object.freeze(['stats']),
});

export function registerStatisticsCommands(): CommandModuleReport {
  return registerCommandModule({
    ...STATISTICS_MODULE,
    expectedGroups: STATISTICS_MODULE.expectedGroups,
  }, () => {
  registry.group("stats", "Listening statistics and recaps.", "statistics", [
    { name: "me", command: me },
    { name: "server", command: server },
    { name: "track", command: track },
    { name: "artist", command: artist },
    { name: "album", command: album },
    { name: "playlist", command: playlist },
    { name: "compare", command: compare },
    { name: "leaderboard", command: leaderboard },
    { name: "peak-hours", command: peakhours },
    { name: "skip-rate", command: skiprate },
    { name: "session-length", command: sessionlength },
    { name: "export", command: export_ },
    { name: "weekly-recap", command: weeklyrecap },
    { name: "yearly-recap", command: yearlyrecap },
    { name: "server-leaderboard", command: serverleaderboard },
    { name: "dj-activity", command: djactivity },
  ]);
  registry.standalone("listening-time", listeningtime);
  registry.standalone("top-tracks", toptracks);
  registry.standalone("top-artists", topartists);
  registry.standalone("top-albums", topalbums);
  registry.standalone("top-genres", topgenres);
  registry.standalone("history", history);
  registry.standalone("recent", recent);
  registry.standalone("streak", streak);
  registry.standalone("music-profile", musicprofile);
  });
}
