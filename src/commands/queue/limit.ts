import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { statusEmbed } from "../../ui/embeds";

export const limit: MusicCommand = {
  meta: { id: "queue.limit", category: "queue", description: "Cap how many tracks the queue can hold.", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addIntegerOption((o) => o.setName("max").setDescription("Max queue size").setRequired(true).setMinValue(1).setMaxValue(1000)); },
  execute: async (interaction) => {
    const max = interaction.options.getInteger("max", true);
    const { prisma } = await import("../../database/prisma");
    await prisma.guild.upsert({ where: { discordId: interaction.guildId! }, update: { maxQueueSize: max }, create: { discordId: interaction.guildId!, maxQueueSize: max } });
    GuildSession.for(interaction.guildId!).player?.setData("maxQueueSize", max);
    await interaction.reply({ embeds: [statusEmbed(`QUEUE LIMIT · ${max}`, "")] });
  },
};
