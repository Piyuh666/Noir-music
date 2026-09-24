import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { fetchLyrics } from "../../providers/lyrics";
import { monoEmbed, errorEmbed } from "../../ui/embeds";

export const fullscreen: MusicCommand = {
  meta: { id: "lyrics.fullscreen", category: "lyrics", description: "Show full-length lyrics without truncation (may span multiple messages).", changesPlaybackState: false, requiresDb: false, requiresProvider: true },
  build: () => {},
  execute: async (interaction) => {
    const track = GuildSession.for(interaction.guildId!).player?.queue.current;
    if (!track) {
      await interaction.reply({ embeds: [errorEmbed("Nothing playing", "Play something first.", "LYR_001")], ephemeral: true });
      return;
    }
    await interaction.deferReply();
    const result = await fetchLyrics(track.info.title, track.info.author);
    const text = result?.plainLyrics ?? "";
    if (!text) {
      await interaction.editReply({ embeds: [errorEmbed("No lyrics", "No lyrics found for this track.", "LYR_002")] });
      return;
    }
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += 3800) chunks.push(text.slice(i, i + 3800));
    await interaction.editReply({ embeds: [monoEmbed().setColor(0x0a0a0a).setTitle(`${track.info.title} · FULLSCREEN (1/${chunks.length})`).setDescription(chunks[0])] });
    for (const chunk of chunks.slice(1)) {
      await interaction.followUp({ embeds: [monoEmbed().setColor(0x0a0a0a).setDescription(chunk)] });
    }
  },
};
