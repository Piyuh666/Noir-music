import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { PlaybackService } from "../../audio/playbackService";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const shuffle: MusicCommand = {
  meta: {
    id: "shuffle",
    category: "playback",
    description: "Shuffle the upcoming queue.",
    changesPlaybackState: true,
    requiresDb: false,
    requiresProvider: false,
  },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player?.queue.tracks.length) {
      await interaction.reply({ embeds: [errorEmbed("Queue too short", "Add more tracks before shuffling.", "QUEUE_001")], ephemeral: true });
      return;
    }
    await PlaybackService.shuffle(interaction.guildId!);
    await interaction.reply({ embeds: [statusEmbed("SHUFFLED", "")] });
  },
};
