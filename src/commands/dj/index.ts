import { registry } from "../registry";
import { registerCommandModule, type CommandModuleReport } from "../moduleRuntime";
import { enable } from "./enable";
import { disable } from "./disable";
import { role } from "./role";
import { permissions } from "./permissions";
import { add } from "./add";
import { remove } from "./remove";
import { list } from "./list";
import { bypass } from "./bypass";
import { lock } from "./lock";
import { unlock } from "./unlock";
import { mode } from "./mode";
import { djonly } from "./djonly";
import { requestonly } from "./requestonly";
import { voteskip } from "./voteskip";
import { votesettings } from "./votesettings";
import { timeout } from "./timeout";
import { queuepriority } from "./queuepriority";
import { transfer } from "./transfer";
import { log } from "./log";
import { emergencyoverride } from "./emergencyoverride";

/** 20 commands total in one /dj group (well under the 25-subcommand cap). */


/**
 * Immutable registration contract for the dj command surface.
 *
 * expectedCommands is the number of executable command implementations this
 * module contributes; expectedTopLevelEntries is the number of Discord
 * top-level application-command entries it consumes.  Keeping both figures
 * explicit prevents a refactor from accidentally trading command depth for
 * top-level budget without the loader noticing.
 */
export const DJ_MODULE = Object.freeze({
  id: "dj",
  category: "dj",
  description: "Configure DJ permissions for this server.",
  expectedCommands: 20,
  expectedTopLevelEntries: 1,
  expectedGroups: Object.freeze(['dj']),
});

export function registerDjCommands(): CommandModuleReport {
  return registerCommandModule({
    ...DJ_MODULE,
    expectedGroups: DJ_MODULE.expectedGroups,
  }, () => {
  registry.group("dj", "Configure DJ permissions for this server.", "dj", [
    { name: "enable", command: enable },
    { name: "disable", command: disable },
    { name: "role", command: role },
    { name: "permissions", command: permissions },
    { name: "add", command: add },
    { name: "remove", command: remove },
    { name: "list", command: list },
    { name: "bypass", command: bypass },
    { name: "lock", command: lock },
    { name: "unlock", command: unlock },
    { name: "mode", command: mode },
    { name: "dj-only", command: djonly },
    { name: "request-only", command: requestonly },
    { name: "vote-skip", command: voteskip },
    { name: "vote-settings", command: votesettings },
    { name: "timeout", command: timeout },
    { name: "queue-priority", command: queuepriority },
    { name: "transfer", command: transfer },
    { name: "log", command: log },
    { name: "emergency-override", command: emergencyoverride },
  ]);
  });
}
