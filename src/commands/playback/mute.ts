import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { PlaybackService } from "../../audio/playbackService";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const mute: MusicCommand = {
  meta: {
    id: "mute",
    category: "playback",
    description: "Mute playback (keeps position, sets volume to 0).",
    changesPlaybackState: true,
    requiresDb: false,
    requiresProvider: false,
  },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player) {
      await interaction.reply({ embeds: [errorEmbed("No active player", "Play something first.", "PLAYER_011")], ephemeral: true });
      return;
    }
    player.setData("volumeBeforeMute", player.volume);
    await PlaybackService.setVolume(interaction.guildId!, 0);
    await interaction.reply({ embeds: [statusEmbed("MUTED", "")] });
  },
};
