import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { PlaylistService } from "../../services/playlistService";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const save: MusicCommand = {
  meta: { id: "queue.save", category: "queue", description: "Save the current queue as a new playlist.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("name").setDescription("New playlist name").setRequired(true)); },
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player?.queue.tracks.length) {
      await interaction.reply({ embeds: [errorEmbed("Queue is empty", "Nothing to save.", "QUEUE_005")], ephemeral: true });
      return;
    }
    const name = interaction.options.getString("name", true);
    const playlist = await PlaylistService.create(interaction.user.id, name);
    for (const t of player.queue.tracks) {
      await PlaylistService.addTrack(playlist.id, { uri: t.info.uri ?? t.info.identifier, title: t.info.title, artist: t.info.author, durationMs: t.info.duration ?? 0, addedById: interaction.user.id });
    }
    await interaction.reply({ embeds: [statusEmbed(`QUEUE SAVED AS · ${name}`, "")] });
  },
};
