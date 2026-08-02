"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Medicine } from "@/lib/db/types";
import { rupeesToPaise } from "@/lib/utils/money";
import type { MedicineFormValues } from "./schema";

/**
 * Inventory data layer. Reads/writes go directly to Supabase under the user's
 * JWT, so RLS scopes everything to their shop (PROJECT.md §11 thin-API). Search
 * uses the search_medicines RPC (name/brand/manufacturer, §13a). Prices are
 * converted rupees→paise here so the rest of the app deals only in paise.
 */

const KEYS = {
  list: (search: string) => ["medicines", { search }] as const,
  detail: (id: string) => ["medicine", id] as const,
};

/** Search/list active medicines for the current shop. Empty term = all, by name. */
export function useMedicineSearch(search: string) {
  return useQuery<Medicine[]>({
    queryKey: KEYS.list(search),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("search_medicines", {
        p_term: search,
      });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Fetch a single medicine by id (RLS ensures it belongs to the caller's shop). */
export function useMedicine(id: string) {
  return useQuery<Medicine | null>({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("medicines")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
    enabled: !!id,
  });
}

/**
 * Checks whether an active medicine with the same name already exists in this
 * shop (case-insensitive). Optionally excludes a given id (for edits). RLS
 * scopes the check to the caller's shop, so this can't leak across tenants.
 */
async function nameExists(name: string, excludeId?: string): Promise<boolean> {
  const supabase = createClient();
  let query = supabase
    .from("medicines")
    .select("id")
    .is("deleted_at", null)
    .ilike("name", name.trim());
  if (excludeId) query = query.neq("id", excludeId);
  const { data, error } = await query.limit(1);
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

/** Maps validated form values to the medicines table shape (paise, nulls). */
function toRow(values: MedicineFormValues) {
  const threshold =
    values.lowStockThreshold === "" ||
    values.lowStockThreshold === undefined
      ? null
      : Number(values.lowStockThreshold);

  return {
    name: values.name.trim(),
    brand: values.brand ? values.brand.trim() : null,
    manufacturer: values.manufacturer ? values.manufacturer.trim() : null,
    unit: values.unit,
    quantity: values.quantity,
    low_stock_threshold: threshold,
    purchase_price_paise: rupeesToPaise(values.purchasePrice),
    selling_price_paise: rupeesToPaise(values.sellingPrice),
    batch_no: values.batchNo ? values.batchNo.trim() : null,
    expiry_date:
      values.expiryDate && values.expiryDate !== "" ? values.expiryDate : null,
  };
}

/** A friendly error type the UI can special-case (duplicate name). */
export class DuplicateNameError extends Error {
  constructor(name: string) {
    super(`"${name}" already exists in your inventory`);
    this.name = "DuplicateNameError";
  }
}

/** Create a new medicine. Requires the caller's shop_id for the insert. */
export function useCreateMedicine(shopId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: MedicineFormValues) => {
      if (await nameExists(values.name)) {
        throw new DuplicateNameError(values.name.trim());
      }
      const supabase = createClient();
      const { data, error } = await supabase
        .from("medicines")
        .insert({ shop_id: shopId, ...toRow(values) })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medicines"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

/** Update an existing medicine (RLS blocks cross-tenant writes). */
export function useUpdateMedicine(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: MedicineFormValues) => {
      if (await nameExists(values.name, id)) {
        throw new DuplicateNameError(values.name.trim());
      }
      const supabase = createClient();
      const { data, error } = await supabase
        .from("medicines")
        .update(toRow(values))
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ["medicines"] });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      return row;
    },
  });
}

/** Archive (soft-delete) a medicine by setting deleted_at. */
export function useArchiveMedicine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("medicines")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medicines"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}
