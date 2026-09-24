import { prisma } from "../database/prisma";

/** Persistent per-guild DJ grants. The DB is authoritative; the in-memory cache is only a fast-path. */
const djUsers = new Map<string, Set<string>>();

async function load(guildId: string): Promise<Set<string>> {
  const cached = djUsers.get(guildId);
  if (cached) return cached;
  const config = await prisma.guildDjConfig.findUnique({ where: { guildId } });
  const ids = config ? JSON.parse(config.extraDjIds || "[]") as string[] : [];
  const set = new Set(ids);
  djUsers.set(guildId, set);
  return set;
}

async function persist(guildId: string, set: Set<string>) {
  const guild = await prisma.guild.upsert({ where: { discordId: guildId }, update: {}, create: { discordId: guildId } });
  await prisma.guildDjConfig.upsert({
    where: { guildId: guild.discordId },
    update: { extraDjIds: JSON.stringify([...set]) },
    create: { guildId: guild.discordId, permissionsJson: "{}", extraDjIds: JSON.stringify([...set]) },
  });
}

export async function grantAdHocDj(guildId: string, userId: string) {
  const set = await load(guildId);
  set.add(userId);
  await persist(guildId, set);
}

export async function revokeAdHocDj(guildId: string, userId: string) {
  const set = await load(guildId);
  set.delete(userId);
  await persist(guildId, set);
}

export async function isAdHocDj(guildId: string, userId: string): Promise<boolean> {
  return (await load(guildId)).has(userId);
}
