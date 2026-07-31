import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";

/**
 * ADMIN client — uses the service-role key and BYPASSES RLS.
 *
 * SERVER-ONLY. The `server-only` import above makes the build fail if this
 * file is ever imported into a client bundle. Use only for narrow, audited,
 * privileged tasks (e.g. future Stripe webhooks). NOT used by the Auth + App
 * Shell module — signup provisioning goes through the SECURITY DEFINER
 * `provision_shop` RPC under the user's own session instead, which is safer.
 *
 * Never expose the service-role key to the browser.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
