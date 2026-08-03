"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Shop, ShopSettings } from "@/lib/db/types";
import type { SettingsFormValues } from "./schema";

/**
 * Pure mapping from validated form values to the shops UPDATE payload. Kept
 * separate (and exported) so it can be unit-tested without a DB. Merges the
 * settings jsonb so any keys not managed by this form are preserved.
 */
export function toShopUpdate(
  values: SettingsFormValues,
  existing: ShopSettings,
): { name: string; phone: string | null; settings: ShopSettings } {
  return {
    name: values.name.trim(),
    phone: values.phone && values.phone.trim() !== "" ? values.phone.trim() : null,
    settings: {
      ...existing,
      low_stock_threshold: values.lowStockThreshold,
      expiry_window_days: values.expiryWindowDays,
      currency: values.currency,
    },
  };
}

/** Reads the current shop (RLS returns only the caller's shop). */
export function useShop() {
  return useQuery<Shop | null>({
    queryKey: ["shop"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("shops")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });
}

/**
 * Persists shop settings via an RLS-scoped UPDATE on the shops table
 * (shops_update_own policy). On success, invalidates the shop cache plus the
 * dashboard and alert lists, since changing thresholds/window changes what
 * counts as low-stock or expiring.
 */
export function useUpdateShop(shopId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      phone: string | null;
      settings: ShopSettings;
    }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("shops")
        .update(payload)
        .eq("id", shopId)
        .select("*")
        .single();
      if (error) throw error;
      return data as Shop;
    },
    onSuccess: (row) => {
      qc.setQueryData(["shop"], row);
      qc.invalidateQueries({ queryKey: ["shop"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      // Thresholds/window feed the alert views.
      qc.invalidateQueries({ queryKey: ["medicines"] });
    },
  });
}
