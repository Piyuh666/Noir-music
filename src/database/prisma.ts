import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";
import { discordSnowflake } from "../utils/limits";
import { config } from "../config";

// One process-wide Prisma client. Keeping construction here prevents accidental
// connection-pool multiplication when commands import database helpers.
const databaseUrl = config.database.url;

export const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl } },
  log: process.env.NODE_ENV === "production" ? [{ emit: "event", level: "error" }] : [{ emit: "event", level: "error" }, { emit: "event", level: "warn" }],
});

prisma.$on("error", (event) => {
  logger.error({ message: event.message, target: event.target }, "Prisma database error");
});

prisma.$on("warn", (event) => {
  logger.warn({ message: event.message, target: event.target }, "Prisma database warning");
});


let databaseReady = false;

export async function checkDatabaseReady(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseReady = true;
    return true;
  } catch (error) {
    databaseReady = false;
    logger.error({ err: error }, "NOIR MUSIC database readiness check failed");
    return false;
  }
}

export function isDatabaseReady(): boolean { return databaseReady; }

let disconnectPromise: Promise<void> | undefined;

export async function disconnectDatabase(): Promise<void> {
  databaseReady = false;
  if (!disconnectPromise) {
    disconnectPromise = prisma.$disconnect().catch((error) => {
      disconnectPromise = undefined;
      throw error;
    });
  }
  await disconnectPromise;
}

export async function upsertUser(discordId: string) {
  const id = discordSnowflake(discordId, "user id");
  return prisma.user.upsert({
    where: { discordId: id },
    update: {},
    create: { discordId: id },
  });
}

export async function upsertGuild(discordId: string) {
  const id = discordSnowflake(discordId, "guild id");
  return prisma.guild.upsert({
    where: { discordId: id },
    update: {},
    create: { discordId: id },
  });
}
