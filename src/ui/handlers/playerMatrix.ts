import type { ButtonInteraction } from "discord.js";
import { UIAction } from "../actions";
import { executeDedicatedHandler, contract } from "./runtime";
import { showMatrix } from "./context";
export const PLAYER_MATRIX_CONTRACT=contract(UIAction.PLAYER_MATRIX,"button","matrix",false);
export async function handlePlayerMatrix(interaction:ButtonInteraction):Promise<void>{await executeDedicatedHandler(interaction,PLAYER_MATRIX_CONTRACT,async (_execution)=>{await showMatrix(interaction)});}
