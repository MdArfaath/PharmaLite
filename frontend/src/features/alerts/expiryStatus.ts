import { differenceInCalendarDays, parseISO } from "date-fns";

/** Buckets for how a medicine's expiry should be presented. */
export type ExpiryStatus = "expired" | "today" | "soon";

export interface ExpiryInfo {
  status: ExpiryStatus;
  /** Calendar days until expiry: negative = past, 0 = today, positive = future. */
  days: number;
  /** Human label for the remaining time, e.g. "Expired 3 days ago", "Today", "in 5 days". */
  remainingLabel: string;
}

/**
 * Classifies an expiry date relative to today (PROJECT.md business rule 5):
 * expired (< today), today (== today), soon (within the window, > today).
 * Pure and side-effect free so it's easy to reason about and reuse.
 */
export function classifyExpiry(expiryDate: string): ExpiryInfo {
  const days = differenceInCalendarDays(parseISO(expiryDate), new Date());

  if (days < 0) {
    const n = Math.abs(days);
    return {
      status: "expired",
      days,
      remainingLabel: `Expired ${n} ${n === 1 ? "day" : "days"} ago`,
    };
  }
  if (days === 0) {
    return { status: "today", days, remainingLabel: "Expires today" };
  }
  return {
    status: "soon",
    days,
    remainingLabel: `in ${days} ${days === 1 ? "day" : "days"}`,
  };
}
