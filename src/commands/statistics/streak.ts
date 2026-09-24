import { MusicCommand } from "../../types/command";
import { StatsService } from "../../services/statsService";
import { statusEmbed } from "../../ui/embeds";

export const streak: MusicCommand = {
  meta: { id: "streak", category: "statistics", description: "Show your current daily listening streak.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const streak = await StatsService.listeningStreak(interaction.user.id);
    await interaction.reply({ embeds: [statusEmbed(`STREAK · ${streak} DAY${streak === 1 ? "" : "S"}`, "")] });
  },
};
