import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { fetchLyrics } from "../../providers/lyrics";
import { monoEmbed, errorEmbed } from "../../ui/embeds";

export const synced: MusicCommand = {
  meta: { id: "lyrics.synced", category: "lyrics", description: "Show synced (timestamped) lyrics if available. Never claims sync when it isn't.", changesPlaybackState: false, requiresDb: false, requiresProvider: true },
  build: () => {},
  execute: async (interaction) => {
    const track = GuildSession.for(interaction.guildId!).player?.queue.current;
    if (!track) {
      await interaction.reply({ embeds: [errorEmbed("Nothing playing", "Play something first.", "LYR_001")], ephemeral: true });
      return;
    }
    await interaction.deferReply();
    const result = await fetchLyrics(track.info.title, track.info.author);
    if (!result?.syncedLyrics) {
      await interaction.editReply({ embeds: [errorEmbed("No synced lyrics", "This track only has unsynced lyrics available (if any) — try /lyrics unsynced.", "LYR_003")] });
      return;
    }
    const stripped = result.syncedLyrics.replace(/^\[\d+:\d+(?:\.\d+)?\]/gm, "").slice(0, 3800);
    const embed = monoEmbed().setColor(0x0a0a0a).setTitle(`${track.info.title} · SYNCED`).setDescription(stripped);
    await interaction.editReply({ embeds: [embed] });
  },
};
