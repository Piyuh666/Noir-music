import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { prisma } from "../../database/prisma";
import { EFFECTS, EffectId, applyEffectChain, restoreEffectChain } from "../../audio/filters";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const load: MusicCommand = {
  meta: { id: "effect.load", category: "effects", description: "Load a previously saved effect chain.", changesPlaybackState: true, requiresDb: true, requiresProvider: false },
  build: (b) => {
    (b as SlashCommandBuilder).addStringOption((o) => o.setName("name").setDescription("Preset name").setRequired(true));
  },
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player) {
      await interaction.reply({ embeds: [errorEmbed("No active player", "Play something first.", "FX_001")], ephemeral: true });
      return;
    }
    const user = await prisma.user.findUnique({ where: { discordId: interaction.user.id } });
    const name = interaction.options.getString("name", true);
    const preset = user ? await prisma.effectPreset.findFirst({ where: { ownerId: user.id, name } }) : null;
    if (!preset) {
      await interaction.reply({ embeds: [errorEmbed("Preset not found", `No saved preset named "${name}".`, "FX_003")], ephemeral: true });
      return;
    }
    let ids: EffectId[];
    try {
      const parsed: unknown = JSON.parse(preset.chainJson);
      if (!Array.isArray(parsed) || parsed.length > 32 || !parsed.every((id): id is EffectId => typeof id === "string" && Object.prototype.hasOwnProperty.call(EFFECTS, id))) {
        throw new Error("FX_INVALID_PRESET");
      }
      ids = [...new Set(parsed)];
    } catch {
      await interaction.reply({ embeds: [errorEmbed("Invalid preset", "This saved effect chain is malformed or contains unsupported effects.", "FX_004")], ephemeral: true });
      return;
    }
    const previous = [...(((player.getData("activeEffects") as string[]) ?? []).filter((id) => Object.prototype.hasOwnProperty.call(EFFECTS, id)))];
    try {
      await applyEffectChain(player, ids);
    } catch (error) {
      try {
        await restoreEffectChain(player, previous);
      } catch {
        player.setData("activeEffects", []);
      }
      throw error;
    }
    await interaction.reply({ embeds: [statusEmbed(`LOADED · ${name}`, "")] });
  },
};
