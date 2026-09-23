import type { ButtonInteraction } from "discord.js";
import { ModalBuilder,ActionRowBuilder,TextInputBuilder,TextInputStyle } from "discord.js";
import { UIAction } from "../actions";
import { executeDedicatedHandler, contract } from "./runtime";
export const HELP_SEARCH_CONTRACT=contract(UIAction.HELP_SEARCH,"button","help-search",false);
export async function handleHelpSearch(interaction:ButtonInteraction):Promise<void>{await executeDedicatedHandler(interaction,HELP_SEARCH_CONTRACT,async (_execution)=>{const modal=new ModalBuilder().setCustomId(UIAction.HELP_SEARCH_SUBMIT).setTitle("NOIR MUSIC / COMMAND SEARCH");const input=new TextInputBuilder().setCustomId("query").setLabel("Search command name, alias, module, or description").setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(80).setPlaceholder("queue, lyrics, volume...");modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));await interaction.showModal(modal)});}
