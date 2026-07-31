"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/db/types";

/**
 * Browser Supabase client. Uses the anon key + the logged-in user's session
 * (stored in cookies by @supabase/ssr). All queries run under the user's JWT,
 * so RLS scopes every row to their shop. Safe to import in client components.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
