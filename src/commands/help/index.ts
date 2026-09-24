import { registry } from "../registry";
import { registerCommandModule, type CommandModuleReport } from "../moduleRuntime";
import { help } from "./help";
import { search } from "./search";
import { category } from "./category";
import { command } from "./command";
import { changelog } from "./changelog";
import { support } from "./support";
import { commandlist } from "./commandlist";
import { shortcuts } from "./shortcuts";
import { feedback } from "./feedback";
import { glossary } from "./glossary";

/** /help is standalone (bare-invocable); everything else groups under /help-tools. */


/**
 * Immutable registration contract for the help command surface.
 *
 * expectedCommands is the number of executable command implementations this
 * module contributes; expectedTopLevelEntries is the number of Discord
 * top-level application-command entries it consumes.  Keeping both figures
 * explicit prevents a refactor from accidentally trading command depth for
 * top-level budget without the loader noticing.
 */
export const HELP_MODULE = Object.freeze({
  id: "help",
  category: "help",
  description: "Search, browse, and get details on commands.",
  expectedCommands: 10,
  expectedTopLevelEntries: 2,
  expectedGroups: Object.freeze(['help-tools']),
});

export function registerHelpCommands(): CommandModuleReport {
  return registerCommandModule({
    ...HELP_MODULE,
    expectedGroups: HELP_MODULE.expectedGroups,
  }, () => {
  registry.standalone("help", help);
  registry.group("help-tools", "Search, browse, and get details on commands.", "help", [
    { name: "search", command: search },
    { name: "category", command: category },
    { name: "command", command: command },
    { name: "changelog", command: changelog },
    { name: "support", command: support },
    { name: "command-list", command: commandlist },
    { name: "shortcuts", command: shortcuts },
    { name: "feedback", command: feedback },
    { name: "glossary", command: glossary },
  ]);
  });
}
