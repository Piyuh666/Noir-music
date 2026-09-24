import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";
import { statusEmbed } from "../../ui/embeds";

export const prefix: MusicCommand = {
  meta: { id: "music_settings.prefix", category: "settings", description: "Set a legacy text-command prefix (slash commands work regardless).", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("value").setDescription("New prefix").setRequired(true).setMaxLength(3)); },
  execute: async (interaction) => {
    const value = interaction.options.getString("value", true);
    await prisma.guild.upsert({ where: { discordId: interaction.guildId! }, update: { prefix: value }, create: { discordId: interaction.guildId!, prefix: value } });
    await interaction.reply({ embeds: [statusEmbed(`PREFIX · ${value}`, "")] });
  },
};
