/**
 * Database types.
 *
 * These mirror the SQL schema in supabase/migrations (0001-0006). In a real
 * workflow you regenerate this file with the Supabase CLI:
 *
 *   supabase gen types typescript --project-id <id> > src/lib/db/types.ts
 *
 * Hand-written here to match the approved schema exactly. Shapes satisfy
 * @supabase/postgrest-js's GenericSchema constraint: every Table/View carries
 * Row/Insert/Update/Relationships. Tables whose writes only happen through
 * RPCs use Record<string, never> for Insert/Update (never inserted directly).
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface ShopSettings {
  low_stock_threshold: number;
  expiry_window_days: number;
  currency: string;
}

type NoRelationships = [];

export interface Database {
  public: {
    Tables: {
      plans: {
        Row: {
          id: string;
          code: string;
          name: string;
          price_paise: number;
          limits: Json;
          is_active: boolean;
          created_at: string;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: NoRelationships;
      };
      shops: {
        Row: {
          id: string;
          name: string;
          plan_id: string;
          owner_user_id: string;
          phone: string | null;
          settings: ShopSettings;
          status: "active" | "suspended";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          plan_id: string;
          owner_user_id: string;
          phone?: string | null;
          settings?: ShopSettings;
          status?: "active" | "suspended";
        };
        Update: {
          name?: string;
          phone?: string | null;
          settings?: ShopSettings;
          status?: "active" | "suspended";
        };
        Relationships: NoRelationships;
      };
      profiles: {
        Row: {
          id: string;
          shop_id: string;
          full_name: string | null;
          role: "owner" | "staff";
          created_at: string;
        };
        Insert: {
          id: string;
          shop_id: string;
          full_name?: string | null;
          role?: "owner" | "staff";
        };
        Update: {
          full_name?: string | null;
          role?: "owner" | "staff";
        };
        Relationships: NoRelationships;
      };
      suppliers: {
        Row: {
          id: string;
          shop_id: string;
          name: string;
          phone: string | null;
          note: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          shop_id: string;
          name: string;
          phone?: string | null;
          note?: string | null;
        };
        Update: {
          name?: string;
          phone?: string | null;
          note?: string | null;
          deleted_at?: string | null;
        };
        Relationships: NoRelationships;
      };
      medicines: {
        Row: {
          id: string;
          shop_id: string;
          name: string;
          brand: string | null;
          manufacturer: string | null;
          unit: string;
          sku: string | null;
          supplier_id: string | null;
          quantity: number;
          low_stock_threshold: number | null;
          purchase_price_paise: number;
          selling_price_paise: number;
          batch_no: string | null;
          expiry_date: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          shop_id: string;
          name: string;
          brand?: string | null;
          manufacturer?: string | null;
          unit: string;
          sku?: string | null;
          supplier_id?: string | null;
          quantity?: number;
          low_stock_threshold?: number | null;
          purchase_price_paise?: number;
          selling_price_paise?: number;
          batch_no?: string | null;
          expiry_date?: string | null;
        };
        Update: {
          name?: string;
          brand?: string | null;
          manufacturer?: string | null;
          unit?: string;
          sku?: string | null;
          supplier_id?: string | null;
          quantity?: number;
          low_stock_threshold?: number | null;
          purchase_price_paise?: number;
          selling_price_paise?: number;
          batch_no?: string | null;
          expiry_date?: string | null;
          deleted_at?: string | null;
        };
        Relationships: NoRelationships;
      };
      sales: {
        Row: {
          id: string;
          shop_id: string;
          total_paise: number;
          item_count: number;
          payment_method: string;
          note: string | null;
          status: "completed" | "voided";
          voided_at: string | null;
          voided_reason: string | null;
          voids_sale_id: string | null;
          sold_by: string | null;
          created_at: string;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: NoRelationships;
      };
      sale_items: {
        Row: {
          id: string;
          shop_id: string;
          sale_id: string;
          medicine_id: string | null;
          medicine_name: string;
          quantity: number;
          unit_price_paise: number;
          line_total_paise: number;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: NoRelationships;
      };
      stock_movements: {
        Row: {
          id: string;
          shop_id: string;
          medicine_id: string;
          delta: number;
          reason: "restock" | "sale" | "void" | "adjust";
          ref_type: "sale" | "stock" | "manual" | null;
          ref_id: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: NoRelationships;
      };
    };
    Views: {
      v_low_stock: {
        Row: Database["public"]["Tables"]["medicines"]["Row"] & {
          effective_threshold: number;
        };
        Relationships: NoRelationships;
      };
      v_expiring_soon: {
        Row: Database["public"]["Tables"]["medicines"]["Row"] & {
          is_expired: boolean;
          expiry_window_days: number;
        };
        Relationships: NoRelationships;
      };
      v_dashboard_stats: {
        Row: {
          shop_id: string;
          medicine_count: number;
          low_stock_count: number;
          expiring_count: number;
          today_sales_paise: number;
          today_sales_count: number;
        };
        Relationships: NoRelationships;
      };
      v_recently_sold: {
        Row: {
          id: string;
          shop_id: string;
          name: string;
          brand: string | null;
          manufacturer: string | null;
          unit: string;
          quantity: number;
          selling_price_paise: number;
          units_sold_30d: number;
          last_sold_at: string;
        };
        Relationships: NoRelationships;
      };
    };
    Functions: {
      auth_shop_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      provision_shop: {
        Args: { p_shop_name: string; p_full_name: string | null };
        Returns: string;
      };
      add_stock: {
        Args: { p_medicine_id: string; p_delta: number; p_reason: string };
        Returns: Database["public"]["Tables"]["medicines"]["Row"];
      };
      record_sale: {
        Args: {
          p_items: Json;
          p_payment_method: string;
          p_note: string | null;
          p_voids_sale_id: string | null;
        };
        Returns: string;
      };
      void_sale: {
        Args: { p_sale_id: string; p_reason: string | null };
        Returns: Database["public"]["Tables"]["sales"]["Row"];
      };
      search_medicines: {
        Args: { p_term: string };
        Returns: Database["public"]["Tables"]["medicines"]["Row"][];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Shop = Database["public"]["Tables"]["shops"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Medicine = Database["public"]["Tables"]["medicines"]["Row"];
export type Supplier = Database["public"]["Tables"]["suppliers"]["Row"];
export type Sale = Database["public"]["Tables"]["sales"]["Row"];
export type SaleItem = Database["public"]["Tables"]["sale_items"]["Row"];
export type DashboardStats =
  Database["public"]["Views"]["v_dashboard_stats"]["Row"];
