import { Logo } from "@/components/layout/Logo";

/**
 * Shell for unauthenticated screens: a centered card, no bottom nav.
 * (PROJECT.md §12 — the (auth) route group.)
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="mb-8">
        <Logo />
      </div>
      <div className="w-full max-w-sm">{children}</div>
      <p className="mt-8 text-center text-xs text-slate-400">
        Built for small pharmacies. Fast and simple.
      </p>
    </main>
  );
}
