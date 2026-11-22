// Greek vocab service worker.
// Serves the saved copy at once (so it works offline), and quietly refreshes it in the background when online.
// A refreshed copy is used the next time the app is opened, never mid-session.
// Other sites (api.github.com) are never touched or cached.
const CACHE = "greek-vocab";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(SHELL.map((u) => fetch(new Request(u, { cache: "reload" })).then((r) => (r.ok ? c.put(u, r) : null))))));
});
self.addEventListener("activate", (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const hit = await c.match(req, { ignoreSearch: true });
    const refresh = fetch(new Request(req, { cache: "no-cache" })).then((r) => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
    if (hit) { e.waitUntil(refresh); return hit; }
    return (await refresh) || (await c.match("index.html")) || Response.error();
  }));
});
