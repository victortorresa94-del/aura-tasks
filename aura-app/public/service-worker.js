const CACHE_NAME = "aura-cache-v1";
const urlsToCache = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", (event) => {
    // Activar inmediatamente el nuevo SW sin esperar
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        Promise.all([
            // Tomar control de los clientes abiertos inmediatamente
            self.clients.claim(),
            caches.keys().then((cacheNames) =>
                Promise.all(
                    cacheNames.map((name) => {
                        if (name !== CACHE_NAME) return caches.delete(name);
                    })
                )
            )
        ])
    );
});
