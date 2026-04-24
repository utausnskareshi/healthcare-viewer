// Service Worker: offline-first app shell cache.
// Data (IndexedDB) is separate and managed by the app.

const VERSION = 'hv-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/main.js',
  './js/db.js',
  './js/prefs.js',
  './js/utils.js',
  './js/metrics.js',
  './js/chart-render.js',
  './js/views/files.js',
  './js/views/dashboard.js',
  './js/views/metric.js',
  './js/views/workout.js',
  './js/views/cycle.js',
  './js/worker.js',
  './vendor/chart/chart.umd.min.js',
  './vendor/chart/chartjs-adapter-date-fns.bundle.min.js',
  './vendor/leaflet/leaflet.js',
  './vendor/leaflet/leaflet.css',
  './vendor/leaflet/images/marker-icon.png',
  './vendor/leaflet/images/marker-icon-2x.png',
  './vendor/leaflet/images/marker-shadow.png',
  './vendor/leaflet/images/layers.png',
  './vendor/leaflet/images/layers-2x.png',
  './vendor/fflate/fflate.min.js',
  './icons/favicon.png',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // OSM tiles: cache-first w/ network fallback, cap entries via separate cache
  if (url.hostname.endsWith('tile.openstreetmap.org') ||
      url.hostname.endsWith('tile.openstreetmap.jp') ||
      url.hostname.endsWith('cyberjapandata.gsi.go.jp')) {
    event.respondWith(tileStrategy(req));
    return;
  }

  // Same-origin (app shell + our assets): cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(req));
    return;
  }
});

async function cacheFirst(req) {
  const cache = await caches.open(VERSION);
  const hit = await cache.match(req, { ignoreSearch: false });
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res && res.ok && (req.url.startsWith(self.location.origin))) {
      cache.put(req, res.clone());
    }
    return res;
  } catch (e) {
    const fallback = await cache.match('./index.html');
    if (fallback) return fallback;
    throw e;
  }
}

async function tileStrategy(req) {
  const cache = await caches.open('hv-tiles');
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    if (hit) return hit;
    return new Response('', { status: 504 });
  }
}
