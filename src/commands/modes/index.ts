import { registry } from "../registry";
import { registerCommandModule, type CommandModuleReport } from "../moduleRuntime";
import { MODES } from "../../audio/modes";
import { buildModeCommand } from "./modeFactory";
import { list } from "./list";



/**
 * Immutable registration contract for the modes command surface.
 *
 * expectedCommands is the number of executable command implementations this
 * module contributes; expectedTopLevelEntries is the number of Discord
 * top-level application-command entries it consumes.  Keeping both figures
 * explicit prevents a refactor from accidentally trading command depth for
 * top-level budget without the loader noticing.
 */
export const MODES_MODULE = Object.freeze({
  id: "modes",
  category: "modes",
  description: "Named playback modes and mode presets.",
  expectedCommands: 15,
  expectedTopLevelEntries: 1,
  expectedGroups: Object.freeze(['mode']),
});

export function registerModesCommands(): CommandModuleReport {
  return registerCommandModule({
    ...MODES_MODULE,
    expectedGroups: MODES_MODULE.expectedGroups,
  }, () => {
  registry.group("mode", "Switch playback mode (chill, party, focus, sleep, ...).", "modes", [
    ...Object.values(MODES).map((def) => ({ name: def.id, command: buildModeCommand(def) })),
    { name: "list", command: list },
  ]);
  });
}
