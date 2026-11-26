/* Iris web app service worker. Exists so Chrome/Edge treat /app as an installable desktop app.
   It only touches page navigations: always the network first, and the cached shell if offline.
   Everything else (API calls, assets) goes straight to the network untouched. */
const SHELL = '/app/';
const CACHE = 'iris-shell-v1';

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.add(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(fetch(event.request).catch(() => caches.match(SHELL)));
});
