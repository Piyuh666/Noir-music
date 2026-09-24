import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { fetchLyrics } from "../../providers/lyrics";
import { errorEmbed } from "../../ui/embeds";
import { AttachmentBuilder } from "discord.js";

export const export_: MusicCommand = {
  meta: { id: "lyrics.export", category: "lyrics", description: "Export the current track's lyrics as a text file.", changesPlaybackState: false, requiresDb: false, requiresProvider: true },
  build: () => {},
  execute: async (interaction) => {
    const track = GuildSession.for(interaction.guildId!).player?.queue.current;
    if (!track) {
      await interaction.reply({ embeds: [errorEmbed("Nothing playing", "Play something first.", "LYR_001")], ephemeral: true });
      return;
    }
    await interaction.deferReply();
    const result = await fetchLyrics(track.info.title, track.info.author);
    const text = result?.plainLyrics ?? result?.syncedLyrics ?? "";
    if (!text) {
      await interaction.editReply({ embeds: [errorEmbed("No lyrics", "No lyrics found for this track.", "LYR_002")] });
      return;
    }
    const file = new AttachmentBuilder(Buffer.from(text, "utf-8"), { name: `${track.info.title}.txt` });
    await interaction.editReply({ files: [file] });
  },
};
