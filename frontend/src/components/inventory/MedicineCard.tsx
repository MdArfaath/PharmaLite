import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Medicine } from "@/lib/db/types";
import { Card } from "@/components/ui/Card";
import { formatMoney } from "@/lib/utils/money";
import { StockBadge, ExpiryBadge } from "./Badges";

/**
 * A single medicine row in the inventory list. Shows name, brand, manufacturer,
 * current stock (with unit), selling price, and expiry (if set). Tapping opens
 * the detail/edit screen.
 */
export function MedicineCard({ medicine }: { medicine: Medicine }) {
  const subtitle = [medicine.brand, medicine.manufacturer]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link href={`/inventory/${medicine.id}`} className="block">
      <Card className="p-4 transition-colors hover:border-slate-300">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-slate-900">
              {medicine.name}
            </p>
            {subtitle && (
              <p className="truncate text-sm text-slate-500">{subtitle}</p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <StockBadge
                quantity={medicine.quantity}
                unit={medicine.unit}
                threshold={medicine.low_stock_threshold}
              />
              <span className="text-sm font-medium text-slate-900">
                {formatMoney(medicine.selling_price_paise)}
              </span>
              <ExpiryBadge expiryDate={medicine.expiry_date} />
            </div>
          </div>

          <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-slate-300" />
        </div>
      </Card>
    </Link>
  );
}
