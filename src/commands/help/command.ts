import { monoEmbed } from "../../ui/embeds";
import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { registry } from "../registry";

export const command: MusicCommand = {
  meta: { id: "help.command", category: "help", description: "Show full details for one command.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("name").setDescription("Command name, e.g. 'queue add'").setRequired(true)); },
  execute: async (interaction) => {
    const name = interaction.options.getString("name", true).replace(/^\//, "").toLowerCase();
    const match = registry.flatCommands().find((c) => c.fullName === name);
    if (!match) {
      await interaction.reply({ embeds: [monoEmbed().setColor(0x0a0a0a).setDescription(`No command named "${name}".`)], ephemeral: true });
      return;
    }
    const m = match.command.meta;
    const embed = monoEmbed()
      .setColor(0x0a0a0a)
      .setTitle(`/${match.fullName}`)
      .setDescription(m.description)
      .addFields(
        { name: "Category", value: m.category, inline: true },
        { name: "DJ only", value: String(Boolean(m.djOnly)), inline: true },
        { name: "Changes playback", value: String(m.changesPlaybackState), inline: true }
      );
    if (m.example) embed.addFields({ name: "Example", value: m.example });
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
