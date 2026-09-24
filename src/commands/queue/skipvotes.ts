import { monoEmbed } from "../../ui/embeds";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";

export const skipvotes: MusicCommand = {
  meta: { id: "queue.skip_votes", category: "queue", description: "Show current vote-skip tally for the playing track.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    const votes = (player?.getData("voteSkipUsers") as string[]) ?? [];
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle("VOTE-SKIP").setDescription(`${votes.length} vote${votes.length === 1 ? "" : "s"} so far`);
    await interaction.reply({ embeds: [embed] });
  },
};
