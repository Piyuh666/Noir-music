import { ChatInputCommandInteraction } from "discord.js";
import { MusicCommand } from "../types/command";
import { config } from "../config";
import { logger } from "../utils/logger";

export class CommandExecutionError extends Error {
  constructor(
    public readonly code: "COMMAND_TIMEOUT" | "COMMAND_EXECUTION_FAILED",
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "CommandExecutionError";
  }
}

function context(interaction: ChatInputCommandInteraction, command: MusicCommand) {
  return {
    commandId: command.meta.id,
    interactionId: interaction.id,
    guildId: interaction.guildId,
    userId: interaction.user.id,
  };
}

export async function executeCommandSafely(interaction: ChatInputCommandInteraction, command: MusicCommand): Promise<void> {
  const meta = context(interaction, command);
  const timeoutMs = config.bot.commandTimeoutMs;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let timedOut = false;
  let settled = false;

  const execution = Promise.resolve().then(() => command.execute(interaction));
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      if (settled) return;
      timedOut = true;
      reject(new CommandExecutionError("COMMAND_TIMEOUT", `Command exceeded ${timeoutMs}ms.`));
    }, timeoutMs);
  });

  try {
    await Promise.race([execution, timeout]);
    settled = true;
    logger.debug({ ...meta }, "Command execution completed");
  } catch (error) {
    settled = true;
    if (error instanceof CommandExecutionError) {
      logger.warn({ ...meta, err: error, timedOut }, "Command execution timed out or was rejected");
      throw error;
    }
    logger.error({ ...meta, err: error }, "Command execution failed");
    throw new CommandExecutionError("COMMAND_EXECUTION_FAILED", "Command execution failed.", error);
  } finally {
    if (timer) clearTimeout(timer);
    // A timed-out command cannot be cancelled by Promise.race. Keep a detached
    // rejection handler attached so a later failure is observable instead of
    // becoming an unhandled rejection.
    if (timedOut) {
      void execution.catch((error) => logger.error({ ...meta, err: error }, "Timed-out command completed after timeout"));
    }
  }
}
