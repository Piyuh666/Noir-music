import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";
import { statusEmbed, errorEmbed } from "../../ui/embeds";
import { DjAction } from "../../services/djService";

const ACTIONS: DjAction[] = ["play", "skip", "stop", "queue", "volume", "effects", "playlist", "radio", "disconnect", "settings"];

export const permissions: MusicCommand = {
  meta: { id: "dj.permissions", category: "dj", description: "Restrict a specific action to DJs only.", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => {
    (b as SlashCommandBuilder)
      .addStringOption((o) => o.setName("action").setDescription("Which action").setRequired(true).addChoices(...ACTIONS.map((a) => ({ name: a, value: a }))))
      .addStringOption((o) => o.setName("rule").setDescription("everyone or dj").setRequired(true).addChoices({ name: "everyone", value: "everyone" }, { name: "dj", value: "dj" }));
  },
  execute: async (interaction) => {
    const action = interaction.options.getString("action", true) as DjAction;
    const rule = interaction.options.getString("rule", true) as "everyone" | "dj";
    const config = await prisma.guildDjConfig.findUnique({ where: { guildId: interaction.guildId! } });
    if (!config) {
      await interaction.reply({ embeds: [errorEmbed("DJ mode not enabled", "Run /dj enable first.", "DJ_001")], ephemeral: true });
      return;
    }
    const perms = JSON.parse(config.permissionsJson);
    perms[action] = rule;
    await prisma.guildDjConfig.update({ where: { guildId: interaction.guildId! }, data: { permissionsJson: JSON.stringify(perms) } });
    await interaction.reply({ embeds: [statusEmbed(`${action.toUpperCase()} → ${rule.toUpperCase()}`, "")] });
  },
};
