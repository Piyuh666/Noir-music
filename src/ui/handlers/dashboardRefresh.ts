import type { ButtonInteraction } from "discord.js";
import { UIAction } from "../actions";
import { executeDedicatedHandler, contract } from "./runtime";
import { showDashboard } from "./context";
export const DASHBOARD_REFRESH_CONTRACT=contract(UIAction.DASHBOARD_REFRESH,"button","dashboard",false);
export async function handleDashboardRefresh(interaction:ButtonInteraction):Promise<void>{await executeDedicatedHandler(interaction,DASHBOARD_REFRESH_CONTRACT,async (_execution)=>{await showDashboard(interaction)});}
