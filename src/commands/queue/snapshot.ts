import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { statusEmbed, errorEmbed } from "../../ui/embeds";

export const snapshot: MusicCommand = {
  meta: { id: "queue.snapshot", category: "queue", description: "Save an in-memory snapshot of the current queue order.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player?.queue.tracks.length) {
      await interaction.reply({ embeds: [errorEmbed("Queue is empty", "Nothing to snapshot.", "QUEUE_005")], ephemeral: true });
      return;
    }
    player.setData("queueSnapshot", [...player.queue.tracks]);
    await interaction.reply({ embeds: [statusEmbed("QUEUE SNAPSHOT SAVED", "")] });
  },
};
