import { monoEmbed } from "../../ui/embeds";
import { MusicCommand } from "../../types/command";
import { StatsService } from "../../services/statsService";

export const server: MusicCommand = {
  meta: { id: "stats.server", category: "statistics", description: "Show this server's listening stats.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const { trackCount, totalMs, uniqueListeners } = await StatsService.serverStats(interaction.guildId!);
    const hrs = Math.floor(totalMs / 3600000);
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle("SERVER STATS").setDescription(`${trackCount} plays\n${hrs}h total listening\n${uniqueListeners} unique listeners`);
    await interaction.reply({ embeds: [embed] });
  },
};
