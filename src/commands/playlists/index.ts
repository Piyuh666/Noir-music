import { registry } from "../registry";
import { registerCommandModule, type CommandModuleReport } from "../moduleRuntime";
import { create } from "./create";
import { del } from "./delete";
import { rename } from "./rename";
import { add } from "./add";
import { remove } from "./remove";
import { move } from "./move";
import { copy } from "./copy";
import { duplicate } from "./duplicate";
import { merge } from "./merge";
import { split } from "./split";
import { shuffle } from "./shuffle";
import { reverse } from "./reverse";
import { sort } from "./sort";
import { play } from "./play";
import { share } from "./share";
import { unshare } from "./unshare";
import { collaborate_add } from "./collaborate_add";
import { collaborate_remove } from "./collaborate_remove";
import { export_ } from "./export_";
import { import_ } from "./import_";
import { backup } from "./backup";
import { restore } from "./restore";
import { favorite } from "./favorite";
import { unfavorite } from "./unfavorite";
import { clone } from "./clone";
import { stats } from "./stats";
import { view } from "./view";
import { search } from "./search";
import { cover } from "./cover";
import { description } from "./description";
import { visibility } from "./visibility";
import { transfer_owner } from "./transfer_owner";
import { lock } from "./lock";
import { unlock } from "./unlock";
import { smart_create } from "./smart_create";

/** 35 commands, split into two top-level groups to respect Discord's 25-subcommand cap. */


/**
 * Immutable registration contract for the playlists command surface.
 *
 * expectedCommands is the number of executable command implementations this
 * module contributes; expectedTopLevelEntries is the number of Discord
 * top-level application-command entries it consumes.  Keeping both figures
 * explicit prevents a refactor from accidentally trading command depth for
 * top-level budget without the loader noticing.
 */
export const PLAYLISTS_MODULE = Object.freeze({
  id: "playlists",
  category: "playlists",
  description: "Playlist creation, editing, sharing, backup, and recovery.",
  expectedCommands: 35,
  expectedTopLevelEntries: 2,
  expectedGroups: Object.freeze(['playlist', 'playlist-more']),
});

export function registerPlaylistCommands(): CommandModuleReport {
  return registerCommandModule({
    ...PLAYLISTS_MODULE,
    expectedGroups: PLAYLISTS_MODULE.expectedGroups,
  }, () => {
  registry.group("playlist", "Manage your playlists.", "playlists", [
    { name: "create", command: create },
    { name: "delete", command: del },
    { name: "rename", command: rename },
    { name: "add", command: add },
    { name: "remove", command: remove },
    { name: "move", command: move },
    { name: "copy", command: copy },
    { name: "duplicate", command: duplicate },
    { name: "merge", command: merge },
    { name: "split", command: split },
    { name: "shuffle", command: shuffle },
    { name: "reverse", command: reverse },
    { name: "sort", command: sort },
    { name: "play", command: play },
    { name: "share", command: share },
    { name: "unshare", command: unshare },
    { name: "view", command: view },
    { name: "search", command: search },
    { name: "stats", command: stats },
    { name: "favorite", command: favorite },
    { name: "unfavorite", command: unfavorite },
    { name: "clone", command: clone },
    { name: "cover", command: cover },
    { name: "description", command: description },
    { name: "visibility", command: visibility },
  ]);
  registry.group("playlist-more", "Additional playlist management tools.", "playlists", [
    { name: "collaborate-add", command: collaborate_add },
    { name: "collaborate-remove", command: collaborate_remove },
    { name: "export", command: export_ },
    { name: "import", command: import_ },
    { name: "backup", command: backup },
    { name: "restore", command: restore },
    { name: "transfer-owner", command: transfer_owner },
    { name: "lock", command: lock },
    { name: "unlock", command: unlock },
    { name: "smart-create", command: smart_create },
  ]);
  });
}
