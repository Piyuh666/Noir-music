import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { PlaybackService } from "../../audio/playbackService";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const reload: MusicCommand = {
  meta: { id: "reload", category: "playback", description: "Re-resolve and restart the current track (fixes some stream errors).", changesPlaybackState: true, requiresDb: false, requiresProvider: true },
  build: () => {},
  execute: async (interaction) => {
    const session = GuildSession.for(interaction.guildId!);
    const player = session.player;
    const current = player?.queue.current;
    if (!player || !current) {
      await interaction.reply({ embeds: [errorEmbed("Nothing playing", "Play something first.", "PLAYER_005")], ephemeral: true });
      return;
    }
    await interaction.deferReply();
    const result = await session.search(player, `${current.info.title} ${current.info.author}`, interaction.user);
    const track = result?.tracks?.[0];
    if (track) {
      await session.addToQueue(player, track);
      const addedIndex = player.queue.tracks.length - 1;
      const [addedTrack] = player.queue.tracks.splice(addedIndex, 1);
      player.queue.tracks.unshift(addedTrack);
      await PlaybackService.skip(interaction.guildId!);
    }
    await interaction.editReply({ embeds: [statusEmbed("RELOADED", "")] });
  },
};
