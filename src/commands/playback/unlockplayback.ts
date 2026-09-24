import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { statusEmbed, errorEmbed } from "../../ui/embeds";

export const unlockplayback: MusicCommand = {
  meta: { id: "unlock_playback", category: "playback", description: "Unlock playback controls for everyone.", djOnly: true, changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player) {
      await interaction.reply({ embeds: [errorEmbed("No active player", "Start playback first.", "PLAYER_001")], ephemeral: true });
      return;
    }
    player.setData("playbackLocked", false);
    await interaction.reply({ embeds: [statusEmbed("PLAYBACK UNLOCKED", "")] });
  },
};
