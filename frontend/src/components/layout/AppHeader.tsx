import Link from "next/link";
import { Settings } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { initials } from "@/lib/utils/format";

/**
 * Top app bar. Shows the shop name (the tenant the user is in) and a link to
 * settings. Sticky so it stays put while lists scroll.
 */
export function AppHeader({
  shopName,
  ownerName,
}: {
  shopName: string;
  ownerName: string | null;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-md items-center justify-between px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-slate-900">
            {shopName}
          </p>
          <p className="text-xs text-slate-500">Pharmacy dashboard</p>
        </div>
        <Link
          href={ROUTES.settings}
          aria-label="Settings"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          {ownerName ? (
            initials(ownerName)
          ) : (
            <Settings className="h-5 w-5" aria-hidden />
          )}
        </Link>
      </div>
    </header>
  );
}
