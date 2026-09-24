import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { statusEmbed } from "../../ui/embeds";

export const explicitfilter: MusicCommand = {
  meta: { id: "music_settings.explicit_filter", category: "settings", description: "Toggle a search-query-level explicit content filter (appends 'clean' to searches — best-effort, not a guarantee).", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addBooleanOption((o) => o.setName("enabled").setDescription("On or off").setRequired(true)); },
  execute: async (interaction) => {
    const enabled = interaction.options.getBoolean("enabled", true);
    const { prisma } = await import("../../database/prisma");
    await prisma.guild.upsert({ where: { discordId: interaction.guildId! }, update: { explicitFilter: enabled }, create: { discordId: interaction.guildId!, explicitFilter: enabled } });
    await interaction.reply({ embeds: [statusEmbed(`EXPLICIT FILTER ${enabled ? "ON" : "OFF"}`, "· best-effort, query-level only")] });
  },
};
