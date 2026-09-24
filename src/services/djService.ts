import { GuildMember, PermissionResolvable } from "discord.js";
import { prisma } from "../database/prisma";
import { isAdHocDj } from "./adHocDj";

export type DjAction = "play" | "skip" | "stop" | "queue" | "volume" | "effects" | "playlist" | "radio" | "disconnect" | "settings";

const DEFAULT_RULES: Record<DjAction, "everyone" | "dj"> = {
  play: "everyone",
  skip: "dj",
  stop: "dj",
  queue: "everyone",
  volume: "dj",
  effects: "dj",
  playlist: "everyone",
  radio: "everyone",
  disconnect: "dj",
  settings: "dj",
};

export class DjService {
  static async isDj(member: GuildMember): Promise<boolean> {
    if (member.permissions.has("Administrator")) return true;
    if (await isAdHocDj(member.guild.id, member.id)) return true;
    const guild = await prisma.guild.findUnique({ where: { discordId: member.guild.id }, include: { djConfig: true } });
    if (!guild?.djConfig) return true;
    const roleId = guild.djRoleId;
    return Boolean(roleId && member.roles.cache.has(roleId));
  }

  static async canPerform(member: GuildMember, action: DjAction): Promise<boolean> {
    const guild = await prisma.guild.findUnique({ where: { discordId: member.guild.id }, include: { djConfig: true } });
    if (!guild?.djConfig) return true;

    if (guild.djConfig.enforcementMode === "off") return true;
    if (guild.djConfig.enforcementMode === "strict") return this.isDj(member);

    // Request-only is intentionally stronger than individual action rules:
    // everyone may enqueue/play requests, but only DJs can control playback.
    if (guild.djConfig.requestOnly && !["play", "queue", "playlist"].includes(action)) {
      return this.isDj(member);
    }

    let perms: Partial<Record<DjAction, "everyone" | "dj">> = {};
    try { perms = JSON.parse(guild.djConfig.permissionsJson || "{}"); } catch { perms = {}; }
    const rule = perms[action] ?? DEFAULT_RULES[action];
    return rule === "everyone" || this.isDj(member);
  }

  static actionForCommand(commandId: string, category: string): DjAction | null {
    if (category === "queue") return "queue";
    if (category === "effects") return "effects";
    if (category === "playlists") return "playlist";
    if (category === "radio") return "radio";
    if (commandId === "vote_skip" || commandId === "queue.skip_votes") return null;
    if (category === "settings" || category === "dj") return "settings";
    if (category === "voice") return /disconnect|leave|move|reconnect/.test(commandId) ? "disconnect" : null;
    if (category !== "playback") return null;

    if (/^play$|playnow|playnext|playat|insert/.test(commandId)) return "play";
    if (/skip|previous/.test(commandId)) return "skip";
    if (/stop/.test(commandId)) return "stop";
    if (/volume|mute|unmute|normalizevolume/.test(commandId)) return "volume";
    return "skip";
  }

  static permissionAllowed(member: GuildMember, permissions: PermissionResolvable[]): boolean {
    return permissions.every((permission) => member.permissions.has(permission));
  }
}
