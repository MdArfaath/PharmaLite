"use client";

import { useEffect } from "react";
import { Trash2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { QtyStepper } from "./QtyStepper";
import { useCartStore } from "@/features/sell/store";
import { formatQty } from "@/lib/utils/format";
import { formatMoney } from "@/lib/utils/money";

/**
 * The cart as a bottom sheet (thumb-reachable, PROJECT.md §21). Lists lines
 * with per-line steppers + remove, shows the running total, and a Confirm sale
 * button. Over-sell is prevented here (stepper capped at available) and again
 * server-side by record_sale.
 */
export function CartSheet({
  open,
  submitting,
  onClose,
  onConfirm,
}: {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const lines = useCartStore((s) => s.lines);
  const increment = useCartStore((s) => s.increment);
  const decrement = useCartStore((s) => s.decrement);
  const removeItem = useCartStore((s) => s.removeItem);
  const totalPaise = useCartStore((s) => s.totalPaise());
  const totalUnits = useCartStore((s) => s.totalUnits());

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, submitting, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Cart"
    >
      <button
        aria-label="Close cart"
        className="absolute inset-0 bg-slate-900/40"
        onClick={() => !submitting && onClose()}
      />

      <div className="relative flex max-h-[85vh] w-full max-w-md flex-col rounded-t-2xl bg-white shadow-xl">
        <div className="shrink-0 border-b border-slate-100 px-5 pb-3 pt-4">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" />
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              Current sale
            </h2>
            <span className="text-sm text-slate-500">
              {totalUnits} {totalUnits === 1 ? "item" : "items"}
            </span>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
          {lines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500">
              <ShoppingCart className="mb-2 h-8 w-8 text-slate-300" />
              <p className="text-sm">Your cart is empty.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {lines.map((l) => (
                <li key={l.medicineId} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">
                      {l.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatMoney(l.unitPricePaise)} each ·{" "}
                      {formatQty(l.available, l.unit)} in stock
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900">
                      {formatMoney(l.unitPricePaise * l.quantity)}
                    </p>
                  </div>

                  <QtyStepper
                    value={l.quantity}
                    max={l.available}
                    onDecrement={() => decrement(l.medicineId)}
                    onIncrement={() => increment(l.medicineId)}
                  />

                  <button
                    type="button"
                    aria-label={`Remove ${l.name}`}
                    onClick={() => removeItem(l.medicineId)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-100 px-5 pb-safe-b pt-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-slate-500">Total</span>
            <span className="text-xl font-bold text-slate-900">
              {formatMoney(totalPaise)}
            </span>
          </div>
          <Button
            fullWidth
            loading={submitting}
            disabled={lines.length === 0}
            onClick={onConfirm}
          >
            Confirm sale · {formatMoney(totalPaise)}
          </Button>
        </div>
      </div>
    </div>
  );
}
