/* Service worker della Segreteria Casentino.
   Serve solo a farla funzionare senza rete: la pagina resta in cache e si apre
   uguale in aereo, in chiesa senza campo o con il wi-fi spento.
   La pagina si prende dalla rete quando c'e' (cosi' gli aggiornamenti arrivano)
   e dalla cache quando non c'e'. Tutto il resto (caratteri) e' cache-first. */
const C = "segreteria-v24";

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(C).then(c => c.addAll(["./", "./index.html"])).catch(() => {}));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  if (r.mode === "navigate") {
    e.respondWith(fetch(r)
      .then(res => { const cp = res.clone(); caches.open(C).then(c => c.put("./index.html", cp)); return res; })
      .catch(() => caches.match("./index.html").then(x => x || caches.match("./"))));
    return;
  }
  e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => {
    if (res.ok && (r.url.startsWith(self.registration.scope) || /fonts\.(googleapis|gstatic)\.com/.test(r.url))) {
      const cp = res.clone(); caches.open(C).then(c => c.put(r, cp));
    }
    return res;
  }).catch(() => hit)));
});
