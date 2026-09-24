import { prisma } from "../database/prisma";
import { GuildSession } from "../audio/session";

export type Always247Mode = "on" | "off" | "toggle";

export interface Always247Result {
  enabled: boolean;
  previous: boolean;
  mode: Always247Mode;
  playerSynchronized: boolean;
}

function normalizeMode(value: string): Always247Mode {
  if (value === "on" || value === "off" || value === "toggle") return value;
  throw new Error("INVALID_247_MODE");
}

/** Atomic-ish optimistic update so concurrent TOGGLE requests cannot silently overwrite each other. */
export async function setAlways247(guildId: string, mode: string): Promise<Always247Result> {
  const normalizedGuild = String(guildId ?? "").trim();
  if (!/^[0-9]{5,32}$/.test(normalizedGuild)) throw new Error("INVALID_GUILD_ID");
  const requested = normalizeMode(mode);
  const current = await prisma.guild.upsert({ where: { discordId: normalizedGuild }, update: {}, create: { discordId: normalizedGuild } });

  let previous = current.always247;
  let enabled = requested === "on" ? true : requested === "off" ? false : !previous;

  for (let attempt = 0; attempt < 3; attempt++) {
    const result = await prisma.guild.updateMany({
      where: { discordId: normalizedGuild, always247: previous },
      data: { always247: enabled },
    });
    if (result.count === 1) break;
    const latest = await prisma.guild.findUnique({ where: { discordId: normalizedGuild }, select: { always247: true } });
    if (!latest) throw new Error("GUILD_STATE_MISSING");
    previous = latest.always247;
    enabled = requested === "on" ? true : requested === "off" ? false : !previous;
    if (attempt === 2) throw new Error("247_STATE_CONFLICT");
  }

  const player = GuildSession.for(normalizedGuild).player;
  if (player) player.setData("always247", enabled);
  return { enabled, previous, mode: requested, playerSynchronized: Boolean(player) };
}
