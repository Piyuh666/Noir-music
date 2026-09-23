import type { ButtonInteraction } from "discord.js";
import { UIAction } from "../actions";
import { executeDedicatedHandler, contract } from "./runtime";
import { requirePlayer, queuePageEmbed } from "./context";
import { queueControls } from "../components";
export const PLAYER_QUEUE_CONTRACT=contract(UIAction.PLAYER_QUEUE,"button","queue",false);
export async function handlePlayerQueue(interaction:ButtonInteraction):Promise<void>{await executeDedicatedHandler(interaction,PLAYER_QUEUE_CONTRACT,async (_execution)=>{const p=requirePlayer(interaction);const view=queuePageEmbed(p,1);await interaction.reply({embeds:[view.embed],components:queueControls(view.page,view.pages),ephemeral:true});});
}
