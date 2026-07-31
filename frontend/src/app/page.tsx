import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/constants";

/**
 * "/" → send to dashboard if signed in, otherwise to login.
 * (Middleware also enforces this; this keeps the entry point explicit.)
 */
export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? ROUTES.dashboard : ROUTES.login);
}
