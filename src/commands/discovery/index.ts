import { registry } from "../registry";
import { registerCommandModule, type CommandModuleReport } from "../moduleRuntime";
import { DISCOVERY_DEFS } from "./definitions";
import { buildDiscoveryCommand } from "./discoveryFactory";

/**
 * Discord caps a single slash command at 25 subcommands (subcommands are
 * "options" and a command tops out at 25 options total). 35 discovery
 * commands therefore can't fit under one /discover group — they're split
 * across /discover (first 25) and /discover-more (remaining 10). This is
 * the same 100-top-level-command constraint from the architecture doc's
 * risk section, one level down.
 */


/**
 * Immutable registration contract for the discovery command surface.
 *
 * expectedCommands is the number of executable command implementations this
 * module contributes; expectedTopLevelEntries is the number of Discord
 * top-level application-command entries it consumes.  Keeping both figures
 * explicit prevents a refactor from accidentally trading command depth for
 * top-level budget without the loader noticing.
 */
export const DISCOVERY_MODULE = Object.freeze({
  id: "discovery",
  category: "discovery",
  description: "Search and discover music.",
  expectedCommands: 35,
  expectedTopLevelEntries: 2,
  expectedGroups: Object.freeze(['discover', 'discover-more']),
});

export function registerDiscoveryCommands(): CommandModuleReport {
  return registerCommandModule({
    ...DISCOVERY_MODULE,
    expectedGroups: DISCOVERY_MODULE.expectedGroups,
  }, () => {
  const entries = DISCOVERY_DEFS.map((def) => ({ name: def.id, command: buildDiscoveryCommand(def) }));
  const first = entries.slice(0, 25);
  const rest = entries.slice(25);

  registry.group("discover", "Search and discover music.", "discovery", first);
  if (rest.length) {
    registry.group("discover-more", "Additional discovery search tools.", "discovery", rest);
  }
  });
}
