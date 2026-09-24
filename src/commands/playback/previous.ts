import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { PlaybackService } from "../../audio/playbackService";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const previous: MusicCommand = {
  meta: {
    id: "previous",
    category: "playback",
    description: "Play the previous track.",
    changesPlaybackState: true,
    requiresDb: false,
    requiresProvider: false,
  },
  build: () => {},
  execute: async (interaction) => {
    const session = GuildSession.for(interaction.guildId!);
    const player = session.player
    const prev = player?.queue.previous?.[0];
    if (!player || !prev) {
      await interaction.reply({ embeds: [errorEmbed("No previous track", "There's nothing before this in the queue history.", "PLAYER_004")], ephemeral: true });
      return;
    }
    await session.addToQueue(player, prev);
    const addedIndex = player.queue.tracks.length - 1;
    const [addedTrack] = player.queue.tracks.splice(addedIndex, 1);
    player.queue.tracks.unshift(addedTrack);
    player.setData("monoSkipped", true);
    await PlaybackService.skip(interaction.guildId!);
    await interaction.reply({ embeds: [statusEmbed(`PLAYING PREVIOUS · ${prev.info.title}`, "")] });
  },
};
