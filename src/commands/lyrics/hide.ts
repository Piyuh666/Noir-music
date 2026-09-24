import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { statusEmbed } from "../../ui/embeds";

export const hide: MusicCommand = {
  meta: { id: "lyrics.hide", category: "lyrics", description: "Hide the lyrics panel from the player message.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    GuildSession.for(interaction.guildId!).player?.setData("lyricsVisible", false);
    await interaction.reply({ embeds: [statusEmbed("LYRICS HIDDEN", "")] });
  },
};
