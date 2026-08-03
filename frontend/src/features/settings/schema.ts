import { z } from "zod";

/**
 * Shop settings form schema (PROJECT.md: React Hook Form + Zod). Covers the
 * editable shop preferences: display name, phone, low-stock threshold, expiry
 * alert window, and currency. Thresholds are coerced from the numeric inputs
 * and bounded to sensible ranges.
 */

/** Currencies offered in v1. Stored as an ISO-ish code in shop.settings. */
export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED"] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

export const settingsFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Shop name must be at least 2 characters")
    .max(80, "Shop name is too long"),
  phone: z
    .string()
    .trim()
    .max(20, "Phone number is too long")
    // Allow blank, or digits with common separators (+, spaces, dashes).
    .refine((v) => v === "" || /^[+0-9][0-9\s-]{5,}$/.test(v), {
      message: "Enter a valid phone number",
    })
    .optional()
    .or(z.literal("")),
  lowStockThreshold: z.coerce
    .number({ invalid_type_error: "Enter a number" })
    .int("Must be a whole number")
    .min(0, "Can't be negative")
    .max(100000, "That's too high"),
  expiryWindowDays: z.coerce
    .number({ invalid_type_error: "Enter a number" })
    .int("Must be a whole number")
    .min(1, "Must be at least 1 day")
    .max(365, "Must be 365 days or fewer"),
  currency: z.enum(CURRENCIES, {
    errorMap: () => ({ message: "Choose a currency" }),
  }),
});

export type SettingsFormInput = z.input<typeof settingsFormSchema>;
export type SettingsFormValues = z.output<typeof settingsFormSchema>;
