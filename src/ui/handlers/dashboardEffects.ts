import type { ButtonInteraction } from "discord.js";
import { UIAction } from "../actions";
import { executeDedicatedHandler, contract, denyManageGuild, requireManageGuild } from "./runtime";
import { UIControlService } from "../../services/uiControlService";
import { showDashboard } from "./context";

export const DASHBOARD_EFFECTS_CONTRACT=contract(UIAction.DASHBOARD_EFFECTS,"button","dashboard",true);
export async function handleDashboardEffects(interaction:ButtonInteraction):Promise<void>{
 await executeDedicatedHandler(interaction,DASHBOARD_EFFECTS_CONTRACT,async (_execution)=>{
  if(!requireManageGuild(interaction)){await denyManageGuild(interaction,"Manage Server is required to change the effects system.");return;}
  await UIControlService.toggleEffects(interaction.guildId!);
  await showDashboard(interaction);
 });
}
