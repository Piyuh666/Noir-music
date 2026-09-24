import { monoEmbed } from "../../ui/embeds";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";

export const upcoming: MusicCommand = {
  meta: { id: "queue.upcoming", category: "queue", description: "Show just the next 5 tracks.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle("UP NEXT").setDescription((player?.queue.tracks ?? []).slice(0, 5).map((t, i) => `${i + 1}. ${t.info.title}`).join("\n") || "Queue is empty.");
    await interaction.reply({ embeds: [embed] });
  },
};
