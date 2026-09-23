import type { ButtonInteraction } from "discord.js";
import { UIAction } from "../actions";
import { executeDedicatedHandler, contract } from "./runtime";
import { requirePlayer, queuePageFromInteraction, queuePageEmbed } from "./context";
import { queueControls } from "../components";
export const QUEUE_PREVIOUS_CONTRACT=contract(UIAction.QUEUE_PREVIOUS,"button","queue-pagination",false);
export async function handleQueuePrevious(interaction:ButtonInteraction):Promise<void>{await executeDedicatedHandler(interaction,QUEUE_PREVIOUS_CONTRACT,async (_execution)=>{const p=requirePlayer(interaction);const current=queuePageFromInteraction(interaction);const view=queuePageEmbed(p,current-1);await interaction.update({embeds:[view.embed],components:queueControls(view.page,view.pages)});});
}
