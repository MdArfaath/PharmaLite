"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { SearchInput } from "@/components/inventory/SearchInput";
import { Field } from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";
import type { SalesFilters } from "@/features/sales/queries";

/**
 * Search + date-range filter controls for the sales list. Search is debounced
 * by the parent. The date range is tucked behind a toggle to keep the screen
 * clean on mobile.
 */
export function SalesFilterBar({
  search,
  from,
  to,
  onSearch,
  onFrom,
  onTo,
  onClearDates,
}: {
  search: string;
  from: string;
  to: string;
  onSearch: (v: string) => void;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
  onClearDates: () => void;
}) {
  const [showDates, setShowDates] = useState(!!(from || to));
  const datesActive = !!(from || to);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={onSearch}
            placeholder="Search bill no. or medicine"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowDates((s) => !s)}
          aria-label="Toggle date filter"
          className={cn(
            "inline-flex h-11 w-11 items-center justify-center rounded-xl border",
            datesActive
              ? "border-brand-500 bg-brand-50 text-brand-700"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
          )}
        >
          <SlidersHorizontal className="h-5 w-5" />
        </button>
      </div>

      {showDates && (
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="From">
              <input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(e) => onFrom(e.target.value)}
                className="block w-full rounded-xl border border-slate-200 bg-white px-3 min-h-touch text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </Field>
            <Field label="To">
              <input
                type="date"
                value={to}
                min={from || undefined}
                onChange={(e) => onTo(e.target.value)}
                className="block w-full rounded-xl border border-slate-200 bg-white px-3 min-h-touch text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </Field>
          </div>
          {datesActive && (
            <button
              type="button"
              onClick={onClearDates}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" />
              Clear dates
            </button>
          )}
        </div>
      )}
    </div>
  );
}
