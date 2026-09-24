import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { fetchLyrics } from "../../providers/lyrics";
import { monoEmbed, errorEmbed } from "../../ui/embeds";

export const unsynced: MusicCommand = {
  meta: { id: "lyrics.unsynced", category: "lyrics", description: "Show plain (unsynced) lyrics.", changesPlaybackState: false, requiresDb: false, requiresProvider: true },
  build: () => {},
  execute: async (interaction) => {
    const track = GuildSession.for(interaction.guildId!).player?.queue.current;
    if (!track) {
      await interaction.reply({ embeds: [errorEmbed("Nothing playing", "Play something first.", "LYR_001")], ephemeral: true });
      return;
    }
    await interaction.deferReply();
    const result = await fetchLyrics(track.info.title, track.info.author);
    if (!result?.plainLyrics) {
      await interaction.editReply({ embeds: [errorEmbed("No lyrics", "No plain lyrics found for this track.", "LYR_002")] });
      return;
    }
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle(track.info.title).setDescription(result.plainLyrics.slice(0, 3800));
    await interaction.editReply({ embeds: [embed] });
  },
};
