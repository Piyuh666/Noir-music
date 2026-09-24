import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { statusEmbed, errorEmbed } from "../../ui/embeds";

export const duration: MusicCommand = {
  meta: { id: "radio.duration", category: "radio", description: "Auto-stop the current radio station after N minutes.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addIntegerOption((o) => o.setName("minutes").setDescription("Minutes until auto-stop").setRequired(true).setMinValue(1)); },
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player?.getData("radioStation")) {
      await interaction.reply({ embeds: [errorEmbed("No radio active", "Start one with /radio play.", "RADIO_002")], ephemeral: true });
      return;
    }
    const minutes = interaction.options.getInteger("minutes", true);
    setTimeout(async () => {
      if (player.getData("radioStation")) {
        player.setData("radioStation", undefined);
        player.setData("radioQuery", undefined);
        player.setData("autoplay", false);
        await player.stopPlaying(true, false);
      }
    }, minutes * 60 * 1000);
    await interaction.reply({ embeds: [statusEmbed(`AUTO-STOP IN ${minutes}m`, "")] });
  },
};
