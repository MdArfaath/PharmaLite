"use client";

import type { Medicine } from "@/lib/db/types";
import { useRecentlySold } from "@/features/sell/queries";
import { useCartStore } from "@/features/sell/store";
import { QuickAddChip } from "./QuickAddChip";

/**
 * Horizontal "Recently sold" quick-add row on the Sell screen. Tapping a chip
 * adds one unit to the cart. Hidden entirely when there's no history yet (a
 * brand-new shop), so the screen stays clean.
 */
export function RecentlySold() {
  const { data, isLoading } = useRecentlySold(8);
  const addItem = useCartStore((s) => s.addItem);

  if (isLoading || !data || data.length === 0) return null;

  return (
    <div>
      <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-slate-400">
        Recently sold
      </p>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {data.map((m) => (
          <QuickAddChip
            key={m.id}
            name={m.name}
            unit={m.unit}
            available={m.quantity}
            pricePaise={m.selling_price_paise}
            onAdd={() =>
              // Recently-sold rows carry the fields addItem needs; cast to the
              // Medicine shape it expects (only the used fields matter).
              addItem(
                {
                  id: m.id,
                  name: m.name,
                  unit: m.unit,
                  quantity: m.quantity,
                  selling_price_paise: m.selling_price_paise,
                } as Medicine,
                1,
              )
            }
          />
        ))}
      </div>
    </div>
  );
}
