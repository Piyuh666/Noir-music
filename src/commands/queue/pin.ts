import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const pin: MusicCommand = {
  meta: { id: "queue.pin", category: "queue", description: "Pin a track so shuffle/rotate can't move it.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addIntegerOption((o) => o.setName("position").setDescription("1-based position").setRequired(true).setMinValue(1)); },
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    const idx = interaction.options.getInteger("position", true) - 1;
    if (!player || idx < 0 || idx >= player.queue.tracks.length) {
      await interaction.reply({ embeds: [errorEmbed("Invalid position", "That queue slot doesn't exist.", "QUEUE_003")], ephemeral: true });
      return;
    }
    const pinned = (player.getData("pinnedTracks") as string[]) ?? [];
    const uri = player.queue.tracks[idx].info.uri ?? player.queue.tracks[idx].info.identifier;
    player.setData("pinnedTracks", [...new Set([...pinned, uri])]);
    await interaction.reply({ embeds: [statusEmbed("TRACK PINNED", "")] });
  },
};
