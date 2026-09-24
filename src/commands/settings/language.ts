import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { statusEmbed } from "../../ui/embeds";

export const language: MusicCommand = {
  meta: { id: "music_settings.language", category: "settings", description: "Set the server's preferred lyrics/UI language code.", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("code").setDescription("Language code, e.g. en, es, ja").setRequired(true)); },
  execute: async (interaction) => {
    const code = interaction.options.getString("code", true);
    const { prisma } = await import("../../database/prisma");
    await prisma.guild.upsert({ where: { discordId: interaction.guildId! }, update: { language: code }, create: { discordId: interaction.guildId!, language: code } });
    await interaction.reply({ embeds: [statusEmbed(`LANGUAGE · ${code}`, "")] });
  },
};
