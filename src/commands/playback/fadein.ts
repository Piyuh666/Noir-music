import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { PlaybackService } from "../../audio/playbackService";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const fadein: MusicCommand = {
  meta: { id: "fade_in", category: "playback", description: "Gradually raise volume from 0 to its current level over N seconds.", changesPlaybackState: true, requiresDb: false, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addIntegerOption((o) => o.setName("seconds").setDescription("Fade duration").setRequired(true).setMinValue(1).setMaxValue(60)); },
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player) {
      await interaction.reply({ embeds: [errorEmbed("No active player", "Play something first.", "PLAYER_006")], ephemeral: true });
      return;
    }
    const seconds = interaction.options.getInteger("seconds", true);
    const target = player.volume;
    await PlaybackService.setVolume(interaction.guildId!, 0);
    const steps = seconds;
    for (let i = 1; i <= steps; i++) {
      setTimeout(() => void PlaybackService.setVolume(interaction.guildId!, Math.round((target * i) / steps)), i * 1000);
    }
    await interaction.reply({ embeds: [statusEmbed(`FADING IN OVER ${seconds}s`, "")] });
  },
};
