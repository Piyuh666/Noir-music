import { registry } from "../registry";
import { registerCommandModule, type CommandModuleReport } from "../moduleRuntime";
import { view } from "./view";
import { add } from "./add";
import { remove } from "./remove";
import { clear } from "./clear";
import { move } from "./move";
import { reverse } from "./reverse";
import { shuffle } from "./shuffle";
import { sort } from "./sort";
import { duplicate } from "./duplicate";
import { save } from "./save";
import { load } from "./load";
import { export_ } from "./export_";
import { import_ } from "./import_";
import { jump } from "./jump";
import { lock } from "./lock";
import { unlock } from "./unlock";
import { limit } from "./limit";
import { history } from "./history";
import { upcoming } from "./upcoming";
import { random } from "./random";
import { repeat } from "./repeat";
import { rotate } from "./rotate";
import { dedupe } from "./dedupe";
import { pin } from "./pin";
import { unpin } from "./unpin";
import { filter } from "./filter";
import { clean } from "./clean";
import { priorityadd } from "./priorityadd";
import { bump } from "./bump";
import { snapshot } from "./snapshot";
import { restoresnapshot } from "./restoresnapshot";
import { skipvotes } from "./skipvotes";

/** 32 commands: 25 under /queue and 7 under /queue-more. */


/**
 * Immutable registration contract for the queue command surface.
 *
 * expectedCommands is the number of executable command implementations this
 * module contributes; expectedTopLevelEntries is the number of Discord
 * top-level application-command entries it consumes.  Keeping both figures
 * explicit prevents a refactor from accidentally trading command depth for
 * top-level budget without the loader noticing.
 */
export const QUEUE_MODULE = Object.freeze({
  id: "queue",
  category: "queue",
  description: "Queue mutation, inspection, persistence, and ordering tools.",
  expectedCommands: 32,
  expectedTopLevelEntries: 2,
  expectedGroups: Object.freeze(['queue', 'queue-more']),
});

export function registerQueueCommands(): CommandModuleReport {
  return registerCommandModule({
    ...QUEUE_MODULE,
    expectedGroups: QUEUE_MODULE.expectedGroups,
  }, () => {
  registry.group("queue", "Manage the playback queue.", "queue", [
    { name: "view", command: view },
    { name: "add", command: add },
    { name: "remove", command: remove },
    { name: "clear", command: clear },
    { name: "move", command: move },
    { name: "reverse", command: reverse },
    { name: "shuffle", command: shuffle },
    { name: "sort", command: sort },
    { name: "duplicate", command: duplicate },
    { name: "save", command: save },
    { name: "load", command: load },
    { name: "export", command: export_ },
    { name: "import", command: import_ },
    { name: "jump", command: jump },
    { name: "lock", command: lock },
    { name: "unlock", command: unlock },
    { name: "limit", command: limit },
    { name: "history", command: history },
    { name: "upcoming", command: upcoming },
    { name: "random", command: random },
    { name: "repeat", command: repeat },
    { name: "rotate", command: rotate },
    { name: "dedupe", command: dedupe },
    { name: "pin", command: pin },
    { name: "unpin", command: unpin },
  ]);
  registry.group("queue-more", "Additional queue management tools.", "queue", [
    { name: "filter", command: filter },
    { name: "clean", command: clean },
    { name: "priority-add", command: priorityadd },
    { name: "bump", command: bump },
    { name: "snapshot", command: snapshot },
    { name: "restore-snapshot", command: restoresnapshot },
    { name: "skip-votes", command: skipvotes },
  ]);
  });
}
