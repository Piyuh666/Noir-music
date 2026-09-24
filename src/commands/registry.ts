/**
 * NOIR MUSIC ENTERPRISE COMMAND REGISTRY
 *
 * This file is intentionally boring at runtime and extremely defensive at the
 * boundaries. Discord command definitions are effectively a public API: a bad
 * name, duplicate id, oversized description, ambiguous alias, or malformed
 * builder can break registration for an entire application. The registry is
 * therefore the single authority for validation, indexing, diagnostics,
 * deterministic ordering, command counting, alias resolution, and immutable
 * snapshots.
 */
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import { CommandMeta, MusicCommand } from "../types/command";

export interface StandaloneEntry { kind: "standalone"; name: string; command: MusicCommand; }
export interface GroupEntry {
  kind: "group";
  name: string;
  description: string;
  category: CommandMeta["category"];
  subcommands: { name: string; command: MusicCommand }[];
}
export type RegistryEntry = StandaloneEntry | GroupEntry;
export type FlatCommand = { fullName: string; command: MusicCommand; kind: "standalone" | "subcommand"; group?: string; name: string };
export interface RegistryDiagnostics {
  topLevel: number;
  topLevelLimit: number;
  topLevelRemaining: number;
  subcommandGroups: number;
  commandCount: number;
  categories: number;
  aliases: number;
  duplicateIds: string[];
  duplicateNames: string[];
  invalidEntries: string[];
}
export interface RegistrySnapshot {
  version: number;
  commandCount: number;
  topLevelCount: number;
  topLevelNames: readonly string[];
  categories: readonly CommandMeta["category"][];
  commands: readonly FlatCommand[];
  aliases: ReadonlyMap<string, string>;
  fingerprint: string;
}

const NAME_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const ID_RE = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const MAX_TOP_LEVEL = 100;
const MAX_SUBCOMMANDS = 25;
const MAX_ALIAS_LENGTH = 32;
const MAX_DESCRIPTION = 100;
const MAX_EXAMPLE = 500;

