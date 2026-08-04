"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (public/sw.js) once, after the window loads, in
 * production only. Kept side-effect-only — renders nothing. Registration is
 * best-effort: any failure is swallowed so it can never break the app.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      return;
    }

    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Non-fatal: app works fine without the SW.
      });
    };

    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
