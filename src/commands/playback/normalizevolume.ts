import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { statusEmbed } from "../../ui/embeds";

export const normalizevolume: MusicCommand = {
  meta: { id: "normalize_volume", category: "playback", description: "Toggle automatic loudness normalization across tracks.", changesPlaybackState: true, requiresDb: false, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addBooleanOption((o) => o.setName("enabled").setDescription("On or off").setRequired(true)); },
  execute: async (interaction) => {
    const enabled = interaction.options.getBoolean("enabled", true);
    GuildSession.for(interaction.guildId!).player?.setData("normalizeVolume", enabled);
    await interaction.reply({ embeds: [statusEmbed(`VOLUME NORMALIZATION ${enabled ? "ON" : "OFF"}`, "")] });
  },
};
