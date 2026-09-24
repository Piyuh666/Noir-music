import { monoEmbed } from "../../ui/embeds";
import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";

export const track: MusicCommand = {
  meta: { id: "stats.track", category: "statistics", description: "Show play stats for a specific track title.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("title").setDescription("Track title").setRequired(true)); },
  execute: async (interaction) => {
    const title = interaction.options.getString("title", true);
    const rows = await prisma.playHistory.findMany({ where: { title: { contains: title, mode: "insensitive" } } });
    const totalMs = rows.reduce((s, r) => s + r.msPlayed, 0);
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle(`TRACK STATS · ${title}`).setDescription(`${rows.length} plays\n${Math.floor(totalMs / 60000)}m total`);
    await interaction.reply({ embeds: [embed] });
  },
};
