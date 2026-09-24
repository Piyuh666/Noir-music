import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { statusEmbed } from "../../ui/embeds";

export const defaultsource: MusicCommand = {
  meta: { id: "music_settings.default_source", category: "settings", description: "Set the default search provider for /play.", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => {
    (b as SlashCommandBuilder).addStringOption((o) =>
      o.setName("source").setDescription("Provider").setRequired(true).addChoices({ name: "YouTube", value: "ytsearch" }, { name: "SoundCloud", value: "scsearch" })
    );
  },
  execute: async (interaction) => {
    const source = interaction.options.getString("source", true);
    const { prisma } = await import("../../database/prisma");
    await prisma.guild.upsert({ where: { discordId: interaction.guildId! }, update: { defaultSource: source }, create: { discordId: interaction.guildId!, defaultSource: source } });
    await interaction.reply({ embeds: [statusEmbed(`DEFAULT SOURCE · ${source}`, "")] });
  },
};
