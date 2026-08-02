"use client";

import { useState } from "react";
import { Plus, PackageX } from "lucide-react";
import { useMedicineSearch } from "@/features/inventory/queries";
import { useDebounce } from "@/hooks/useDebounce";
import { useCartStore } from "@/features/sell/store";
import { SearchInput } from "@/components/inventory/SearchInput";
import { LoadingState, EmptyState } from "@/components/common/States";
import { formatQty } from "@/lib/utils/format";
import { formatMoney } from "@/lib/utils/money";

/**
 * Search + add-to-cart list for the Sell screen. Reuses the inventory
 * search_medicines hook (name/brand/manufacturer) and the debounce hook — no
 * duplicate search logic. Each result is a tap-to-add row; out-of-stock rows
 * are shown but not addable.
 */
export function SellSearch() {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 200);
  const { data, isLoading } = useMedicineSearch(debounced);
  const addItem = useCartStore((s) => s.addItem);
  const lines = useCartStore((s) => s.lines);

  const results = data ?? [];

  return (
    <div className="space-y-3">
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search medicine to sell"
      />

      {isLoading ? (
        <LoadingState label="Searching…" />
      ) : results.length === 0 ? (
        <EmptyState
          icon={PackageX}
          title={debounced.trim() ? "No matches" : "Search to add"}
          description={
            debounced.trim()
              ? "Try a different name, brand, or manufacturer."
              : "Find a medicine by name, brand, or manufacturer to add it to the sale."
          }
        />
      ) : (
        <div className="space-y-2">
          {results.map((m) => {
            const inCart =
              lines.find((l) => l.medicineId === m.id)?.quantity ?? 0;
            const out = m.quantity <= 0;
            const maxed = inCart >= m.quantity;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => !out && !maxed && addItem(m, 1)}
                disabled={out || maxed}
                className={[
                  "flex w-full items-center justify-between gap-3 rounded-2xl border bg-white p-3 text-left",
                  out || maxed
                    ? "cursor-not-allowed border-slate-100 opacity-60"
                    : "border-slate-200 hover:bg-slate-50 active:bg-slate-100",
                ].join(" ")}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">
                    {m.name}
                  </p>
                  <p className="truncate text-sm text-slate-500">
                    {out
                      ? "Out of stock"
                      : `${formatQty(m.quantity, m.unit)} · ${formatMoney(
                          m.selling_price_paise,
                        )}`}
                    {inCart > 0 && !out ? ` · ${inCart} in cart` : ""}
                  </p>
                </div>
                <span
                  className={[
                    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    out || maxed
                      ? "bg-slate-100 text-slate-300"
                      : "bg-brand-600 text-white",
                  ].join(" ")}
                >
                  <Plus className="h-5 w-5" />
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
