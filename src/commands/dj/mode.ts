import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";
import { statusEmbed } from "../../ui/embeds";

export const mode: MusicCommand = {
  meta: { id: "dj.mode", category: "dj", description: "Set the DJ enforcement mode.", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => {
    (b as SlashCommandBuilder).addStringOption((o) =>
      o.setName("mode").setDescription("Mode").setRequired(true).addChoices({ name: "strict", value: "strict" }, { name: "relaxed", value: "relaxed" }, { name: "off", value: "off" })
    );
  },
  execute: async (interaction) => {
    const mode = interaction.options.getString("mode", true);
    await prisma.guild.upsert({ where: { discordId: interaction.guildId! }, update: {}, create: { discordId: interaction.guildId! } });
    const { GuildSession } = await import("../../audio/session");
    GuildSession.for(interaction.guildId!).player?.setData("djMode", mode);
    await interaction.reply({ embeds: [statusEmbed(`DJ MODE · ${mode.toUpperCase()}`, "")] });
  },
};
