import { MusicCommand } from "../../types/command";
import { StatsService } from "../../services/statsService";
import { statusEmbed } from "../../ui/embeds";

export const listeningtime: MusicCommand = {
  meta: { id: "listening_time", category: "statistics", description: "Show your total listening time.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const ms = await StatsService.totalListeningMs(interaction.user.id);
    await interaction.reply({ embeds: [statusEmbed(`LISTENING TIME · ${Math.floor(ms / 3600000)}h`, "")] });
  },
};
