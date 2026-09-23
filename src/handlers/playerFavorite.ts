import type { ButtonInteraction } from "discord.js";
import { UIAction } from "../actions";
import { UIControlService } from "../../services/uiControlService";
import { executeDedicatedHandler, contract } from "./runtime";
import { requirePlayer, requireControl, safeTitle } from "./context";
import { statusEmbed } from "../embeds";
export const PLAYER_FAVORITE_CONTRACT=contract(UIAction.PLAYER_FAVORITE,"button","library",true);
export async function handlePlayerFavorite(interaction:ButtonInteraction):Promise<void>{await executeDedicatedHandler(interaction,PLAYER_FAVORITE_CONTRACT,async (_execution)=>{const p=requirePlayer(interaction);if(!(await requireControl(interaction,p)))return;await UIControlService.favoriteCurrent(interaction.guildId!,interaction.user.id);const title=safeTitle(p.queue.current?.info?.title);await interaction.reply({embeds:[statusEmbed(`FAVORITED · ${title}`,"SAVED · LIVE LIBRARY")],ephemeral:true});});
}
