import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { statusEmbed } from "../../ui/embeds";

export const idletimeout: MusicCommand = {
  meta: { id: "voice.idle_timeout", category: "voice", permissions: ["ManageGuild"], description: "Set how many minutes of empty-queue idling before auto-disconnect.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addIntegerOption((o) => o.setName("minutes").setDescription("Idle minutes").setRequired(true).setMinValue(1).setMaxValue(120)); },
  execute: async (interaction) => {
    const minutes = interaction.options.getInteger("minutes", true);
    GuildSession.for(interaction.guildId!).player?.setData("idleTimeoutMinutes", minutes);
    const { prisma } = await import("../../database/prisma");
    await prisma.guild.upsert({ where: { discordId: interaction.guildId! }, update: { idleTimeoutMinutes: minutes }, create: { discordId: interaction.guildId!, idleTimeoutMinutes: minutes } });
    await interaction.reply({ embeds: [statusEmbed(`IDLE TIMEOUT · ${minutes}m`, "")] });
  },
};
