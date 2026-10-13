/**
 * Service Worker for Angel's Stardust / E LIT
 * Strategy:
 *  - HTML pages: Network-first, fall back to cache
 *  - Fonts, CSS, JS, images: Cache-first, fall back to network
 *  - Audio/Video: Cache with byte-range request support
 */

const CACHE_NAME = 'stardust-v1';
const MEDIA_CACHE = 'stardust-media-v1';

// Core shell files to precache on install
const PRECACHE_URLS = [
  './',
  './landing.html',
  './index.html',
  './chapter1.html',
  './chapter1-akira.html',
  './main-menu.html',
  './login.html',
  './notepad-black-desktop.html',
  './zone.html',
  './creditx.html',
  './credits.html',
  './credits-finale.html',
  './alex-session1.html',
  './alex-session2.html',
  './alex-session4.html',
  './alex-session5.html',
  './alex-session5b.html',
  './alex-sophia.html',
  './alexsophiaeye.html',
  './alex-memory.html',
  './alex-biodata.html',
  './akira-index.html',
  './akira-menu.html',
  './akira-chapter1.html',
  './akira-police.html',
  './akira-session2.html',
  './akira-session3.html',
  './akira-session4.html',
  './fog-three-scenes.html',
  './mse-alex-s1.html',
  './mse-alex-s2.html',
  './mse-alex-s4.html',
  './mse-akira-s2.html',
  './mse-akira-s3.html',
  './mse-akira-s4.html',
  './sm/alex-brown-combined.html',
  './platform.js',
  './script.js',
  './style.css',
  './manifest.webmanifest',
  './icon.svg',
  './icon-maskable.svg',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './vendor/fonts/fonts.css',
  './vendor/fontawesome/4.7.0/css/font-awesome.min.css',
  './vendor/fontawesome/5.15.4/css/all.min.css',
  './vendor/js/jquery.min.js',
  './vendor/js/gsap.min.js',
  './vendor/js/Physics2DPlugin.min.js',
  './vendor/js/three.module.js',
  './vendor/js/three.bundle.mjs',
  './vendor/js/EffectComposer.bundle.mjs',
  './vendor/js/RenderPass.bundle.mjs',
  './vendor/js/GlitchPass.bundle.mjs',
  './vendor/js/UnrealBloomPass.bundle.mjs',
  './vendor/js/lil-gui.esm.min.js',
  './vendor/js/rough-notation.esm.js'
];

// ─── Install: precache shell ───
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

// ─── Activate: clean old caches ───
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== MEDIA_CACHE)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// ─── Fetch handler ───
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  const pathname = url.pathname;

  // Media files: special handling for byte-range requests
  if (/\.(mp4|mp3|webm|ogg|wav)$/i.test(pathname)) {
    event.respondWith(handleMedia(event.request));
    return;
  }

  // Font files: cache-first
  if (/\.(woff2?|ttf|eot|otf)$/i.test(pathname) || pathname.includes('/vendor/fonts/')) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // CSS, JS, images: cache-first
  if (/\.(css|js|mjs|png|jpg|jpeg|gif|svg|ico|webp)$/i.test(pathname)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // HTML pages: network-first, fall back to cache
  if (event.request.mode === 'navigate' || /\.html$/i.test(pathname)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Everything else: cache-first
  event.respondWith(cacheFirst(event.request));
});

// ─── Strategies ───

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(
      '<!DOCTYPE html><html><body style="background:#0a0a0a;color:#d4a843;font-family:serif;text-align:center;padding:4rem"><h1>Offline</h1><p>This page is not yet cached. Connect to the internet and try again.</p></body></html>',
      { status: 503, headers: { 'Content-Type': 'text/html' } }
    );
  }
}

/**
 * Handle media files with byte-range request support.
 * Android WebView and <video>/<audio> elements often request media
 * with Range headers. The Cache API stores complete responses, so
 * we need to slice the cached ArrayBuffer when a Range is requested.
 */
async function handleMedia(request) {
  const cache = await caches.open(MEDIA_CACHE);
  const rangeHeader = request.headers.get('range');

  // Try to get the full response from cache first
  // Use a range-less request as the cache key
  const cacheKey = new Request(request.url, { headers: {} });
  let fullResponse = await cache.match(cacheKey);

  if (!fullResponse) {
    // Not cached — fetch from network
    try {
      // Fetch without range to get the full file for caching
      const networkResponse = await fetch(new Request(request.url, {
        headers: {} // no range header — get full file
      }));

      if (networkResponse.ok) {
        // Clone and cache the full response
        cache.put(cacheKey, networkResponse.clone());
        fullResponse = networkResponse;
      } else if (networkResponse.status === 206) {
        // Server returned partial content even without range — just pass through
        return networkResponse;
      } else {
        return networkResponse;
      }
    } catch (e) {
      return new Response('Media unavailable offline', {
        status: 503,
        statusText: 'Service Unavailable'
      });
    }
  }

  // If no range requested, return the full response
  if (!rangeHeader) {
    return fullResponse;
  }

  // Parse the Range header and return a 206 Partial Content response
  const fullBlob = await fullResponse.clone().arrayBuffer();
  const totalSize = fullBlob.byteLength;
  const contentType = fullResponse.headers.get('Content-Type') || 'application/octet-stream';

  const rangeMatch = rangeHeader.match(/bytes=(\d+)-(\d*)/);
  if (!rangeMatch) {
    return new Response(fullBlob, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': totalSize,
        'Accept-Ranges': 'bytes'
      }
    });
  }

  const start = parseInt(rangeMatch[1], 10);
  const end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : totalSize - 1;
  const chunkSize = end - start + 1;

  return new Response(fullBlob.slice(start, end + 1), {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Type': contentType,
      'Content-Range': `bytes ${start}-${end}/${totalSize}`,
      'Content-Length': chunkSize,
      'Accept-Ranges': 'bytes'
    }
  });
}
