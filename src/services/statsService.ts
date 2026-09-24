import { prisma } from "../database/prisma";

export class StatsService {
  static async recordPlay(opts: {
    userDiscordId: string;
    guildDiscordId: string;
    trackUri: string;
    title: string;
    artist: string;
    msPlayed: number;
    skipped: boolean;
  }) {
    const user = await prisma.user.upsert({
      where: { discordId: opts.userDiscordId },
      update: {},
      create: { discordId: opts.userDiscordId },
    });
    const guild = await prisma.guild.upsert({
      where: { discordId: opts.guildDiscordId },
      update: {},
      create: { discordId: opts.guildDiscordId },
    });
    return prisma.playHistory.create({
      data: {
        userId: user.id,
        guildId: guild.id,
        trackUri: opts.trackUri,
        title: opts.title,
        artist: opts.artist,
        msPlayed: opts.msPlayed,
        skipped: opts.skipped,
      },
    });
  }

  static async topTracksForUser(userDiscordId: string, limit = 10) {
    const user = await prisma.user.findUnique({ where: { discordId: userDiscordId } });
    if (!user) return [];
    const rows = await prisma.playHistory.groupBy({
      by: ["trackUri", "title", "artist"],
      where: { userId: user.id },
      _count: { trackUri: true },
      orderBy: { _count: { trackUri: "desc" } },
      take: limit,
    });
    return rows;
  }

  static async totalListeningMs(userDiscordId: string): Promise<number> {
    const user = await prisma.user.findUnique({ where: { discordId: userDiscordId } });
    if (!user) return 0;
    const agg = await prisma.playHistory.aggregate({
      where: { userId: user.id },
      _sum: { msPlayed: true },
    });
    return agg._sum.msPlayed ?? 0;
  }

  static async topArtistsForUser(userDiscordId: string, limit = 10) {
    const user = await prisma.user.findUnique({ where: { discordId: userDiscordId } });
    if (!user) return [];
    return prisma.playHistory.groupBy({
      by: ["artist"],
      where: { userId: user.id },
      _count: { artist: true },
      orderBy: { _count: { artist: "desc" } },
      take: limit,
    });
  }

  static async recentForUser(userDiscordId: string, limit = 10) {
    const user = await prisma.user.findUnique({ where: { discordId: userDiscordId } });
    if (!user) return [];
    return prisma.playHistory.findMany({ where: { userId: user.id }, orderBy: { playedAt: "desc" }, take: limit });
  }

  static async serverStats(guildDiscordId: string) {
    const guild = await prisma.guild.findUnique({ where: { discordId: guildDiscordId } });
    if (!guild) return { trackCount: 0, totalMs: 0, uniqueListeners: 0 };
    const [count, aggregate, listeners] = await Promise.all([
      prisma.playHistory.count({ where: { guildId: guild.id } }),
      prisma.playHistory.aggregate({ where: { guildId: guild.id }, _sum: { msPlayed: true } }),
      prisma.playHistory.findMany({ where: { guildId: guild.id }, distinct: ["userId"], select: { userId: true } }),
    ]);
    return { trackCount: count, totalMs: aggregate._sum.msPlayed ?? 0, uniqueListeners: listeners.length };
  }

  static async trackStats(trackUri: string) {
    const [playCount, aggregate] = await Promise.all([
      prisma.playHistory.count({ where: { trackUri } }),
      prisma.playHistory.aggregate({ where: { trackUri }, _sum: { msPlayed: true } }),
    ]);
    return { playCount, totalMs: aggregate._sum.msPlayed ?? 0 };
  }

  static async artistStats(artist: string) {
    const where = { artist: { equals: artist, mode: "insensitive" as const } };
    const [playCount, aggregate] = await Promise.all([
      prisma.playHistory.count({ where }),
      prisma.playHistory.aggregate({ where, _sum: { msPlayed: true } }),
    ]);
    return { playCount, totalMs: aggregate._sum.msPlayed ?? 0 };
  }

  static async skipRate(userDiscordId: string) {
    const user = await prisma.user.findUnique({ where: { discordId: userDiscordId } });
    if (!user) return 0;
    const [total, skipped] = await Promise.all([
      prisma.playHistory.count({ where: { userId: user.id } }),
      prisma.playHistory.count({ where: { userId: user.id, skipped: true } }),
    ]);
    return total ? skipped / total : 0;
  }

  static async listeningStreak(userDiscordId: string): Promise<number> {
    const user = await prisma.user.findUnique({ where: { discordId: userDiscordId } });
    if (!user) return 0;
    const rows = await prisma.playHistory.findMany({ where: { userId: user.id }, orderBy: { playedAt: "desc" } });
    const days = new Set(rows.map((r) => r.playedAt.toISOString().slice(0, 10)));
    let streak = 0;
    const cursor = new Date();
    while (days.has(cursor.toISOString().slice(0, 10))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  static async peakHours(userDiscordId: string) {
    const user = await prisma.user.findUnique({ where: { discordId: userDiscordId } });
    if (!user) return [];
    const rows = await prisma.playHistory.findMany({ where: { userId: user.id } });
    const buckets = new Array(24).fill(0);
    for (const r of rows) buckets[r.playedAt.getUTCHours()]++;
    return buckets;
  }

  static async guildLeaderboard(guildDiscordId: string, limit = 10) {
    const guild = await prisma.guild.findUnique({ where: { discordId: guildDiscordId } });
    if (!guild) return [];
    return prisma.playHistory.groupBy({
      by: ["userId"],
      where: { guildId: guild.id },
      _count: { userId: true },
      orderBy: { _count: { userId: "desc" } },
      take: limit,
    });
  }
}
