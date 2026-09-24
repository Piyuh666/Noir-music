import { prisma } from "../database/prisma";

async function ensureUser(discordId: string) {
  return prisma.user.upsert({ where: { discordId }, update: {}, create: { discordId } });
}

/** Accept either a Discord user id (legacy command callers) or a persisted User.id. */
async function resolveUserId(value: string): Promise<string> {
  const byId = await prisma.user.findUnique({ where: { id: value }, select: { id: true } }).catch(() => null);
  if (byId) return byId.id;
  return (await ensureUser(value)).id;
}
async function ensureGuild(discordId: string) {
  return prisma.guild.upsert({ where: { discordId }, update: {}, create: { discordId } });
}

export class PlaylistService {
  static async create(ownerDiscordId: string, name: string, guildDiscordId?: string) {
    const owner = await ensureUser(ownerDiscordId);
    const guild = guildDiscordId ? await ensureGuild(guildDiscordId) : undefined;
    return prisma.playlist.create({
      data: { ownerId: owner.id, name, guildId: guild?.id, visibility: guild ? "server" : "private" },
    });
  }

  static async delete(playlistId: string) {
    return prisma.playlist.delete({ where: { id: playlistId } });
  }

  static async rename(playlistId: string, name: string) {
    return prisma.playlist.update({ where: { id: playlistId }, data: { name } });
  }

  static async addTrack(playlistId: string, track: { uri: string; title: string; artist: string; durationMs: number; addedById: string }) {
    const playlist = await prisma.playlist.findUniqueOrThrow({ where: { id: playlistId }, select: { guildId: true } });
    const guild = playlist.guildId ? await prisma.guild.findUnique({ where: { id: playlist.guildId } }) : null;
    const max = guild?.maxPlaylistSize ?? 1000;
    const count = await prisma.playlistTrack.count({ where: { playlistId } });
    if (count >= max) throw new Error("PLAYLIST_LIMIT");
    return prisma.playlistTrack.create({
      data: {
        playlistId,
        trackUri: String(track.uri).slice(0, 2000),
        title: String(track.title).slice(0, 500),
        artist: String(track.artist).slice(0, 500),
        durationMs: Math.max(0, Math.min(Number(track.durationMs) || 0, 24 * 60 * 60 * 1000)),
        position: count,
        addedById: await resolveUserId(track.addedById),
      },
    });
  }

  static async removeTrack(playlistId: string, trackId: string) {
    const track = await prisma.playlistTrack.findFirstOrThrow({ where: { id: trackId, playlistId } });
    await prisma.playlistTrack.delete({ where: { id: track.id } });
    const remaining = await prisma.playlistTrack.findMany({ where: { playlistId }, orderBy: { position: "asc" } });
    await prisma.$transaction(remaining.map((t, i) => prisma.playlistTrack.update({ where: { id: t.id }, data: { position: i } })));
    return track;
  }

  static async moveTrack(playlistId: string, fromPos: number, toPos: number) {
    const tracks = await prisma.playlistTrack.findMany({ where: { playlistId }, orderBy: { position: "asc" } });
    if (fromPos < 0 || fromPos >= tracks.length || toPos < 0 || toPos >= tracks.length) throw new Error("Invalid position");
    const [moved] = tracks.splice(fromPos, 1);
    tracks.splice(toPos, 0, moved);
    await prisma.$transaction(tracks.map((t, i) => prisma.playlistTrack.update({ where: { id: t.id }, data: { position: i } })));
    return moved;
  }

  static async copyTrack(fromPlaylistId: string, toPlaylistId: string, trackId: string) {
    const track = await prisma.playlistTrack.findUniqueOrThrow({ where: { id: trackId } });
    return PlaylistService.addTrack(toPlaylistId, { uri: track.trackUri, title: track.title, artist: track.artist, durationMs: track.durationMs, addedById: track.addedById });
  }

  static async duplicate(playlistId: string, ownerDiscordId: string, newName: string) {
    const original = await prisma.playlist.findUniqueOrThrow({ where: { id: playlistId }, include: { tracks: true } });
    const owner = await ensureUser(ownerDiscordId);
    const clone = await prisma.playlist.create({ data: { ownerId: owner.id, name: newName, visibility: "private" } });
    await prisma.playlistTrack.createMany({
      data: original.tracks.map((t) => ({ playlistId: clone.id, trackUri: t.trackUri, title: t.title, artist: t.artist, durationMs: t.durationMs, position: t.position, addedById: t.addedById })),
    });
    return clone;
  }

  static async merge(sourceId: string, targetId: string) {
    const source = await prisma.playlistTrack.findMany({ where: { playlistId: sourceId } });
    const target = await prisma.playlist.findUniqueOrThrow({ where: { id: targetId }, select: { guildId: true } });
    const guild = target.guildId ? await prisma.guild.findUnique({ where: { id: target.guildId } }) : null;
    const count = await prisma.playlistTrack.count({ where: { playlistId: targetId } });
    const max = guild?.maxPlaylistSize ?? 1000;
    const room = Math.max(0, max - count);
    if (source.length > room) throw new Error("PLAYLIST_LIMIT");
    await prisma.playlistTrack.createMany({
      data: source.map((t, i) => ({ playlistId: targetId, trackUri: t.trackUri, title: t.title, artist: t.artist, durationMs: t.durationMs, position: count + i, addedById: t.addedById })),
    });
    return prisma.playlist.findUniqueOrThrow({ where: { id: targetId } });
  }

