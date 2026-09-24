import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { PlaybackService } from "../../audio/playbackService";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const resume: MusicCommand = {
  meta: {
    id: "resume",
    category: "playback",
    description: "Resume the paused track.",
    changesPlaybackState: true,
    requiresDb: false,
    requiresProvider: false,
  },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player?.paused) {
      await interaction.reply({ embeds: [errorEmbed("Not paused", "There's nothing paused to resume.", "PLAYER_002")], ephemeral: true });
      return;
    }
    await PlaybackService.resume(interaction.guildId!);
    await interaction.reply({ embeds: [statusEmbed("PLAYING", "")] });
  },
};
