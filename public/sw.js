/* MindCocoon service worker: offline shell, help page and on-demand audio. */
const CACHE = "mc-v1";
const PRECACHE = [
  "/vi",
  "/en",
  "/vi/help",
  "/en/help",
  "/vi/vent",
  "/en/vent",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.status === 200) {
    const cache = await caches.open(CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;
    const lang = new URL(request.url).pathname.startsWith("/vi") ? "vi" : "en";
    return (await caches.match(`/${lang}/help`)) || Response.error();
  }
}

/** Media elements ask for byte ranges; serve them from a fully cached copy so audio works offline. */
async function audio(request, pathname) {
  let response = await caches.match(pathname);
  if (!response) {
    response = await fetch(pathname);
    if (!response.ok) return response;
    const cache = await caches.open(CACHE);
    await cache.put(pathname, response.clone());
  }
  const range = request.headers.get("range");
  if (!range) return response;
  const body = await response.arrayBuffer();
  const [startText, endText] = range.replace(/bytes=/, "").split("-");
  const start = Number(startText) || 0;
  const end = endText ? Math.min(Number(endText), body.byteLength - 1) : body.byteLength - 1;
  return new Response(body.slice(start, end + 1), {
    status: 206,
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "audio/mp4",
      "Content-Range": `bytes ${start}-${end}/${body.byteLength}`,
      "Content-Length": String(end - start + 1),
      "Accept-Ranges": "bytes",
    },
  });
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
  } else if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(request));
  } else if (url.pathname.startsWith("/audio/")) {
    event.respondWith(audio(request, url.pathname));
  }
});