  static async split(playlistId: string, atPosition: number, ownerDiscordId: string, newName: string) {
    const tracks = await prisma.playlistTrack.findMany({ where: { playlistId }, orderBy: { position: "asc" } });
    const tail = tracks.slice(atPosition);
    const owner = await ensureUser(ownerDiscordId);
    const newPlaylist = await prisma.playlist.create({ data: { ownerId: owner.id, name: newName, visibility: "private" } });
    await prisma.playlistTrack.createMany({
      data: tail.map((t, i) => ({ playlistId: newPlaylist.id, trackUri: t.trackUri, title: t.title, artist: t.artist, durationMs: t.durationMs, position: i, addedById: t.addedById })),
    });
    await prisma.playlistTrack.deleteMany({ where: { id: { in: tail.map((t) => t.id) } } });
    return newPlaylist;
  }

  static async shuffle(playlistId: string) {
    const tracks = await prisma.playlistTrack.findMany({ where: { playlistId } });
    for (let i = tracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tracks[i], tracks[j]] = [tracks[j], tracks[i]];
    }
    await prisma.$transaction(tracks.map((t, i) => prisma.playlistTrack.update({ where: { id: t.id }, data: { position: i } })));
  }

  static async reverse(playlistId: string) {
    const tracks = await prisma.playlistTrack.findMany({ where: { playlistId }, orderBy: { position: "asc" } });
    const reversed = [...tracks].reverse();
    await prisma.$transaction(reversed.map((t, i) => prisma.playlistTrack.update({ where: { id: t.id }, data: { position: i } })));
  }

  static async sort(playlistId: string, by: "title" | "artist" | "duration") {
    const orderBy = by === "title" ? { title: "asc" as const } : by === "artist" ? { artist: "asc" as const } : { durationMs: "asc" as const };
    const tracks = await prisma.playlistTrack.findMany({ where: { playlistId }, orderBy });
    await prisma.$transaction(tracks.map((t, i) => prisma.playlistTrack.update({ where: { id: t.id }, data: { position: i } })));
  }

  static async list(playlistId: string) {
    return prisma.playlistTrack.findMany({ where: { playlistId }, orderBy: { position: "asc" } });
  }

  static async share(playlistId: string) {
    return prisma.playlist.update({ where: { id: playlistId }, data: { visibility: "shared" } });
  }

  static async unshare(playlistId: string) {
    return prisma.playlist.update({ where: { id: playlistId }, data: { visibility: "private" } });
  }

  static async addCollaborator(playlistId: string, userDiscordId: string, role: "editor" | "viewer" = "editor") {
    const user = await ensureUser(userDiscordId);
    return prisma.playlistCollaborator.upsert({
      where: { playlistId_userId: { playlistId, userId: user.id } },
      update: { role },
      create: { playlistId, userId: user.id, role },
    });
  }

  static async removeCollaborator(playlistId: string, userDiscordId: string) {
    const user = await ensureUser(userDiscordId);
    return prisma.playlistCollaborator.delete({ where: { playlistId_userId: { playlistId, userId: user.id } } });
  }

  static async exportJson(playlistId: string) {
    const playlist = await prisma.playlist.findUniqueOrThrow({ where: { id: playlistId }, include: { tracks: true } });
    return JSON.stringify({ name: playlist.name, tracks: playlist.tracks.map((t) => ({ uri: t.trackUri, title: t.title, artist: t.artist, durationMs: t.durationMs })) }, null, 2);
  }

  static async importJson(ownerDiscordId: string, json: string) {
    if (Buffer.byteLength(json, "utf8") > 2_000_000) throw new Error("PLAYLIST_IMPORT_TOO_LARGE");
    let parsed: { name: string; tracks: { uri: string; title: string; artist: string; durationMs: number }[] };
    try {
      parsed = JSON.parse(json) as typeof parsed;
    } catch {
      throw new Error("PLAYLIST_IMPORT_INVALID");
    }
    if (!parsed || typeof parsed.name !== "string" || !Array.isArray(parsed.tracks)) throw new Error("PLAYLIST_IMPORT_INVALID");
    if (!parsed.tracks.length || parsed.tracks.length > 5000 || parsed.name.trim().length === 0) throw new Error("PLAYLIST_IMPORT_INVALID");
    for (const track of parsed.tracks) {
      if (!track || typeof track.uri !== "string" || !track.uri.trim() || typeof track.title !== "string" || typeof track.artist !== "string") {
        throw new Error("PLAYLIST_IMPORT_INVALID");
      }
    }
    const owner = await ensureUser(ownerDiscordId);
    const playlist = await prisma.playlist.create({ data: { ownerId: owner.id, name: parsed.name.slice(0, 100), visibility: "private" } });
    await prisma.playlistTrack.createMany({
      data: parsed.tracks.map((t, i) => ({ playlistId: playlist.id, trackUri: String(t.uri).slice(0, 2000), title: String(t.title).slice(0, 500), artist: String(t.artist).slice(0, 500), durationMs: Math.max(0, Math.min(Number(t.durationMs) || 0, 24 * 60 * 60 * 1000)), position: i, addedById: owner.id })),
    });
    return playlist;
  }

  static async favorite(playlistId: string) {
    // Playlist "favoriting" reuses the isSmart-adjacent visibility flag space —
    // modeled here as a dedicated boolean would be a 1-line schema addition;
    // tracked via a Favorite row against a synthetic "playlist:<id>" uri so it
    // shares the existing Favorite table rather than adding a new one.
    const playlist = await prisma.playlist.findUniqueOrThrow({ where: { id: playlistId } });
    return prisma.favorite.upsert({
      where: { userId_trackUri: { userId: playlist.ownerId, trackUri: `playlist:${playlistId}` } },
      update: {},
      create: { userId: playlist.ownerId, trackUri: `playlist:${playlistId}`, title: playlist.name, artist: "playlist" },
    });
  }

  static async unfavorite(playlistId: string) {
    const playlist = await prisma.playlist.findUniqueOrThrow({ where: { id: playlistId } });
    return prisma.favorite.deleteMany({ where: { userId: playlist.ownerId, trackUri: `playlist:${playlistId}` } });
  }

  static async clone(playlistId: string, ownerDiscordId: string) {
    const original = await prisma.playlist.findUniqueOrThrow({ where: { id: playlistId } });
    return PlaylistService.duplicate(playlistId, ownerDiscordId, `${original.name} (Copy)`);
  }

  static async stats(playlistId: string) {
    const tracks = await prisma.playlistTrack.findMany({ where: { playlistId } });
    const totalMs = tracks.reduce((sum, t) => sum + t.durationMs, 0);
    return { trackCount: tracks.length, totalMs };
  }

  static async byOwner(ownerDiscordId: string) {
    const owner = await ensureUser(ownerDiscordId);
    return prisma.playlist.findMany({ where: { ownerId: owner.id } });
  }

  static async search(ownerDiscordId: string, query: string) {
    const owner = await ensureUser(ownerDiscordId);
    return prisma.playlist.findMany({ where: { ownerId: owner.id, name: { contains: query, mode: "insensitive" } } });
  }

  static async setCover(playlistId: string, url: string) {
    return prisma.playlist.update({ where: { id: playlistId }, data: { coverUrl: url } });
  }

  static async setDescription(playlistId: string, description: string) {
    return prisma.playlist.update({ where: { id: playlistId }, data: { description } });
  }

  static async setVisibility(playlistId: string, visibility: "private" | "shared" | "server" | "public") {
    return prisma.playlist.update({ where: { id: playlistId }, data: { visibility } });
  }

  static async transferOwner(playlistId: string, newOwnerDiscordId: string) {
    const newOwner = await ensureUser(newOwnerDiscordId);
    return prisma.playlist.update({ where: { id: playlistId }, data: { ownerId: newOwner.id } });
  }

  static async findById(playlistId: string) {
    return prisma.playlist.findUnique({ where: { id: playlistId }, include: { tracks: true } });
  }

  static async smartCreate(ownerDiscordId: string, name: string, seedGenre: string) {
    const owner = await ensureUser(ownerDiscordId);
    return prisma.playlist.create({ data: { ownerId: owner.id, name, visibility: "private", isSmart: true, description: `Auto-curated: ${seedGenre}` } });
  }

  static async lock(playlistId: string) {
    return prisma.playlist.update({ where: { id: playlistId }, data: { locked: true } });
  }

  static async unlock(playlistId: string) {
    return prisma.playlist.update({ where: { id: playlistId }, data: { locked: false } });
  }

  static async backup(playlistId: string) {
    const original = await prisma.playlist.findUniqueOrThrow({ where: { id: playlistId }, include: { tracks: true } });
    const backupName = `${original.name} (Backup ${new Date().toISOString().slice(0, 10)})`;
    const backup = await prisma.playlist.create({ data: { ownerId: original.ownerId, name: backupName, visibility: "private" } });
    await prisma.playlistTrack.createMany({
      data: original.tracks.map((t) => ({ playlistId: backup.id, trackUri: t.trackUri, title: t.title, artist: t.artist, durationMs: t.durationMs, position: t.position, addedById: t.addedById })),
    });
    return backup;
  }

  static async restore(playlistId: string, backupPlaylistId: string) {
    const backup = await prisma.playlist.findUniqueOrThrow({ where: { id: backupPlaylistId }, include: { tracks: true } });
    await prisma.playlistTrack.deleteMany({ where: { playlistId } });
    await prisma.playlistTrack.createMany({
      data: backup.tracks.map((t) => ({ playlistId, trackUri: t.trackUri, title: t.title, artist: t.artist, durationMs: t.durationMs, position: t.position, addedById: t.addedById })),
    });
    return prisma.playlist.findUniqueOrThrow({ where: { id: playlistId } });
  }
}
