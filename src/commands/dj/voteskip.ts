import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { prisma } from "../../database/prisma";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

const votes = new Map<string, Set<string>>();

export const voteskip: MusicCommand = {
  meta: { id: "vote_skip", category: "dj", description: "Cast a vote to skip the current track.", changesPlaybackState: true, requiresDb: true, requiresProvider: false },
  build: () => {},
  execute: async (interaction) => {
    const player = GuildSession.for(interaction.guildId!).player;
    if (!player?.playing) {
      await interaction.reply({ embeds: [errorEmbed("Nothing playing", "No track to vote-skip.", "PLAYER_003")], ephemeral: true });
      return;
    }
    const key = `${interaction.guildId}:${player.queue.current?.info?.uri ?? player.queue.current?.info?.identifier ?? "unknown"}`;
    const set = votes.get(key) ?? new Set<string>();
    set.add(interaction.user.id);
    votes.set(key, set);
    player.setData("voteSkipUsers", [...set]);

    const guild = await prisma.guild.upsert({ where: { discordId: interaction.guildId! }, update: {}, create: { discordId: interaction.guildId! } });
    const voiceChannel = interaction.guild?.channels.cache.get(player.voiceChannelId!);
    const memberCount = (voiceChannel as any)?.members?.filter((m: any) => !m.user.bot).size ?? 1;
    const required = Math.ceil(memberCount * guild.voteSkipRatio);

    if (set.size >= required) {
      votes.delete(key);
      player.setData("voteSkipUsers", []);
      player.setData("monoSkipped", true);
      await player.skip();
      await interaction.reply({ embeds: [statusEmbed("VOTE-SKIP PASSED", "")] });
    } else {
      await interaction.reply({ embeds: [statusEmbed(`VOTE-SKIP · ${set.size}/${required}`, "")] });
    }
  },
};
