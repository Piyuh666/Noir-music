import type { StringSelectMenuInteraction } from "discord.js";
import { UIAction } from "../actions";
import { executeDedicatedHandler, contract } from "./runtime";
import { registry } from "../../commands/registry";
import { listEmbed } from "../embeds";
import { helpBackControl } from "../components";

export const HELP_CATEGORY_CONTRACT=contract(UIAction.HELP_CATEGORY,"select","help-category",false);

export async function handleHelpCategory(interaction:StringSelectMenuInteraction):Promise<void>{
 await executeDedicatedHandler(interaction,HELP_CATEGORY_CONTRACT,async (_execution)=>{
  const category=String(interaction.values[0]??"").trim();
  if(!category){await interaction.reply({content:"A help category is required.",ephemeral:true});return;}
  const commands=registry.flatCommands()
   .filter(({command})=>command.meta.category===category)
   .sort((a,b)=>a.fullName.localeCompare(b.fullName));
  const visible=commands.slice(0,24);
  const lines=visible.map(({fullName,command})=>`▸ **/${fullName}**\\n  ${command.meta.description}`);
  if(commands.length>visible.length)lines.push(`… +${commands.length-visible.length} MORE`);
  await interaction.update({embeds:[listEmbed(`${category.toUpperCase()} // COMMAND INDEX`,lines.length?lines:["NO COMMANDS IN THIS CATEGORY"],`${commands.length} COMMAND(S) · LIVE REGISTRY · SELECT BACK TO RETURN`)],components:helpBackControl()});
 });
}
