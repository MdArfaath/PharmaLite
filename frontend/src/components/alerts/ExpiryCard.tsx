import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StockBadge } from "@/components/inventory/Badges";
import { formatQty } from "@/lib/utils/format";
import { classifyExpiry, type ExpiryStatus } from "@/features/alerts/expiryStatus";
import type { ExpiringRow } from "@/features/alerts/expiryQueries";
import { cn } from "@/lib/utils/cn";

const TAG: Record<ExpiryStatus, { label: string; className: string }> = {
  expired: { label: "Expired", className: "bg-red-50 text-danger" },
  today: { label: "Expires today", className: "bg-red-50 text-danger" },
  soon: { label: "Expiring soon", className: "bg-amber-50 text-warn" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * One expiry alert row. Shows a clear status tag (Expired / Expires today /
 * Expiring soon), the medicine name, batch (if any), expiry date, remaining
 * days, and current stock (with unit). Tapping opens the medicine detail page.
 */
export function ExpiryCard({ medicine }: { medicine: ExpiringRow }) {
  // The view only returns rows with a non-null expiry_date.
  const info = classifyExpiry(medicine.expiry_date as string);
  const tag = TAG[info.status];
  const subtitle = [medicine.brand, medicine.manufacturer]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link href={`/inventory/${medicine.id}`} className="block">
      <Card className="p-4 transition-colors hover:border-slate-300">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                  tag.className,
                )}
              >
                {tag.label}
              </span>
              <span
                className={cn(
                  "text-xs",
                  info.status === "soon" ? "text-slate-500" : "text-danger",
                )}
              >
                {info.remainingLabel}
              </span>
            </div>

            <p className="truncate font-medium text-slate-900">
              {medicine.name}
            </p>
            {subtitle && (
              <p className="truncate text-sm text-slate-500">{subtitle}</p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <span>Exp {formatDate(medicine.expiry_date as string)}</span>
              {medicine.batch_no && <span>Batch {medicine.batch_no}</span>}
              <StockBadge
                quantity={medicine.quantity}
                unit={medicine.unit}
                threshold={medicine.low_stock_threshold}
              />
            </div>
          </div>

          <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-slate-300" />
        </div>
      </Card>
    </Link>
  );
}
