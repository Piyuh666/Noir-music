import { monoEmbed } from "../../ui/embeds";
import { MusicCommand } from "../../types/command";
import { StatsService } from "../../services/statsService";

export const me: MusicCommand = {
  meta: { id: "stats.me", category: "statistics", description: "Show your personal listening stats.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const totalMs = await StatsService.totalListeningMs(interaction.user.id);
    const top = await StatsService.topTracksForUser(interaction.user.id, 1);
    const hrs = Math.floor(totalMs / 3600000);
    const embed = monoEmbed()
      .setColor(0x0a0a0a)
      .setTitle("YOUR STATS")
      .setDescription(`Total listening: ${hrs}h\nTop track: ${top[0]?.title ?? "n/a"}`);
    await interaction.reply({ embeds: [embed] });
  },
};
