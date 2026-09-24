import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { fetchLyrics } from "../../providers/lyrics";
import { monoEmbed, errorEmbed } from "../../ui/embeds";

export const search: MusicCommand = {
  meta: { id: "lyrics.search", category: "lyrics", description: "Search lyrics for any song by title and artist.", changesPlaybackState: false, requiresDb: false, requiresProvider: true },
  build: (b) => {
    (b as SlashCommandBuilder)
      .addStringOption((o) => o.setName("title").setDescription("Song title").setRequired(true))
      .addStringOption((o) => o.setName("artist").setDescription("Artist").setRequired(true));
  },
  execute: async (interaction) => {
    await interaction.deferReply();
    const title = interaction.options.getString("title", true);
    const artist = interaction.options.getString("artist", true);
    const result = await fetchLyrics(title, artist);
    if (!result || (!result.plainLyrics && !result.syncedLyrics)) {
      await interaction.editReply({ embeds: [errorEmbed("Lyrics unavailable", "No lyrics found for that title/artist.", "LYR_002")] });
      return;
    }
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle(`${result.title} — ${result.artist}`).setDescription((result.plainLyrics ?? "Synced-only").slice(0, 3800));
    await interaction.editReply({ embeds: [embed] });
  },
};
