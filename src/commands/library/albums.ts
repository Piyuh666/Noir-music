import { MusicCommand } from "../../types/command";
import { statusEmbed } from "../../ui/embeds";

export const albums: MusicCommand = {
  meta: { id: "library.albums", category: "library", description: "Show unique albums in your library. (Album metadata isn't captured yet.)", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    await interaction.reply({ embeds: [statusEmbed("ALBUM DATA NOT YET TRACKED", "")], ephemeral: true });
  },
};
