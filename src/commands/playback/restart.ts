import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { PlaybackService } from "../../audio/playbackService";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const restart: MusicCommand = {
  meta: { id: "restart", category: "playback", description: "Restart the entire queue from the first track.", changesPlaybackState: true, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const session = GuildSession.for(interaction.guildId!);
    const player = session.player
    const history = player?.queue.previous ?? [];
    if (!player || !history.length) {
      await interaction.reply({ embeds: [errorEmbed("Nothing to restart", "No earlier queue history to restart from.", "PLAYER_013")], ephemeral: true });
      return;
    }
    const first = history[history.length - 1];
    await session.addToQueue(player, first);
    const addedIndex = player.queue.tracks.length - 1;
    const [addedTrack] = player.queue.tracks.splice(addedIndex, 1);
    player.queue.tracks.unshift(addedTrack);
    await PlaybackService.skip(interaction.guildId!);
    await interaction.reply({ embeds: [statusEmbed("QUEUE RESTARTED", "")] });
  },
};
