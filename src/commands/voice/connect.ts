import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { requireVoiceChannel } from "../../utils/voice";
import { statusEmbed } from "../../ui/embeds";

export const connect: MusicCommand = {
  meta: { id: "voice.connect", category: "voice", description: "Explicitly (re)connect to your voice channel.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const voiceChannelId = await requireVoiceChannel(interaction);
    if (!voiceChannelId) return;
    const session = GuildSession.for(interaction.guildId!);
    await session.destroy().catch(() => {});
    await session.ensurePlayer(voiceChannelId, interaction.channelId);
    await interaction.reply({ embeds: [statusEmbed("RECONNECTED", "")] });
  },
};
