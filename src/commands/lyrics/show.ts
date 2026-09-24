import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { statusEmbed } from "../../ui/embeds";

export const show: MusicCommand = {
  meta: { id: "lyrics.show", category: "lyrics", description: "Show the lyrics panel on the player message.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    GuildSession.for(interaction.guildId!).player?.setData("lyricsVisible", true);
    await interaction.reply({ embeds: [statusEmbed("LYRICS SHOWN", "")] });
  },
};
