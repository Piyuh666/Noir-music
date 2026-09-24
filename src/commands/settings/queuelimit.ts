import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { statusEmbed } from "../../ui/embeds";

export const queuelimit: MusicCommand = {
  meta: { id: "music_settings.queue_limit", category: "settings", description: "Set the maximum number of tracks allowed in the queue.", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addIntegerOption((o) => o.setName("max").setDescription("Max queue size").setRequired(true).setMinValue(10).setMaxValue(2000)); },
  execute: async (interaction) => {
    const max = interaction.options.getInteger("max", true);
    const { prisma } = await import("../../database/prisma");
    await prisma.guild.upsert({ where: { discordId: interaction.guildId! }, update: { maxQueueSize: max }, create: { discordId: interaction.guildId!, maxQueueSize: max } });
    await interaction.reply({ embeds: [statusEmbed(`QUEUE LIMIT · ${max}`, "")] });
  },
};
