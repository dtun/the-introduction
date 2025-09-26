import { UserProfile } from "@/schemas/userProfile";
import { Message } from "@/types/chat";
import { PromptContext } from "@/types/services";

export class PromptBuilder {
  static createPrompt(userMessage: string, context: PromptContext): string {
    const { currentProfile, missingFields, conversationHistory } = context;

    const systemPrompt = this.buildSystemPrompt(currentProfile, missingFields);
    const conversationContext =
      this.buildConversationContext(conversationHistory);

    return `${systemPrompt}

${conversationContext}

User: ${userMessage}

Respond naturally and help collect the missing profile information. Be conversational and friendly.`;
  }

  private static buildSystemPrompt(
    currentProfile: Partial<UserProfile>,
    missingFields: string[]
  ): string {
    return `You are a friendly profile builder assistant. Your job is to collect user profile information through natural conversation.

PROFILE SCHEMA:
- name (string, 2-50 chars) - Full name
- age (number, 13-120) - Age in years
- gender ("male", "female") - Biological gender
- location (string, 2-100 chars) - City, state/country

CURRENT PROFILE: ${JSON.stringify(currentProfile)}
MISSING FIELDS: ${missingFields.join(", ")}

RULES:
- Ask for ONE missing field at a time
- Be conversational and friendly, not robotic
- If user provides multiple pieces of info, acknowledge all but focus on what's still missing
- Keep responses under 50 words
- Don't repeat information you already have
- When you extract information, be confident about it

RESPONSE FORMAT:
Respond with natural conversation that guides toward collecting the next missing field.`;
  }

  private static buildConversationContext(
    conversationHistory: Message[]
  ): string {
    if (conversationHistory.length === 0) return "";

    const recentMessages = conversationHistory.slice(-6); // Last 6 messages for context
    return (
      "CONVERSATION HISTORY:\\n" +
      recentMessages.map((msg) => `${msg.sender}: ${msg.text}`).join("\\n")
    );
  }

  static createExtractionPrompt(
    userMessage: string,
    currentProfile: Partial<UserProfile>
  ): string {
    return `Extract profile information from this user message and current context.

USER MESSAGE: "${userMessage}"
CURRENT PROFILE: ${JSON.stringify(currentProfile)}

EXTRACTION RULES:
- Only extract information that is clearly stated or strongly implied
- Don't guess or make assumptions
- Return confidence score (0-1) for each extracted field
- If information conflicts with existing data, prefer the newer information

Return a JSON object with extracted profile data and confidence scores.

EXAMPLE RESPONSE:
{
  "name": "John Doe",
  "age": 25,
  "confidence": {
    "name": 0.95,
    "age": 0.9
  }
}`;
  }
}
