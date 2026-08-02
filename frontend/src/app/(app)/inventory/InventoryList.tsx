"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, Plus } from "lucide-react";
import { useMedicineSearch } from "@/features/inventory/queries";
import { useDebounce } from "@/hooks/useDebounce";
import { SearchInput } from "@/components/inventory/SearchInput";
import { MedicineCard } from "@/components/inventory/MedicineCard";
import {
  EmptyState,
  LoadingState,
  ErrorState,
} from "@/components/common/States";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/lib/constants";

export function InventoryList() {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 200);
  const { data, isLoading, isError, refetch, isFetching } =
    useMedicineSearch(debounced);

  const medicines = data ?? [];
  const searching = debounced.trim().length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} />
        </div>
        <Link href={ROUTES.inventoryNew} aria-label="Add medicine">
          <Button size="md" className="h-11 px-3">
            <Plus className="h-5 w-5" />
            Add
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <LoadingState label="Loading inventory…" />
      ) : isError ? (
        <ErrorState
          title="Couldn't load inventory"
          description="Check your connection and try again."
          onRetry={() => refetch()}
        />
      ) : medicines.length === 0 ? (
        searching ? (
          <EmptyState
            icon={Package}
            title="No matches"
            description={`Nothing found for "${debounced.trim()}". Try a different name, brand, or manufacturer.`}
          />
        ) : (
          <EmptyState
            icon={Package}
            title="No medicines yet"
            description="Add your first medicine to start tracking stock."
            action={
              <Link href={ROUTES.inventoryNew}>
                <Button size="md">
                  <Plus className="h-5 w-5" />
                  Add medicine
                </Button>
              </Link>
            }
          />
        )
      ) : (
        <div className="space-y-2">
          <p className="px-1 text-xs text-slate-400">
            {medicines.length}{" "}
            {medicines.length === 1 ? "medicine" : "medicines"}
            {isFetching && searching ? " · searching…" : ""}
          </p>
          {medicines.map((m) => (
            <MedicineCard key={m.id} medicine={m} />
          ))}
        </div>
      )}
    </div>
  );
}
