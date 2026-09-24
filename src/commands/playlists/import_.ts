import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { PlaylistService } from "../../services/playlistService";
import { errorEmbed, statusEmbed } from "../../ui/embeds";
import { fetchTextBounded } from "../../utils/runtimeGuard";

export const import_: MusicCommand = {
  meta: { id: "playlist.import", category: "playlists", description: "Import a playlist from a JSON file.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addAttachmentOption((o) => o.setName("file").setDescription("Exported playlist JSON").setRequired(true)); },
  execute: async (interaction) => {
    const attachment = interaction.options.getAttachment("file", true);
    await interaction.deferReply();
    try {
      if (attachment.size !== undefined && attachment.size > 2_000_000) throw new Error("PLAYLIST_IMPORT_TOO_LARGE");
      const text = await fetchTextBounded(attachment.url, {}, { timeoutMs: 10_000, maxBytes: 2_000_000, allowedHostSuffixes: ["discordapp.com", "discord.com"] });
      const playlist = await PlaylistService.importJson(interaction.user.id, text);
      await interaction.editReply({ embeds: [statusEmbed(`IMPORTED · ${playlist.name}`, "")] });
    } catch {
      await interaction.editReply({ embeds: [errorEmbed("Import failed", "That file isn't valid playlist JSON.", "PL_006")] });
    }
  },
};
