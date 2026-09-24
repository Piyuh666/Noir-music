import { monoEmbed } from "../../ui/embeds";
import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { registry } from "../registry";

export const category: MusicCommand = {
  meta: { id: "help.category", category: "help", description: "List every command in one category.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("name").setDescription("Category").setRequired(true)); },
  execute: async (interaction) => {
    const name = interaction.options.getString("name", true).toLowerCase();
    const matches = registry.flatCommands().filter((c) => c.command.meta.category === name);
    const embed = monoEmbed()
      .setColor(0x0a0a0a)
      .setTitle(`HELP · ${name.toUpperCase()}`)
      .setDescription(matches.map((m) => `/${m.fullName}`).join("\n") || "No commands in that category.");
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
