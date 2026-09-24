import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { PlaybackService } from "../../audio/playbackService";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const replay: MusicCommand = {
  meta: { id: "replay", category: "playback", description: "Restart the current track from the beginning.", changesPlaybackState: true, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player?.queue.current) {
      await interaction.reply({ embeds: [errorEmbed("Nothing playing", "Play something first.", "PLAYER_005")], ephemeral: true });
      return;
    }
    await PlaybackService.replay(interaction.guildId!);
    await interaction.reply({ embeds: [statusEmbed("REPLAYING", "")] });
  },
};
