import { SlashCommandBuilder, ChannelType } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const move: MusicCommand = {
  meta: { id: "voice.move", category: "voice", description: "Move the bot to a different voice channel.", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: (b) => {
    (b as SlashCommandBuilder).addChannelOption((o) =>
      o.setName("channel").setDescription("Target voice channel").addChannelTypes(ChannelType.GuildVoice).setRequired(true)
    );
  },
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player) {
      await interaction.reply({ embeds: [errorEmbed("Not connected", "Use /join first.", "VOICE_002")], ephemeral: true });
      return;
    }
    const channel = interaction.options.getChannel("channel", true);
    await player.changeVoiceState({ voiceChannelId: channel.id });
    await interaction.reply({ embeds: [statusEmbed(`MOVED · ${channel.name}`, "")] });
  },
};
