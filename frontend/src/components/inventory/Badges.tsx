import { differenceInCalendarDays, parseISO } from "date-fns";
import { formatQty } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

/**
 * StockBadge — shows quantity WITH unit (business rule 12) and colors by level:
 * red at zero, amber at/under threshold, neutral otherwise.
 */
export function StockBadge({
  quantity,
  unit,
  threshold,
  className,
}: {
  quantity: number;
  unit: string;
  threshold: number | null;
  className?: string;
}) {
  const low = threshold != null && quantity <= threshold;
  const out = quantity <= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        out
          ? "bg-red-50 text-danger"
          : low
            ? "bg-amber-50 text-warn"
            : "bg-slate-100 text-slate-700",
        className,
      )}
    >
      {formatQty(quantity, unit)}
    </span>
  );
}

/**
 * ExpiryBadge — shows the expiry date, red if expired, amber if within 30 days,
 * subtle otherwise. Returns null when there's no expiry set.
 */
export function ExpiryBadge({
  expiryDate,
  className,
}: {
  expiryDate: string | null;
  className?: string;
}) {
  if (!expiryDate) return null;
  const date = parseISO(expiryDate);
  const days = differenceInCalendarDays(date, new Date());
  const expired = days < 0;
  const soon = days >= 0 && days <= 30;

  const label = date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs",
        expired
          ? "text-danger"
          : soon
            ? "text-warn"
            : "text-slate-500",
        className,
      )}
    >
      {expired ? "Expired" : "Exp"} {label}
    </span>
  );
}
