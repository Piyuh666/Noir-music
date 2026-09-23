import type { ButtonInteraction } from "discord.js";
import { UIAction } from "../actions";
import { executeDedicatedHandler, contract } from "./runtime";
import { showDashboard } from "./context";
export const PLAYER_DASHBOARD_CONTRACT=contract(UIAction.PLAYER_DASHBOARD,"button","dashboard",false);
export async function handlePlayerDashboard(interaction:ButtonInteraction):Promise<void>{await executeDedicatedHandler(interaction,PLAYER_DASHBOARD_CONTRACT,async (_execution)=>{await showDashboard(interaction)});}
