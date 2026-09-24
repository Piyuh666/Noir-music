import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";
import { statusEmbed } from "../../ui/embeds";

export const afkchannelbehavior: MusicCommand = {
  meta: { id: "voice.afk_channel_behavior", category: "voice", description: "Set what happens if the bot ends up in the server's AFK channel.", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => {
    (b as SlashCommandBuilder).addStringOption((o) =>
      o.setName("behavior").setDescription("Behavior").setRequired(true).addChoices({ name: "pause", value: "pause" }, { name: "disconnect", value: "disconnect" }, { name: "ignore", value: "ignore" })
    );
  },
  execute: async (interaction) => {
    const behavior = interaction.options.getString("behavior", true);
    await prisma.guild.upsert({ where: { discordId: interaction.guildId! }, update: {}, create: { discordId: interaction.guildId! } });
    const { GuildSession } = await import("../../audio/session");
    GuildSession.for(interaction.guildId!).player?.setData("afkBehavior", behavior);
    await interaction.reply({ embeds: [statusEmbed(`AFK BEHAVIOR · ${behavior.toUpperCase()}`, "")] });
  },
};
