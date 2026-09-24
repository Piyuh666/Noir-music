import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { errorEmbed, statusEmbed } from "../../ui/embeds";
import { applyEffectChain, EFFECTS, EffectDef, restoreEffectChain } from "../../audio/filters";
import { prisma } from "../../database/prisma";

/**
 * Turns one EffectDef into a fully working standalone MusicCommand:
 * toggling it on if off, off if on, and tracking active-effect state on
 * the player so /nowplaying and /effect list can report it. This is the
 * shared implementation every single /bassboost, /nightcore, /8d, etc.
 * command in effects/index.ts is built from — one bug fix here fixes all
 * 29 of them instead of needing 29 separate patches.
 */
export function buildEffectCommand(def: EffectDef): MusicCommand {
  return {
    meta: {
      id: `effect.${def.id}`,
      category: "effects",
      description: def.description,
      example: def.acceptsValue ? `/${def.id} value:${def.acceptsValue.min}` : undefined,
      changesPlaybackState: true,
      requiresDb: true,
      requiresProvider: false,
    },
    build: (b) => {
      if (def.acceptsValue) {
        (b as SlashCommandBuilder).addIntegerOption((o) =>
          o
            .setName("value")
            .setDescription(def.acceptsValue!.description)
            .setMinValue(def.acceptsValue!.min)
            .setMaxValue(def.acceptsValue!.max)
        );
      }
    },
    execute: async (interaction) => {
      const guild = await prisma.guild.findUnique({ where: { discordId: interaction.guildId! }, select: { effectsEnabled: true } });
      if (guild?.effectsEnabled === false) {
        await interaction.reply({ embeds: [errorEmbed("Effects disabled", "The server has disabled the effects system.", "FX_DISABLED")], ephemeral: true });
        return;
      }
      const player = GuildSession.for(interaction.guildId!).player;
      if (!player) {
        await interaction.reply({
          embeds: [errorEmbed("No active player", "Play something first.", "FX_001")],
          ephemeral: true,
        });
        return;
      }

      const active = (player.getData("activeEffects") as string[]) ?? [];
      const isActive = active.includes(def.id);
      const value = def.acceptsValue ? interaction.options.getInteger("value") ?? undefined : undefined;

      const previousActive = [...active];
      const previousValues = { ...(((player.getData("activeEffectValues") as Record<string, number> | undefined) ?? {})) };
      try {
        const nextActive = isActive && value === undefined
          ? active.filter((e) => e !== def.id)
          : [...new Set([...active, def.id])];
        const nextValues = { ...previousValues };
        if (value === undefined) delete nextValues[def.id]; else nextValues[def.id] = value;
        await applyEffectChain(player, nextActive, nextValues);
        await interaction.reply({ embeds: [statusEmbed(`${def.label.toUpperCase()} ${isActive && value === undefined ? "OFF" : "ON"}`, "")] });
      } catch (err) {
        try {
          await applyEffectChain(player, previousActive, previousValues);
        } catch (rollbackError) {
          player.setData("activeEffects", []);
          player.setData("activeEffectValues", {});
        }
        await interaction.reply({
          embeds: [
            errorEmbed(
              "Filter unavailable",
              `This node doesn't currently support the ${def.label} filter. Check that filters are enabled in your Lavalink application.yml.`,
              "FX_NODE_UNSUPPORTED"
            ),
          ],
          ephemeral: true,
        });
      }
    },
  };
}
