/** NOIR MUSIC // compatibility projection from the single bot configuration. */
import { BOT_CONFIG } from "./botConfig";

export const botIdentity = Object.freeze({
  developerIds: BOT_CONFIG.discord.developerIds,
  ownerIds: BOT_CONFIG.discord.ownerIds,
  guildIds: BOT_CONFIG.discord.guildIds,
  developmentGuildId: BOT_CONFIG.discord.developmentGuildId || undefined,
  supportGuildId: BOT_CONFIG.discord.supportGuildId || undefined,
  shardId: BOT_CONFIG.discord.shardId,
  shardCount: BOT_CONFIG.discord.shardCount,
});
