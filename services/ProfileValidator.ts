import { UserProfile, userProfileSchema } from "@/schemas/userProfile";
import { ExtractionResult } from "@/types/services";
import { z } from "zod";

export class ProfileValidator {
  static validatePartial(
    extractedData: Partial<UserProfile>
  ): ExtractionResult {
    const validData: Partial<UserProfile> = {};
    const errors: string[] = [];
    const missingRequired: string[] = [];
    const completionStatus: Record<keyof UserProfile, boolean> = {
      name: false,
      age: false,
      gender: false,
      location: false,
    };

    // Validate each field individually
    this.validateName(extractedData.name, validData, errors, completionStatus);
    this.validateAge(extractedData.age, validData, errors, completionStatus);
    this.validateGender(
      extractedData.gender,
      validData,
      errors,
      completionStatus
    );
    this.validateLocation(
      extractedData.location,
      validData,
      errors,
      completionStatus
    );

    // Determine missing required fields
    Object.entries(completionStatus).forEach(([field, isComplete]) => {
      if (!isComplete) {
        missingRequired.push(field);
      }
    });

    return {
      validData,
      errors,
      missingRequired,
      completionStatus,
    };
  }

  static validateComplete(profileData: Partial<UserProfile>): {
    isValid: boolean;
    validatedProfile?: UserProfile;
    errors: string[];
  } {
    try {
      const validatedProfile = userProfileSchema.parse(profileData);
      return {
        isValid: true,
        validatedProfile,
        errors: [],
      };
    } catch (error) {
      const errors: string[] = [];

      if (error instanceof z.ZodError) {
        errors.push(
          ...error.issues.map((err) => `${err.path.join(".")}: ${err.message}`)
        );
      } else {
        errors.push("Unknown validation error");
      }

      return {
        isValid: false,
        errors,
      };
    }
  }

  private static validateName(
    name: string | undefined,
    validData: Partial<UserProfile>,
    errors: string[],
    completionStatus: Record<keyof UserProfile, boolean>
  ): void {
    if (!name) {
      return;
    }

    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      errors.push("Name must be at least 2 characters");
      return;
    }

    if (trimmedName.length > 50) {
      errors.push("Name must be less than 50 characters");
      return;
    }

    // Basic name validation - should contain letters
    if (!/^[a-zA-Z\s'-]+$/.test(trimmedName)) {
      errors.push(
        "Name should only contain letters, spaces, hyphens, and apostrophes"
      );
      return;
    }

    validData.name = trimmedName;
    completionStatus.name = true;
  }

  private static validateAge(
    age: number | undefined,
    validData: Partial<UserProfile>,
    errors: string[],
    completionStatus: Record<keyof UserProfile, boolean>
  ): void {
    if (age === undefined) {
      return;
    }

    if (!Number.isInteger(age)) {
      errors.push("Age must be a whole number");
      return;
    }

    if (age < 13) {
      errors.push("Must be at least 13 years old");
      return;
    }

    if (age > 120) {
      errors.push("Age must be less than 120");
      return;
    }

    validData.age = age;
    completionStatus.age = true;
  }

  private static validateGender(
    gender: string | undefined,
    validData: Partial<UserProfile>,
    errors: string[],
    completionStatus: Record<keyof UserProfile, boolean>
  ): void {
    if (!gender) {
      return;
    }

    const normalizedGender = gender.toLowerCase().trim();
    const validGenders = ["male", "female"];

    if (!validGenders.includes(normalizedGender)) {
      errors.push("Biological gender must be either male or female");
      return;
    }

    validData.gender = normalizedGender as UserProfile["gender"];
    completionStatus.gender = true;
  }

  private static validateLocation(
    location: string | undefined,
    validData: Partial<UserProfile>,
    errors: string[],
    completionStatus: Record<keyof UserProfile, boolean>
  ): void {
    if (!location) {
      return;
    }

    const trimmedLocation = location.trim();

    if (trimmedLocation.length < 2) {
      errors.push("Location must be at least 2 characters");
      return;
    }

    if (trimmedLocation.length > 100) {
      errors.push("Location must be less than 100 characters");
      return;
    }

    // Basic location validation - should contain letters and common location characters
    if (!/^[a-zA-Z\s,.-]+$/.test(trimmedLocation)) {
      errors.push(
        "Location should only contain letters, spaces, commas, periods, and hyphens"
      );
      return;
    }

    validData.location = trimmedLocation;
    completionStatus.location = true;
  }

  static isProfileComplete(profileData: Partial<UserProfile>): boolean {
    return !!(
      profileData.name &&
      profileData.age &&
      profileData.gender &&
      profileData.location
    );
  }

  static getMissingFields(profileData: Partial<UserProfile>): string[] {
    const missing: string[] = [];

    if (!profileData.name) missing.push("name");
    if (!profileData.age) missing.push("age");
    if (!profileData.gender) missing.push("gender");
    if (!profileData.location) missing.push("location");

    return missing;
  }
}
