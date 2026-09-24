import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { registerTimer } from "../../audio/timers";
import { statusEmbed } from "../../ui/embeds";

export const autodisconnecttimer: MusicCommand = {
  meta: { id: "auto_disconnect_timer", category: "automation", description: "Disconnect the bot after N minutes of the queue being empty.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addIntegerOption((o) => o.setName("minutes").setDescription("Idle minutes before disconnect").setRequired(true).setMinValue(1)); },
  execute: async (interaction) => {
    const minutes = interaction.options.getInteger("minutes", true);
    registerTimer(interaction.guildId!, "auto-disconnect", minutes * 60 * 1000, async () => {
      const session = GuildSession.for(interaction.guildId!);
      if (!session.hasActivePlayback()) await session.destroy();
    });
    await interaction.reply({ embeds: [statusEmbed(`AUTO-DISCONNECT · after ${minutes}m idle`, "")] });
  },
};
