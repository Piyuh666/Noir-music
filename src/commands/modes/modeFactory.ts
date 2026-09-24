import { MusicCommand } from "../../types/command";
import { GuildSession } from "../../audio/session";
import { ModeDef } from "../../audio/modes";
import { applyEffectChain, EffectId } from "../../audio/filters";
import { errorEmbed, statusEmbed } from "../../ui/embeds";

/**
 * One ModeDef -> one real MusicCommand. Applies actual volume/effect/
 * autoplay/shuffle/loop changes to the live player — modes are not
 * informational messages, per the original spec's explicit requirement.
 */
export function buildModeCommand(def: ModeDef): MusicCommand {
  return {
    meta: {
      id: `mode.${def.id}`,
      category: "modes",
      description: def.description,
      changesPlaybackState: true,
      requiresDb: false,
      requiresProvider: false,
    },
    build: () => {},
    execute: async (interaction) => {
      const player = GuildSession.for(interaction.guildId!).player;
      if (!player) {
        await interaction.reply({ embeds: [errorEmbed("No active player", "Play something first, then switch modes.", "MODE_001")], ephemeral: true });
        return;
      }

      if (def.volume !== undefined) await player.setVolume(def.volume);
      if (def.effects) {
        await applyEffectChain(player, def.effects as EffectId[], {});
      }
      if (def.autoplay !== undefined) player.setData("autoplay", def.autoplay);
      if (def.shuffle) player.queue.shuffle();
      if (def.loop) await player.setRepeatMode(def.loop);
      player.setData("searchModifier", def.searchModifier ?? undefined);
      player.setData("mode", def.id);

      await interaction.reply({ embeds: [statusEmbed(`MODE · ${def.label.toUpperCase()}`, "")] });
    },
  };
}
