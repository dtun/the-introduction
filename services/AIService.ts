import { UserProfile } from "@/schemas/userProfile";
import { Message } from "@/types/chat";
import { AIServiceResponse, PromptContext } from "@/types/services";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { AIExtractor } from "./AIExtractor";
import { ProfileExtractor } from "./ProfileExtractor";
import { ProfileValidator } from "./ProfileValidator";
import { PromptBuilder } from "./PromptBuilder";

export class AIService {
  private static openai = createOpenAI({
    apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || "",
  });

  static async processMessage(
    userMessage: string,
    currentProfile: Partial<UserProfile>,
    conversationHistory: Message[] = []
  ): Promise<AIServiceResponse> {
    try {
      // Use AI-powered structured extraction
      const extractionResult = await AIExtractor.extractProfileData(
        userMessage,
        currentProfile
      );

      // Merge extracted data with current profile
      const updatedProfile = {
        ...currentProfile,
        ...extractionResult.extractedData,
      };
      const missingFields = ProfileValidator.getMissingFields(updatedProfile);

      // If profile is complete, validate with Zod and return completion
      if (extractionResult.isComplete) {
        const validation = AIExtractor.validateWithZod(updatedProfile);

        if (validation.isValid) {
          return {
            chatResponse:
              "Perfect! I have all the information I need. Let me show you your completed profile.",
            extractedData: updatedProfile,
            nextQuestion: "",
            confidence: 1.0,
          };
        } else {
          // Validation failed, continue conversation
          console.log("Validation errors:", validation.errors);
        }
      }

      // Generate AI response for missing fields
      const aiResponse = await this.generateAIResponse(
        userMessage,
        updatedProfile,
        missingFields,
        conversationHistory
      );

      // Determine next question based on missing fields
      const nextField = missingFields[0];
      const nextQuestion = nextField ? this.getQuestionForField(nextField) : "";

      return {
        chatResponse: aiResponse,
        extractedData: updatedProfile,
        nextQuestion,
        confidence: extractionResult.confidence,
      };
    } catch (error) {
      console.error("AIService error:", error);
      return this.getFallbackResponse(currentProfile);
    }
  }

  private static async generateAIResponse(
    userMessage: string,
    currentProfile: Partial<UserProfile>,
    missingFields: string[],
    conversationHistory: Message[]
  ): Promise<string> {
    const context: PromptContext = {
      currentProfile,
      missingFields,
      conversationHistory,
    };

    const prompt = PromptBuilder.createPrompt(userMessage, context);

    try {
      const { text } = await generateText({
        model: this.openai("gpt-4o-mini"),
        prompt,
        temperature: 0.7,
      });

      return text;
    } catch (error) {
      console.error("AI generation error:", error);
      throw error;
    }
  }

  private static getFallbackResponse(
    currentProfile: Partial<UserProfile>
  ): AIServiceResponse {
    const missingFields = ProfileValidator.getMissingFields(currentProfile);

    if (missingFields.length === 0) {
      return {
        chatResponse: "Great! I have all your information.",
        extractedData: currentProfile,
        nextQuestion: "",
        confidence: 0.8,
      };
    }

    const nextField = missingFields[0];
    const question = this.getQuestionForField(nextField);

    return {
      chatResponse: question,
      extractedData: currentProfile,
      nextQuestion: question,
      confidence: 0.5,
    };
  }

  private static getQuestionForField(field: string): string {
    const questions = {
      name: "What's your name?",
      age: "How old are you?",
      gender: "What's your biological gender? (male or female)",
      location: "Where are you from?",
    };

    return (
      questions[field as keyof typeof questions] ||
      "Could you tell me more about yourself?"
    );
  }

  static async validateProfileCompletion(
    profile: Partial<UserProfile>
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const validation = ProfileValidator.validateComplete(profile);
    return {
      isValid: validation.isValid,
      errors: validation.errors,
    };
  }

  static getProgressSummary(profile: Partial<UserProfile>): string {
    const extractionResult = ProfileValidator.validatePartial(profile);
    return ProfileExtractor.generateProgressSummary(extractionResult);
  }

  static isProfileComplete(profile: Partial<UserProfile>): boolean {
    return ProfileValidator.isProfileComplete(profile);
  }
}
