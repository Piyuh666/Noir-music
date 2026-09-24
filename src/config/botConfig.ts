/**
 * NOIR MUSIC // SINGLE BOT CONFIGURATION
 *
 * This is the one human-edited configuration surface for a deployment.
 * Replace SAMPLE_* values with real credentials before starting the bot.
 *
 * SECURITY:
 * - Every credential below is intentionally fake/sample data.
 * - Never commit real tokens, passwords, private keys or webhook secrets.
 * - Environment variables may override individual values when deploying with
 *   a secret manager, but this file remains the canonical configuration shape.
 */

export type BotConfigNodeRole = "PRIMARY" | "SECONDARY" | "EDGE" | "BACKUP";

export interface BotConfigLavalinkNode {
  readonly id: string;
  readonly host: string;
  readonly port: number;
  readonly authorization: string;
  readonly secure: boolean;
  readonly priority: number;
  readonly weight: number;
  readonly role: BotConfigNodeRole;
  readonly region: string;
  readonly resumeTimeoutMs: number;
  readonly capacityPlayers: number;
  readonly reservedCapacityPlayers: number;
  readonly healthIntervalMs: number;
  readonly healthTimeoutMs: number;
  readonly healthStaleAfterMs: number;
  readonly failureThreshold: number;
  readonly recoveryThreshold: number;
  readonly maxSystemLoadPercent: number;
  readonly maxLavalinkLoadPercent: number;
  readonly maxMemoryPercent: number;
  readonly minFreeMemoryBytes: number;
  readonly maxLatencyMs: number;
  readonly connectGraceMs: number;
  readonly selectionCooldownMs: number;
  readonly enabled: boolean;
  readonly allowNewPlayers: boolean;
}

const env = (name: string, fallback: string): string => process.env[name]?.trim() || fallback;
const envInt = (name: string, fallback: number): number => {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isSafeInteger(value) ? value : fallback;
};
const envBool = (name: string, fallback: boolean): boolean => {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return fallback;
  return ["1", "true", "yes", "on"].includes(raw) ? true : ["0", "false", "no", "off"].includes(raw) ? false : fallback;
};
const csv = (name: string, fallback: readonly string[]): readonly string[] => {
  const raw = process.env[name]?.trim();
  return Object.freeze(raw ? raw.split(",").map((value: string) => value.trim()).filter(Boolean) : [...fallback]);
};

/**
 * SAMPLE DATA ONLY. These values are deliberately non-functional.
 * Edit this file for a local deployment, or override them with environment
 * variables supplied by your secret manager.
 */
