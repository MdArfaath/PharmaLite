"use client";

import { useEffect, useRef, useState } from "react";
import { ReceiptText } from "lucide-react";
import { useSalesList, type SalesFilters } from "@/features/sales/queries";
import { useDebounce } from "@/hooks/useDebounce";
import { SaleRow } from "@/components/sales/SaleRow";
import { SalesFilterBar } from "@/components/sales/SalesFilterBar";
import {
  EmptyState,
  LoadingState,
  ErrorState,
} from "@/components/common/States";

export function SalesList() {
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const debouncedSearch = useDebounce(search, 250);

  const filters: SalesFilters = {
    search: debouncedSearch,
    from,
    to,
  };

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
  } = useSalesList(filters);

  // Infinite-scroll sentinel.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const sales = data?.pages.flatMap((p) => p.rows) ?? [];
  const filtersActive = !!(debouncedSearch.trim() || from || to);

  return (
    <div className="space-y-4">
      <SalesFilterBar
        search={search}
        from={from}
        to={to}
        onSearch={setSearch}
        onFrom={setFrom}
        onTo={setTo}
        onClearDates={() => {
          setFrom("");
          setTo("");
        }}
      />

      {isLoading ? (
        <LoadingState label="Loading sales…" />
      ) : isError ? (
        <ErrorState
          title="Couldn't load sales"
          description="Check your connection and try again."
          onRetry={() => refetch()}
        />
      ) : sales.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title={filtersActive ? "No matching sales" : "No sales yet"}
          description={
            filtersActive
              ? "Try a different search or date range."
              : "Completed sales will appear here."
          }
        />
      ) : (
        <div className="space-y-2">
          <p className="px-1 text-xs text-slate-400">
            {sales.length} shown{isFetching && !isFetchingNextPage ? " · refreshing…" : ""}
          </p>
          {sales.map((s) => (
            <SaleRow key={s.id} sale={s} />
          ))}

          <div ref={sentinelRef} className="h-8" />
          {isFetchingNextPage && (
            <p className="py-2 text-center text-xs text-slate-400">
              Loading more…
            </p>
          )}
          {!hasNextPage && sales.length > 0 && (
            <p className="py-2 text-center text-xs text-slate-300">
              End of history
            </p>
          )}
        </div>
      )}
    </div>
  );
}
