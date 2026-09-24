import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { statusEmbed } from "../../ui/embeds";

export const dedupe: MusicCommand = {
  meta: { id: "queue.dedupe", category: "queue", description: "Remove duplicate tracks from the queue.", changesPlaybackState: true, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    if (player) {
      const seen = new Set<string>();
      player.queue.tracks = player.queue.tracks.filter((t) => {
        const key = t.info.uri ?? t.info.identifier;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    await interaction.reply({ embeds: [statusEmbed("DUPLICATES REMOVED", "")] });
  },
};
