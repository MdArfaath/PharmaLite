"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { DashboardStats } from "@/lib/db/types";

/**
 * Reads the shop's headline stats from v_dashboard_stats. RLS returns only
 * the caller's shop, so this is a single-row fetch.
 */
export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("v_dashboard_stats")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      // Fallback zeros if the view has no row yet (brand-new shop).
      return (
        data ?? {
          shop_id: "",
          medicine_count: 0,
          low_stock_count: 0,
          expiring_count: 0,
          today_sales_paise: 0,
          today_sales_count: 0,
        }
      );
    },
  });
}
