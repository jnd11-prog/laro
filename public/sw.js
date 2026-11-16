// Offline support. Pages and the saved career load from the network when possible and fall back to the
// last copy kept on this device. Art, fonts and code are cached as they load, and the game's own code is
// cached at install so the offline game page actually runs. Changes (spins, answers, signups, analytics)
// are never cached or replayed here: they need a connection, and analytics events wait in the page's own
// queue until the device is back online.
const VERSION = 'v3';
const PAGES = `laro-pages-${VERSION}`, STATIC = `laro-static-${VERSION}`, DATA = `laro-data-${VERSION}`;
const SHELL = ['/play', '/welcome', '/offline.html', '/manifest.webmanifest', '/art/base-day.png', '/art/base-dusk.png', '/art/base-night.png', '/art/clouds-day.png', '/art/clouds-dusk.png', '/art/clouds-night.png', '/art/grass-day.png', '/art/grass-dusk.png', '/art/grass-night.png', '/art/keeper.png', '/art/jeep.png', '/fonts/pixelify-sans.woff2', '/fonts/laro-pixel.woff'];

// Caches a page and every script, style and preload it references, so it can run offline.
async function cachePageWithAssets(url) {
  const response = await fetch(url, { credentials: 'same-origin' });
  if (!response.ok) return;
  const html = await response.clone().text();
  await (await caches.open(PAGES)).put(url, response);
  const assets = new Set();
  for (const [, ref] of html.matchAll(/(?:src|href)="(\/[^"]+\.(?:js|css|woff2?))"/g)) assets.add(ref);
  const cache = await caches.open(STATIC);
  await Promise.all([...assets].map((a) => cache.add(a).catch(() => null)));
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const pages = await caches.open(PAGES);
    await Promise.all(SHELL.filter((u) => u !== '/play' && u !== '/welcome').map((u) => pages.add(u).catch(() => null)));
    await Promise.all(['/play', '/welcome'].map((u) => cachePageWithAssets(u).catch(() => null)));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', (event) => {
  // Older versions' caches, including old code bundles, are removed.
  const keep = new Set([PAGES, STATIC, DATA]);
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('laro-') && !keep.has(k)).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

const offlineJson = () => new Response(JSON.stringify({ error: 'You’re offline. Open Laro once while online so your career is saved on this device.' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
const cacheable = (request, response) => response.ok && response.status === 200 && response.type === 'basic' && !request.headers.has('range');

async function navigate(event, url) {
  const { request } = event, pages = await caches.open(PAGES);
  try {
    const response = await fetch(request);
    // Invite links are one-off; everything else is kept for offline use.
    if (cacheable(request, response) && !url.searchParams.has('join')) event.waitUntil(pages.put(url.pathname, response.clone()));
    return response;
  } catch {
    // Offline: anyone who has played (a saved career is on this device) gets the game at "/".
    const played = !!(await (await caches.open(DATA)).match('/api/state'));
    const order = url.pathname === '/' ? (played ? ['/play', '/'] : ['/', '/welcome']) : [url.pathname];
    for (const path of order) { const hit = await pages.match(path); if (hit) return hit; }
    return (await caches.match('/offline.html')) || new Response('You’re offline.', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}
async function data(event) {
  const { request } = event, cache = await caches.open(DATA);
  try {
    const response = await fetch(request);
    if (cacheable(request, response)) event.waitUntil(cache.put(request, response.clone()));
    return response;
  } catch {
    return (await cache.match(request)) || offlineJson();
  }
}
async function asset(event) {
  const { request } = event, cache = await caches.open(STATIC), hit = await cache.match(request);
  const update = fetch(request).then((response) => { if (cacheable(request, response)) return cache.put(request, response.clone()).then(() => response); return response; }).catch(() => null);
  if (hit) { event.waitUntil(update); return hit; }
  return (await update) || new Response('', { status: 504 });
}

self.addEventListener('fetch', (event) => {
  const { request } = event, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') return event.respondWith(navigate(event, url));
  // Recordings stream with byte ranges, which caches can't store; leave those to the browser.
  if (request.headers.has('range')) return;
  // This device's saved career, the news and recordings: fresh when online, last copy offline.
  if (url.pathname === '/api/state' || url.pathname === '/api/united' || url.pathname.startsWith('/api/audio/')) return event.respondWith(data(event));
  if (url.pathname.startsWith('/api/')) return;
  if (['script', 'style', 'font', 'image', 'manifest'].includes(request.destination) || /\.(js|css|woff2?|png|svg|webp)$/.test(url.pathname)) event.respondWith(asset(event));
});
