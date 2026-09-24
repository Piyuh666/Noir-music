import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  PermissionResolvable,
} from "discord.js";

export type CommandCategory =
  | "playback" | "queue" | "discovery" | "playlists" | "lyrics" | "effects"
  | "dj" | "voice" | "radio" | "statistics" | "library" | "modes"
  | "automation" | "settings" | "help";

export interface CommandMeta {
  /** Unique dotted id, e.g. "queue.remove". Used for command counting — never reuse. */
  id: string;
  category: CommandCategory;
  description: string;
  /** Human-readable usage example, shown in /help command:<name> */
  example?: string;
  /** Non-canonical names that resolve to this command. NEVER counted toward the 300+ total. */
  aliases?: string[];
  permissions?: PermissionResolvable[];
  djOnly?: boolean;
  cooldownMs?: number;
  changesPlaybackState: boolean;
  requiresDb: boolean;
  requiresProvider: boolean;
}

export interface MusicCommand {
  meta: CommandMeta;
  /** Builds the discord.js definition. Either a full command or a subcommand fragment. */
  build: (builder: SlashCommandBuilder | SlashCommandSubcommandBuilder) => void;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
