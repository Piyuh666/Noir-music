import type { ButtonInteraction } from "discord.js";
import { UIAction } from "../actions";
import { executeDedicatedHandler, contract } from "./runtime";
import { requirePlayer, safeTitle } from "./context";
import { statusEmbed } from "../embeds";
export const PLAYER_LYRICS_CONTRACT=contract(UIAction.PLAYER_LYRICS,"button","lyrics",false);
export async function handlePlayerLyrics(interaction:ButtonInteraction):Promise<void>{await executeDedicatedHandler(interaction,PLAYER_LYRICS_CONTRACT,async (_execution)=>{const p=requirePlayer(interaction);const title=safeTitle(p.queue.current?.info?.title);await interaction.reply({embeds:[statusEmbed(`LYRICS · ${title}`,"Use /lyrics current to open the live lyrics provider flow." )],ephemeral:true});});}
