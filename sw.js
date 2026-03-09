// ==========================================
// SERVICE WORKER — Andre's Calibrations PWA
// Caches all app files for offline gym use.
// Strategy: Cache-first for app shell,
//           Network-first for Firebase/API calls
// ==========================================

const CACHE_NAME = 'andres-calibrations-v1';

// All app files to cache for offline use
const APP_SHELL = [
    './',
    './index.html',
    './andre.html',
    './base.html',
    './glossary.html',
    './injury.html',
    './leaderboard.html',
    './macros.html',
    './warmup.html',
    './style.css',
    './script_andre.js',
    './script_base.js',
    './manifest.json',
    // Google Fonts (cached on first load)
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
    'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;900&family=Barlow:wght@300;400;500;600&display=swap',
    'https://fonts.googleapis.com/css2?family=Roboto:wght@400;700;900&display=swap'
];

// ── INSTALL: Pre-cache the app shell ──
self.addEventListener('install', event => {
    console.log('[SW] Installing — caching app shell');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
            .catch(err => console.error('[SW] Cache failed:', err))
    );
});

// ── ACTIVATE: Clean up old caches ──
self.addEventListener('activate', event => {
    console.log('[SW] Activating — cleaning old caches');
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(k => k !== CACHE_NAME)
                    .map(k => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

// ── FETCH: Serve from cache, fall back to network ──
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Skip Firebase/API calls — let them go to network normally
    // They'll just fail silently offline (app handles this gracefully)
    if (url.hostname.includes('firebaseapp.com') ||
        url.hostname.includes('googleapis.com') && url.pathname.includes('/v1/') ||
        url.hostname.includes('firestore.googleapis.com') ||
        url.hostname.includes('identitytoolkit.googleapis.com') ||
        url.hostname.includes('securetoken.googleapis.com') ||
        url.hostname.includes('firebasestorage.googleapis.com') ||
        url.hostname.includes('gstatic.com') && url.pathname.includes('firebase')) {
        // Network only for Firebase — don't cache auth/db calls
        event.respondWith(
            fetch(event.request).catch(() => {
                // Return empty response so the app doesn't crash
                return new Response('{}', {
                    status: 503,
                    statusText: 'Offline',
                    headers: { 'Content-Type': 'application/json' }
                });
            })
        );
        return;
    }

    // For everything else: Cache-first strategy
    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) {
                // Serve from cache immediately
                // Also fetch from network to update cache in background
                fetch(event.request).then(response => {
                    if (response && response.status === 200) {
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, response);
                        });
                    }
                }).catch(() => {}); // Ignore network errors
                return cached;
            }

            // Not in cache — try network
            return fetch(event.request).then(response => {
                // Cache successful responses for future offline use
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            }).catch(() => {
                // Offline and not cached — return offline fallback for HTML pages
                if (event.request.headers.get('accept').includes('text/html')) {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
