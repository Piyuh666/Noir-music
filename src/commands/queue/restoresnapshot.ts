import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { statusEmbed, errorEmbed } from "../../ui/embeds";

export const restoresnapshot: MusicCommand = {
  meta: { id: "queue.restore_snapshot", category: "queue", description: "Restore the queue to its last saved snapshot.", changesPlaybackState: true, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    const snapshot = player?.getData("queueSnapshot") as any[] | undefined;
    if (!player || !snapshot) {
      await interaction.reply({ embeds: [errorEmbed("No snapshot", "Save one first with /queue-more snapshot.", "QUEUE_007")], ephemeral: true });
      return;
    }
    player.queue.tracks = [...snapshot];
    await interaction.reply({ embeds: [statusEmbed("QUEUE RESTORED FROM SNAPSHOT", "")] });
  },
};
