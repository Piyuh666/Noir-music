import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";
import { statusEmbed } from "../../ui/embeds";

export const sessionlength: MusicCommand = {
  meta: {
    id: "stats.session_length",
    category: "statistics",
    description: "Estimate your average listening session length (heuristic: gaps under 30 minutes between plays count as one session).",
    changesPlaybackState: false,
    requiresDb: true,
    requiresProvider: false,
  },
  build: () => {},
  execute: async (interaction) => {
    const user = await prisma.user.findUnique({ where: { discordId: interaction.user.id } });
    if (!user) {
      await interaction.reply({ embeds: [statusEmbed("NO DATA YET", "")], ephemeral: true });
      return;
    }
    const rows = await prisma.playHistory.findMany({ where: { userId: user.id }, orderBy: { playedAt: "asc" } });
    if (rows.length < 2) {
      await interaction.reply({ embeds: [statusEmbed("NOT ENOUGH DATA YET", "")], ephemeral: true });
      return;
    }
    const GAP_MS = 30 * 60 * 1000;
    const sessions: number[] = [];
    let sessionStart = rows[0].playedAt.getTime();
    let last = sessionStart;
    for (const row of rows.slice(1)) {
      const t = row.playedAt.getTime();
      if (t - last > GAP_MS) {
        sessions.push(last - sessionStart);
        sessionStart = t;
      }
      last = t;
    }
    sessions.push(last - sessionStart);
    const avgMs = sessions.reduce((s, v) => s + v, 0) / sessions.length;
    await interaction.reply({ embeds: [statusEmbed(`AVG SESSION · ${Math.round(avgMs / 60000)}m (heuristic)`, "")] });
  },
};
