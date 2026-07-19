/* Parcela operator service worker — staff, branch lead, and portal login only.
   HQ (/admin) and platform (/platform) always use the network (no offline cache). */

const CACHE_VERSION = "parcela-operator-v2";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const OFFLINE_URL = "/offline-operator.html";

const PRECACHE_URLS = [
  OFFLINE_URL,
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
];

function isAdminOrPlatformPath(pathname) {
  return pathname.startsWith("/admin") || pathname.startsWith("/platform");
}

function isOperatorPath(pathname) {
  return (
    pathname.startsWith("/staff") ||
    pathname.startsWith("/lead") ||
    pathname.startsWith("/portal")
  );
}

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
            .filter((key) => key.startsWith("parcela-operator-") && key !== STATIC_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // HQ and platform admin — always online, never intercept.
  if (isAdminOrPlatformPath(url.pathname)) return;

  // API and auth — network only.
  if (url.pathname.startsWith("/api")) return;

  // Next.js static assets — cache for faster reload / flaky links.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response.ok) {
              void cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => cached);
        return cached ?? network;
      }),
    );
    return;
  }

  // Operator page navigations — network first, offline fallback shell.
  if (request.mode === "navigate" && isOperatorPath(url.pathname)) {
    event.respondWith(
      fetch(request).catch(async () => {
        const offline = await caches.match(OFFLINE_URL);
        if (offline) return offline;
        return new Response("Offline — reopen Parcela Counter when connected.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }),
    );
  }
});
