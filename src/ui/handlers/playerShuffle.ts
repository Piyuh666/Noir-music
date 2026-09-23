import type { ButtonInteraction } from "discord.js";
import { UIAction } from "../actions";
import { UIControlService } from "../../services/uiControlService";
import { executeDedicatedHandler, contract } from "./runtime";
import { requirePlayer, requireControl, playerView } from "./context";

export const HANDLEPLAYERSHUFFLE_CONTRACT = contract(UIAction.PLAYER_SHUFFLE, "button", "player", true);

export async function handlePlayerShuffle(interaction: ButtonInteraction): Promise<void> {
  await executeDedicatedHandler(interaction, HANDLEPLAYERSHUFFLE_CONTRACT, async (_execution) => {
    const guildId = interaction.guildId!;
    const player = requirePlayer(interaction);
    if (!(await requireControl(interaction, player))) return;
    await UIControlService.shuffle(guildId);
    if (!interaction.replied && !interaction.deferred) await interaction.update(playerView(guildId));
  });
}
