import { monoEmbed } from "../../ui/embeds";
import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { registry } from "../registry";

export const search: MusicCommand = {
  meta: { id: "help.search", category: "help", description: "Search commands by keyword.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: (b) => {
    (b as SlashCommandBuilder).addStringOption((o) => o.setName("query").setDescription("Keyword").setRequired(true));
  },
  execute: async (interaction) => {
    const query = interaction.options.getString("query", true).toLowerCase();
    const matches = registry
      .flatCommands()
      .filter((c) => c.fullName.includes(query) || c.command.meta.description.toLowerCase().includes(query))
      .slice(0, 15);
    const embed = monoEmbed()
      .setColor(0x0a0a0a)
      .setTitle(`HELP · "${query}"`)
      .setDescription(matches.length ? matches.map((m) => `/${m.fullName} — ${m.command.meta.description}`).join("\n") : "No matching commands.");
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
