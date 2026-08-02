"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Input";
import { StockBadge } from "@/components/inventory/Badges";
import { LoadingState, ErrorState } from "@/components/common/States";
import { useMedicine, useAddStock } from "@/features/inventory/queries";
import {
  addStockSchema,
  type AddStockInput,
} from "@/features/inventory/addStockSchema";
import { formatQty } from "@/lib/utils/format";
import { ROUTES } from "@/lib/constants";

const QUICK_ADD = [1, 5, 10, 20, 50] as const;

export function AddStock({ medicineId }: { medicineId: string }) {
  const router = useRouter();
  const { data: medicine, isLoading, isError, refetch } =
    useMedicine(medicineId);
  const addStock = useAddStock(medicineId);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AddStockInput>({
    resolver: zodResolver(addStockSchema),
    defaultValues: { quantity: 1 },
  });

  const current = watch("quantity");
  const parsed = Number(current);
  const preview =
    medicine && Number.isFinite(parsed) && parsed > 0
      ? medicine.quantity + Math.trunc(parsed)
      : null;

  async function onSubmit(values: AddStockInput) {
    setSubmitting(true);
    try {
      const updated = await addStock.mutateAsync(Number(values.quantity));
      toast.success(
        `Added — now ${formatQty(updated.quantity, updated.unit)}`,
      );
      router.replace(`/inventory/${medicineId}`);
      router.refresh();
    } catch {
      setSubmitting(false);
      toast.error("Couldn't add stock. Please try again.");
    }
  }

  return (
    <div>
      <Link
        href={`/inventory/${medicineId}`}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Link>

      <h1 className="mb-4 text-lg font-semibold text-slate-900">Add stock</h1>

      {isLoading ? (
        <LoadingState label="Loading medicine…" />
      ) : isError ? (
        <ErrorState title="Couldn't load medicine" onRetry={() => refetch()} />
      ) : !medicine ? (
        <ErrorState
          title="Medicine not found"
          description="It may have been archived, or it doesn't belong to your shop."
        />
      ) : (
        <>
          <Card className="mb-4 p-4">
            <p className="font-medium text-slate-900">{medicine.name}</p>
            {(medicine.brand || medicine.manufacturer) && (
              <p className="truncate text-sm text-slate-500">
                {[medicine.brand, medicine.manufacturer]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-slate-500">Current:</span>
              <StockBadge
                quantity={medicine.quantity}
                unit={medicine.unit}
                threshold={medicine.low_stock_threshold}
              />
            </div>
          </Card>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field
              label={`Quantity to add (${medicine.unit})`}
              error={
                typeof errors.quantity?.message === "string"
                  ? errors.quantity.message
                  : undefined
              }
              required
            >
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                autoFocus
                invalid={!!errors.quantity}
                {...register("quantity")}
              />
            </Field>

            {/* Quick-add chips for fast entry (mobile-first). */}
            <div className="flex flex-wrap gap-2">
              {QUICK_ADD.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() =>
                    setValue("quantity", n, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                  className="inline-flex min-h-touch items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {n}
                </button>
              ))}
            </div>

            {preview !== null && (
              <p className="text-sm text-slate-500">
                New total:{" "}
                <span className="font-medium text-slate-900">
                  {formatQty(preview, medicine.unit)}
                </span>
              </p>
            )}

            <Button type="submit" fullWidth loading={submitting}>
              Add to stock
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
