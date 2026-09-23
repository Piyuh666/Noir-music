import type { ButtonInteraction } from "discord.js";
import { UIAction } from "../actions";
import { executeDedicatedHandler, contract } from "./runtime";
import { showHelpBack } from "./context";
export const MATRIX_BACK_CONTRACT=contract(UIAction.MATRIX_BACK,"button","matrix-navigation",false);
export async function handleMatrixBack(interaction:ButtonInteraction):Promise<void>{await executeDedicatedHandler(interaction,MATRIX_BACK_CONTRACT,async (_execution)=>{await showHelpBack(interaction)});}
