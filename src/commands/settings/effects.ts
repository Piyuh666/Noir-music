import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";
import { statusEmbed } from "../../ui/embeds";

export const effects: MusicCommand = {
  meta: { id: "music_settings.effects", category: "settings", description: "Enable or disable the effects system server-wide (same as /effect toggle).", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addBooleanOption((o) => o.setName("enabled").setDescription("On or off").setRequired(true)); },
  execute: async (interaction) => {
    const enabled = interaction.options.getBoolean("enabled", true);
    await prisma.guild.upsert({ where: { discordId: interaction.guildId! }, update: { effectsEnabled: enabled }, create: { discordId: interaction.guildId!, effectsEnabled: enabled } });
    await interaction.reply({ embeds: [statusEmbed(`EFFECTS ${enabled ? "ON" : "OFF"}`, "")] });
  },
};
