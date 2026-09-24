import "dotenv/config";
import { BOT_CONFIG, configSecretHealth, validateProductionConfig } from "./botConfig";
import { loadLavalinkNodes, lavalinkHealthConfig, lavalinkTopologySummary } from "./lavalinkNodes";
import { botIdentity } from "./botIdentity";
export { BOT_CONFIG, configSecretHealth, validateProductionConfig } from "./botConfig";
export { lavalinkHealthConfig } from "./lavalinkNodes";
export type { LavalinkNodeConfig, LavalinkHealthConfig, LavalinkTopologySummary } from "./lavalinkNodes";

const lavalinkNodes = loadLavalinkNodes();

export const config = Object.freeze({
  app: BOT_CONFIG.app,
  discord: Object.freeze({
    token: BOT_CONFIG.discord.token,
    clientId: BOT_CONFIG.discord.clientId,
    applicationId: BOT_CONFIG.discord.applicationId,
    devGuildId: botIdentity.developmentGuildId,
    developerIds: botIdentity.developerIds,
    ownerIds: botIdentity.ownerIds,
    guildIds: botIdentity.guildIds,
    supportGuildId: botIdentity.supportGuildId,
    logChannelId: BOT_CONFIG.discord.logChannelId,
    errorChannelId: BOT_CONFIG.discord.errorChannelId,
    shardId: botIdentity.shardId,
    shardCount: botIdentity.shardCount,
  }),
  database: Object.freeze({
    url: BOT_CONFIG.database.primary.url,
    primary: BOT_CONFIG.database.primary,
    replica: BOT_CONFIG.database.replica,
    pooler: BOT_CONFIG.database.pooler,
    migration: BOT_CONFIG.database.migration,
  }),
  redis: BOT_CONFIG.redis,
  lavalink: Object.freeze({
    nodes: lavalinkNodes,
    failoverCooldownMs: BOT_CONFIG.lavalink.failoverCooldownMs,
    failoverMaxAttempts: BOT_CONFIG.lavalink.failoverMaxAttempts,
    health: lavalinkHealthConfig,
  }),
  providers: BOT_CONFIG.providers,
  dashboard: BOT_CONFIG.dashboard,
  security: BOT_CONFIG.security,
  observability: BOT_CONFIG.observability,
  webhooks: BOT_CONFIG.webhooks,
  paths: BOT_CONFIG.paths,
  bot: BOT_CONFIG.bot,
});

export function configHealth() {
  return Object.freeze({
    app: Object.freeze({ name: config.app.name, environment: config.app.environment, region: config.app.region }),
    discord: Object.freeze({
      clientIdConfigured: Boolean(config.discord.clientId),
      developmentGuildConfigured: Boolean(config.discord.devGuildId),
      developerIds: config.discord.developerIds.length,
      ownerIds: config.discord.ownerIds.length,
      allowlistedGuilds: config.discord.guildIds.length,
      supportGuildConfigured: Boolean(config.discord.supportGuildId),
      shardId: config.discord.shardId,
      shardCount: config.discord.shardCount,
    }),
    database: Object.freeze({
      primaryConfigured: Boolean(config.database.primary.url),
      replicaEnabled: config.database.replica.enabled,
      poolerEnabled: config.database.pooler.enabled,
      autoMigrate: config.database.migration.autoApply,
    }),
    redis: Object.freeze({ enabled: config.redis.enabled, tls: config.redis.tls }),
    lavalink: Object.freeze({
      nodes: config.lavalink.nodes.length,
      topology: lavalinkTopologySummary(config.lavalink.nodes),
      secureNodes: config.lavalink.nodes.filter((node) => node.secure).length,
      capacities: config.lavalink.nodes.map((node) => ({ id: node.id, capacityPlayers: node.capacityPlayers })),
      failoverCooldownMs: config.lavalink.failoverCooldownMs,
      failoverMaxAttempts: config.lavalink.failoverMaxAttempts,
      health: config.lavalink.health,
    }),
    dashboard: Object.freeze({ enabled: config.dashboard.enabled, port: config.dashboard.port }),
    security: Object.freeze({ debugEndpoints: config.security.allowDebugEndpoints, trustProxy: config.security.trustProxy }),
    secrets: configSecretHealth(),
  });
}
