import { MusicCommand } from "../../types/command";
import { statusEmbed } from "../../ui/embeds";

export const topgenres: MusicCommand = {
  meta: { id: "top_genres_personal", category: "statistics", description: "Show your most-played genres. (Genre metadata isn't captured yet — Lavalink tracks don't reliably return it.)", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    await interaction.reply({ embeds: [statusEmbed("GENRE STATS NOT YET TRACKED", "")], ephemeral: true });
  },
};
