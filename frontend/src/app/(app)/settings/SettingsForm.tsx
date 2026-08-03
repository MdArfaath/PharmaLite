"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Store, Package, CalendarClock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { Shop } from "@/lib/db/types";
import {
  settingsFormSchema,
  CURRENCIES,
  type SettingsFormInput,
  type SettingsFormValues,
} from "@/features/settings/schema";
import { toShopUpdate, useUpdateShop } from "@/features/settings/queries";

/**
 * Editable shop settings form. Server-loaded shop is passed in as `initial`.
 * Validates with Zod, persists via the RLS-scoped shops UPDATE, and gives
 * success/error feedback via toasts.
 */
export function SettingsForm({ initial }: { initial: Shop }) {
  const router = useRouter();
  const update = useUpdateShop(initial.id);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<SettingsFormInput>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      name: initial.name,
      phone: initial.phone ?? "",
      lowStockThreshold: initial.settings.low_stock_threshold,
      expiryWindowDays: initial.settings.expiry_window_days,
      currency: (initial.settings.currency as SettingsFormInput["currency"]) ?? "INR",
    },
  });

  async function onSubmit(values: SettingsFormValues) {
    setSubmitting(true);
    try {
      const payload = toShopUpdate(values, initial.settings);
      const updated = await update.mutateAsync(payload);
      // Reset dirty state to the newly-saved values.
      reset({
        name: updated.name,
        phone: updated.phone ?? "",
        lowStockThreshold: updated.settings.low_stock_threshold,
        expiryWindowDays: updated.settings.expiry_window_days,
        currency: updated.settings.currency as SettingsFormInput["currency"],
      });
      toast.success("Settings saved");
      // Refresh the server components (header shows shop name).
      router.refresh();
    } catch {
      toast.error("Couldn't save settings. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit((v) => onSubmit(v as SettingsFormValues))} className="space-y-4">
      {/* Shop identity */}
      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Store className="h-4 w-4 text-brand-600" />
          <p className="text-sm font-medium text-slate-700">Shop details</p>
        </div>
        <div className="space-y-4">
          <Field label="Shop name" error={errors.name?.message} required>
            <Input
              autoComplete="organization"
              invalid={!!errors.name}
              {...register("name")}
            />
          </Field>
          <Field label="Phone" error={errors.phone?.message}>
            <Input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="Optional"
              invalid={!!errors.phone}
              {...register("phone")}
            />
          </Field>
        </div>
      </Card>

      {/* Alert thresholds */}
      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Package className="h-4 w-4 text-warn" />
          <p className="text-sm font-medium text-slate-700">Alert thresholds</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Low stock at"
            hint="Default for medicines"
            error={
              typeof errors.lowStockThreshold?.message === "string"
                ? errors.lowStockThreshold.message
                : undefined
            }
            required
          >
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              invalid={!!errors.lowStockThreshold}
              {...register("lowStockThreshold")}
            />
          </Field>
          <Field
            label="Expiry window"
            hint="Days ahead to warn"
            error={
              typeof errors.expiryWindowDays?.message === "string"
                ? errors.expiryWindowDays.message
                : undefined
            }
            required
          >
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              invalid={!!errors.expiryWindowDays}
              {...register("expiryWindowDays")}
            />
          </Field>
        </div>
        <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
          <CalendarClock className="h-3.5 w-3.5" />
          These drive the Low stock and Expiring soon alerts.
        </p>
      </Card>

      {/* Preferences */}
      <Card className="p-4">
        <p className="mb-3 text-sm font-medium text-slate-700">Preferences</p>
        <Field label="Currency" error={errors.currency?.message} required>
          <Select invalid={!!errors.currency} {...register("currency")}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
      </Card>

      <Button type="submit" fullWidth loading={submitting} disabled={!isDirty}>
        {isDirty ? "Save changes" : "Saved"}
      </Button>
    </form>
  );
}
