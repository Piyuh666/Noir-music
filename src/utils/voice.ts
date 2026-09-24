import { ChatInputCommandInteraction, GuildMember } from "discord.js";
import { errorEmbed } from "../ui/embeds";

/** Returns the member's current voice channel id, or null + sends a standard error. */
export async function requireVoiceChannel(interaction: ChatInputCommandInteraction): Promise<string | null> {
  const member = interaction.member as GuildMember;
  const channelId = member.voice?.channelId;
  if (!channelId) {
    await interaction.reply({
      embeds: [
        errorEmbed(
          "Not in a voice channel",
          "Join a voice channel first, then try again.",
          "VOICE_001"
        ),
      ],
      ephemeral: true,
    });
    return null;
  }
  return channelId;
}

/** Ensures the invoking member is in the SAME voice channel as the bot's player, if one exists. */
export function isSameChannelAsPlayer(memberChannelId: string, playerChannelId?: string | null): boolean {
  if (!playerChannelId) return true; // no active player yet — any channel is fine
  return memberChannelId === playerChannelId;
}
