import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { errorEmbed, queueEmbed } from "../../ui/embeds";

export const view: MusicCommand = {
  meta: {
    id: "queue.view",
    category: "queue",
    description: "Open the paginated NOIR MUSIC Glyph queue display with compact track telemetry.",
    changesPlaybackState: false,
    requiresDb: false,
    requiresProvider: false,
  },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player?.queue.tracks.length) {
      await interaction.reply({ embeds: [errorEmbed("Queue is empty", "Use /play to add something to the playback pipeline.", "QUEUE_002")], ephemeral: true });
      return;
    }
    const tracks = player.queue.tracks.map((t: any) => ({ title: t.info?.title, artist: t.info?.author, duration: t.info?.duration }));
    await interaction.reply({ embeds: [queueEmbed("QUEUE / UPCOMING", tracks, 1, 10, tracks.length)] });
  },
};
