import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";
import { statusEmbed } from "../../ui/embeds";

export const voteskipratio: MusicCommand = {
  meta: { id: "music_settings.vote_skip_ratio", category: "settings", description: "Set the vote-skip pass ratio (same as /dj vote-settings).", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addIntegerOption((o) => o.setName("percent").setDescription("Percent required").setRequired(true).setMinValue(1).setMaxValue(100)); },
  execute: async (interaction) => {
    const percent = interaction.options.getInteger("percent", true);
    await prisma.guild.upsert({
      where: { discordId: interaction.guildId! },
      update: { voteSkipRatio: percent / 100 },
      create: { discordId: interaction.guildId!, voteSkipRatio: percent / 100 },
    });
    await interaction.reply({ embeds: [statusEmbed(`VOTE-SKIP RATIO · ${percent}%`, "")] });
  },
};
