import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { PlaybackService } from "../../audio/playbackService";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const unmute: MusicCommand = {
  meta: {
    id: "unmute",
    category: "playback",
    description: "Restore volume after /mute.",
    changesPlaybackState: true,
    requiresDb: false,
    requiresProvider: false,
  },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player) {
      await interaction.reply({ embeds: [errorEmbed("No active player", "Play something first.", "PLAYER_012")], ephemeral: true });
      return;
    }
    const restored = (player.getData("volumeBeforeMute") as number) ?? 70;
    await PlaybackService.setVolume(interaction.guildId!, restored);
    await interaction.reply({ embeds: [statusEmbed(`VOL ${restored}%`, "")] });
  },
};
