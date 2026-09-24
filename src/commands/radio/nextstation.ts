import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { STATIONS } from "../../audio/radio";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export const nextstation: MusicCommand = {
  meta: { id: "radio.next_station", category: "radio", description: "Skip to the next station in rotation.", changesPlaybackState: true, requiresDb: false, requiresProvider: true },
  build: () => {},
  execute: async (interaction) => {
    const session = GuildSession.for(interaction.guildId!);
    const player = session.player;
    const current = player?.getData("radioStation") as string | undefined;
    if (!player || !current) {
      await interaction.reply({ embeds: [errorEmbed("No radio active", "Start one with /radio play.", "RADIO_002")], ephemeral: true });
      return;
    }
    const idx = STATIONS.findIndex((s) => s.id === current);
    const next = STATIONS[(idx + 1) % STATIONS.length];
    const result = await session.search(player, next.searchQuery, interaction.user);
    player.queue.tracks.splice(0);
    await session.addManyToQueue(player, (result?.tracks ?? []).slice(0, 10));
    player.setData("radioStation", next.id);
    player.setData("radioQuery", next.searchQuery);
    await player.skip();
    await interaction.reply({ embeds: [statusEmbed(`RADIO · ${next.name}`, "")] });
  },
};
