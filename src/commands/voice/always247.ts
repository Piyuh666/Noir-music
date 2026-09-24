import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { setAlways247 } from "../../services/always247Service";
import { glyphPanel, statusEmbed } from "../../ui/embeds";

export const always247: MusicCommand = {
  meta: {
    id: "voice.always247",
    category: "voice",
    permissions: ["ManageGuild"],
    description: "Set NOIR MUSIC's persistent 24/7 voice policy.",
    changesPlaybackState: false,
    requiresDb: true,
    requiresProvider: false,
    cooldownMs: 750,
  },
  build: (builder) => (builder as SlashCommandBuilder).addStringOption((option) => option
    .setName("mode")
    .setDescription("Choose ON, OFF, or TOGGLE.")
    .setRequired(true)
    .addChoices(
      { name: "ON — persistent voice", value: "on" },
      { name: "OFF — normal idle policy", value: "off" },
      { name: "TOGGLE — invert current policy", value: "toggle" },
    )),
  execute: async (interaction) => {
    const guildId = interaction.guildId;
    if (!guildId) throw new Error("COMMAND_GUILD_REQUIRED");
    const requested = interaction.options.getString("mode", true);
    if (!new Set(["on", "off", "toggle"]).has(requested)) throw new Error("INVALID_247_MODE");

    const result = await setAlways247(guildId, requested);
    const enabled = result.enabled;
    const player = GuildSession.for(guildId).player;

    await interaction.reply({
      embeds: [statusEmbed(
        `ALWAYS247 // ${enabled ? "ONLINE" : "OFFLINE"}`,
        enabled ? "PERSISTENT VOICE POLICY · ARMED" : "NORMAL IDLE POLICY · ARMED",
      ).setDescription(glyphPanel([
        `POLICY     ${enabled ? "ALWAYS-ON" : "STANDARD"}`,
        `DATABASE   SYNCHRONIZED`,
        `PLAYER     ${player ? "SYNCHRONIZED" : "LAZY-SYNC"}`,
        `REQUEST    ${requested.toUpperCase()}`,
      ], 42))],
    });
  },
};
