import type { ButtonInteraction } from "discord.js";
import { UIAction } from "../actions";
import { executeDedicatedHandler, contract } from "./runtime";
import { showHelpBack } from "./context";
export const HELP_BACK_CONTRACT=contract(UIAction.HELP_BACK,"button","help-navigation",false);
export async function handleHelpBack(interaction:ButtonInteraction):Promise<void>{await executeDedicatedHandler(interaction,HELP_BACK_CONTRACT,async (_execution)=>{await showHelpBack(interaction)});}
