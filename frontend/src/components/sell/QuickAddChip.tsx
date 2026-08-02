"use client";

import { Plus } from "lucide-react";
import { formatQty } from "@/lib/utils/format";
import { formatMoney } from "@/lib/utils/money";

/**
 * A one-tap chip that adds a medicine to the cart (PROJECT.md §13a). Shows
 * name, on-hand (with unit), and price. Disabled when out of stock.
 */
export function QuickAddChip({
  name,
  unit,
  available,
  pricePaise,
  onAdd,
}: {
  name: string;
  unit: string;
  available: number;
  pricePaise: number;
  onAdd: () => void;
}) {
  const out = available <= 0;
  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={out}
      className={cnBase(out)}
    >
      <span className="flex items-center gap-1 font-medium">
        {!out && <Plus className="h-3.5 w-3.5 text-brand-600" />}
        <span className="max-w-[9rem] truncate">{name}</span>
      </span>
      <span className="mt-0.5 text-xs text-slate-500">
        {out ? "Out of stock" : `${formatQty(available, unit)} · ${formatMoney(pricePaise)}`}
      </span>
    </button>
  );
}

function cnBase(out: boolean) {
  return [
    "flex min-h-touch shrink-0 flex-col items-start rounded-xl border px-3 py-2 text-left text-sm",
    out
      ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400"
      : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50 active:bg-slate-100",
  ].join(" ");
}
