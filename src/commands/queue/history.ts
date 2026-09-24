import { monoEmbed } from "../../ui/embeds";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";

export const history: MusicCommand = {
  meta: { id: "queue.history", category: "queue", description: "Show tracks that already played this session.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    const prev = player?.queue.previous ?? [];
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle("QUEUE HISTORY").setDescription(prev.slice(0, 15).map((t) => t.info.title).join("\n") || "No history this session.");
    await interaction.reply({ embeds: [embed] });
  },
};
