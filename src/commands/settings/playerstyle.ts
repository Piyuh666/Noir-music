import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { statusEmbed } from "../../ui/embeds";

export const playerstyle: MusicCommand = {
  meta: { id: "music_settings.player_style", category: "settings", description: "Choose the now-playing embed style.", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => {
    (b as SlashCommandBuilder).addStringOption((o) =>
      o.setName("style").setDescription("Style").setRequired(true).addChoices({ name: "glyph (default)", value: "glyph" }, { name: "minimal", value: "minimal" }, { name: "compact", value: "compact" })
    );
  },
  execute: async (interaction) => {
    const style = interaction.options.getString("style", true);
    const { prisma } = await import("../../database/prisma");
    await prisma.guild.upsert({ where: { discordId: interaction.guildId! }, update: { playerStyle: style }, create: { discordId: interaction.guildId!, playerStyle: style } });
    await interaction.reply({ embeds: [statusEmbed(`PLAYER STYLE · ${style.toUpperCase()}`, "")] });
  },
};
