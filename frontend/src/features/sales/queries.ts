"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Sale, SaleItem } from "@/lib/db/types";

const PAGE_SIZE = 20;

export interface SalesFilters {
  /** Free-text: matches bill number (derived) or medicine name. */
  search: string;
  /** Inclusive ISO date (yyyy-mm-dd) lower bound, or "". */
  from: string;
  /** Inclusive ISO date (yyyy-mm-dd) upper bound, or "". */
  to: string;
}

/**
 * Paginated sales list (reverse chronological) with optional date-range and
 * text search. Text search matches either a derived bill number (the sale id
 * prefix) or a medicine name in the sale's items (resolved to sale ids first).
 *
 * Keyed under ["sales", ...] so the existing invalidateQueries({queryKey:
 * ["sales"]}) in the Sell mutation auto-refreshes this list after a new sale.
 */
export function useSalesList(filters: SalesFilters) {
  return useInfiniteQuery({
    queryKey: ["sales", "list", filters],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const supabase = createClient();
      const offset = (pageParam as number) * PAGE_SIZE;
      const term = filters.search.trim();

      // If searching, resolve matching sale ids first (by medicine name or by
      // bill-number/id prefix), then page the sales by those ids.
      let saleIdFilter: string[] | null = null;
      if (term) {
        const ids = new Set<string>();

        // Medicine-name matches via sale_items (RLS-scoped to this shop).
        const { data: itemHits, error: itemErr } = await supabase
          .from("sale_items")
          .select("sale_id")
          .ilike("medicine_name", `%${term}%`)
          .limit(500);
        if (itemErr) throw itemErr;
        itemHits?.forEach((r) => ids.add(r.sale_id));

        // Bill-number/id prefix match: the derived bill no. is the id's first
        // 6 hex chars. Match on the id text (dashes stripped by comparing the
        // raw prefix). We fetch a bounded set and filter client-side.
        const cleaned = term.replace(/^#/, "");
        if (/^[0-9a-fA-F]+$/.test(cleaned)) {
          const { data: idHits, error: idErr } = await supabase
            .from("sales")
            .select("id")
            .ilike("id", `${cleaned}%`)
            .limit(500);
          if (idErr) throw idErr;
          idHits?.forEach((r) => ids.add(r.id));
        }

        saleIdFilter = Array.from(ids);
        // No matches at all → return an empty page.
        if (saleIdFilter.length === 0) {
          return { rows: [] as Sale[], nextPage: undefined };
        }
      }

      let query = supabase
        .from("sales")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (filters.from) query = query.gte("created_at", `${filters.from}T00:00:00`);
      if (filters.to) query = query.lte("created_at", `${filters.to}T23:59:59.999`);
      if (saleIdFilter) query = query.in("id", saleIdFilter);

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data ?? []) as Sale[];
      const nextPage =
        rows.length === PAGE_SIZE ? (pageParam as number) + 1 : undefined;
      return { rows, nextPage };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });
}

export interface SaleDetail {
  sale: Sale;
  items: SaleItem[];
}

/** Full detail for one sale: header + line items (RLS-scoped). */
export function useSaleDetail(saleId: string) {
  return useQuery<SaleDetail | null>({
    queryKey: ["sales", "detail", saleId],
    queryFn: async () => {
      const supabase = createClient();
      const { data: sale, error: saleErr } = await supabase
        .from("sales")
        .select("*")
        .eq("id", saleId)
        .maybeSingle();
      if (saleErr) throw saleErr;
      if (!sale) return null;

      const { data: items, error: itemsErr } = await supabase
        .from("sale_items")
        .select("*")
        .eq("sale_id", saleId)
        .order("medicine_name", { ascending: true });
      if (itemsErr) throw itemsErr;

      return { sale: sale as Sale, items: (items ?? []) as SaleItem[] };
    },
    enabled: !!saleId,
  });
}

/**
 * Void a sale via the void_sale RPC (PROJECT.md §8 — append-only, void restores
 * stock + logs movements). Invalidates sales, inventory, dashboard and
 * recently-sold so everything reflects the reversal immediately.
 */
export function useVoidSale(saleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reason: string | null) => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("void_sale", {
        p_sale_id: saleId,
        p_reason: reason,
      });
      if (error) throw error;
      return data as Sale;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["medicines"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["recently-sold"] });
    },
  });
}
