import Link from "next/link";
import { ChevronRight, PackagePlus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StockBadge } from "@/components/inventory/Badges";
import { formatQty } from "@/lib/utils/format";
import type { LowStockRow } from "@/features/alerts/queries";

/**
 * One low-stock alert row. Shows the medicine, its current quantity (with unit)
 * vs the effective threshold, and a shortcut to add stock. Tapping the row
 * opens the medicine detail page.
 */
export function LowStockCard({ medicine }: { medicine: LowStockRow }) {
  const subtitle = [medicine.brand, medicine.manufacturer]
    .filter(Boolean)
    .join(" · ");
  const out = medicine.quantity <= 0;

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <Link
          href={`/inventory/${medicine.id}`}
          className="min-w-0 flex-1"
          aria-label={`Open ${medicine.name}`}
        >
          <p className="truncate font-medium text-slate-900">
            {medicine.name}
          </p>
          {subtitle && (
            <p className="truncate text-sm text-slate-500">{subtitle}</p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <StockBadge
              quantity={medicine.quantity}
              unit={medicine.unit}
              threshold={medicine.effective_threshold}
            />
            <span className="text-xs text-slate-500">
              {out ? "Out of stock" : "Low"} · alert at{" "}
              {formatQty(medicine.effective_threshold, medicine.unit)}
            </span>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-1">
          <Link
            href={`/inventory/${medicine.id}/add-stock`}
            aria-label={`Add stock to ${medicine.name}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700"
          >
            <PackagePlus className="h-4 w-4" />
          </Link>
          <Link
            href={`/inventory/${medicine.id}`}
            aria-label={`Open ${medicine.name}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-100 hover:text-slate-500"
          >
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </Card>
  );
}
