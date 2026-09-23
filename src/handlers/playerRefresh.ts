import type { ButtonInteraction } from "discord.js";
import { UIAction } from "../actions";
import { executeDedicatedHandler, contract } from "./runtime";
import { playerView } from "./context";
export const PLAYER_REFRESH_CONTRACT=contract(UIAction.PLAYER_REFRESH,"button","player-state",false);
export async function handlePlayerRefresh(interaction:ButtonInteraction):Promise<void>{await executeDedicatedHandler(interaction,PLAYER_REFRESH_CONTRACT,async (_execution)=>{await interaction.update(playerView(interaction.guildId!));});
}
