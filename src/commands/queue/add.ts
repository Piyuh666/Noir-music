import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { requireVoiceChannel } from "../../utils/voice";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const add: MusicCommand = {
  meta: {
    id: "queue.add",
    category: "queue",
    description: "Add a track to the queue without interrupting playback.",
    changesPlaybackState: true,
    requiresDb: false,
    requiresProvider: true,
  },
  build: (b) => {
    (b as SlashCommandBuilder).addStringOption((o) => o.setName("query").setDescription("Song or URL").setRequired(true));
  },
  execute: async (interaction) => {
    const voiceChannelId = await requireVoiceChannel(interaction);
    if (!voiceChannelId) return;
    await interaction.deferReply();
    const query = interaction.options.getString("query", true);
    const session = GuildSession.for(interaction.guildId!);
    const player = await session.ensurePlayer(voiceChannelId, interaction.channelId);
    const result = await session.search(player, query, interaction.user);
    if (!result?.tracks?.length) {
      await interaction.editReply({ embeds: [errorEmbed("No results", "Try a different query.", "SEARCH_204")] });
      return;
    }
    const added = await session.addToQueue(player, result.tracks[0]);
    if (!added) {
      await interaction.editReply({ embeds: [statusEmbed("DUPLICATE SKIPPED", "That track is already in the queue.")] });
      return;
    }
    await interaction.editReply({ embeds: [statusEmbed(`ADDED · ${result.tracks[0].info.title}`, "")] });
  },
};
