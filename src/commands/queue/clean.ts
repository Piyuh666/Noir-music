import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { statusEmbed } from "../../ui/embeds";

export const clean: MusicCommand = {
  meta: { id: "queue.clean", category: "queue", description: "Remove tracks requested by members who've since left the voice channel.", changesPlaybackState: true, requiresDb: false, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    const guild = interaction.guild;
    if (player && guild) {
      const voiceChannel = guild.channels.cache.get(player.voiceChannelId ?? "");
      const memberIds = new Set(voiceChannel && "members" in voiceChannel ? [...voiceChannel.members.keys()] : []);
      player.queue.tracks = player.queue.tracks.filter((t) => {
        const id = (t.requester as any)?.id;
        return !id || memberIds.has(id);
      });
    }
    await interaction.reply({ embeds: [statusEmbed("QUEUE CLEANED", "")] });
  },
};
