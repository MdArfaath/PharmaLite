import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Card } from "@/components/ui/Card";
import { formatMoney } from "@/lib/utils/money";
import { billNumber } from "@/features/sales/billNumber";
import type { Sale } from "@/lib/db/types";
import { cn } from "@/lib/utils/cn";

/**
 * One sale in the history list. Shows bill number, date+time, item count and
 * total. Voided sales are visually de-emphasized with a "Voided" tag (the sale
 * is kept, per the append-only model). Tapping opens the detail screen.
 */
export function SaleRow({ sale }: { sale: Sale }) {
  const voided = sale.status === "voided";
  return (
    <Link href={`/sales/${sale.id}`} className="block">
      <Card
        className={cn(
          "p-4 transition-colors hover:border-slate-300",
          voided && "opacity-70",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-medium text-slate-900">
                {billNumber(sale.id)}
              </span>
              {voided && (
                <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-danger">
                  Voided
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {format(parseISO(sale.created_at), "d MMM yyyy · h:mm a")}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {sale.item_count} {sale.item_count === 1 ? "item" : "items"}
            </p>
          </div>

          <div className="text-right">
            <p
              className={cn(
                "font-semibold",
                voided ? "text-slate-400 line-through" : "text-slate-900",
              )}
            >
              {formatMoney(sale.total_paise)}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
        </div>
      </Card>
    </Link>
  );
}
