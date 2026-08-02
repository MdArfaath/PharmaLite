"use client";

import { PackageCheck } from "lucide-react";
import { useLowStock } from "@/features/alerts/queries";
import { LowStockCard } from "@/components/alerts/LowStockCard";
import {
  EmptyState,
  LoadingState,
  ErrorState,
} from "@/components/common/States";

/**
 * Low-stock alerts list. Auto-refreshes after stock changes because its query
 * key sits under the "medicines" namespace that sell/add-stock/inventory
 * mutations already invalidate.
 */
export function LowStockList() {
  const { data, isLoading, isError, refetch, isFetching } = useLowStock();
  const medicines = data ?? [];

  if (isLoading) return <LoadingState label="Checking stock levels…" />;

  if (isError) {
    return (
      <ErrorState
        title="Couldn't load alerts"
        description="Check your connection and try again."
        onRetry={() => refetch()}
      />
    );
  }

  if (medicines.length === 0) {
    return (
      <EmptyState
        icon={PackageCheck}
        title="Stock levels look good"
        description="No medicines are below their low-stock threshold right now."
      />
    );
  }

  return (
    <div className="space-y-2">
      <p className="px-1 text-xs text-slate-400">
        {medicines.length} {medicines.length === 1 ? "medicine" : "medicines"}{" "}
        need attention
        {isFetching ? " · refreshing…" : ""}
      </p>
      {medicines.map((m) => (
        <LowStockCard key={m.id} medicine={m} />
      ))}
    </div>
  );
}
