import { UserProfile } from "@/schemas/userProfile";
import { ParsedAIResponse } from "@/types/services";

export class ResponseProcessor {
  static parse(aiResponse: string): ParsedAIResponse {
    try {
      // Try to extract JSON from the response if present
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      let structuredData: Partial<UserProfile> | undefined;

      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          structuredData = this.extractProfileData(parsed);
        } catch {
          // JSON parsing failed, fall back to text extraction
        }
      }

      // If no JSON or JSON parsing failed, extract from text
      if (!structuredData) {
        structuredData = this.extractFromText(aiResponse);
      }

      return {
        text: aiResponse,
        structuredData,
        confidence: this.calculateConfidence(aiResponse, structuredData),
        suggestedNextQuestion: this.generateNextQuestion(structuredData),
      };
    } catch (error) {
      return {
        text: aiResponse,
        confidence: 0.5,
      };
    }
  }

  static parseStructuredData(response: string): Partial<UserProfile> {
    try {
      // First try direct JSON parsing
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return this.extractProfileData(parsed);
      }

      // If no JSON found, we should use AI extraction instead of regex
      // For now, return empty object - this will be handled by AIService
      return {};
    } catch {
      return {};
    }
  }

  private static extractProfileData(data: any): Partial<UserProfile> {
    const extracted: Partial<UserProfile> = {};

    if (data.name && typeof data.name === "string") {
      extracted.name = data.name.trim();
    }

    if (
      data.age &&
      (typeof data.age === "number" || !isNaN(Number(data.age)))
    ) {
      extracted.age = Number(data.age);
    }

    if (data.gender && typeof data.gender === "string") {
      const gender = data.gender.toLowerCase();
      if (["male", "female", "other", "prefer-not-to-say"].includes(gender)) {
        extracted.gender = gender as UserProfile["gender"];
      }
    }

    if (data.location && typeof data.location === "string") {
      extracted.location = data.location.trim();
    }

    return extracted;
  }

  private static extractFromText(text: string): Partial<UserProfile> {
    const extracted: Partial<UserProfile> = {};

    // Extract name patterns
    const namePatterns = [
      /(?:name is|i'm|call me|my name is)\s+([a-zA-Z\s]+)/i,
      /^([A-Z][a-z]+\s+[A-Z][a-z]+)/i, // First Last name pattern
      /^([a-zA-Z]+\s+[a-zA-Z]+)$/i, // Simple "First Last" pattern
      /^([a-zA-Z]{2,})\s*$/i, // Single name
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        extracted.name = match[1].trim();
        break;
      }
    }

    // Extract age patterns
    const agePatterns = [
      /(?:age is|i'm|years old|age:|aged)\s*(\d+)/i,
      /(\d+)\s*(?:years old|yrs old|y\.o\.|years)/i,
      /^(\d+)$/i, // Just a number
    ];

    for (const pattern of agePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const age = parseInt(match[1]);
        if (age >= 13 && age <= 120) {
          extracted.age = age;
          break;
        }
      }
    }

    // Extract location patterns
    const locationPatterns = [
      /(?:from|live in|location is|located in|based in)\s+([a-zA-Z\s,.-]+)/i,
      /(?:in|at)\s+([A-Z][a-z]+(?:[\s,]+[A-Z][a-z]+)*)/i,
      /^([A-Z][a-zA-Z\s,.-]{1,})/i, // City starting with capital
    ];

    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        extracted.location = match[1].trim();
        break;
      }
    }

    // Extract gender patterns
    if (
      text.toLowerCase().includes("male") &&
      !text.toLowerCase().includes("female")
    ) {
      extracted.gender = "male";
    } else if (text.toLowerCase().includes("female")) {
      extracted.gender = "female";
    }

    return extracted;
  }

  private static calculateConfidence(
    text: string,
    extractedData?: Partial<UserProfile>
  ): number {
    if (!extractedData || Object.keys(extractedData).length === 0) {
      return 0.1;
    }

    let confidence = 0.5; // Base confidence

    // Increase confidence based on explicit patterns
    if (extractedData.name && text.toLowerCase().includes("name")) {
      confidence += 0.2;
    }

    if (extractedData.age && text.toLowerCase().includes("age")) {
      confidence += 0.2;
    }

    if (
      extractedData.location &&
      (text.toLowerCase().includes("from") ||
        text.toLowerCase().includes("live"))
    ) {
      confidence += 0.2;
    }

    if (extractedData.gender) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  private static generateNextQuestion(
    extractedData?: Partial<UserProfile>
  ): string {
    if (!extractedData?.name) return "What's your name?";
    if (!extractedData?.age) return "How old are you?";
    if (!extractedData?.gender) return "What's your gender?";
    if (!extractedData?.location) return "Where are you from?";
    return "Great! I think I have all the information I need.";
  }
}
