import { MusicCommand } from "../../types/command";
import { registry } from "../registry";
import { AttachmentBuilder } from "discord.js";

export const commandlist: MusicCommand = {
  meta: { id: "help.command_list", category: "help", description: "Export the full command list as a text file.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const lines = registry.flatCommands().map((c) => `/${c.fullName} — ${c.command.meta.description}`);
    const file = new AttachmentBuilder(Buffer.from(lines.join("\n"), "utf-8"), { name: "commands.txt" });
    await interaction.reply({ files: [file], ephemeral: true });
  },
};
