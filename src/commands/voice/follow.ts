import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { statusEmbed } from "../../ui/embeds";

export const follow: MusicCommand = {
  meta: { id: "voice.follow", category: "voice", permissions: ["ManageGuild"], description: "Toggle whether the bot follows you between voice channels.", changesPlaybackState: false, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    const current = Boolean(player?.getData("followUser"));
    player?.setData("followUser", current ? undefined : interaction.user.id);
    await interaction.reply({ embeds: [statusEmbed(`FOLLOW MODE ${current ? "OFF" : "ON"}`, "")] });
  },
};
