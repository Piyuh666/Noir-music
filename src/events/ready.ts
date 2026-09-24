import { Events, Client, REST, Routes } from "discord.js";
import { config } from "../config";
import { registry } from "../commands/registry";
import { logger } from "../utils/logger";

export async function registerReadyHandler(client: Client) {
  client.once(Events.ClientReady, (c) => {
    void (async () => {
      logger.info(`Logged in as ${c.user.tag}`);
      const rest = new REST().setToken(config.discord.token);
      const body = registry.toDiscordBuilders().map((b) => b.toJSON());

      if (config.discord.devGuildId) {
        await rest.put(
          Routes.applicationGuildCommands(config.discord.clientId, config.discord.devGuildId),
          { body },
        );
        logger.info(`Registered ${body.length} top-level commands to dev guild.`);
      } else {
        await rest.put(Routes.applicationCommands(config.discord.clientId), { body });
        logger.info(`Registered ${body.length} top-level commands globally.`);
      }
    })().catch((error) => {
      logger.error({ err: error }, "NOIR MUSIC command registration failed after Discord became ready");
    });
  });
}
