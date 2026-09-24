import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { statusEmbed } from "../../ui/embeds";

export const gapless: MusicCommand = {
  meta: { id: "gapless", category: "playback", description: "Toggle gapless playback between queued tracks.", changesPlaybackState: true, requiresDb: false, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addBooleanOption((o) => o.setName("enabled").setDescription("On or off").setRequired(true)); },
  execute: async (interaction) => {
    const enabled = interaction.options.getBoolean("enabled", true);
    GuildSession.for(interaction.guildId!).player?.setData("gapless", enabled);
    await interaction.reply({ embeds: [statusEmbed(`GAPLESS ${enabled ? "ON" : "OFF"}`, "")] });
  },
};