export const BOT_CONFIG = Object.freeze({
  app: Object.freeze({
    name: env("BOT_NAME", "NOIR MUSIC"),
    environment: env("NODE_ENV", "development"),
    version: env("BOT_CONFIG_VERSION", "1.0.0"),
    timezone: env("BOT_TIMEZONE", "Asia/Kolkata"),
    region: env("BOT_REGION", "IN-BR"),
  }),

  discord: Object.freeze({
    token: env("DISCORD_TOKEN", "SAMPLE_DISCORD_BOT_TOKEN_DO_NOT_USE_7K2M9P"),
    clientId: env("DISCORD_CLIENT_ID", "123456789012345678"),
    applicationId: env("DISCORD_APPLICATION_ID", "123456789012345678"),
    developerIds: csv("DISCORD_DEVELOPER_IDS", ["111111111111111111", "222222222222222222"]),
    ownerIds: csv("DISCORD_OWNER_IDS", ["333333333333333333"]),
    guildIds: csv("DISCORD_GUILD_IDS", ["444444444444444444", "555555555555555555"]),
    developmentGuildId: env("DISCORD_GUILD_ID_DEV", "444444444444444444"),
    supportGuildId: env("DISCORD_SUPPORT_GUILD_ID", "555555555555555555"),
    logChannelId: env("DISCORD_LOG_CHANNEL_ID", "666666666666666666"),
    errorChannelId: env("DISCORD_ERROR_CHANNEL_ID", "777777777777777777"),
    shardId: env("DISCORD_SHARD_ID", "0"),
    shardCount: env("DISCORD_SHARD_COUNT", "1"),
    intentsProfile: env("DISCORD_INTENTS_PROFILE", "music-standard"),
  }),

  database: Object.freeze({
    primary: Object.freeze({
      url: env("DATABASE_PRIMARY_URL", "postgresql://sample_user:SAMPLE_DB_PASSWORD@127.0.0.1:5432/noir_music"),
      host: env("DATABASE_PRIMARY_HOST", "127.0.0.1"),
      port: envInt("DATABASE_PRIMARY_PORT", 5432),
      name: env("DATABASE_PRIMARY_NAME", "noir_music"),
      user: env("DATABASE_PRIMARY_USER", "sample_user"),
      password: env("DATABASE_PRIMARY_PASSWORD", "SAMPLE_DB_PASSWORD_DO_NOT_USE"),
      ssl: envBool("DATABASE_PRIMARY_SSL", false),
      poolMin: envInt("DATABASE_PRIMARY_POOL_MIN", 2),
      poolMax: envInt("DATABASE_PRIMARY_POOL_MAX", 20),
    }),
    replica: Object.freeze({
      enabled: envBool("DATABASE_REPLICA_ENABLED", true),
      url: env("DATABASE_REPLICA_URL", "postgresql://sample_read:SAMPLE_REPLICA_PASSWORD@127.0.0.1:5433/noir_music"),
      host: env("DATABASE_REPLICA_HOST", "127.0.0.1"),
      port: envInt("DATABASE_REPLICA_PORT", 5433),
      name: env("DATABASE_REPLICA_NAME", "noir_music"),
      user: env("DATABASE_REPLICA_USER", "sample_read"),
      password: env("DATABASE_REPLICA_PASSWORD", "SAMPLE_REPLICA_PASSWORD_DO_NOT_USE"),
      ssl: envBool("DATABASE_REPLICA_SSL", false),
    }),
    pooler: Object.freeze({
      enabled: envBool("DATABASE_POOLER_ENABLED", false),
      url: env("DATABASE_POOLER_URL", "postgresql://sample_pool:SAMPLE_POOL_PASSWORD@127.0.0.1:6432/noir_music"),
      host: env("DATABASE_POOLER_HOST", "127.0.0.1"),
      port: envInt("DATABASE_POOLER_PORT", 6432),
      user: env("DATABASE_POOLER_USER", "sample_pool"),
      password: env("DATABASE_POOLER_PASSWORD", "SAMPLE_POOL_PASSWORD_DO_NOT_USE"),
    }),
    migration: Object.freeze({
      autoApply: envBool("DATABASE_AUTO_MIGRATE", false),
      shadowUrl: env("DATABASE_SHADOW_URL", "postgresql://sample_shadow:SAMPLE_SHADOW_PASSWORD@127.0.0.1:5432/noir_music_shadow"),
    }),
  }),

  redis: Object.freeze({
    enabled: envBool("REDIS_ENABLED", true),
    url: env("REDIS_URL", "redis://:SAMPLE_REDIS_PASSWORD@127.0.0.1:6379/0"),
    host: env("REDIS_HOST", "127.0.0.1"),
    port: envInt("REDIS_PORT", 6379),
    username: env("REDIS_USERNAME", "default"),
    password: env("REDIS_PASSWORD", "SAMPLE_REDIS_PASSWORD_DO_NOT_USE"),
    database: envInt("REDIS_DATABASE", 0),
    tls: envBool("REDIS_TLS", false),
  }),

  lavalink: Object.freeze({
    nodes: Object.freeze<readonly BotConfigLavalinkNode[]>([
      {
        id: "sample-in-primary",
        host: env("LAVALINK_1_HOST", "127.0.0.1"),
        port: envInt("LAVALINK_1_PORT", 2333),
        authorization: env("LAVALINK_1_PASSWORD", "SAMPLE_LAVALINK_PASSWORD_01_DO_NOT_USE"),
        secure: envBool("LAVALINK_1_SECURE", false),
        priority: envInt("LAVALINK_1_PRIORITY", 10),
        weight: envInt("LAVALINK_1_WEIGHT", 100),
        role: "PRIMARY",
        region: env("LAVALINK_1_REGION", "IN-BR"),
        resumeTimeoutMs: envInt("LAVALINK_1_RESUME_TIMEOUT_MS", 300000),
        capacityPlayers: envInt("LAVALINK_1_CAPACITY_PLAYERS", 250),
        reservedCapacityPlayers: envInt("LAVALINK_1_RESERVED_CAPACITY_PLAYERS", 10),
        healthIntervalMs: envInt("LAVALINK_1_HEALTH_INTERVAL_MS", 15000),
        healthTimeoutMs: envInt("LAVALINK_1_HEALTH_TIMEOUT_MS", 4000),
        healthStaleAfterMs: envInt("LAVALINK_1_HEALTH_STALE_AFTER_MS", 45000),
        failureThreshold: envInt("LAVALINK_1_FAILURE_THRESHOLD", 3),
        recoveryThreshold: envInt("LAVALINK_1_RECOVERY_THRESHOLD", 2),
        maxSystemLoadPercent: envInt("LAVALINK_1_MAX_SYSTEM_LOAD_PERCENT", 85),
        maxLavalinkLoadPercent: envInt("LAVALINK_1_MAX_LAVALINK_LOAD_PERCENT", 85),
        maxMemoryPercent: envInt("LAVALINK_1_MAX_MEMORY_PERCENT", 90),
        minFreeMemoryBytes: envInt("LAVALINK_1_MIN_FREE_MEMORY_BYTES", 268435456),
        maxLatencyMs: envInt("LAVALINK_1_MAX_LATENCY_MS", 1500),
        connectGraceMs: envInt("LAVALINK_1_CONNECT_GRACE_MS", 30000),
        selectionCooldownMs: envInt("LAVALINK_1_SELECTION_COOLDOWN_MS", 2000),
        enabled: envBool("LAVALINK_1_ENABLED", true),
        allowNewPlayers: envBool("LAVALINK_1_ALLOW_NEW_PLAYERS", true),
      },
      {
        id: "sample-in-secondary",
        host: env("LAVALINK_2_HOST", "127.0.0.1"),
        port: envInt("LAVALINK_2_PORT", 2334),
        authorization: env("LAVALINK_2_PASSWORD", "SAMPLE_LAVALINK_PASSWORD_02_DO_NOT_USE"),
        secure: envBool("LAVALINK_2_SECURE", false),
        priority: envInt("LAVALINK_2_PRIORITY", 20),
        weight: envInt("LAVALINK_2_WEIGHT", 100),
        role: "SECONDARY",
        region: env("LAVALINK_2_REGION", "IN-MH"),
        resumeTimeoutMs: envInt("LAVALINK_2_RESUME_TIMEOUT_MS", 300000),
        capacityPlayers: envInt("LAVALINK_2_CAPACITY_PLAYERS", 250),
        reservedCapacityPlayers: envInt("LAVALINK_2_RESERVED_CAPACITY_PLAYERS", 10),
        healthIntervalMs: envInt("LAVALINK_2_HEALTH_INTERVAL_MS", 15000),
        healthTimeoutMs: envInt("LAVALINK_2_HEALTH_TIMEOUT_MS", 4000),
        healthStaleAfterMs: envInt("LAVALINK_2_HEALTH_STALE_AFTER_MS", 45000),
        failureThreshold: envInt("LAVALINK_2_FAILURE_THRESHOLD", 3),
        recoveryThreshold: envInt("LAVALINK_2_RECOVERY_THRESHOLD", 2),
        maxSystemLoadPercent: envInt("LAVALINK_2_MAX_SYSTEM_LOAD_PERCENT", 85),
        maxLavalinkLoadPercent: envInt("LAVALINK_2_MAX_LAVALINK_LOAD_PERCENT", 85),
        maxMemoryPercent: envInt("LAVALINK_2_MAX_MEMORY_PERCENT", 90),
        minFreeMemoryBytes: envInt("LAVALINK_2_MIN_FREE_MEMORY_BYTES", 268435456),
        maxLatencyMs: envInt("LAVALINK_2_MAX_LATENCY_MS", 1500),
        connectGraceMs: envInt("LAVALINK_2_CONNECT_GRACE_MS", 30000),
        selectionCooldownMs: envInt("LAVALINK_2_SELECTION_COOLDOWN_MS", 2000),
        enabled: envBool("LAVALINK_2_ENABLED", true),
        allowNewPlayers: envBool("LAVALINK_2_ALLOW_NEW_PLAYERS", true),
      },
      {
        id: "sample-sg-edge",
        host: env("LAVALINK_3_HOST", "127.0.0.1"),
        port: envInt("LAVALINK_3_PORT", 2335),
        authorization: env("LAVALINK_3_PASSWORD", "SAMPLE_LAVALINK_PASSWORD_03_DO_NOT_USE"),
        secure: envBool("LAVALINK_3_SECURE", false),
        priority: envInt("LAVALINK_3_PRIORITY", 30),
        weight: envInt("LAVALINK_3_WEIGHT", 80),
        role: "EDGE",
        region: env("LAVALINK_3_REGION", "SG"),
        resumeTimeoutMs: envInt("LAVALINK_3_RESUME_TIMEOUT_MS", 300000),
        capacityPlayers: envInt("LAVALINK_3_CAPACITY_PLAYERS", 200),
        reservedCapacityPlayers: envInt("LAVALINK_3_RESERVED_CAPACITY_PLAYERS", 8),
        healthIntervalMs: envInt("LAVALINK_3_HEALTH_INTERVAL_MS", 15000),
        healthTimeoutMs: envInt("LAVALINK_3_HEALTH_TIMEOUT_MS", 4000),
        healthStaleAfterMs: envInt("LAVALINK_3_HEALTH_STALE_AFTER_MS", 45000),
        failureThreshold: envInt("LAVALINK_3_FAILURE_THRESHOLD", 3),
        recoveryThreshold: envInt("LAVALINK_3_RECOVERY_THRESHOLD", 2),
        maxSystemLoadPercent: envInt("LAVALINK_3_MAX_SYSTEM_LOAD_PERCENT", 85),
        maxLavalinkLoadPercent: envInt("LAVALINK_3_MAX_LAVALINK_LOAD_PERCENT", 85),
        maxMemoryPercent: envInt("LAVALINK_3_MAX_MEMORY_PERCENT", 90),
        minFreeMemoryBytes: envInt("LAVALINK_3_MIN_FREE_MEMORY_BYTES", 268435456),
        maxLatencyMs: envInt("LAVALINK_3_MAX_LATENCY_MS", 1800),
        connectGraceMs: envInt("LAVALINK_3_CONNECT_GRACE_MS", 30000),
        selectionCooldownMs: envInt("LAVALINK_3_SELECTION_COOLDOWN_MS", 2000),
        enabled: envBool("LAVALINK_3_ENABLED", true),
        allowNewPlayers: envBool("LAVALINK_3_ALLOW_NEW_PLAYERS", true),
      },
    ]),
    failoverCooldownMs: envInt("LAVALINK_FAILOVER_COOLDOWN_MS", 5000),
    failoverMaxAttempts: envInt("LAVALINK_FAILOVER_MAX_ATTEMPTS", 5),
    health: Object.freeze({
      enabled: envBool("LAVALINK_HEALTH_ENABLED", true),
      intervalMs: envInt("LAVALINK_HEALTH_INTERVAL_MS", 15000),
      timeoutMs: envInt("LAVALINK_HEALTH_TIMEOUT_MS", 4000),
      staleAfterMs: envInt("LAVALINK_HEALTH_STALE_AFTER_MS", 45000),
      failureThreshold: envInt("LAVALINK_HEALTH_FAILURE_THRESHOLD", 3),
      recoveryThreshold: envInt("LAVALINK_HEALTH_RECOVERY_THRESHOLD", 2),
      maxConcurrentProbes: envInt("LAVALINK_HEALTH_MAX_CONCURRENT_PROBES", 4),
      jitterMs: envInt("LAVALINK_HEALTH_JITTER_MS", 750),
    }),
  }),

  providers: Object.freeze({
    youtube: Object.freeze({ apiKey: env("YOUTUBE_API_KEY", "SAMPLE_YOUTUBE_API_KEY_DO_NOT_USE") }),
    spotify: Object.freeze({
      clientId: env("SPOTIFY_CLIENT_ID", "SAMPLE_SPOTIFY_CLIENT_ID"),
      clientSecret: env("SPOTIFY_CLIENT_SECRET", "SAMPLE_SPOTIFY_CLIENT_SECRET_DO_NOT_USE"),
    }),
    lrclib: Object.freeze({ baseUrl: env("LRCLIB_BASE_URL", "https://lrclib.net") }),
  }),

  dashboard: Object.freeze({
    enabled: envBool("DASHBOARD_ENABLED", true),
    url: env("DASHBOARD_URL", "http://127.0.0.1:3000"),
    port: envInt("DASHBOARD_PORT", 3000),
    sessionSecret: env("DASHBOARD_SESSION_SECRET", "SAMPLE_DASHBOARD_SESSION_SECRET_DO_NOT_USE"),
    cookieSecret: env("DASHBOARD_COOKIE_SECRET", "SAMPLE_DASHBOARD_COOKIE_SECRET_DO_NOT_USE"),
    oauthClientId: env("DASHBOARD_OAUTH_CLIENT_ID", "SAMPLE_DASHBOARD_OAUTH_CLIENT_ID"),
    oauthClientSecret: env("DASHBOARD_OAUTH_CLIENT_SECRET", "SAMPLE_DASHBOARD_OAUTH_CLIENT_SECRET_DO_NOT_USE"),
  }),

  security: Object.freeze({
    encryptionKey: env("ENCRYPTION_KEY", "SAMPLE_32_BYTE_ENCRYPTION_KEY_DO_NOT_USE"),
    webhookSigningSecret: env("WEBHOOK_SIGNING_SECRET", "SAMPLE_WEBHOOK_SIGNING_SECRET_DO_NOT_USE"),
    internalApiKey: env("INTERNAL_API_KEY", "SAMPLE_INTERNAL_API_KEY_DO_NOT_USE"),
    allowDebugEndpoints: envBool("ALLOW_DEBUG_ENDPOINTS", false),
    trustProxy: envBool("TRUST_PROXY", false),
  }),

  observability: Object.freeze({
    logLevel: env("LOG_LEVEL", "info"),
    metricsEnabled: envBool("METRICS_ENABLED", true),
    metricsPort: envInt("METRICS_PORT", 9090),
    healthPort: envInt("HEALTH_PORT", 9091),
    healthBindHost: env("HEALTH_BIND_HOST", "127.0.0.1"),
    sentryDsn: env("SENTRY_DSN", "SAMPLE_SENTRY_DSN_DO_NOT_USE"),
  }),

  bot: Object.freeze({
    defaultVolume: envInt("DEFAULT_VOLUME", 70),
    maxQueueSize: envInt("MAX_QUEUE_SIZE", 500),
    commandTimeoutMs: envInt("COMMAND_TIMEOUT_MS", 25000),
    componentMaxAgeMs: envInt("COMPONENT_MAX_AGE_MS", 1800000),
    always247: envBool("ALWAYS_247", true),
    autoReconnect: envBool("AUTO_RECONNECT", true),
    maxPlayersPerGuild: envInt("MAX_PLAYERS_PER_GUILD", 1),
  }),

  webhooks: Object.freeze({
    alertsUrl: env("ALERTS_WEBHOOK_URL", "https://example.invalid/noir-alerts"),
    deploymentUrl: env("DEPLOYMENT_WEBHOOK_URL", "https://example.invalid/noir-deployments"),
  }),

  paths: Object.freeze({
    data: env("DATA_DIR", "./data"),
    logs: env("LOG_DIR", "./logs"),
    cache: env("CACHE_DIR", "./cache"),
    backups: env("BACKUP_DIR", "./backups"),
  }),
});