function stableHash(input: string): string {
  // FNV-1a is deliberately tiny, deterministic, and sufficient for a local
  // configuration fingerprint; it is NOT a security primitive.
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

class CommandRegistry {
  private readonly entries = new Map<string, RegistryEntry>();
  private readonly aliases = new Map<string, string>();
  private flatCache: readonly FlatCommand[] | null = null;
  private categoryCache: readonly CommandMeta["category"][] | null = null;
  private commandIndexCache: ReadonlyMap<string, MusicCommand> | null = null;
  private aliasIndexCache: ReadonlyMap<string, string> | null = null;
  private snapshotCache: RegistrySnapshot | null = null;
  private mutationVersion = 0;
  private validatedVersion = -1;

  private invalidate(): void {
    this.flatCache = null;
    this.categoryCache = null;
    this.commandIndexCache = null;
    this.aliasIndexCache = null;
    this.snapshotCache = null;
    this.mutationVersion += 1;
  }

  standalone(name: string, command: MusicCommand): void {
    this.validateName(name);
    if (this.entries.has(name)) throw new Error(`Duplicate top-level command name: ${name}`);
    this.validateCommand(command, name);
    this.assertAliasSpace(command, name);
    this.entries.set(name, { kind: "standalone", name, command });
    this.registerAliases(command, name);
    this.invalidate();
  }

  group(name: string, description: string, category: CommandMeta["category"], subcommands: { name: string; command: MusicCommand }[]): void {
    this.validateName(name);
    this.validateDescription(description, `/${name}`);
    if (!Array.isArray(subcommands) || subcommands.length === 0) throw new Error(`Group /${name} must contain at least one subcommand`);

    const existing = this.entries.get(name);
    if (existing && existing.kind !== "group") throw new Error(`Name collision on group: ${name}`);
    const target = existing?.kind === "group" ? existing : undefined;
    const names = new Set(target?.subcommands.map((item) => item.name) ?? []);
    const stagedAliases: Array<[string, string]> = [];

    for (const item of subcommands) {
      this.validateName(item.name);
      if (names.has(item.name)) throw new Error(`Duplicate subcommand: /${name} ${item.name}`);
      this.validateCommand(item.command, `${name} ${item.name}`);
      const fullName = `${name} ${item.name}`;
      this.assertAliasSpace(item.command, fullName, stagedAliases);
      names.add(item.name);
      for (const alias of item.command.meta.aliases ?? []) stagedAliases.push([alias, fullName]);
    }

    const nextCount = (target?.subcommands.length ?? 0) + subcommands.length;
    if (nextCount > MAX_SUBCOMMANDS) throw new Error(`Discord subcommand limit exceeded for /${name}: ${nextCount}`);

    if (target) target.subcommands.push(...subcommands);
    else this.entries.set(name, { kind: "group", name, description, category, subcommands: [...subcommands] });
    for (const [alias, fullName] of stagedAliases) this.aliases.set(alias, fullName);
    this.invalidate();
  }

  all(): RegistryEntry[] { return [...this.entries.values()]; }

  flatCommands(): readonly FlatCommand[] {
    if (this.flatCache) return this.flatCache;
    const out: FlatCommand[] = [];
    for (const entry of this.entries.values()) {
      if (entry.kind === "standalone") {
        out.push({ fullName: entry.name, command: entry.command, kind: "standalone", name: entry.name });
      } else {
        for (const sub of entry.subcommands) {
          out.push({ fullName: `${entry.name} ${sub.name}`, command: sub.command, kind: "subcommand", group: entry.name, name: sub.name });
        }
      }
    }
    this.flatCache = Object.freeze(out);
    return this.flatCache;
  }

  categories(): readonly CommandMeta["category"][] {
    if (this.categoryCache) return this.categoryCache;
    this.categoryCache = Object.freeze([...new Set(this.flatCommands().map((x) => x.command.meta.category))].sort());
    return this.categoryCache;
  }

  commandIndex(): ReadonlyMap<string, MusicCommand> {
    if (this.commandIndexCache) return this.commandIndexCache;
    const map = new Map<string, MusicCommand>();
    for (const item of this.flatCommands()) map.set(item.fullName, item.command);
    this.commandIndexCache = map;
    return map;
  }

  aliasIndex(): ReadonlyMap<string, string> {
    if (this.aliasIndexCache) return this.aliasIndexCache;
    this.aliasIndexCache = new Map(this.aliases);
    return this.aliasIndexCache;
  }

  /** Performs the complete invariant sweep. Call this before Discord registration. */
  validate(): void {
    if (this.validatedVersion === this.mutationVersion) return;
    if (this.entries.size > MAX_TOP_LEVEL) throw new Error(`Discord top-level command limit exceeded: ${this.entries.size}/${MAX_TOP_LEVEL}`);

    const ids = new Set<string>();
    const names = new Set<string>();
    const aliasTargets = new Set<string>();
    for (const entry of this.entries.values()) {
      this.validateName(entry.name);
      if (names.has(entry.name)) throw new Error(`Duplicate top-level registry entry: ${entry.name}`);
      names.add(entry.name);
      if (entry.kind === "standalone") this.validateCommand(entry.command, entry.name);
      else {
        this.validateDescription(entry.description, `/${entry.name}`);
        if (entry.subcommands.length > MAX_SUBCOMMANDS) throw new Error(`Discord subcommand limit exceeded for /${entry.name}`);
        const subNames = new Set<string>();
        for (const sub of entry.subcommands) {
          this.validateName(sub.name);
          if (subNames.has(sub.name)) throw new Error(`Duplicate subcommand: /${entry.name} ${sub.name}`);
          subNames.add(sub.name);
          const fullName = `${entry.name} ${sub.name}`;
          this.validateCommand(sub.command, fullName);
          aliasTargets.add(fullName);
        }
      }
    }
    for (const item of this.flatCommands()) {
      if (ids.has(item.command.meta.id)) throw new Error(`Duplicate command id: ${item.command.meta.id}`);
      ids.add(item.command.meta.id);
    }
    for (const [alias, target] of this.aliases) {
      this.validateName(alias);
      if (alias.length > MAX_ALIAS_LENGTH) throw new Error(`Alias is too long: ${alias}`);
      if (!this.commandIndex().has(target)) throw new Error(`Alias points to missing command: ${alias} -> ${target}`);
      if (this.entries.has(alias) || aliasTargets.has(alias)) throw new Error(`Alias collides with command name: ${alias}`);
    }
    this.validatedVersion = this.mutationVersion;
  }

  diagnostics(): RegistryDiagnostics {
    const duplicateIds: string[] = [];
    const ids = new Set<string>();
    for (const item of this.flatCommands()) {
      if (ids.has(item.command.meta.id)) duplicateIds.push(item.command.meta.id); else ids.add(item.command.meta.id);
    }
    return {
      topLevel: this.entries.size,
      topLevelLimit: MAX_TOP_LEVEL,
      topLevelRemaining: MAX_TOP_LEVEL - this.entries.size,
      subcommandGroups: [...this.entries.values()].filter((e) => e.kind === "group").length,
      commandCount: this.count(),
      categories: this.categories().length,
      aliases: this.aliases.size,
      duplicateIds,
      duplicateNames: [],
      invalidEntries: [],
    };
  }

  snapshot(): RegistrySnapshot {
    this.validate();
    if (this.snapshotCache) return this.snapshotCache;
    const commands = this.flatCommands().map((item) => ({ ...item }));
    const aliases = new Map(this.aliases);
    const signature = commands.map((item) => `${item.fullName}|${item.command.meta.id}|${item.command.meta.category}|${item.command.meta.description}`).join("\n");
    this.snapshotCache = Object.freeze({
      version: this.mutationVersion,
      commandCount: commands.length,
      topLevelCount: this.entries.size,
      topLevelNames: Object.freeze([...this.entries.keys()]),
      categories: this.categories(),
      commands: Object.freeze(commands),
      aliases,
      fingerprint: stableHash(signature),
    });
    return this.snapshotCache;
  }

  toDiscordBuilders(): SlashCommandBuilder[] {
    this.validate();
    return this.all().map((entry) => {
      if (entry.kind === "standalone") {
        const builder = new SlashCommandBuilder().setName(entry.name).setDescription(entry.command.meta.description);
        entry.command.build(builder);
        return builder;
      }
      const builder = new SlashCommandBuilder().setName(entry.name).setDescription(entry.description);
      for (const sub of entry.subcommands) {
        builder.addSubcommand((s: SlashCommandSubcommandBuilder) => {
          s.setName(sub.name).setDescription(sub.command.meta.description);
          sub.command.build(s);
          return s;
        });
      }
      return builder;
    });
  }

  resolveExecutor(interaction: ChatInputCommandInteraction): MusicCommand | null {
    const entry = this.entries.get(interaction.commandName);
    if (!entry) {
      const aliasTarget = this.aliases.get(interaction.commandName);
      if (!aliasTarget) return null;
      return this.commandIndex().get(aliasTarget) ?? null;
    }
    if (entry.kind === "standalone") return entry.command;
    const subName = interaction.options.getSubcommand(false);
    if (!subName) return null;
    return entry.subcommands.find((item) => item.name === subName)?.command ?? null;
  }

  count(): number { return this.flatCommands().length; }

  private registerAliases(command: MusicCommand, target: string): void {
    for (const alias of command.meta.aliases ?? []) this.aliases.set(alias, target);
  }

  private assertAliasSpace(command: MusicCommand, target: string, staged: Array<[string, string]> = []): void {
    for (const alias of command.meta.aliases ?? []) {
      this.validateName(alias);
      if (alias.length > MAX_ALIAS_LENGTH) throw new Error(`Alias is too long: ${alias}`);
      if (this.entries.has(alias)) throw new Error(`Alias collides with top-level command: ${alias}`);
      const existing = this.aliases.get(alias) ?? staged.find(([name]) => name === alias)?.[1];
      if (existing && existing !== target) throw new Error(`Duplicate alias: ${alias}`);
    }
  }

  private validateName(name: string): void {
    if (typeof name !== "string" || !NAME_RE.test(name) || name.length > 32) throw new Error(`Invalid Discord command name: ${name}`);
  }

  private validateDescription(description: string, context: string): void {
    if (typeof description !== "string" || !description.trim() || description.length > MAX_DESCRIPTION || /[\u0000-\u001F\u007F]/.test(description)) throw new Error(`Invalid command description: ${context}`);
  }

  private validateCommand(command: MusicCommand, context: string): void {
    if (!command || typeof command !== "object") throw new Error(`Missing command implementation: ${context}`);
    const meta = command.meta;
    if (!meta || !ID_RE.test(meta.id) || meta.id.length > 128) throw new Error(`Invalid command id: ${context}`);
    this.validateDescription(meta.description, context);
    if (meta.example !== undefined && (typeof meta.example !== "string" || meta.example.length > MAX_EXAMPLE)) throw new Error(`Invalid command example: ${meta.id}`);
    if (meta.aliases !== undefined && (!Array.isArray(meta.aliases) || meta.aliases.length > 16)) throw new Error(`Invalid aliases metadata: ${meta.id}`);
    if (meta.permissions !== undefined && !Array.isArray(meta.permissions)) throw new Error(`Invalid permissions metadata: ${meta.id}`);
    if (typeof meta.changesPlaybackState !== "boolean" || typeof meta.requiresDb !== "boolean" || typeof meta.requiresProvider !== "boolean") throw new Error(`Invalid command flags: ${meta.id}`);
    if (meta.cooldownMs !== undefined && (!Number.isFinite(meta.cooldownMs) || meta.cooldownMs < 0 || meta.cooldownMs > 120_000)) throw new Error(`Invalid cooldown: ${meta.id}`);
    if (typeof command.build !== "function" || typeof command.execute !== "function") throw new Error(`Incomplete command implementation: ${meta.id}`);
  }
}

export const registry = new CommandRegistry();
