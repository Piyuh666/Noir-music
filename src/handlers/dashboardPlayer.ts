import type { ButtonInteraction } from "discord.js";
import { UIAction } from "../actions";
import { executeDedicatedHandler, contract } from "./runtime";
import { playerView } from "./context";
export const DASHBOARD_PLAYER_CONTRACT=contract(UIAction.DASHBOARD_PLAYER,"button","dashboard-player",false);
export async function handleDashboardPlayer(interaction:ButtonInteraction):Promise<void>{
 await executeDedicatedHandler(interaction,DASHBOARD_PLAYER_CONTRACT,async (_execution)=>{await interaction.update(playerView(interaction.guildId!))});
}
