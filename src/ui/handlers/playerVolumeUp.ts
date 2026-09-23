import type { ButtonInteraction } from "discord.js";
import { UIAction } from "../actions";
import { UIControlService } from "../../services/uiControlService";
import { executeDedicatedHandler, contract } from "./runtime";
import { requirePlayer, requireControl, playerView } from "./context";

export const HANDLEPLAYERVOLUMEUP_CONTRACT = contract(UIAction.PLAYER_VOLUME_UP, "button", "volume", true);

export async function handlePlayerVolumeUp(interaction: ButtonInteraction): Promise<void> {
  await executeDedicatedHandler(interaction, HANDLEPLAYERVOLUMEUP_CONTRACT, async (_execution) => {
    const guildId = interaction.guildId!;
    const player = requirePlayer(interaction);
    if (!(await requireControl(interaction, player))) return;
    await UIControlService.volumeStep(guildId, 10);
    if (!interaction.replied && !interaction.deferred) await interaction.update(playerView(guildId));
  });
}
