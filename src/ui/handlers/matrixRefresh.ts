import type { ButtonInteraction } from "discord.js";
import { UIAction } from "../actions";
import { executeDedicatedHandler, contract } from "./runtime";
import { showMatrix } from "./context";
export const MATRIX_REFRESH_CONTRACT=contract(UIAction.MATRIX_REFRESH,"button","matrix",false);
export async function handleMatrixRefresh(interaction:ButtonInteraction):Promise<void>{await executeDedicatedHandler(interaction,MATRIX_REFRESH_CONTRACT,async (_execution)=>{await showMatrix(interaction)});}
