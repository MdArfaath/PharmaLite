/* PharmaLite service worker (hand-written, no build dependency).
 *
 * Strategy (PROJECT.md — offline shell + static assets, never stale business data):
 *   - Precache a minimal app shell (the offline fallback + icons/manifest).
 *   - Static build assets (/_next/static/*, icons) -> cache-first (immutable, hashed).
 *   - Navigations (HTML) -> network-first, falling back to the cached page and,
 *     if that misses, to /offline. This guarantees fresh pages when online and a
 *     graceful screen when offline.
 *   - Supabase and auth requests -> ALWAYS network, never cached (no stale
 *     business data, no cached auth state).
 *   - Everything else same-origin GET -> network-first with cache fallback.
 *
 * Bump CACHE_VERSION to invalidate old caches on deploy.
 */

const CACHE_VERSION = "v1";
const STATIC_CACHE = `pharmalite-static-${CACHE_VERSION}`;
const PAGES_CACHE = `pharmalite-pages-${CACHE_VERSION}`;

// Minimal shell precached on install.
const PRECACHE_URLS = [
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-192.png",
  "/icons/maskable-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (k) => k !== STATIC_CACHE && k !== PAGES_CACHE,
            )
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Allow the page to trigger an immediate activation after an update.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

function isSupabaseOrAuth(url) {
  // Never touch Supabase API/realtime/storage or our auth callback.
  return (
    url.hostname.endsWith(".supabase.co") ||
    url.hostname.endsWith(".supabase.in") ||
    url.pathname.startsWith("/auth") ||
    url.pathname.startsWith("/callback") ||
    url.pathname.startsWith("/api")
  );
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/favicon.ico"
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET; let the network deal with everything else.
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Only same-origin. Cross-origin (incl. Supabase) goes straight to network.
  if (url.origin !== self.location.origin) return;

  // Never cache Supabase/auth/api — always live.
  if (isSupabaseOrAuth(url)) return;

  // Immutable static assets -> cache-first.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(request, copy));
            return res;
          }),
      ),
    );
    return;
  }

  // Navigations (page loads) -> network-first with offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(PAGES_CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match("/offline");
        }),
    );
    return;
  }

  // Other same-origin GETs -> network-first, cache fallback.
  event.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone();
        caches.open(PAGES_CACHE).then((c) => c.put(request, copy));
        return res;
      })
      .catch(() => caches.match(request)),
  );
});
