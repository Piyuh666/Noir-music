import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const random: MusicCommand = {
  meta: { id: "queue.random", category: "queue", description: "Jump to a random track in the queue.", changesPlaybackState: true, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player?.queue.tracks.length) {
      await interaction.reply({ embeds: [errorEmbed("Queue is empty", "Nothing to jump to.", "QUEUE_005")], ephemeral: true });
      return;
    }
    const idx = Math.floor(Math.random() * player.queue.tracks.length);
    const [track] = player.queue.tracks.splice(idx, 1);
    player.queue.tracks.unshift(track);
    await player.skip();
    await interaction.reply({ embeds: [statusEmbed(`RANDOM · ${track.info.title}`, "")] });
  },
};
