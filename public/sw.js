const CACHE_NAME = "ttpu-lms-static-v3";
const PRECACHE_URLS = ["/sw.js", "/manifest.webmanifest", "/logo.svg", "/icon.svg"];

const OFFLINE_HTML = `<!doctype html>
<html lang="uz">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>TTPU LMS — Oflayn</title>
<style>
body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f6f7fa;color:#1d3460;display:flex;min-height:100vh;align-items:center;justify-content:center}
main{max-width:22rem;padding:2rem;text-align:center}
img{border-radius:9999px}
h1{margin:.75rem 0 .25rem;font-size:1.4rem}
p{margin:0 0 1.25rem;color:#475569;line-height:1.5}
button{border:0;border-radius:.65rem;background:#1d3460;color:#fff;font-size:.9rem;font-weight:600;padding:.7rem 1.4rem;cursor:pointer}
</style>
</head>
<body>
<main>
<img src="/logo.svg" alt="TTPU" width="72" height="72" />
<h1>TTPU LMS</h1>
<p>Internet aloqasi yo'q. Ulanish tiklangach sahifani qayta yuklang.</p>
<button onclick="location.reload()">Qayta urinish</button>
</main>
</body>
</html>`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.allSettled(
          PRECACHE_URLS.map(async (url) => {
            const response = await fetch(url, { cache: "no-cache" });
            if (isCacheable(response)) {
              await cache.put(url, response);
            }
          }),
        ),
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      // Faqat shu ilovaning eski versiyalangan keshlarini o'chiramiz. Xuddi shu
      // origin'dagi boshqa ilova/xizmatlar keshlari (boshqa nom bilan) tegilmaydi.
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("ttpu-lms-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (PRECACHE_URLS.includes(url.pathname)) {
    event.respondWith(cacheFirst(request));
  }
});

function isCacheable(response) {
  if (!response || !response.ok || response.type === "opaque") return false;
  const cacheControl = response.headers.get("Cache-Control") || "";
  return !/no-store|private/i.test(cacheControl);
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (isCacheable(response)) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(OFFLINE_HTML, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (isCacheable(response)) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}
