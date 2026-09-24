import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { EffectId, applyEffectChain } from "../../audio/filters";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

const PRESETS: Record<string, EffectId[]> = {
  party: ["bassboost", "8d"],
  chill: ["reverb", "slow"],
  focus: ["normalize"],
  gaming: ["8d", "bassboost"],
};

export const preset: MusicCommand = {
  meta: { id: "effect.preset", category: "effects", description: "Apply a bundled effect preset (party, chill, focus, gaming).", changesPlaybackState: true, requiresDb: false, requiresProvider: false },
  build: (b) => {
    (b as SlashCommandBuilder).addStringOption((o) =>
      o.setName("name").setDescription("Preset name").setRequired(true).addChoices(...Object.keys(PRESETS).map((k) => ({ name: k, value: k })))
    );
  },
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player) {
      await interaction.reply({ embeds: [errorEmbed("No active player", "Play something first.", "FX_001")], ephemeral: true });
      return;
    }
    const name = interaction.options.getString("name", true);
    const ids = PRESETS[name];
    await applyEffectChain(player, ids);
    await interaction.reply({ embeds: [statusEmbed(`PRESET · ${name.toUpperCase()}`, "")] });
  },
};
