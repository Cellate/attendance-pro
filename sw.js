const cacheName = 'attendance-pro-v3'; // Changed name to force update

// 1. Files to cache immediately (Pre-cache)
const staticAssets = [
    './',
'./index.html',
'./manifest.json',
'./icon.png',
// We explicitly cache the external libraries so it works offline!
'https://cdn.tailwindcss.com',
'https://unpkg.com/vue@3/dist/vue.global.js',
'https://fonts.googleapis.com/icon?family=Material+Icons+Round'
];

// 2. Install Event
self.addEventListener('install', async e => {
    const cache = await caches.open(cacheName);
    // This attempts to cache everything. If icon.png is missing, this fails!
    await cache.addAll(staticAssets);
    return self.skipWaiting();
});

// 3. Activate Event
self.addEventListener('activate', e => {
    self.clients.claim();
    // Cleanup old caches
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys.map(key => {
                if (key !== cacheName) return caches.delete(key);
            }));
        })
    );
});

// 4. Fetch Event
self.addEventListener('fetch', async e => {
    const req = e.request;

    // Try to get from cache first, then network
    e.respondWith(
        caches.match(req).then(cachedResponse => {
            // Return cached response if found
            if (cachedResponse) {
                return cachedResponse;
            }
            // Otherwise fetch from network
            return fetch(req).then(networkResponse => {
                // Check if we received a valid response
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
                    return networkResponse;
                }

                // Clone the response
                const responseToCache = networkResponse.clone();

                // Open cache and save it for next time (Dynamic Caching)
                caches.open(cacheName).then(cache => {
                    cache.put(req, responseToCache);
                });

                return networkResponse;
            }).catch(() => {
                // If offline and item not in cache, we could return a fallback here
                console.log("Offline and resource not cached:", req.url);
            });
        })
    );
});
