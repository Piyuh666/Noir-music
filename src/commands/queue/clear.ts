import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { statusEmbed } from "../../ui/embeds";

export const clear: MusicCommand = {
  meta: {
    id: "queue.clear",
    category: "queue",
    description: "Clear all upcoming tracks (current track keeps playing).",
    changesPlaybackState: true,
    requiresDb: false,
    requiresProvider: false,
  },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    player?.queue.tracks.splice(0);
    await interaction.reply({ embeds: [statusEmbed("QUEUE CLEARED", "")] });
  },
};
