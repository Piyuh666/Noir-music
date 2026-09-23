import type { ButtonInteraction } from "discord.js";
import { UIAction } from "../actions";
import { executeDedicatedHandler, contract, denyManageGuild, requireManageGuild } from "./runtime";
import { UIControlService } from "../../services/uiControlService";
import { showDashboard } from "./context";

export const DASHBOARD_SOURCE_CONTRACT=contract(UIAction.DASHBOARD_SOURCE,"button","dashboard",true);
export async function handleDashboardSource(interaction:ButtonInteraction):Promise<void>{
 await executeDedicatedHandler(interaction,DASHBOARD_SOURCE_CONTRACT,async (_execution)=>{
  if(!requireManageGuild(interaction)){await denyManageGuild(interaction,"Manage Server is required to change the default source.");return;}
  await UIControlService.cycleDefaultSource(interaction.guildId!);
  await showDashboard(interaction);
 });
}
