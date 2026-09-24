import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { registerTimer, runGuildTimerAction } from "../../audio/timers";
import { statusEmbed } from "../../ui/embeds";

export const pauseat: MusicCommand = {
  meta: { id: "pause_at", category: "automation", description: "Pause playback after N minutes.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addIntegerOption((o) => o.setName("minutes").setDescription("Minutes from now").setRequired(true).setMinValue(1)); },
  execute: async (interaction) => {
    const minutes = interaction.options.getInteger("minutes", true);
    registerTimer(interaction.guildId!, "pause-at", minutes * 60 * 1000, async () => {
      await runGuildTimerAction(interaction.guildId!, async () => {
        const player = GuildSession.for(interaction.guildId!).player;
        if (player?.playing) await player.pause();
      });
    });
    await interaction.reply({ embeds: [statusEmbed(`PAUSE SCHEDULED · in ${minutes}m`, "")] });
  },
};
