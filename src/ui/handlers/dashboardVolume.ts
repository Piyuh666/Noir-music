import type { ButtonInteraction } from "discord.js";
import { UIAction } from "../actions";
import { executeDedicatedHandler, contract } from "./runtime";
import { requirePlayer, requireControl } from "./context";
import { volumeControls } from "../components";
import { statusEmbed } from "../embeds";
export const DASHBOARD_VOLUME_CONTRACT=contract(UIAction.DASHBOARD_VOLUME,"button","dashboard-volume",false);
export async function handleDashboardVolume(interaction:ButtonInteraction):Promise<void>{
 await executeDedicatedHandler(interaction,DASHBOARD_VOLUME_CONTRACT,async (_execution)=>{const player=requirePlayer(interaction);if(!(await requireControl(interaction,player)))return;const volume=Math.max(0,Math.min(100,Number(player.volume??70)));await interaction.update({embeds:[statusEmbed(`VOLUME · ${volume}%`,"LIVE · CONTROL SURFACE")],components:volumeControls()})});
}
