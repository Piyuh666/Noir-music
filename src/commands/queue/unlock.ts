import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { statusEmbed, errorEmbed } from "../../ui/embeds";

export const unlock: MusicCommand = {
  meta: { id: "queue.unlock", category: "queue", description: "Unlock the queue for everyone.", djOnly: true, changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player) {
      await interaction.reply({ embeds: [errorEmbed("No active player", "Start playback first.", "PLAYER_001")], ephemeral: true });
      return;
    }
    player.setData("queueLocked", false);
    await interaction.reply({ embeds: [statusEmbed("QUEUE UNLOCKED", "")] });
  },
};
