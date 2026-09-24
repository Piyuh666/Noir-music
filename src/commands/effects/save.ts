import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { prisma } from "../../database/prisma";
import { errorEmbed, statusEmbed } from "../../ui/embeds";
import { EFFECTS, type EffectId } from "../../audio/filters";

export const save: MusicCommand = {
  meta: { id: "effect.save", category: "effects", description: "Save your currently active effect chain as a named preset.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => {
    (b as SlashCommandBuilder).addStringOption((o) => o.setName("name").setDescription("Preset name").setRequired(true));
  },
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    const active = (((player?.getData("activeEffects") as string[]) ?? [])
      .filter((id) => typeof id === "string" && id.length <= 64));
    if (!active.length) {
      await interaction.reply({ embeds: [errorEmbed("No active effects", "Turn on some effects first, then save them.", "FX_002")], ephemeral: true });
      return;
    }
    const invalid = active.filter((id) => !Object.prototype.hasOwnProperty.call(EFFECTS, id));
    if (invalid.length) {
      await interaction.reply({ embeds: [errorEmbed("Effect state invalid", "The active effect state contains an unsupported filter and was not saved.", "FX_005")], ephemeral: true });
      return;
    }
    const canonicalChain = active as EffectId[];
    const user = await prisma.user.upsert({ where: { discordId: interaction.user.id }, update: {}, create: { discordId: interaction.user.id } });
    const name = interaction.options.getString("name", true);
    await prisma.effectPreset.create({ data: { ownerId: user.id, name, chainJson: JSON.stringify(canonicalChain) } });
    await interaction.reply({ embeds: [statusEmbed(`SAVED · ${name}`, "")] });
  },
};
