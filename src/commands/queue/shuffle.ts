import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const shuffle: MusicCommand = {
  meta: {
    id: "queue.shuffle",
    category: "queue",
    description: "Shuffle the upcoming queue.",
    changesPlaybackState: true,
    requiresDb: false,
    requiresProvider: false,
  },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player?.queue.tracks.length) {
      await interaction.reply({ embeds: [errorEmbed("Queue too short", "Add more tracks first.", "QUEUE_001")], ephemeral: true });
      return;
    }
    player.queue.shuffle();
    await interaction.reply({ embeds: [statusEmbed("SHUFFLED", "")] });
  },
};
