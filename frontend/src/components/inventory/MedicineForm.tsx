"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Medicine } from "@/lib/db/types";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { MEDICINE_UNITS } from "@/lib/constants";
import { paiseToRupees } from "@/lib/utils/money";
import {
  medicineFormSchema,
  type MedicineFormInput,
  type MedicineFormValues,
} from "@/features/inventory/schema";

/**
 * Add/Edit medicine form. One component for both flows (no duplication):
 * pass `initial` to prefill for editing. Calls onSubmit with validated,
 * typed values; the parent owns the mutation + navigation.
 */
export function MedicineForm({
  initial,
  submitLabel,
  submitting,
  onSubmit,
}: {
  initial?: Medicine;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (values: MedicineFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MedicineFormInput>({
    resolver: zodResolver(medicineFormSchema),
    defaultValues: initial
      ? {
          name: initial.name,
          brand: initial.brand ?? "",
          manufacturer: initial.manufacturer ?? "",
          unit: initial.unit as MedicineFormInput["unit"],
          quantity: initial.quantity,
          lowStockThreshold: initial.low_stock_threshold ?? "",
          purchasePrice: paiseToRupees(initial.purchase_price_paise),
          sellingPrice: paiseToRupees(initial.selling_price_paise),
          batchNo: initial.batch_no ?? "",
          expiryDate: initial.expiry_date ?? "",
        }
      : {
          name: "",
          brand: "",
          manufacturer: "",
          unit: "strip",
          quantity: 0,
          lowStockThreshold: "",
          purchasePrice: 0,
          sellingPrice: 0,
          batchNo: "",
          expiryDate: "",
        },
  });

  return (
    <form
      onSubmit={handleSubmit((v) => onSubmit(v as MedicineFormValues))}
      className="space-y-4"
    >
      <Field label="Medicine name" error={errors.name?.message} required>
        <Input
          placeholder="e.g. Paracetamol 500mg"
          autoComplete="off"
          invalid={!!errors.name}
          {...register("name")}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Brand" error={errors.brand?.message}>
          <Input
            placeholder="e.g. Calpol"
            autoComplete="off"
            invalid={!!errors.brand}
            {...register("brand")}
          />
        </Field>
        <Field label="Manufacturer" error={errors.manufacturer?.message}>
          <Input
            placeholder="e.g. GSK"
            autoComplete="off"
            invalid={!!errors.manufacturer}
            {...register("manufacturer")}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Unit" error={errors.unit?.message} required>
          <Select invalid={!!errors.unit} {...register("unit")}>
            {MEDICINE_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Quantity in stock" error={errors.quantity?.message} required>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            invalid={!!errors.quantity}
            {...register("quantity")}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Purchase price (₹)"
          error={errors.purchasePrice?.message}
          required
        >
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            invalid={!!errors.purchasePrice}
            {...register("purchasePrice")}
          />
        </Field>
        <Field
          label="Selling price (₹)"
          error={errors.sellingPrice?.message}
          required
        >
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            invalid={!!errors.sellingPrice}
            {...register("sellingPrice")}
          />
        </Field>
      </div>

      <Field
        label="Low-stock alert at"
        hint="Leave blank to use the shop default"
        error={
          typeof errors.lowStockThreshold?.message === "string"
            ? errors.lowStockThreshold.message
            : undefined
        }
      >
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          placeholder="Shop default"
          invalid={!!errors.lowStockThreshold}
          {...register("lowStockThreshold")}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Batch no." error={errors.batchNo?.message}>
          <Input
            placeholder="Optional"
            autoComplete="off"
            invalid={!!errors.batchNo}
            {...register("batchNo")}
          />
        </Field>
        <Field label="Expiry date" error={errors.expiryDate?.message}>
          <Input
            type="date"
            invalid={!!errors.expiryDate}
            {...register("expiryDate")}
          />
        </Field>
      </div>

      <Button type="submit" fullWidth loading={submitting}>
        {submitLabel}
      </Button>
    </form>
  );
}
