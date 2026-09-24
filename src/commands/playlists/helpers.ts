import { ChatInputCommandInteraction } from "discord.js";
import { PlaylistService } from "../../services/playlistService";
import { errorEmbed } from "../../ui/embeds";

/** Resolves a playlist owned by the invoking user by name, or replies with a standard error and returns null. */
export async function resolveOwnedPlaylist(interaction: ChatInputCommandInteraction, optionName = "name") {
  const name = interaction.options.getString(optionName, true);
  const playlists = await PlaylistService.byOwner(interaction.user.id);
  const found = playlists.find((p) => p.name.toLowerCase() === name.toLowerCase());
  if (!found) {
    await interaction.reply({
      embeds: [errorEmbed("Playlist not found", `You don't have a playlist named "${name}".`, "PL_001")],
      ephemeral: true,
    });
    return null;
  }
  if (found.locked) {
    await interaction.reply({
      embeds: [errorEmbed("Playlist locked", "Unlock it first with /playlist unlock.", "PL_002")],
      ephemeral: true,
    });
    return null;
  }
  return found;
}
