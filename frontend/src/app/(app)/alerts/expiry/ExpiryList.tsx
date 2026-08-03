"use client";

import { useMemo } from "react";
import { CalendarCheck } from "lucide-react";
import { useExpiring, type ExpiringRow } from "@/features/alerts/expiryQueries";
import { classifyExpiry } from "@/features/alerts/expiryStatus";
import { ExpiryCard } from "@/components/alerts/ExpiryCard";
import {
  EmptyState,
  LoadingState,
  ErrorState,
} from "@/components/common/States";

/**
 * Expiry alerts list. Rows come from v_expiring_soon (already filtered to
 * expired/within-window) sorted by nearest expiry first, then grouped into
 * Expired / Expiring today / Expiring soon sections for a clear distinction.
 * Auto-refreshes after inventory changes via the "medicines" key namespace.
 */
export function ExpiryList() {
  const { data, isLoading, isError, refetch, isFetching } = useExpiring();

  const groups = useMemo(() => {
    const rows = data ?? [];
    const expired: ExpiringRow[] = [];
    const today: ExpiringRow[] = [];
    const soon: ExpiringRow[] = [];
    for (const m of rows) {
      if (!m.expiry_date) continue;
      const { status } = classifyExpiry(m.expiry_date);
      if (status === "expired") expired.push(m);
      else if (status === "today") today.push(m);
      else soon.push(m);
    }
    return { expired, today, soon };
  }, [data]);

  if (isLoading) return <LoadingState label="Checking expiry dates…" />;

  if (isError) {
    return (
      <ErrorState
        title="Couldn't load alerts"
        description="Check your connection and try again."
        onRetry={() => refetch()}
      />
    );
  }

  const total =
    groups.expired.length + groups.today.length + groups.soon.length;

  if (total === 0) {
    return (
      <EmptyState
        icon={CalendarCheck}
        title="Nothing expiring soon"
        description="No medicines are expired or within your expiry alert window."
      />
    );
  }

  return (
    <div className="space-y-5">
      <p className="px-1 text-xs text-slate-400">
        {total} {total === 1 ? "medicine" : "medicines"} need attention
        {isFetching ? " · refreshing…" : ""}
      </p>

      <Section title="Expired" tone="danger" items={groups.expired} />
      <Section title="Expiring today" tone="danger" items={groups.today} />
      <Section title="Expiring soon" tone="warn" items={groups.soon} />
    </div>
  );
}

function Section({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "danger" | "warn";
  items: ExpiringRow[];
}) {
  if (!items || items.length === 0) return null;
  return (
    <div className="space-y-2">
      <h2
        className={
          "px-1 text-xs font-semibold uppercase tracking-wide " +
          (tone === "danger" ? "text-danger" : "text-warn")
        }
      >
        {title} ({items.length})
      </h2>
      {items.map((m) => (
        <ExpiryCard key={m.id} medicine={m} />
      ))}
    </div>
  );
}
