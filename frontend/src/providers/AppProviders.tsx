"use client";

import { Toaster } from "sonner";
import { QueryProvider } from "./QueryProvider";

/**
 * Composes all client-side providers for the root layout.
 * Toaster powers the "Saved ✓ / Sold ✓" feedback (PROJECT.md §21).
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      {children}
      <Toaster
        position="top-center"
        richColors
        toastOptions={{ duration: 2500 }}
      />
    </QueryProvider>
  );
}
