import type { Metadata } from "next";
import { WifiOff } from "lucide-react";
import { Logo } from "@/components/layout/Logo";

export const metadata: Metadata = {
  title: "Offline · PharmaLite",
};

/**
 * Offline fallback shown by the service worker when a navigation fails and no
 * cached copy exists. Purely static (no data fetching) so it always renders.
 * Reuses the brand Logo + design tokens. A client-free "Try again" link simply
 * re-navigates, which the SW will attempt against the network first.
 */
export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mb-8">
        <Logo />
      </div>

      <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <WifiOff className="h-7 w-7" />
      </span>

      <h1 className="text-xl font-semibold text-slate-900">You&apos;re offline</h1>
      <p className="mt-2 max-w-xs text-sm text-slate-500">
        PharmaLite needs a connection to load your latest inventory and sales.
        Check your network and try again.
      </p>

      <a
        href="/dashboard"
        className="mt-6 inline-flex min-h-touch items-center justify-center rounded-xl bg-brand-600 px-5 font-medium text-white hover:bg-brand-700"
      >
        Try again
      </a>

      <p className="mt-8 text-xs text-slate-400">
        Your data is safe — it lives in the cloud, not on this device.
      </p>
    </main>
  );
}
