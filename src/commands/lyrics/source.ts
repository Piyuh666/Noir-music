import { MusicCommand } from "../../types/command";
import { statusEmbed } from "../../ui/embeds";

export const source: MusicCommand = {
  meta: { id: "lyrics.source", category: "lyrics", description: "Show which lyrics provider is currently active.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    await interaction.reply({ embeds: [statusEmbed("LYRICS SOURCE · lrclib.net", "")], ephemeral: true });
  },
};
