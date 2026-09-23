import type { ButtonInteraction } from "discord.js";
import { UIAction } from "../actions";
import { executeDedicatedHandler, contract } from "./runtime";
import { requirePlayer, queuePageEmbed } from "./context";
import { queueControls } from "../components";
export const DASHBOARD_QUEUE_CONTRACT=contract(UIAction.DASHBOARD_QUEUE,"button","dashboard-queue",false);
export async function handleDashboardQueue(interaction:ButtonInteraction):Promise<void>{
 await executeDedicatedHandler(interaction,DASHBOARD_QUEUE_CONTRACT,async (_execution)=>{const player=requirePlayer(interaction);const view=queuePageEmbed(player,1);await interaction.update({embeds:[view.embed],components:queueControls(view.page,view.pages)})});
}
