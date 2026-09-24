import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { setAlways247 } from "../../services/always247Service";
import { statusEmbed } from "../../ui/embeds";

export const always247: MusicCommand = {
  meta: { id: "music_settings.always247", category: "settings", description: "Set the server 24/7 voice policy explicitly.", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addBooleanOption((o) => o.setName("enabled").setDescription("On or off").setRequired(true)); },
  execute: async (interaction) => {
    const enabled = interaction.options.getBoolean("enabled", true);
    const result = await setAlways247(interaction.guildId!, enabled ? "on" : "off");
    await interaction.reply({ embeds: [statusEmbed(`ALWAYS247 // ${result.enabled ? "ONLINE" : "OFFLINE"}`, result.playerSynchronized ? "DATABASE + PLAYER SYNCHRONIZED" : "DATABASE SYNCHRONIZED · PLAYER READY ON JOIN")] });
  },
};
