import type { ButtonInteraction } from "discord.js";
import { UIAction } from "../actions";
import { UIControlService } from "../../services/uiControlService";
import { executeDedicatedHandler, contract } from "./runtime";
import { requirePlayer, requireControl, playerView } from "./context";

export const HANDLEPLAYERREPLAY_CONTRACT = contract(UIAction.PLAYER_REPLAY, "button", "player", true);

export async function handlePlayerReplay(interaction: ButtonInteraction): Promise<void> {
  await executeDedicatedHandler(interaction, HANDLEPLAYERREPLAY_CONTRACT, async (_execution) => {
    const guildId = interaction.guildId!;
    const player = requirePlayer(interaction);
    if (!(await requireControl(interaction, player))) return;
    await UIControlService.replay(guildId);
    if (!interaction.replied && !interaction.deferred) await interaction.update(playerView(guildId));
  });
}
