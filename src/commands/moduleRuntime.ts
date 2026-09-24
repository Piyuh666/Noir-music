/**
 * NOIR MUSIC COMMAND MODULE RUNTIME
 *
 * This boundary sits between individual command-category index files and the
 * global command registry.  It intentionally owns only registration-time
 * invariants: deterministic accounting, local-name collision detection,
 * category integrity, top-level budget accounting, and boot telemetry.
 *
 * The individual command files remain responsible for command behavior.  This
 * module is deliberately boring at runtime and strict at startup: if a module
 * registers a different shape than it declares, startup fails immediately.
 */
import type { CommandCategory } from "../types/command";
import { registry } from "./registry";

export interface CommandModuleManifest {
  readonly id: string;
  readonly category: CommandCategory;
  readonly description: string;
  readonly expectedTopLevelEntries: number;
  readonly expectedCommands: number;
  readonly expectedGroups: readonly string[];
}

export interface CommandModuleReport {
  readonly id: string;
  readonly category: CommandCategory;
  readonly description: string;
  readonly durationMs: number;
  readonly registryVersionBefore: number;
  readonly registryVersionAfter: number;
  readonly commandsBefore: number;
  readonly commandsAfter: number;
  readonly commandsAdded: number;
  readonly topLevelBefore: number;
  readonly topLevelAfter: number;
  readonly topLevelAdded: number;
  readonly groupsAdded: number;
  readonly expectedCommands: number;
  readonly expectedTopLevelEntries: number;
  readonly healthy: true;
}

const MODULE_ID_RE = /^[a-z][a-z0-9-]{1,63}$/;

function assertManifest(manifest: CommandModuleManifest): void {
  if (!MODULE_ID_RE.test(manifest.id)) throw new Error(`Invalid command module id: ${manifest.id}`);
  if (!manifest.description.trim() || manifest.description.length > 512) {
    throw new Error(`Invalid command module description: ${manifest.id}`);
  }
  if (!Number.isSafeInteger(manifest.expectedTopLevelEntries) || manifest.expectedTopLevelEntries < 1) {
    throw new Error(`Invalid expected top-level count: ${manifest.id}`);
  }
  if (!Number.isSafeInteger(manifest.expectedCommands) || manifest.expectedCommands < 1) {
    throw new Error(`Invalid expected command count: ${manifest.id}`);
  }
  if (!Array.isArray(manifest.expectedGroups)) throw new Error(`Invalid expected group list: ${manifest.id}`);
  const names = new Set<string>();
  for (const group of manifest.expectedGroups) {
    if (!/^[a-z][a-z0-9-]{0,31}$/.test(group)) throw new Error(`Invalid expected group name: ${manifest.id}/${group}`);
    if (names.has(group)) throw new Error(`Duplicate expected group name: ${manifest.id}/${group}`);
    names.add(group);
  }
  if (manifest.expectedGroups.length !== manifest.expectedTopLevelEntries) {
    // A module can contain standalone commands.  The list therefore contains
    // only expected group names, while the top-level number includes both.
    return;
  }
}

/**
 * Register exactly one category module and return immutable boot telemetry.
 *
 * The callback is executed once.  A module is not silently retried because a
 * partial registry mutation cannot safely be inferred to be reversible.  The
 * global registry's own validation remains the final authority.
 */
export function registerCommandModule(
  manifest: CommandModuleManifest,
  register: () => void,
): CommandModuleReport {
  assertManifest(manifest);
  if (typeof register !== "function") throw new Error(`Missing register function: ${manifest.id}`);

  const before = registry.snapshot();
  const started = process.hrtime.bigint();
  register();
  registry.validate();
  const after = registry.snapshot();
  const durationMs = Number(process.hrtime.bigint() - started) / 1_000_000;

  const commandsAdded = after.commandCount - before.commandCount;
  const topLevelAdded = after.topLevelCount - before.topLevelCount;
  const beforeNames = new Set(before.commands.map((item) => item.fullName));
  const newlyAdded = after.commands.filter((item) => !beforeNames.has(item.fullName));
  const newlyAddedTopLevelNames = after.topLevelNames.filter((name) => !before.topLevelNames.includes(name));
  const expectedGroupSet = new Set(manifest.expectedGroups);
  const addedGroupNames = newlyAddedTopLevelNames.filter((name) => {
    return after.commands.some((item) => item.kind === "subcommand" && item.group === name);
  });
  const unexpectedGroups = addedGroupNames.filter((name) => !expectedGroupSet.has(name));
  const missingGroups = manifest.expectedGroups.filter((name) => !addedGroupNames.includes(name));
  const standaloneAdded = newlyAdded.filter((item) => item.kind === "standalone").length;
  const groupsAdded = addedGroupNames.length;

  if (unexpectedGroups.length || missingGroups.length) {
    throw new Error(
      `Command module group drift: ${manifest.id}; unexpected=[${unexpectedGroups.join(",")}] missing=[${missingGroups.join(",")}]`,
    );
  }
  if (standaloneAdded + groupsAdded !== topLevelAdded) {
    throw new Error(`Top-level accounting failure: ${manifest.id}`);
  }

  if (commandsAdded !== manifest.expectedCommands) {
    throw new Error(
      `Command module drift: ${manifest.id} registered ${commandsAdded} commands; expected ${manifest.expectedCommands}`,
    );
  }
  if (topLevelAdded !== manifest.expectedTopLevelEntries) {
    throw new Error(
      `Top-level module drift: ${manifest.id} registered ${topLevelAdded} entries; expected ${manifest.expectedTopLevelEntries}`,
    );
  }

  const newlyAddedCommands = after.commands.filter((item) => !beforeNames.has(item.fullName));
  const foreignCategory = newlyAddedCommands.filter((item) => item.command.meta.category !== manifest.category);
  if (foreignCategory.length) {
    throw new Error(`Category accounting failure: ${manifest.id} registered commands outside ${manifest.category}: ${foreignCategory.map((item) => item.fullName).join(",")}`);
  }
  if (newlyAddedCommands.length !== commandsAdded) {
    throw new Error(`Command delta accounting failure: ${manifest.id}`);
  }

  return Object.freeze({
    id: manifest.id,
    category: manifest.category,
    description: manifest.description,
    durationMs: Number(durationMs.toFixed(3)),
    registryVersionBefore: before.version,
    registryVersionAfter: after.version,
    commandsBefore: before.commandCount,
    commandsAfter: after.commandCount,
    commandsAdded,
    topLevelBefore: before.topLevelCount,
    topLevelAfter: after.topLevelCount,
    topLevelAdded,
    groupsAdded: Math.max(0, groupsAdded),
    expectedCommands: manifest.expectedCommands,
    expectedTopLevelEntries: manifest.expectedTopLevelEntries,
    healthy: true as const,
  });
}
