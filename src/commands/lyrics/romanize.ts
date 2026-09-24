import { MusicCommand } from "../../types/command";
import { statusEmbed } from "../../ui/embeds";

export const romanize: MusicCommand = {
  meta: {
    id: "lyrics.romanize",
    category: "lyrics",
    description: "Romanize non-Latin-script lyrics. (No romanization provider is wired up yet.)",
    changesPlaybackState: false,
    requiresDb: false,
    requiresProvider: false,
  },
  build: () => {},
  execute: async (interaction) => {
    await interaction.reply({ embeds: [statusEmbed("ROMANIZATION NOT YET CONFIGURED", "· no romanization library is integrated")], ephemeral: true });
  },
};
