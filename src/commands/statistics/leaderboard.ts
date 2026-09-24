import { monoEmbed } from "../../ui/embeds";
import { MusicCommand } from "../../types/command";
import { StatsService } from "../../services/statsService";
import { prisma } from "../../database/prisma";

export const leaderboard: MusicCommand = {
  meta: { id: "stats.leaderboard", category: "statistics", description: "Show this server's top listeners by play count.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const rows = await StatsService.guildLeaderboard(interaction.guildId!);
    const lines = await Promise.all(
      rows.map(async (r, i) => {
        const user = await prisma.user.findUnique({ where: { id: r.userId } });
        return `${i + 1}. <@${user?.discordId ?? "unknown"}> — ${r._count.userId} plays`;
      })
    );
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle("LEADERBOARD").setDescription(lines.join("\n") || "No data yet.");
    await interaction.reply({ embeds: [embed] });
  },
};
