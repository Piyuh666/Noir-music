import { registry } from "../registry";
import { registerCommandModule, type CommandModuleReport } from "../moduleRuntime";
import { favorite } from "./favorite";
import { unfavorite } from "./unfavorite";
import { favorites } from "./favorites";
import { likedsongs } from "./likedsongs";
import { recentlyplayed } from "./recentlyplayed";
import { recentlyadded } from "./recentlyadded";
import { mostplayed } from "./mostplayed";
import { view } from "./view";
import { add } from "./add";
import { remove } from "./remove";
import { search } from "./search";
import { sort } from "./sort";
import { shuffle } from "./shuffle";
import { export_ } from "./export_";
import { import_ } from "./import_";
import { backup } from "./backup";
import { merge } from "./merge";
import { artists } from "./artists";
import { albums } from "./albums";
import { stats } from "./stats";

/** 20 commands total: 7 standalone + a 13-command /library group. */


/**
 * Immutable registration contract for the library command surface.
 *
 * expectedCommands is the number of executable command implementations this
 * module contributes; expectedTopLevelEntries is the number of Discord
 * top-level application-command entries it consumes.  Keeping both figures
 * explicit prevents a refactor from accidentally trading command depth for
 * top-level budget without the loader noticing.
 */
export const LIBRARY_MODULE = Object.freeze({
  id: "library",
  category: "library",
  description: "Personal music library and history tools.",
  expectedCommands: 20,
  expectedTopLevelEntries: 8,
  expectedGroups: Object.freeze(['library']),
});

export function registerLibraryCommands(): CommandModuleReport {
  return registerCommandModule({
    ...LIBRARY_MODULE,
    expectedGroups: LIBRARY_MODULE.expectedGroups,
  }, () => {
  registry.standalone("favorite", favorite);
  registry.standalone("unfavorite", unfavorite);
  registry.standalone("favorites", favorites);
  registry.standalone("liked-songs", likedsongs);
  registry.standalone("recently-played", recentlyplayed);
  registry.standalone("recently-added", recentlyadded);
  registry.standalone("most-played", mostplayed);

  registry.group("library", "Your personal music library.", "library", [
    { name: "view", command: view },
    { name: "add", command: add },
    { name: "remove", command: remove },
    { name: "search", command: search },
    { name: "sort", command: sort },
    { name: "shuffle", command: shuffle },
    { name: "export", command: export_ },
    { name: "import", command: import_ },
    { name: "backup", command: backup },
    { name: "merge", command: merge },
    { name: "artists", command: artists },
    { name: "albums", command: albums },
    { name: "stats", command: stats },
  ]);
  });
}
