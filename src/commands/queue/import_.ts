import { SlashCommandBuilder } from "discord.js";
import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { requireVoiceChannel } from "../../utils/voice";
import { errorEmbed, statusEmbed } from "../../ui/embeds";
import { assertStringField, fetchJsonBounded } from "../../utils/runtimeGuard";

export const import_: MusicCommand = {
  meta: { id: "queue.import", category: "queue", description: "Import a queue from a previously exported JSON file.", changesPlaybackState: true, requiresDb: false, requiresProvider: true },
  build: (b) => { (b as SlashCommandBuilder).addAttachmentOption((o) => o.setName("file").setDescription("Exported queue JSON").setRequired(true)); },
  execute: async (interaction) => {
    const voiceChannelId = await requireVoiceChannel(interaction);
    if (!voiceChannelId) return;
    const attachment = interaction.options.getAttachment("file", true);
    await interaction.deferReply();
    try {
      const rows = await fetchJsonBounded<{ title: string; artist: string; uri: string }[]>(attachment.url, {}, { timeoutMs: 10_000, maxBytes: 512 * 1024 });
      if (!Array.isArray(rows) || rows.length > 1_000) throw new Error("IMPORT_ROW_LIMIT");
      for (const row of rows) {
        assertStringField(row?.title, "title", 512);
        assertStringField(row?.artist, "artist", 512);
        assertStringField(row?.uri, "uri", 2048);
      }
      const session = GuildSession.for(interaction.guildId!);
      const player = await session.ensurePlayer(voiceChannelId, interaction.channelId);
      for (const r of rows) {
        const result = await session.search(player, r.uri || `${r.title} ${r.artist}`, interaction.user);
        const found = result?.tracks?.[0];
        if (found) await session.addToQueue(player, found);
      }
      if (!player.playing) await player.play();
      await interaction.editReply({ embeds: [statusEmbed(`IMPORTED ${rows.length} TRACKS`, "")] });
    } catch {
      await interaction.editReply({ embeds: [errorEmbed("Import failed", "That file isn't valid queue JSON.", "QUEUE_006")] });
    }
  },
};
