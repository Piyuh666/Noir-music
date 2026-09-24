import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { statusEmbed } from "../../ui/embeds";

export const crossfade: MusicCommand = {
  meta: { id: "crossfade", category: "playback", description: "Toggle crossfade between consecutive tracks.", changesPlaybackState: true, requiresDb: false, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addIntegerOption((o) => o.setName("seconds").setDescription("Crossfade length (0 to disable)").setRequired(true).setMinValue(0).setMaxValue(10)); },
  execute: async (interaction) => {
    const seconds = interaction.options.getInteger("seconds", true);
    GuildSession.for(interaction.guildId!).player?.setData("crossfadeSeconds", seconds);
    await interaction.reply({ embeds: [statusEmbed(seconds === 0 ? "CROSSFADE OFF" : `CROSSFADE · ${seconds}s`, "")] });
  },
};
