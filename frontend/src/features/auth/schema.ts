import { z } from "zod";

/**
 * Auth form schemas (PROJECT.md: React Hook Form + Zod, one schema reused for
 * client validation and typing).
 */

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z.object({
  shopName: z
    .string()
    .trim()
    .min(2, "Shop name must be at least 2 characters")
    .max(80, "Shop name is too long"),
  fullName: z
    .string()
    .trim()
    .max(80, "Name is too long")
    .optional()
    .or(z.literal("")),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
