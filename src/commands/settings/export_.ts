import { MusicCommand } from "../../types/command";
import { prisma } from "../../database/prisma";
import { errorEmbed } from "../../ui/embeds";
import { AttachmentBuilder } from "discord.js";

export const export_: MusicCommand = {
  meta: { id: "music_settings.export", category: "settings", description: "Export this server's music settings as JSON.", permissions: ["ManageGuild"], changesPlaybackState: false, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const guild = await prisma.guild.findUnique({ where: { discordId: interaction.guildId! } });
    if (!guild) {
      await interaction.reply({ embeds: [errorEmbed("No settings yet", "Nothing has been configured for this server yet.", "SET_001")], ephemeral: true });
      return;
    }
    const file = new AttachmentBuilder(Buffer.from(JSON.stringify(guild, null, 2), "utf-8"), { name: "music-settings.json" });
    await interaction.reply({ files: [file] });
  },
};
