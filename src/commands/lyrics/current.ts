import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { fetchLyrics } from "../../providers/lyrics";
import { monoEmbed, errorEmbed } from "../../ui/embeds";

export const current: MusicCommand = {
  meta: { id: "lyrics.current", category: "lyrics", description: "Fetch lyrics for the currently playing track.", changesPlaybackState: false, requiresDb: false, requiresProvider: true },
  build: () => {},
  execute: async (interaction) => {
    const track = GuildSession.for(interaction.guildId!).player?.queue.current;
    if (!track) {
      await interaction.reply({ embeds: [errorEmbed("Nothing playing", "Play something first.", "LYR_001")], ephemeral: true });
      return;
    }
    await interaction.deferReply();
    const result = await fetchLyrics(track.info.title, track.info.author);
    if (!result || (!result.plainLyrics && !result.syncedLyrics)) {
      await interaction.editReply({ embeds: [errorEmbed("Lyrics unavailable", "No lyrics found for this track.", "LYR_002")] });
      return;
    }
    const body = (result.plainLyrics ?? "Synced-only — use /lyrics synced").slice(0, 3800);
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle(`${track.info.title} — ${track.info.author}`).setDescription(body);
    await interaction.editReply({ embeds: [embed] });
  },
};
