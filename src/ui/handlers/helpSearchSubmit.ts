import type { ModalSubmitInteraction } from "discord.js";
import { UIAction } from "../actions";
import { executeDedicatedHandler, contract } from "./runtime";
import { searchLiveCommands } from "../help";
import { listEmbed } from "../embeds";
export const HELP_SEARCH_SUBMIT_CONTRACT=contract(UIAction.HELP_SEARCH_SUBMIT,"modal","help-search",false);
export async function handleHelpSearchSubmit(interaction:ModalSubmitInteraction):Promise<void>{await executeDedicatedHandler(interaction,HELP_SEARCH_SUBMIT_CONTRACT,async (_execution)=>{const query=interaction.fields.getTextInputValue("query").trim().slice(0,80);const matches=searchLiveCommands(query);const lines=matches.map(m=>`▸ **/${m.fullName}**\n  ${m.command.meta.description}`);await interaction.reply({embeds:[listEmbed(`HELP // SEARCH · ${query.toUpperCase()}`,lines.length?lines:["NO MATCHES IN LIVE COMMAND REGISTRY"],`${matches.length} RESULT(S) · LIVE REGISTRY`)],ephemeral:true});});}
