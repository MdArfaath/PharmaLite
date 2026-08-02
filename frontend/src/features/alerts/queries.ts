"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/db/types";

/**
 * A low-stock row = a full medicine row plus the computed effective threshold
 * (per-medicine override, else shop default, else 10) — all done in the
 * v_low_stock view (PROJECT.md §8 views, business rule 4).
 */
export type LowStockRow =
  Database["public"]["Views"]["v_low_stock"]["Row"];

/**
 * Medicines at or below their effective low-stock threshold for the current
 * shop. RLS (security_invoker on the view) scopes rows to the caller's shop.
 *
 * NOTE ON AUTO-REFRESH: the query key is nested UNDER the "medicines"
 * namespace (["medicines", "low-stock"]). TanStack Query invalidates by key
 * prefix, so the existing invalidateQueries({ queryKey: ["medicines"] }) calls
 * in the sell, add-stock, and inventory mutations automatically refresh this
 * list after any stock change — without modifying those modules.
 */
export function useLowStock() {
  return useQuery<LowStockRow[]>({
    queryKey: ["medicines", "low-stock"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("v_low_stock")
        .select("*")
        .order("quantity", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}
