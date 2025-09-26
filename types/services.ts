import { UserProfile } from "@/schemas/userProfile";
import { Message } from "@/types/chat";

export interface AIServiceResponse {
  chatResponse: string;
  extractedData: Partial<UserProfile>;
  nextQuestion: string;
  confidence: number;
}

export interface ExtractionResult {
  validData: Partial<UserProfile>;
  errors: string[];
  missingRequired: string[];
  completionStatus: Record<keyof UserProfile, boolean>;
}

export interface PromptContext {
  currentProfile: Partial<UserProfile>;
  missingFields: string[];
  conversationHistory: Message[];
}

export interface ParsedAIResponse {
  text: string;
  structuredData?: Partial<UserProfile>;
  confidence: number;
  suggestedNextQuestion?: string;
}
