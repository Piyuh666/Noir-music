import { monoEmbed } from "../../ui/embeds";
import { MusicCommand } from "../../types/command";

export const changelog: MusicCommand = {
  meta: { id: "help.changelog", category: "help", description: "Show the bot's recent changelog.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const embed = monoEmbed()
      .setColor(0x0a0a0a)
      .setTitle("CHANGELOG")
      .setDescription("v0.1.0 — Initial scaffold: playback, queue, voice, DJ, settings, help, discovery, playlists, radio, statistics, library, lyrics, effects, modes, automation.");
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
