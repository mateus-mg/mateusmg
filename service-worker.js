// Service Worker para o portfólio
const CACHE_NAME = 'portfolio-cache-v1';
const OFFLINE_PAGE = '/404.html';

// Assets que queremos disponíveis offline imediatamente
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/init.js',
    '/js/scripts.js',
    '/js/optimizer.js',
    '/js/seo-loader.js',
    '/js/seo.json',
    '/i18n/pt.json',
    '/i18n/en.json',
    '/i18n/es.json',
    '/img/webp/header-bg.webp',
    '/img/webp/favicon.webp',
    '/img/webp/rh.webp',
    '/img/webp/vendas.webp',
    '/img/webp/preços-casas.webp',
    OFFLINE_PAGE
];

// Instalação do Service Worker
self.addEventListener('install', event => {
    console.log('[Service Worker] Instalando...');

    // Armazenar recursos essenciais em cache durante a instalação
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Pré-carregando arquivos...');
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => {
                console.log('[Service Worker] Instalação concluída - recursos em cache');
                return self.skipWaiting();
            })
    );
});

// Ativação do Service Worker
self.addEventListener('activate', event => {
    console.log('[Service Worker] Ativando...');

    // Limpar caches antigos
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('[Service Worker] Removendo cache antigo:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => {
            console.log('[Service Worker] Agora está ativo e controlando a página');
            return self.clients.claim();
        })
    );
});

// Interceptação de solicitações de rede
self.addEventListener('fetch', event => {
    // Não interceptar solicitações para analytics ou apis externas
    if (event.request.url.includes('analytics') ||
        event.request.url.includes('formsubmit.co')) {
        return;
    }

    // Estratégia: stale-while-revalidate para a maioria dos recursos
    // Isso mostra conteúdo em cache imediatamente (mesmo se estiver desatualizado)
    // enquanto atualiza o cache em segundo plano para a próxima visita
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                const fetchPromise = fetch(event.request)
                    .then(networkResponse => {
                        // Não armazenar respostas sem-sucesso
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        // Armazenar a nova resposta em cache
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    })
                    .catch(error => {
                        console.log('[Service Worker] Erro de rede:', error);

                        // Se for uma navegação para página e tivermos uma falha de rede,
                        // fornecer a página offline
                        if (event.request.mode === 'navigate') {
                            return caches.match(OFFLINE_PAGE);
                        }

                        return null;
                    });

                // Retornar a versão em cache ou buscar na rede
                return cachedResponse || fetchPromise;
            })
    );
});

// Sincronização em segundo plano
self.addEventListener('sync', event => {
    if (event.tag === 'sync-formulario') {
        console.log('[Service Worker] Tentando sincronizar formulário em background');
        // Aqui você implementaria a lógica para sincronizar dados do formulário
        // armazenados enquanto o usuário estava offline
    }
});

// Notificações push (preparado para implementação futura)
self.addEventListener('push', event => {
    const title = 'Portfólio Atualizado';
    const options = {
        body: event.data.text() || 'Veja as novidades em meu portfólio!',
        icon: '/img/webp/favicon.webp',
        badge: '/img/webp/favicon.webp'
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// Ações de notificação
self.addEventListener('notificationclick', event => {
    event.notification.close();

    event.waitUntil(
        clients.openWindow('/')
    );
});