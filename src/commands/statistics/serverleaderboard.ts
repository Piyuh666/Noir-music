import { monoEmbed } from "../../ui/embeds";
import { MusicCommand } from "../../types/command";
import { StatsService } from "../../services/statsService";
import { prisma } from "../../database/prisma";

export const serverleaderboard: MusicCommand = {
  meta: { id: "stats.server_leaderboard", category: "statistics", description: "Show this server's top listeners (alias view of /stats leaderboard, kept separate for discoverability).", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const rows = await StatsService.guildLeaderboard(interaction.guildId!, 15);
    const lines = await Promise.all(rows.map(async (r, i) => {
      const user = await prisma.user.findUnique({ where: { id: r.userId } });
      return `${i + 1}. <@${user?.discordId ?? "unknown"}> — ${r._count.userId} plays`;
    }));
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle("SERVER LEADERBOARD").setDescription(lines.join("\n") || "No data yet.");
    await interaction.reply({ embeds: [embed] });
  },
};
