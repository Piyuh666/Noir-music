import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { EFFECTS, EffectId, applyEffectChain } from "../../audio/filters";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const remove: MusicCommand = {
  meta: { id: "effect.remove", category: "effects", description: "Turn off one specific active effect by name.", changesPlaybackState: true, requiresDb: false, requiresProvider: false },
  build: (b) => {
    (b as SlashCommandBuilder).addStringOption((o) =>
      o.setName("name").setDescription("Effect id").setRequired(true).addChoices(...Object.keys(EFFECTS).map((k) => ({ name: k, value: k })))
    );
  },
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player) {
      await interaction.reply({ embeds: [errorEmbed("No active player", "Play something first.", "FX_001")], ephemeral: true });
      return;
    }
    const id = interaction.options.getString("name", true) as EffectId;
    const active = ((player.getData("activeEffects") as string[]) ?? []).filter((e) => e !== id);
    const values = { ...(((player.getData("activeEffectValues") as Record<string, number> | undefined) ?? {})) };
    delete values[id];
    await applyEffectChain(player, active, values);
    await interaction.reply({ embeds: [statusEmbed(`${EFFECTS[id].label.toUpperCase()} OFF`, "")] });
  },
};
