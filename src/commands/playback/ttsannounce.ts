import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { statusEmbed } from "../../ui/embeds";

export const ttsannounce: MusicCommand = {
  meta: {
    id: "tts_announce",
    category: "playback",
    description: "Toggle a text announcement (via chat message, not voice TTS) when a new track starts.",
    changesPlaybackState: false,
    requiresDb: false,
    requiresProvider: false,
  },
  build: (b) => { (b as SlashCommandBuilder).addBooleanOption((o) => o.setName("enabled").setDescription("On or off").setRequired(true)); },
  execute: async (interaction) => {
    const enabled = interaction.options.getBoolean("enabled", true);
    GuildSession.for(interaction.guildId!).player?.setData("announceTracks", enabled);
    await interaction.reply({ embeds: [statusEmbed(`TRACK ANNOUNCEMENTS ${enabled ? "ON" : "OFF"}`, "")] });
  },
};
