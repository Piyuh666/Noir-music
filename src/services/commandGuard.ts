import { GuildMember } from "discord.js";
import { MusicCommand } from "../types/command";
import { DjService } from "./djService";
import { prisma } from "../database/prisma";

export type GuardFailureCode = "PERM_001" | "PERM_002" | "VOICE_002" | "VOICE_003" | "PERM_004" | "PERM_005" | "FX_DISABLED" | "RATE_001";

export class CommandGuardError extends Error {
  constructor(public readonly code: GuardFailureCode, message: string) {
    super(message);
    this.name = "CommandGuardError";
  }
}

const cooldowns = new Map<string, number>();
const burstWindows = new Map<string, number[]>();
const MAX_COOLDOWN_ENTRIES = 50_000;
const MAX_BURST_ENTRIES = 50_000;
const BURST_LIMIT = 18;
const BURST_WINDOW_MS = 10_000;

function pruneCooldowns(now: number): void {
  for (const [key, expiry] of cooldowns) {
    if (expiry <= now) cooldowns.delete(key);
    if (cooldowns.size <= MAX_COOLDOWN_ENTRIES) break;
  }
}

function pruneBurstWindows(now: number): void {
  for (const [key, timestamps] of burstWindows) {
    const recent = timestamps.filter((stamp) => now - stamp < BURST_WINDOW_MS);
    if (recent.length) burstWindows.set(key, recent);
    else burstWindows.delete(key);
    if (burstWindows.size <= MAX_BURST_ENTRIES) break;
  }
}

function validId(value: string): string {
  const normalized = String(value ?? "").trim();
  if (!normalized || normalized.length > 128 || /[\u0000-\u001F\u007F]/.test(normalized)) throw new TypeError("Invalid command guard key");
  return normalized;
}

function cooldownKey(guildId: string, userId: string, commandId: string): string {
  return `${validId(guildId)}:${validId(userId)}:${validId(commandId)}`;
}

export function consumeCooldown(guildId: string, userId: string, command: MusicCommand, now = Date.now()): number {
  if (!Number.isFinite(now)) throw new TypeError("Invalid cooldown timestamp");
  pruneBurstWindows(now);
  const burstKey = `${validId(guildId)}:${validId(userId)}`;
  const recent = (burstWindows.get(burstKey) ?? []).filter((stamp) => now - stamp < BURST_WINDOW_MS);
  if (recent.length >= BURST_LIMIT) {
    burstWindows.set(burstKey, recent);
    return Math.max(1, BURST_WINDOW_MS - (now - recent[0]));
  }
  recent.push(now);
  burstWindows.set(burstKey, recent);

  const defaultCooldown = command.meta.requiresProvider ? 500 : command.meta.changesPlaybackState ? 350 : 200;
  const duration = Math.max(0, Math.min(120_000, command.meta.cooldownMs ?? defaultCooldown));
  if (!duration) return 0;
  pruneCooldowns(now);
  const key = cooldownKey(guildId, userId, command.meta.id);
  const expiry = cooldowns.get(key) ?? 0;
  if (expiry > now) return expiry - now;
  cooldowns.set(key, now + duration);
  return 0;
}

const queueMutation = /^(queue|playlist)\.(add|bump|clean|clear|dedupe|duplicate|filter|import|jump|limit|load|lock|move|pin|priority_add|random|remove|repeat|restore_snapshot|reverse|rotate|save|shuffle|sort|unlock|unpin|create|delete|rename|track_add|track_remove|track_move)$/;

type PlayerLike = {
  voiceChannelId?: string | null;
  getData<T>(key: string): T | undefined;
};

export async function assertCommandAllowed(member: GuildMember, command: MusicCommand, player?: PlayerLike): Promise<void> {
  if (!member?.guild?.id || !member.user?.id) throw new CommandGuardError("PERM_001", "NOIR MUSIC could not verify your server membership.");
  if (command.meta.permissions?.length && !DjService.permissionAllowed(member, command.meta.permissions)) {
    throw new CommandGuardError("PERM_001", "You do not have the Discord permissions required for this command.");
  }
  if (command.meta.djOnly && !(await DjService.isDj(member))) {
    throw new CommandGuardError("PERM_002", "This command is restricted to configured DJs and server administrators.");
  }

  if (command.meta.category === "effects" && command.meta.id !== "effect.toggle") {
    const guild = await prisma.guild.findUnique({ where: { discordId: member.guild.id }, select: { effectsEnabled: true } });
    if (guild && !guild.effectsEnabled) throw new CommandGuardError("FX_DISABLED", "Audio effects are disabled for this server.");
  }

  const action = DjService.actionForCommand(command.meta.id, command.meta.category);
  if (action && !(await DjService.canPerform(member, action))) {
    throw new CommandGuardError("PERM_002", `The ${action} action is currently restricted to DJs.`);
  }
  if (!player) return;

  if (command.meta.changesPlaybackState && player.voiceChannelId && member.voice.channelId !== player.voiceChannelId) {
    throw new CommandGuardError("VOICE_002", "Join the same voice channel as NOIR MUSIC before controlling playback.");
  }
  if (command.meta.id === "voice.move" && player.getData<boolean>("voiceLocked")) {
    throw new CommandGuardError("VOICE_003", "The bot's voice channel is locked. Unlock it before moving NOIR MUSIC.");
  }

  const dj = await DjService.isDj(member);
  if (command.meta.changesPlaybackState && player.getData<boolean>("playbackLocked") && !dj) {
    throw new CommandGuardError("PERM_004", "Playback controls are currently restricted to DJs.");
  }
  if (queueMutation.test(command.meta.id) && player.getData<boolean>("queueLocked") && !dj) {
    throw new CommandGuardError("PERM_005", "Queue changes are currently restricted to DJs.");
  }
}

export function clearGuardState(): void {
  cooldowns.clear();
  burstWindows.clear();
}
