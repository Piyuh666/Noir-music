import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { registerTimer, runGuildTimerAction } from "../../audio/timers";
import { statusEmbed } from "../../ui/embeds";

/**
 * Distinct from /radio duration: this is a general automation timer that
 * stops whatever is playing after N minutes regardless of whether it was
 * started via /radio — useful for capping a plain /play session too.
 */
export const radioduration: MusicCommand = {
  meta: { id: "automation.radio_duration", category: "automation", description: "Stop playback after N minutes, regardless of how it was started.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addIntegerOption((o) => o.setName("minutes").setDescription("Minutes until stop").setRequired(true).setMinValue(1)); },
  execute: async (interaction) => {
    const minutes = interaction.options.getInteger("minutes", true);
    registerTimer(interaction.guildId!, "radio-duration", minutes * 60 * 1000, async () => {
      await runGuildTimerAction(interaction.guildId!, async () => {
        const player = GuildSession.for(interaction.guildId!).player;
        if (player) {
          player.setData("radioStation", undefined);
          player.setData("radioQuery", undefined);
          player.setData("autoplay", false);
          await player.stopPlaying(true, false);
        }
      });
    });
    await interaction.reply({ embeds: [statusEmbed(`AUTO-STOP · in ${minutes}m`, "")] });
  },
};
