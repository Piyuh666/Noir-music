import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { statusEmbed } from "../../ui/embeds";

export const duplicatehandling: MusicCommand = {
  meta: { id: "music_settings.duplicate_handling", category: "settings", description: "Set how duplicate tracks in the queue are handled.", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => {
    (b as SlashCommandBuilder).addStringOption((o) =>
      o.setName("mode").setDescription("Mode").setRequired(true).addChoices({ name: "allow", value: "allow" }, { name: "warn", value: "warn" }, { name: "block", value: "block" })
    );
  },
  execute: async (interaction) => {
    const mode = interaction.options.getString("mode", true);
    const { prisma } = await import("../../database/prisma");
    await prisma.guild.upsert({ where: { discordId: interaction.guildId! }, update: { duplicateHandling: mode }, create: { discordId: interaction.guildId!, duplicateHandling: mode } });
    await interaction.reply({ embeds: [statusEmbed(`DUPLICATE HANDLING · ${mode.toUpperCase()}`, "")] });
  },
};
