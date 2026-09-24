import { monoEmbed } from "../../ui/embeds";
import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";

export const weeklyrecap: MusicCommand = {
  meta: { id: "stats.weekly_recap", category: "statistics", description: "Show your listening recap for the last 7 days.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const user = await prisma.user.findUnique({ where: { discordId: interaction.user.id } });
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = user ? await prisma.playHistory.findMany({ where: { userId: user.id, playedAt: { gte: since } } }) : [];
    const totalMs = rows.reduce((s, r) => s + r.msPlayed, 0);
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle("WEEKLY RECAP").setDescription(`${rows.length} plays\n${Math.floor(totalMs / 3600000)}h listened`);
    await interaction.reply({ embeds: [embed] });
  },
};
