import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { requireVoiceChannel } from "../../utils/voice";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const custom: MusicCommand = {
  meta: { id: "radio.custom", category: "radio", description: "Start a radio mix from a free-text theme.", changesPlaybackState: true, requiresDb: false, requiresProvider: true },
  build: (b) => { (b as SlashCommandBuilder).addStringOption((o) => o.setName("theme").setDescription("Describe the vibe").setRequired(true)); },
  execute: async (interaction) => {
    const voiceChannelId = await requireVoiceChannel(interaction);
    if (!voiceChannelId) return;
    await interaction.deferReply();
    const theme = interaction.options.getString("theme", true);
    const session = GuildSession.for(interaction.guildId!);
    const player = await session.ensurePlayer(voiceChannelId, interaction.channelId);
    const result = await session.search(player, `${theme} mix`, interaction.user);
    if (!result?.tracks?.length) {
      await interaction.editReply({ embeds: [errorEmbed("No results", "Try describing it differently.", "RADIO_003")] });
      return;
    }
    await session.addManyToQueue(player, result.tracks.slice(0, 10));
    player.setData("radioQuery", `${theme} mix`);
    player.setData("autoplay", true);
    if (!player.playing && !player.paused) await player.play();
    await interaction.editReply({ embeds: [statusEmbed(`RADIO · ${theme}`, "")] });
  },
};
