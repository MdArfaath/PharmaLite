"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Quantity stepper: −/value/+ with a max guard. Large touch targets. Used per
 * cart line. Decrement below 1 is handled by the parent (removes the line).
 */
export function QtyStepper({
  value,
  max,
  onDecrement,
  onIncrement,
  className,
}: {
  value: number;
  max: number;
  onDecrement: () => void;
  onIncrement: () => void;
  className?: string;
}) {
  const atMax = value >= max;
  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={onDecrement}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-[2.5rem] text-center text-sm font-semibold tabular-nums text-slate-900">
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={onIncrement}
        disabled={atMax}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-lg border text-slate-700",
          atMax
            ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
            : "border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100",
        )}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
