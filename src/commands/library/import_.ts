import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";
import { errorEmbed, statusEmbed } from "../../ui/embeds";
import { assertStringField, fetchJsonBounded } from "../../utils/runtimeGuard";

export const import_: MusicCommand = {
  meta: { id: "library.import", category: "library", description: "Import favorites from a previously exported library JSON file.", changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: (b) => { (b as SlashCommandBuilder).addAttachmentOption((o) => o.setName("file").setDescription("Exported library JSON").setRequired(true)); },
  execute: async (interaction) => {
    const attachment = interaction.options.getAttachment("file", true);
    await interaction.deferReply({ ephemeral: true });
    try {
      const rows = await fetchJsonBounded<{ trackUri: string; title: string; artist: string }[]>(attachment.url, {}, { timeoutMs: 10_000, maxBytes: 512 * 1024 });
      if (!Array.isArray(rows) || rows.length > 1_000) throw new Error("IMPORT_ROW_LIMIT");
      for (const row of rows) {
        assertStringField(row?.trackUri, "trackUri", 2048);
        assertStringField(row?.title, "title", 512);
        assertStringField(row?.artist, "artist", 512);
      }
      const user = await prisma.user.upsert({ where: { discordId: interaction.user.id }, update: {}, create: { discordId: interaction.user.id } });
      for (const r of rows) {
        await prisma.favorite.upsert({
          where: { userId_trackUri: { userId: user.id, trackUri: r.trackUri } },
          update: {},
          create: { userId: user.id, trackUri: r.trackUri, title: r.title, artist: r.artist },
        });
      }
      await interaction.editReply({ embeds: [statusEmbed(`IMPORTED ${rows.length} TRACKS`, "")] });
    } catch {
      await interaction.editReply({ embeds: [errorEmbed("Import failed", "That file isn't valid library JSON.", "LIB_003")] });
    }
  },
};
