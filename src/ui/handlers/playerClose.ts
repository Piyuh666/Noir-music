import type { ButtonInteraction } from "discord.js";
import { UIAction } from "../actions";
import { executeDedicatedHandler, contract } from "./runtime";
import { statusEmbed } from "../embeds";
export const PLAYER_CLOSE_CONTRACT=contract(UIAction.PLAYER_CLOSE,"button","player",false);
export async function handlePlayerClose(interaction:ButtonInteraction):Promise<void>{await executeDedicatedHandler(interaction,PLAYER_CLOSE_CONTRACT,async (_execution)=>{await interaction.update({embeds:[statusEmbed("PLAYER PANEL","CLOSED · INTERACTIVE SURFACE RELEASED")],components:[]})});}
