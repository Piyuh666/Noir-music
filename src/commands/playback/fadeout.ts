import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { PlaybackService } from "../../audio/playbackService";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const fadeout: MusicCommand = {
  meta: { id: "fade_out", category: "playback", description: "Gradually lower volume to 0 over N seconds, then pause.", changesPlaybackState: true, requiresDb: false, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addIntegerOption((o) => o.setName("seconds").setDescription("Fade duration").setRequired(true).setMinValue(1).setMaxValue(60)); },
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player) {
      await interaction.reply({ embeds: [errorEmbed("No active player", "Play something first.", "PLAYER_006")], ephemeral: true });
      return;
    }
    const seconds = interaction.options.getInteger("seconds", true);
    const start = player.volume;
    const steps = seconds;
    for (let i = 1; i <= steps; i++) {
      setTimeout(async () => {
        await void PlaybackService.setVolume(interaction.guildId!, Math.round(start * (1 - i / steps)));
        if (i === steps) { await PlaybackService.pause(interaction.guildId!); await void PlaybackService.setVolume(interaction.guildId!, start); }
      }, i * 1000);
    }
    await interaction.reply({ embeds: [statusEmbed(`FADING OUT OVER ${seconds}s`, "")] });
  },
};
