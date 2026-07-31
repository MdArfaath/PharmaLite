import { createClient } from "@/lib/supabase/server";
import type { Profile, Shop } from "@/lib/db/types";

/**
 * Server-side loader for the authenticated user's profile + shop.
 * Used by the (app) layout to guard routes and populate the header.
 * Returns nulls when unauthenticated or not yet provisioned.
 */
export interface CurrentContext {
  userId: string | null;
  email: string | null;
  profile: Profile | null;
  shop: Shop | null;
}

export async function getCurrentContext(): Promise<CurrentContext> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { userId: null, email: null, profile: null, shop: null };
  }

  // profiles + shops are RLS-scoped to this user's shop.
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  let shop: Shop | null = null;
  if (profile) {
    const { data: shopRow } = await supabase
      .from("shops")
      .select("*")
      .eq("id", profile.shop_id)
      .maybeSingle();
    shop = shopRow ?? null;
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    profile: profile ?? null,
    shop,
  };
}
