"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/db/types";

/**
 * An expiring row = a full medicine row plus is_expired and the shop's
 * expiry_window_days, all computed by the v_expiring_soon view (PROJECT.md §8,
 * business rule 5). The view already filters to medicines that are expired or
 * expiring within the window.
 */
export type ExpiringRow =
  Database["public"]["Views"]["v_expiring_soon"]["Row"];

/**
 * Medicines that are expired or expiring within the shop's window for the
 * current shop. RLS (security_invoker on the view) scopes rows to the caller's
 * shop. Ordered by nearest expiry first (expired at the top).
 *
 * NOTE ON AUTO-REFRESH: the query key is nested UNDER the "medicines"
 * namespace (["medicines", "expiring"]). TanStack Query invalidates by key
 * prefix, so the existing invalidateQueries({ queryKey: ["medicines"] }) calls
 * in the sell, add-stock, and inventory mutations automatically refresh this
 * list after any inventory change — without modifying those modules.
 */
export function useExpiring() {
  return useQuery<ExpiringRow[]>({
    queryKey: ["medicines", "expiring"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("v_expiring_soon")
        .select("*")
        .order("expiry_date", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}
