import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const toggle: MusicCommand = {
  meta: { id: "effect.toggle", category: "effects", description: "Enable or disable the entire effects system for this server.", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => {
    (b as SlashCommandBuilder).addBooleanOption((o) => o.setName("enabled").setDescription("On or off").setRequired(true));
  },
  execute: async (interaction) => {
    const enabled = interaction.options.getBoolean("enabled", true);
    const { prisma } = await import("../../database/prisma");
    await prisma.guild.upsert({
      where: { discordId: interaction.guildId! },
      update: { effectsEnabled: enabled },
      create: { discordId: interaction.guildId!, effectsEnabled: enabled },
    });
    if (!enabled) {
      const player = GuildSession.for(interaction.guildId!).player;
      if (player) {
        const { clearAllEffects } = await import("../../audio/filters");
        await clearAllEffects(player);
        player.setData("activeEffects", []);
      }
    }
    await interaction.reply({ embeds: [statusEmbed(`EFFECTS SYSTEM ${enabled ? "ON" : "OFF"}`, "")] });
  },
};
