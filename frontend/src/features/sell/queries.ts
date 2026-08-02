"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/db/types";
import type { CartLine } from "./store";

type RecentlySold =
  Database["public"]["Views"]["v_recently_sold"]["Row"];

/**
 * Recently-sold medicines for the Sell quick-add row (PROJECT.md §13a). Backed
 * by v_recently_sold (top fast-movers, in-stock, non-voided, last 30 days).
 * RLS scopes to the caller's shop. Capped client-side.
 */
export function useRecentlySold(limit = 8) {
  return useQuery<RecentlySold[]>({
    queryKey: ["recently-sold", limit],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("v_recently_sold")
        .select("*")
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/**
 * Records a sale via the record_sale RPC. The RPC atomically validates stock,
 * decrements each medicine's quantity, writes the sale + snapshotted line items
 * and 'sale' stock_movements, and returns the new sale id (PROJECT.md §11, §8).
 * On success we invalidate inventory, dashboard, sales and recently-sold caches
 * so on-hand counts and lists refresh immediately.
 */
export function useRecordSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      lines: CartLine[];
      paymentMethod?: string;
      note?: string | null;
    }) => {
      const items = args.lines.map((l) => ({
        medicine_id: l.medicineId,
        quantity: l.quantity,
      }));
      const supabase = createClient();
      const { data, error } = await supabase.rpc("record_sale", {
        p_items: items,
        p_payment_method: args.paymentMethod ?? "cash",
        p_note: args.note ?? null,
        p_voids_sale_id: null,
      });
      if (error) throw error;
      return data as string; // new sale id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medicines"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["recently-sold"] });
      qc.invalidateQueries({ queryKey: ["sales"] });
    },
  });
}
