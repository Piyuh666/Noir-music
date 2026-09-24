import { MusicCommand } from "../../types/command";
import { statusEmbed } from "../../ui/embeds";

export const topalbums: MusicCommand = {
  meta: { id: "top_albums_personal", category: "statistics", description: "Show your most-played albums. (Album metadata isn't captured yet — see /stats album.)", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    await interaction.reply({ embeds: [statusEmbed("ALBUM STATS NOT YET TRACKED", "")], ephemeral: true });
  },
};
