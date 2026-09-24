import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { PlaybackService } from "../../audio/playbackService";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const skip: MusicCommand = {
  meta: {
    id: "skip",
    category: "playback",
    description: "Skip the current track.",
    changesPlaybackState: true,
    requiresDb: false,
    requiresProvider: false,
  },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player?.playing) {
      await interaction.reply({ embeds: [errorEmbed("Nothing to skip", "No track is currently playing.", "PLAYER_003")], ephemeral: true });
      return;
    }
    const skipped = player.queue.current?.info.title ?? "track";
    player.setData("monoSkipped", true);
    await PlaybackService.skip(interaction.guildId!);
    await interaction.reply({ embeds: [statusEmbed(`SKIPPED · ${skipped}`, "")] });
  },
};
