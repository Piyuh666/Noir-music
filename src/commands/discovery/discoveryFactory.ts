import { SlashCommandBuilder } from "discord.js";
import { MusicCommand, CommandMeta } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { requireVoiceChannel } from "../../utils/voice";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

export type DiscoveryMode =
  | "query"    // user supplies a free-text query, used as-is (+ optional modifier)
  | "typed"    // user supplies a value for a named concept (artist/genre/decade/...) + modifier template
  | "seed"     // uses the currently-playing track as the search seed (radio/similar/related-style)
  | "random";  // no input — picks from a fixed rotation of modifiers

export interface DiscoveryDef {
  id: string;
  label: string;
  description: string;
  mode: DiscoveryMode;
  /** For "typed": template with {value} substituted. For "query"/"seed": suffix appended. */
  template?: string;
  optionName?: string;
  optionDescription?: string;
  /** How many results to queue — >1 turns this into an autoplay-style batch add. */
  resultCount?: number;
  /** Honest caveat surfaced in /help — set for anything not backed by a licensed charts/recommendation API. */
  heuristicNote?: string;
}

const RANDOM_SEEDS = ["chill lofi mix", "upbeat pop hits", "deep house set", "acoustic covers", "90s throwbacks", "indie discoveries"];

export function buildDiscoveryCommand(def: DiscoveryDef): MusicCommand {
  const needsFreeInput = def.mode === "query" || def.mode === "typed";

  const meta: CommandMeta = {
    id: `discovery.${def.id}`,
    category: "discovery",
    description: def.heuristicNote ? `${def.description} (${def.heuristicNote})` : def.description,
    changesPlaybackState: true,
    requiresDb: true,
    requiresProvider: true,
  };

  return {
    meta,
    build: (b) => {
      if (needsFreeInput) {
        (b as SlashCommandBuilder).addStringOption((o) =>
          o
            .setName(def.optionName ?? "query")
            .setDescription(def.optionDescription ?? "Search term")
            .setRequired(true)
        );
      }
    },
    execute: async (interaction) => {
      const voiceChannelId = await requireVoiceChannel(interaction);
      if (!voiceChannelId) return;
      await interaction.deferReply();

      const session = GuildSession.for(interaction.guildId!);
      const player = await session.ensurePlayer(voiceChannelId, interaction.channelId);

      let searchQuery: string;
      if (def.mode === "typed") {
        const value = interaction.options.getString(def.optionName ?? "query", true);
        searchQuery = (def.template ?? "{value}").replace("{value}", value);
      } else if (def.mode === "query") {
        const value = interaction.options.getString(def.optionName ?? "query", true);
        searchQuery = def.template ? `${value} ${def.template}` : value;
      } else if (def.mode === "seed") {
        const current = player.queue.current;
        if (!current) {
          await interaction.editReply({
            embeds: [errorEmbed("Nothing playing", "Play a track first so there's something to base this on.", "DISC_001")],
          });
          return;
        }
        searchQuery = `${current.info.author} ${def.template ?? ""}`.trim();
      } else {
        searchQuery = RANDOM_SEEDS[Math.floor(Math.random() * RANDOM_SEEDS.length)];
      }

      const result = await session.search(player, searchQuery, interaction.user);
      if (!result?.tracks?.length) {
        await interaction.editReply({ embeds: [errorEmbed("No results", "Try a more specific term.", "SEARCH_204")] });
        return;
      }

      const count = def.resultCount ?? 1;
      const picked = result.tracks.slice(0, count);
      for (const t of picked) await session.addToQueue(player, t);
      if (!player.playing && !player.paused) await player.play();

      const queuedCount = picked.length;
      const label = queuedCount > 1 ? `QUEUED ${queuedCount} · ${def.label.toUpperCase()}` : `QUEUED · ${picked[0].info.title}`;
      await interaction.editReply({ embeds: [statusEmbed(label, "")] });
    },
  };
}
