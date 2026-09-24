import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { PlaybackService } from "../../audio/playbackService";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const pause: MusicCommand = {
  meta: {
    id: "pause",
    category: "playback",
    description: "Pause the current track.",
    changesPlaybackState: true,
    requiresDb: false,
    requiresProvider: false,
  },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player?.playing) {
      await interaction.reply({ embeds: [errorEmbed("Nothing playing", "There's no active track to pause.", "PLAYER_001")], ephemeral: true });
      return;
    }
    await PlaybackService.pause(interaction.guildId!);
    await interaction.reply({ embeds: [statusEmbed("PAUSED", "")] });
  },
};
