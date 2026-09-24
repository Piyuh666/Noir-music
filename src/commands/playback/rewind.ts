import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { PlaybackService } from "../../audio/playbackService";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const rewind: MusicCommand = {
  meta: { id: "rewind", category: "playback", description: "Rewind the current track by N seconds.", changesPlaybackState: true, requiresDb: false, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addIntegerOption((o) => o.setName("seconds").setDescription("Seconds to rewind").setRequired(true).setMinValue(1)); },
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player?.playing) {
      await interaction.reply({ embeds: [errorEmbed("Nothing playing", "Play something first.", "PLAYER_005")], ephemeral: true });
      return;
    }
    const seconds = interaction.options.getInteger("seconds", true);
    await PlaybackService.seek(interaction.guildId!, Math.max(0, (player.position ?? 0) - seconds * 1000));
    await interaction.reply({ embeds: [statusEmbed(`REWOUND ${seconds}s`, "")] });
  },
};
