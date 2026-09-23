import type { ButtonInteraction } from "discord.js";
import { UIAction } from "../actions";
import { UIControlService } from "../../services/uiControlService";
import { executeDedicatedHandler, contract } from "./runtime";
import { requirePlayer, requireControl, playerView } from "./context";

export const HANDLEPLAYERSKIP_CONTRACT = contract(UIAction.PLAYER_SKIP, "button", "player", true);

export async function handlePlayerSkip(interaction: ButtonInteraction): Promise<void> {
  await executeDedicatedHandler(interaction, HANDLEPLAYERSKIP_CONTRACT, async (_execution) => {
    const guildId = interaction.guildId!;
    const player = requirePlayer(interaction);
    if (!(await requireControl(interaction, player))) return;
    await UIControlService.skip(guildId);
    if (!interaction.replied && !interaction.deferred) await interaction.update(playerView(guildId));
  });
}
