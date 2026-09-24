import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const sharepreset: MusicCommand = {
  meta: { id: "effect.share_preset", category: "effects", description: "Make one of your saved presets available to everyone.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => {
    (b as SlashCommandBuilder).addStringOption((o) => o.setName("name").setDescription("Preset name").setRequired(true));
  },
  execute: async (interaction) => {
    const user = await prisma.user.findUnique({ where: { discordId: interaction.user.id } });
    const name = interaction.options.getString("name", true);
    const found = user ? await prisma.effectPreset.findFirst({ where: { ownerId: user.id, name } }) : null;
    if (!found) {
      await interaction.reply({ embeds: [errorEmbed("Preset not found", `No preset named "${name}" on your account.`, "FX_003")], ephemeral: true });
      return;
    }
    await prisma.effectPreset.update({ where: { id: found.id }, data: { isShared: true } });
    await interaction.reply({ embeds: [statusEmbed(`SHARED · ${name}`, "")] });
  },
};
