import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const reverse: MusicCommand = {
  meta: {
    id: "queue.reverse",
    category: "queue",
    description: "Reverse the order of the upcoming queue.",
    changesPlaybackState: true,
    requiresDb: false,
    requiresProvider: false,
  },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player?.queue.tracks.length) {
      await interaction.reply({ embeds: [errorEmbed("Queue is empty", "Nothing to reverse.", "QUEUE_005")], ephemeral: true });
      return;
    }
    player.queue.tracks.reverse();
    await interaction.reply({ embeds: [statusEmbed("QUEUE REVERSED", "")] });
  },
};
