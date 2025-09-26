import { UserProfile } from "@/schemas/userProfile";
import { ExtractionResult } from "@/types/services";
import { ProfileValidator } from "./ProfileValidator";
import { ResponseProcessor } from "./ResponseProcessor";

export class ProfileExtractor {
  static extract(
    aiResponse: string,
    currentProfile: Partial<UserProfile>
  ): ExtractionResult {
    // Parse the AI response to extract structured data
    const extractedData = ResponseProcessor.parseStructuredData(aiResponse);

    // Merge with current profile (new data takes precedence)
    const mergedProfile = { ...currentProfile, ...extractedData };

    // Validate the merged profile
    const validationResult = ProfileValidator.validatePartial(mergedProfile);

    return validationResult;
  }

  static extractFromUserMessage(
    userMessage: string,
    currentProfile: Partial<UserProfile>
  ): ExtractionResult {
    // Extract data directly from user message using text processing
    const extractedData = ResponseProcessor.parseStructuredData(userMessage);

    // Merge with current profile
    const mergedProfile = { ...currentProfile, ...extractedData };

    // Validate the merged profile
    const validationResult = ProfileValidator.validatePartial(mergedProfile);

    return validationResult;
  }

  static calculateOverallConfidence(
    extractionResult: ExtractionResult
  ): number {
    const { validData, errors, completionStatus } = extractionResult;

    // Start with base confidence
    let confidence = 0.5;

    // Increase confidence based on valid data
    const validFieldCount = Object.keys(validData).length;
    const totalFields = 4; // name, age, gender, location
    confidence += (validFieldCount / totalFields) * 0.3;

    // Decrease confidence based on errors
    if (errors.length > 0) {
      confidence -= errors.length * 0.1;
    }

    // Increase confidence based on completion status
    const completedFields =
      Object.values(completionStatus).filter(Boolean).length;
    confidence += (completedFields / totalFields) * 0.2;

    // Ensure confidence is between 0 and 1
    return Math.max(0, Math.min(1, confidence));
  }

  static getNextRequiredField(
    extractionResult: ExtractionResult
  ): string | null {
    const { missingRequired } = extractionResult;

    if (missingRequired.length === 0) {
      return null; // Profile is complete
    }

    // Return the first missing field in order of importance
    const fieldOrder = ["name", "age", "gender", "location"];

    for (const field of fieldOrder) {
      if (missingRequired.includes(field)) {
        return field;
      }
    }

    return missingRequired[0]; // Fallback
  }

  static generateProgressSummary(extractionResult: ExtractionResult): string {
    const { validData, completionStatus, missingRequired } = extractionResult;

    const completedFields = Object.entries(completionStatus)
      .filter(([_, isComplete]) => isComplete)
      .map(([field, _]) => field);

    if (completedFields.length === 0) {
      return "Let's start building your profile!";
    }

    if (missingRequired.length === 0) {
      return "Great! Your profile is complete.";
    }

    const completedFieldsText = completedFields.join(", ");
    const remainingFieldsText = missingRequired.join(", ");

    return `Progress: Got your ${completedFieldsText}. Still need: ${remainingFieldsText}.`;
  }

  static isExtractionComplete(extractionResult: ExtractionResult): boolean {
    return extractionResult.missingRequired.length === 0;
  }

  static getConfidenceLevel(confidence: number): "low" | "medium" | "high" {
    if (confidence < 0.4) return "low";
    if (confidence < 0.7) return "medium";
    return "high";
  }
}
