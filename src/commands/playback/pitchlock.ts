import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { statusEmbed } from "../../ui/embeds";
import { setPitchLock } from "../../audio/filters";

export const pitchlock: MusicCommand = {
  meta: { id: "pitch_lock", category: "playback", description: "Keep pitch constant even when speed changes.", changesPlaybackState: true, requiresDb: false, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addBooleanOption((o) => o.setName("enabled").setDescription("On or off").setRequired(true)); },
  execute: async (interaction) => {
    const enabled = interaction.options.getBoolean("enabled", true);
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player) {
      await interaction.reply({ embeds: [statusEmbed("PITCH LOCK · NO ACTIVE PLAYER", "Play something first." )], ephemeral: true });
      return;
    }
    await setPitchLock(player, enabled);
    await interaction.reply({ embeds: [statusEmbed(`PITCH LOCK ${enabled ? "ON" : "OFF"}`, "")] });
  },
};
