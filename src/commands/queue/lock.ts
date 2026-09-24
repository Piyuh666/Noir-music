import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { statusEmbed, errorEmbed } from "../../ui/embeds";

export const lock: MusicCommand = {
  meta: { id: "queue.lock", category: "queue", description: "Lock the queue so only DJs can modify it.", djOnly: true, changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player) {
      await interaction.reply({ embeds: [errorEmbed("No active player", "Start playback first.", "PLAYER_001")], ephemeral: true });
      return;
    }
    player.setData("queueLocked", true);
    await interaction.reply({ embeds: [statusEmbed("QUEUE LOCKED", "")] });
  },
};
