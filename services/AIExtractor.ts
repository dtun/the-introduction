import { UserProfile } from "@/schemas/userProfile";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

// Partial schema for extraction - all fields optional
const extractionSchema = z.object({
  name: z.string().optional(),
  age: z.number().int().min(13).max(120).optional(),
  gender: z.enum(["male", "female"]).optional(),
  location: z.string().optional(),
});

export type ExtractedData = z.infer<typeof extractionSchema>;

export class AIExtractor {
  private static openai = createOpenAI({
    apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || "",
  });

  static async extractProfileData(
    userMessage: string,
    currentProfile: Partial<UserProfile>
  ): Promise<{
    extractedData: ExtractedData;
    confidence: number;
    isComplete: boolean;
  }> {
    try {
      const { object } = await generateObject({
        model: this.openai("gpt-4o-mini"),
        schema: extractionSchema,
        system: `You are a profile data extraction system. Analyze the user's message and extract any profile information.

CURRENT PROFILE: ${JSON.stringify(currentProfile)}

Your task is to identify if the user is providing any of these pieces of information:
- name: Their full name or first name
- age: Their age in years (must be a number between 13-120)
- gender: Biological gender - "male" or "female" only
- location: Where they live (city, state, country)

EXAMPLES:
User: "My name is Danny" → {"name": "Danny"}
User: "I'm 25" → {"age": 25}
User: "I'm from New York" → {"location": "New York"}
User: "I'm male" → {"gender": "male"}
User: "Danny, 25, male, NYC" → {"name": "Danny", "age": 25, "gender": "male", "location": "NYC"}
User: "I'm female" → {"gender": "female"}

If the message doesn't contain clear profile information, return an empty object {}.`,
        prompt: `Analyze this message and extract any profile information: "${userMessage}"`,
        temperature: 0.1,
        maxRetries: 2,
      });

      // Merge with current profile
      const mergedData = { ...currentProfile, ...object };

      // Calculate confidence based on how much new data we extracted
      const extractedFields = Object.keys(object).length;
      const confidence = extractedFields > 0 ? 0.9 : 0.1;

      // Check if profile is complete
      const isComplete = !!(
        mergedData.name &&
        mergedData.age &&
        mergedData.gender &&
        mergedData.location
      );

      return {
        extractedData: object,
        confidence,
        isComplete,
      };
    } catch (error) {
      console.error("AI extraction error:", error);

      // If AI fails completely, return empty extraction
      return {
        extractedData: {},
        confidence: 0.1,
        isComplete: false,
      };
    }
  }

  static validateWithZod(data: Partial<UserProfile>): {
    isValid: boolean;
    validatedData?: UserProfile;
    errors: string[];
  } {
    try {
      const validatedData = extractionSchema.parse(data);

      // Check if all required fields are present
      if (
        validatedData.name &&
        validatedData.age &&
        validatedData.gender &&
        validatedData.location
      ) {
        return {
          isValid: true,
          validatedData: validatedData as UserProfile,
          errors: [],
        };
      } else {
        return {
          isValid: false,
          errors: ["Profile incomplete - missing required fields"],
        };
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.issues.map(
            (err) => `${err.path.join(".")}: ${err.message}`
          ),
        };
      }
      return {
        isValid: false,
        errors: ["Unknown validation error"],
      };
    }
  }
}
