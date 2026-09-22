# Noir Music — Production Runbook

## Production boundary

Noir Music starts in a fail-closed mode when `NODE_ENV=production` (or the
same value is supplied through `BOT_CONFIG.app.environment`). The process
refuses to boot when required credentials remain sample values, the primary
PostgreSQL connection is not SSL-enabled, no Lavalink admission node exists,
or production debug endpoints are enabled.

The canonical configuration remains `src/config/botConfig.ts`. Environment
variables override the sample values without requiring credentials to be
committed to source control.

## Startup

1. Supply the real Discord token/application IDs and owner IDs.
2. Supply the primary PostgreSQL connection and enable SSL.
3. Supply real credentials for every enabled Redis/database replica and
   Lavalink node.
4. Set real dashboard/encryption secrets when the dashboard is enabled.
5. Keep `ALLOW_DEBUG_ENDPOINTS=false` in production.
6. Install dependencies from the complete lockfile used by the deployment
   environment.
7. Run Prisma generation/migrations through the deployment pipeline.
8. Run `npm run production:preflight`.
9. Start with `npm start`.

## Health endpoints

The process exposes a local HTTP health server:

- `/health/live` — process liveness; does not require dependencies.
- `/health/ready` — readiness; requires all readiness components, a working
  database probe, Discord readiness, and at least one healthy Lavalink node.
- `/health` — bounded runtime/readiness information.
- `/health/config` — disabled unless debug endpoints are explicitly enabled.

Use `npm run health:check` from the same network namespace as the process.
For a container/orchestrator, set `HEALTH_BIND_HOST=0.0.0.0` and restrict the
health port at the network boundary.

## Shutdown

SIGTERM/SIGINT initiate a single idempotent shutdown path. The bot stops
accepting new work, destroys the Discord connection, stops the health server,
releases session recovery state, closes Prisma, clears runtime samplers, and
exits within the configured grace period.

## Deployment caveat

The repository snapshot must contain a complete dependency lockfile before a
strict `npm ci` deployment is considered reproducible. This environment did
not have the package registry/cache available to regenerate the dependency
lock, so dependency installation and a full TypeScript/Vitest run remain
external deployment verification steps.
