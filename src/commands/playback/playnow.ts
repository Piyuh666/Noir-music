import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { PlaybackService } from "../../audio/playbackService";
import { requireVoiceChannel } from "../../utils/voice";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const playnow: MusicCommand = {
  meta: { id: "playnow", category: "playback", description: "Interrupt the current track and play a new one immediately.", changesPlaybackState: true, requiresDb: false, requiresProvider: true },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("query").setDescription("Song or URL").setRequired(true)); },
  execute: async (interaction) => {
    const voiceChannelId = await requireVoiceChannel(interaction);
    if (!voiceChannelId) return;
    await interaction.deferReply();
    const query = interaction.options.getString("query", true);
    const session = GuildSession.for(interaction.guildId!);
    const player = await session.ensurePlayer(voiceChannelId, interaction.channelId);
    const result = await session.search(player, query, interaction.user);
    const track = result?.tracks?.[0];
    if (!track) {
      await interaction.editReply({ embeds: [errorEmbed("No results", "Try a different search.", "SEARCH_204")] });
      return;
    }
    await session.addToQueue(player, track);
    const addedIndex = player.queue.tracks.length - 1;
    const [inserted] = player.queue.tracks.splice(addedIndex, 1);
    player.queue.tracks.unshift(inserted);
    await PlaybackService.skip(interaction.guildId!);
    await interaction.editReply({ embeds: [statusEmbed(`PLAYING NOW · ${track.info.title}`, "")] });
  },
};
