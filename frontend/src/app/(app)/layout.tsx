import { redirect } from "next/navigation";
import { getCurrentContext } from "@/features/auth/getCurrentContext";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { ROUTES } from "@/lib/constants";

/**
 * Authenticated shell (PROJECT.md §12). Server-guards every app route:
 *  - no session        → /login (middleware also enforces this)
 *  - session but no shop yet → /login to complete provisioning on next sign-in
 * Then renders the sticky header + fixed bottom nav around the page.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, profile, shop } = await getCurrentContext();

  if (!userId) {
    redirect(ROUTES.login);
  }

  // Signed in but provisioning didn't complete (e.g. interrupted signup).
  // Send back to login; ensureProvisioned() runs there and finishes setup.
  if (!profile || !shop) {
    redirect(`${ROUTES.login}?needsSetup=1`);
  }

  return (
    <div className="min-h-screen">
      <AppHeader shopName={shop.name} ownerName={profile.full_name} />
      {children}
      <BottomNav />
    </div>
  );
}
