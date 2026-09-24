import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { requireVoiceChannel } from "../../utils/voice";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const song: MusicCommand = {
  meta: { id: "radio.song", category: "radio", description: "Start a continuous radio mix seeded on a song.", changesPlaybackState: true, requiresDb: false, requiresProvider: true },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("value").setDescription("song to seed the mix with").setRequired(true)); },
  execute: async (interaction) => {
    const voiceChannelId = await requireVoiceChannel(interaction);
    if (!voiceChannelId) return;
    await interaction.deferReply();
    const value = interaction.options.getString("value", true);
    const session = GuildSession.for(interaction.guildId!);
    const player = await session.ensurePlayer(voiceChannelId, interaction.channelId);
    const result = await session.search(player, `${value} song radio mix`, interaction.user);
    if (!result?.tracks?.length) {
      await interaction.editReply({ embeds: [errorEmbed("No results", "Try a different song.", "RADIO_003")] });
      return;
    }
    await session.addManyToQueue(player, result.tracks.slice(0, 10));
    player.setData("radioQuery", `${value} song radio mix`);
    player.setData("autoplay", true);
    if (!player.playing && !player.paused) await player.play();
    await interaction.editReply({ embeds: [statusEmbed(`RADIO · ${value}`, "")] });
  },
};
