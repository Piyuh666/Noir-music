import { MusicCommand } from "../../types/command";
import { registry } from "../registry";
import { renderHelp } from "../../ui/renderer";

export const help: MusicCommand = {
  meta: { id: "help", category: "help", description: "Open the NOIR MUSIC command matrix with the interactive Glyph module navigator.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const categories = [...new Set(registry.flatCommands().map((c) => c.command.meta.category))].sort();
        await interaction.reply({ ...renderHelp(categories, registry.flatCommands().length) });
  },
};
