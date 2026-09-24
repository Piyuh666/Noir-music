import { SlashCommandBuilder, ChannelType } from "discord.js";
import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";
import { statusEmbed } from "../../ui/embeds";

export const playerchannel: MusicCommand = {
  meta: { id: "music_settings.player_channel", category: "settings", description: "Alias of /music-settings default-channel — the channel the persistent player lives in.", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addChannelOption((o) => o.setName("channel").setDescription("Text channel").addChannelTypes(ChannelType.GuildText).setRequired(true)); },
  execute: async (interaction) => {
    const channel = interaction.options.getChannel("channel", true);
    await prisma.guild.upsert({
      where: { discordId: interaction.guildId! },
      update: { defaultChannelId: channel.id },
      create: { discordId: interaction.guildId!, defaultChannelId: channel.id },
    });
    await interaction.reply({ embeds: [statusEmbed(`PLAYER CHANNEL · ${channel.name}`, "")] });
  },
};
