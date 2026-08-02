import { z } from "zod";
import { MEDICINE_UNITS } from "@/lib/constants";

/**
 * Medicine form schema (PROJECT.md: React Hook Form + Zod, one schema reused
 * for client validation and typing). Prices are entered in rupees and converted
 * to integer paise before hitting the DB (see queries.ts). Quantity is an
 * integer count in the medicine's unit.
 */

const optionalTrimmed = z
  .string()
  .trim()
  .max(80, "Too long")
  .optional()
  .or(z.literal(""));

// Accept a number or numeric string from the input; coerce and validate.
const nonNegativeNumber = (label: string) =>
  z.coerce
    .number({ invalid_type_error: `${label} must be a number` })
    .min(0, `${label} can't be negative`);

export const medicineFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120, "Name is too long"),
  brand: optionalTrimmed,
  manufacturer: optionalTrimmed,
  unit: z.enum(MEDICINE_UNITS, {
    errorMap: () => ({ message: "Choose a unit" }),
  }),
  quantity: z.coerce
    .number({ invalid_type_error: "Quantity must be a number" })
    .int("Quantity must be a whole number")
    .min(0, "Quantity can't be negative"),
  lowStockThreshold: z
    .union([z.coerce.number().int().min(0), z.literal("")])
    .optional(),
  purchasePrice: nonNegativeNumber("Purchase price"),
  sellingPrice: nonNegativeNumber("Selling price"),
  batchNo: optionalTrimmed,
  expiryDate: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),
});

export type MedicineFormInput = z.input<typeof medicineFormSchema>;
export type MedicineFormValues = z.output<typeof medicineFormSchema>;
