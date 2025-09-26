import { z } from "zod";

export const userProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters"),
  age: z
    .number()
    .int("Age must be a whole number")
    .min(13, "Must be at least 13 years old")
    .max(120, "Age must be less than 120"),
  gender: z.enum(["male", "female"], {
    message: "Please select biological gender",
  }),
  location: z
    .string()
    .min(2, "Location must be at least 2 characters")
    .max(100, "Location must be less than 100 characters"),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

export const genderOptions = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
] as const;
