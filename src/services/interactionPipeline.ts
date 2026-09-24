import { ChatInputCommandInteraction, GuildMember } from "discord.js";
import { MusicCommand } from "../types/command";
import { CommandGuardError, assertCommandAllowed, consumeCooldown } from "./commandGuard";
import { executeCommandSafely } from "./commandExecutor";
import { GuildSession } from "../audio/session";
import { KeyedMutex } from "../utils/keyedMutex";
import { logger } from "../utils/logger";

export type PipelineResult = {
  commandId: string;
  durationMs: number;
  failed: boolean;
};

const inFlight = new Set<string>();
const stateOperations = new KeyedMutex();
const MAX_IN_FLIGHT = 10_000;
const MAX_IN_FLIGHT_PER_GUILD = 250;
const guildInFlight = new Map<string, number>();

function interactionKey(interaction: ChatInputCommandInteraction): string {
  return String(interaction.id ?? "").trim();
}

function shouldSerialize(command: MusicCommand): boolean {
  // Playback mutations are the highest-risk race surface: skip/play/seek/
  // pause/queue-driven state changes can otherwise interleave in Discord's
  // concurrent event loop. Queue-only commands already use their own service
  // boundaries and are intentionally not held behind the playback gate.
  return Boolean(command.meta.changesPlaybackState);
}

export async function runCommandPipeline(
  interaction: ChatInputCommandInteraction,
  command: MusicCommand,
): Promise<PipelineResult> {
  const startedAt = Date.now();
  if (!interaction.inGuild() || !interaction.guildId) {
    throw new CommandGuardError("PERM_001", "NOIR MUSIC music commands must be used inside a server.");
  }
  if (inFlight.size >= MAX_IN_FLIGHT) throw new Error("COMMAND_BUSY");

  const guildId = String(interaction.guildId);
  const guildCount = guildInFlight.get(guildId) ?? 0;
  if (guildCount >= MAX_IN_FLIGHT_PER_GUILD) throw new Error("COMMAND_BUSY");

  const key = interactionKey(interaction);
  if (!key || inFlight.has(key)) {
    throw new CommandGuardError("RATE_001", "This interaction is already being processed.");
  }
  inFlight.add(key);
  guildInFlight.set(guildId, guildCount + 1);

  const run = async (): Promise<void> => {
    const member = interaction.member;
    if (!(member instanceof GuildMember)) {
      throw new CommandGuardError("PERM_001", "NOIR MUSIC could not resolve your server membership.");
    }

    // Validate permissions and server state before consuming a cooldown. A
    // denied user must not be able to poison another user's useful retry path.
    const player = GuildSession.for(interaction.guildId!).player;
    await assertCommandAllowed(member, command, player);

    const remaining = consumeCooldown(interaction.guildId!, interaction.user.id, command);
    if (remaining > 0) {
      throw new CommandGuardError("RATE_001", `This command is cooling down for ${Math.ceil(remaining / 1000)}s.`);
    }

    await executeCommandSafely(interaction, command);
  };

  try {
    if (shouldSerialize(command)) {
      await stateOperations.runExclusive(`playback:${interaction.guildId}`, run);
    } else {
      await run();
    }
    return { commandId: command.meta.id, durationMs: Date.now() - startedAt, failed: false };
  } catch (error) {
    const normalized = error instanceof Error ? error : new Error(String(error));
    logger.debug({ err: normalized, commandId: command.meta.id, guildId: interaction.guildId }, "Command pipeline failed");
    throw Object.assign(normalized, {
      commandId: command.meta.id,
      durationMs: Date.now() - startedAt,
    });
  } finally {
    inFlight.delete(key);
    const remaining = (guildInFlight.get(guildId) ?? 1) - 1;
    if (remaining > 0) guildInFlight.set(guildId, remaining);
    else guildInFlight.delete(guildId);
  }
}

export function inFlightCount(): number {
  return inFlight.size;
}

export function guildInFlightCount(guildId: string): number {
  return guildInFlight.get(String(guildId)) ?? 0;
}

export function assertInteractionCapacity(guildId?: string): void {
  if (inFlight.size >= MAX_IN_FLIGHT) throw new Error("COMMAND_BUSY");
  if (guildId && guildInFlightCount(guildId) >= MAX_IN_FLIGHT_PER_GUILD) throw new Error("COMMAND_BUSY");
}

export function playbackOperationQueueCount(guildId?: string): number {
  if (!guildId) return stateOperations.size();
  return stateOperations.pending(`playback:${guildId}`);
}
