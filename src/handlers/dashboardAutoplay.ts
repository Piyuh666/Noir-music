import type { ButtonInteraction } from "discord.js";
import { UIAction } from "../actions";
import { executeDedicatedHandler, contract, denyManageGuild, requireManageGuild } from "./runtime";
import { UIControlService } from "../../services/uiControlService";
import { showDashboard } from "./context";

export const DASHBOARD_AUTOPLAY_CONTRACT=contract(UIAction.DASHBOARD_AUTOPLAY,"button","dashboard",true);
export async function handleDashboardAutoplay(interaction:ButtonInteraction):Promise<void>{
 await executeDedicatedHandler(interaction,DASHBOARD_AUTOPLAY_CONTRACT,async (_execution)=>{
  if(!requireManageGuild(interaction)){await denyManageGuild(interaction,"Manage Server is required to change server autoplay.");return;}
  await UIControlService.toggleAutoplay(interaction.guildId!);
  await showDashboard(interaction);
 });
}
