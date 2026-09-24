import { registry } from "../registry";
import { registerCommandModule, type CommandModuleReport } from "../moduleRuntime";
import { EFFECTS } from "../../audio/filters";
import { buildEffectCommand } from "./effectFactory";
import { preset } from "./preset";
import { save } from "./save";
import { load } from "./load";
import { reset } from "./reset";
import { list } from "./list";
import { remove } from "./remove";
import { toggle } from "./toggle";
import { chainview } from "./chainview";
import { sharepreset } from "./sharepreset";

/**
 * IMPORTANT: 30 effect toggles do NOT register as 29 top-level commands —
 * Discord caps a bot at 100 top-level global commands total, and this bot
 * has 15 categories competing for that budget. They're grouped as /fx
 * (first 25) and /fx-more (remaining 5) instead. This was a real mistake
 * in an earlier pass (registering them standalone) caught by counting the
 * actual top-level total before shipping — see loader.ts for the running
 * tally comment.
 */


/**
 * Immutable registration contract for the effects command surface.
 *
 * expectedCommands is the number of executable command implementations this
 * module contributes; expectedTopLevelEntries is the number of Discord
 * top-level application-command entries it consumes.  Keeping both figures
 * explicit prevents a refactor from accidentally trading command depth for
 * top-level budget without the loader noticing.
 */
export const EFFECTS_MODULE = Object.freeze({
  id: "effects",
  category: "effects",
  description: "Audio effects and effect-preset management.",
  expectedCommands: 39,
  expectedTopLevelEntries: 3,
  expectedGroups: Object.freeze(['fx', 'fx-more', 'effect']),
});

export function registerEffectsCommands(): CommandModuleReport {
  return registerCommandModule({
    ...EFFECTS_MODULE,
    expectedGroups: EFFECTS_MODULE.expectedGroups,
  }, () => {
  const entries = Object.values(EFFECTS).map((def) => ({ name: def.id, command: buildEffectCommand(def) }));
  const first = entries.slice(0, 25);
  const rest = entries.slice(25);

  registry.group("fx", "Audio effects (bassboost, nightcore, 8D, and more).", "effects", first);
  if (rest.length) {
    registry.group("fx-more", "Additional audio effects.", "effects", rest);
  }

  registry.group("effect", "Manage effect presets and the effects system.", "effects", [
    { name: "preset", command: preset },
    { name: "save", command: save },
    { name: "load", command: load },
    { name: "reset", command: reset },
    { name: "list", command: list },
    { name: "remove", command: remove },
    { name: "toggle", command: toggle },
    { name: "chain-view", command: chainview },
    { name: "share-preset", command: sharepreset },
  ]);
  });
}
