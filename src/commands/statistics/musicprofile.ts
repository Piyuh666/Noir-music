import { monoEmbed } from "../../ui/embeds";
import { MusicCommand } from "../../types/command";
import { StatsService } from "../../services/statsService";

export const musicprofile: MusicCommand = {
  meta: { id: "music_profile", category: "statistics", description: "Show a combined profile card: top track, top artist, streak, total time.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const [totalMs, topTracks, topArtists, streak] = await Promise.all([
      StatsService.totalListeningMs(interaction.user.id),
      StatsService.topTracksForUser(interaction.user.id, 1),
      StatsService.topArtistsForUser(interaction.user.id, 1),
      StatsService.listeningStreak(interaction.user.id),
    ]);
    const embed = monoEmbed()
      .setColor(0x0a0a0a)
      .setTitle("MUSIC PROFILE")
      .setDescription(
        [
          `Total listening: ${Math.floor(totalMs / 3600000)}h`,
          `Top track: ${topTracks[0]?.title ?? "n/a"}`,
          `Top artist: ${topArtists[0]?.artist ?? "n/a"}`,
          `Streak: ${streak} day${streak === 1 ? "" : "s"}`,
        ].join("\n")
      );
    await interaction.reply({ embeds: [embed] });
  },
};
