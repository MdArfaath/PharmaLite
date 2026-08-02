import { z } from "zod";

/**
 * Add-stock form schema. A single positive integer quantity to add to the
 * medicine's on-hand count. Validated with Zod (PROJECT.md forms decision),
 * coercing the numeric input and enforcing a whole number >= 1.
 */
export const addStockSchema = z.object({
  quantity: z.coerce
    .number({ invalid_type_error: "Enter a number" })
    .int("Enter a whole number")
    .min(1, "Add at least 1"),
});

export type AddStockInput = z.input<typeof addStockSchema>;
export type AddStockValues = z.output<typeof addStockSchema>;