export interface ProductionConfigValidation {
  readonly environment: string;
  readonly valid: boolean;
  readonly failures: readonly string[];
}

const SAMPLE_MARKERS = Object.freeze([
  "SAMPLE_",
  "example.invalid",
  "127.0.0.1",
]);

function looksSample(value: string): boolean {
  return SAMPLE_MARKERS.some((marker) => value.includes(marker));
}

/**
 * Fail-closed production configuration validation. Development/test may use
 * the deliberately fake sample values, but production may not. Secrets are
 * never returned by this function.
 */
export function validateProductionConfig(): ProductionConfigValidation {
  const failures: string[] = [];
  const environment = BOT_CONFIG.app.environment.trim().toLowerCase();
  if (environment !== "production") return Object.freeze({ environment, valid: true, failures: Object.freeze([]) });

  if (looksSample(BOT_CONFIG.discord.token)) failures.push("DISCORD_TOKEN is still a sample value");
  if (!/^\d{17,20}$/.test(BOT_CONFIG.discord.clientId)) failures.push("DISCORD_CLIENT_ID must be a Discord application id");
  if (!/^\d{17,20}$/.test(BOT_CONFIG.discord.applicationId)) failures.push("DISCORD_APPLICATION_ID must be a Discord application id");
  if (!BOT_CONFIG.discord.ownerIds.length) failures.push("at least one DISCORD_OWNER_IDS entry is required");
  if (!BOT_CONFIG.database.primary.url || looksSample(BOT_CONFIG.database.primary.url)) failures.push("primary database URL is not configured");
  if (!BOT_CONFIG.database.primary.ssl) failures.push("primary database SSL must be enabled in production");
  if (BOT_CONFIG.database.replica.enabled && looksSample(BOT_CONFIG.database.replica.url)) failures.push("enabled database replica contains a sample URL");
  if (BOT_CONFIG.redis.enabled && looksSample(BOT_CONFIG.redis.password)) failures.push("enabled Redis contains a sample password");
  if (!BOT_CONFIG.lavalink.nodes.some((node) => node.enabled && node.allowNewPlayers)) failures.push("at least one Lavalink admission node is required");
  if (BOT_CONFIG.lavalink.nodes.some((node) => node.enabled && looksSample(node.authorization))) failures.push("enabled Lavalink nodes contain sample credentials");
  if (BOT_CONFIG.dashboard.enabled) {
    if (looksSample(BOT_CONFIG.dashboard.url) || !/^https?:\/\//.test(BOT_CONFIG.dashboard.url)) failures.push("dashboard URL must be a real HTTP(S) URL");
    if (looksSample(BOT_CONFIG.dashboard.sessionSecret) || BOT_CONFIG.dashboard.sessionSecret.length < 32) failures.push("dashboard session secret must be a real 32+ character secret");
    if (looksSample(BOT_CONFIG.dashboard.cookieSecret) || BOT_CONFIG.dashboard.cookieSecret.length < 32) failures.push("dashboard cookie secret must be a real 32+ character secret");
    if (looksSample(BOT_CONFIG.dashboard.oauthClientSecret)) failures.push("dashboard OAuth client secret is still a sample value");
  }
  if (looksSample(BOT_CONFIG.security.encryptionKey) || BOT_CONFIG.security.encryptionKey.length < 32) failures.push("encryption key must be a real 32+ character secret");
  if (BOT_CONFIG.security.allowDebugEndpoints) failures.push("debug endpoints must be disabled in production");
  if (BOT_CONFIG.bot.maxPlayersPerGuild < 1) failures.push("MAX_PLAYERS_PER_GUILD must be at least 1");
  return Object.freeze({ environment, valid: failures.length === 0, failures: Object.freeze(failures) });
}

export function configSecretHealth() {
  const configured = (value: string, sampleMarker: string): boolean => Boolean(value) && !value.includes(sampleMarker);
  return Object.freeze({
    discordTokenConfigured: configured(BOT_CONFIG.discord.token, "SAMPLE_DISCORD"),
    databasePrimaryConfigured: configured(BOT_CONFIG.database.primary.password, "SAMPLE_DB_PASSWORD"),
    redisConfigured: !BOT_CONFIG.redis.enabled || configured(BOT_CONFIG.redis.password, "SAMPLE_REDIS_PASSWORD"),
    lavalinkConfigured: BOT_CONFIG.lavalink.nodes.filter((node) => !node.authorization.includes("SAMPLE_LAVALINK")).length,
    dashboardSecretConfigured: configured(BOT_CONFIG.dashboard.sessionSecret, "SAMPLE_DASHBOARD"),
    encryptionKeyConfigured: configured(BOT_CONFIG.security.encryptionKey, "SAMPLE_32_BYTE"),
  });
}
