// NOIR MUSIC — CANONICAL INTERACTION BOUNDARY
// Every UI action is delegated to one dedicated handler module.
import { Client, Events } from "discord.js";
import { registry } from "../commands/registry";
import { errorEmbed } from "../ui/embeds";
import { UI_ACTION_IDS } from "../ui/actions";
import { registerUIHandler, routeUIInteraction, assertUIRouterComplete } from "../ui/router";
import { CANONICAL_UI_HANDLERS, canonicalUIHandlerIds } from "../ui/handlers";
import { assertCanonicalUIRuntimeWiring } from "../ui/runtimeWiring";
import { recordCommandMetric } from "../services/commandMetrics";
import { logger, musicLog } from "../utils/logger";
import { CommandGuardError } from "../services/commandGuard";
import { runCommandPipeline } from "../services/interactionPipeline";
import { livePlayerPanelService } from "../services/livePlayerPanelService";

function commandError(err: unknown) {
  if (err instanceof CommandGuardError) return errorEmbed("Request blocked", err.message, err.code);
  const message = String((err as Error)?.message ?? "");
  if (message === "QUEUE_LIMIT") return errorEmbed("Queue limit reached", "The server's configured maximum queue size has been reached.", "QUEUE_429");
  if (message === "PLAYLIST_LIMIT") return errorEmbed("Playlist limit reached", "The configured maximum playlist size has been reached.", "PLAYLIST_429");
  if (message.startsWith("PLAYLIST_IMPORT_")) return errorEmbed("Import failed", "The playlist JSON is invalid or exceeds the supported import limits.", "PLAYLIST_400");
  if (message === "COMMAND_TIMEOUT") return errorEmbed("Execution timeout", "NOIR MUSIC stopped waiting for this command after 25 seconds. The operation may still be finishing upstream.", "CMD_408");
  if (message === "COMMAND_BUSY") return errorEmbed("Command core busy", "NOIR MUSIC is processing too many interactions at once. Try again in a moment.", "CMD_429");
  return errorEmbed("Command failure", "The command could not be completed. Check the server configuration and try again.", "CMD_500");
}

// File-to-file wiring contract: actions -> dedicated handler modules -> UI router.
const canonicalHandlerIds = canonicalUIHandlerIds();
if (canonicalHandlerIds.length !== UI_ACTION_IDS.length) throw new Error("CANONICAL_UI_HANDLER_COUNT_MISMATCH");
for (const id of UI_ACTION_IDS) {
  const handler = CANONICAL_UI_HANDLERS[id];
  if (!handler) throw new Error(`MISSING_DEDICATED_UI_HANDLER:${id}`);
  registerUIHandler(id, handler);
}
assertUIRouterComplete(UI_ACTION_IDS);
assertCanonicalUIRuntimeWiring();

export function registerInteractionHandler(client: Client) {
  client.on(Events.InteractionCreate, async (interaction) => {
    const startedAt = Date.now();
    let metricCommand = "interaction";
    let metricFailed = false;
    try {
      if (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) {
        if (await routeUIInteraction(interaction)) {
          if (interaction.isButton()) {
            // Only canonical player controls become live projections; dashboard,
            // help and matrix messages must never be overwritten by player state.
            livePlayerPanelService.registerInteraction(interaction);
          }
          return;
        }
        if (interaction.isRepliable()) {
          await interaction.reply({ embeds: [errorEmbed("Unsupported control", "This UI action is not registered by the canonical Noir Music handler graph.", "UI_404")], ephemeral: true }).catch(() => undefined);
        }
        return;
      }
      if (!interaction.isChatInputCommand()) return;

      const command = registry.resolveExecutor(interaction);
      metricCommand = command?.meta.id ?? `unknown:${interaction.commandName}`;
      if (!command) {
        logger.warn({ commandName: interaction.commandName, userId: interaction.user.id }, "Unknown command");
        await interaction.reply({ embeds: [errorEmbed("Unknown command", "That command is not currently registered. Refresh Discord commands and try again.", "CMD_404")], ephemeral: true }).catch(() => undefined);
        return;
      }
      if (!interaction.inGuild()) {
        await interaction.reply({ embeds: [errorEmbed("Server only", "NOIR MUSIC music commands must be used inside a Discord server.", "CMD_GUILD")], ephemeral: true }).catch(() => undefined);
        return;
      }

      const result = await runCommandPipeline(interaction, command);
      musicLog("COMMAND", { guildId: interaction.guildId, userId: interaction.user.id, extra: { command: command.meta.id, latencyMs: result.durationMs } });
    } catch (err) {
      metricFailed = true;
      logger.error({ err, interactionId: interaction.id, userId: interaction.user.id, commandId: metricCommand }, "Interaction failed");
      const payload = { embeds: [commandError(err)] };
      if (interaction.isRepliable()) {
        if (interaction.deferred || interaction.replied) await interaction.editReply(payload).catch(() => undefined);
        else await interaction.reply({ ...payload, ephemeral: true }).catch(() => undefined);
      }
    } finally {
      recordCommandMetric(metricCommand, Date.now() - startedAt, metricFailed);
    }
  });
}
