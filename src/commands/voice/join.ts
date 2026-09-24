import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { requireVoiceChannel } from "../../utils/voice";
import { statusEmbed } from "../../ui/embeds";

export const join: MusicCommand = {
  meta: { id: "join", category: "voice", description: "Join your current voice channel.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const voiceChannelId = await requireVoiceChannel(interaction);
    if (!voiceChannelId) return;
    await GuildSession.for(interaction.guildId!).ensurePlayer(voiceChannelId, interaction.channelId);
    await interaction.reply({ embeds: [statusEmbed("CONNECTED", "")] });
  },
};
