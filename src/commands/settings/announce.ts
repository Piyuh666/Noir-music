import { SlashCommandBuilder, ChannelType } from "discord.js";
import { MusicCommand } from "../../types/command";
import { statusEmbed } from "../../ui/embeds";

export const announce: MusicCommand = {
  meta: { id: "music_settings.announce", category: "settings", description: "Set the channel used for track-change announcements.", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addChannelOption((o) => o.setName("channel").setDescription("Announcement channel").addChannelTypes(ChannelType.GuildText).setRequired(true)); },
  execute: async (interaction) => {
    const channel = interaction.options.getChannel("channel", true);
    const { prisma } = await import("../../database/prisma");
    await prisma.guild.upsert({ where: { discordId: interaction.guildId! }, update: { announceChannelId: channel.id }, create: { discordId: interaction.guildId!, announceChannelId: channel.id } });
    await interaction.reply({ embeds: [statusEmbed(`ANNOUNCE CHANNEL · ${channel.name}`, "")] });
  },
};
