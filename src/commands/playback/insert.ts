import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { requireVoiceChannel } from "../../utils/voice";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const insert: MusicCommand = {
  meta: { id: "insert", category: "playback", description: "Insert a track at a specific queue position.", changesPlaybackState: true, requiresDb: false, requiresProvider: true },
  build: (b) => {
    (b as SlashCommandBuilder)
      .addStringOption((o) => o.setName("query").setDescription("Song or URL").setRequired(true))
      .addIntegerOption((o) => o.setName("position").setDescription("1-based position").setRequired(true).setMinValue(1));
  },
  execute: async (interaction) => {
    const voiceChannelId = await requireVoiceChannel(interaction);
    if (!voiceChannelId) return;
    await interaction.deferReply();
    const query = interaction.options.getString("query", true);
    const position = interaction.options.getInteger("position", true);
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
    const targetIndex = Math.min(position - 1, player.queue.tracks.length - 1);
    const [inserted] = player.queue.tracks.splice(addedIndex, 1);
    player.queue.tracks.splice(targetIndex, 0, inserted);
    await interaction.editReply({ embeds: [statusEmbed(`INSERTED AT #${position} · ${track.info.title}`, "")] });
  },
};
