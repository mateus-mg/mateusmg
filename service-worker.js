// Service Worker para o portfólio
const CACHE_NAME = 'portfolio-cache-v1';

// Lista de recursos críticos para cache
const CRITICAL_RESOURCES = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/init.js',
    '/js/scripts.js',
    '/js/optimizer.js'
];

// Instalação do service worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(CRITICAL_RESOURCES))
    );
});

// Estratégia de cache: Cache First com fallback para network
self.addEventListener('fetch', (event) => {
    // Ignorar recursos que já são cacheados pelo _headers
    if (event.request.url.includes('/img/') ||
        event.request.url.includes('/i18n/') ||
        event.request.url.includes('/fonts/')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request)
                    .then(response => {
                        // Não cachear respostas com erro ou não-GET
                        if (!response || response.status !== 200 || response.type !== 'basic' || event.request.method !== 'GET') {
                            return response;
                        }

                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    });
            })
    );
});