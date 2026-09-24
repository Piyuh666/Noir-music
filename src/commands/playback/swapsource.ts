import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { PlaybackService } from "../../audio/playbackService";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const swapsource: MusicCommand = {
  meta: { id: "swap_source", category: "playback", description: "Re-search the current track from a different provider.", changesPlaybackState: true, requiresDb: false, requiresProvider: true },
  build: (b) => {
    (b as SlashCommandBuilder).addStringOption((o) =>
      o.setName("source").setDescription("Provider").setRequired(true).addChoices({ name: "YouTube", value: "ytsearch" }, { name: "SoundCloud", value: "scsearch" })
    );
  },
  execute: async (interaction) => {
    const session = GuildSession.for(interaction.guildId!);
    const player = session.player;
    const current = player?.queue.current;
    if (!player || !current) {
      await interaction.reply({ embeds: [errorEmbed("Nothing playing", "Play something first.", "PLAYER_005")], ephemeral: true });
      return;
    }
    await interaction.deferReply();
    const source = interaction.options.getString("source", true) as "ytsearch" | "scsearch";
    const result = await session.search(player, `${current.info.title} ${current.info.author}`, interaction.user, source);
    const track = result?.tracks?.[0];
    if (!track) {
      await interaction.editReply({ embeds: [errorEmbed("No match found", "That source doesn't have this track.", "SEARCH_204")] });
      return;
    }
    await session.addToQueue(player, track);
    const addedIndex = player.queue.tracks.length - 1;
    const [addedTrack] = player.queue.tracks.splice(addedIndex, 1);
    player.queue.tracks.unshift(addedTrack);
    await PlaybackService.skip(interaction.guildId!);
    await interaction.editReply({ embeds: [statusEmbed(`SWAPPED SOURCE · ${source}`, "")] });
  },
};
