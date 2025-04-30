/**
 * Script otimizado unificado para melhorar o desempenho do site
 * Combina otimizações de LCP e gerenciamento de imagens
 */

// Otimizações de LCP - Executar imediatamente
(function () {
    // ----- OTIMIZAÇÕES DE LCP -----
    // Indica que este arquivo está lidando com o monitoramento LCP centralizadamente
    window.lcpMonitoringActive = true;

    // Gerenciador de Imagens unificado
    // Cria um namespace único para todas as funções relacionadas à manipulação de imagens
    window.ImageManager = {
        // Verifica suporte a WebP
        verificarSuporteWebP: function () {
            return new Promise(resolve => {
                const webP = new Image();
                webP.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
                webP.onload = webP.onerror = function () {
                    resolve(webP.width > 0 && webP.height > 0);
                };
            });
        },

        // Configura lazy loading para imagens não críticas
        configurarLazyLoading: function () {
            console.log("Configurando lazy loading de imagens");
            if ('IntersectionObserver' in window) {
                const imageObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            const dataSrc = img.getAttribute('data-src');
                            if (dataSrc) {
                                img.src = dataSrc;
                                img.removeAttribute('data-src');
                            }
                            imageObserver.unobserve(img);
                        }
                    });
                }, {
                    rootMargin: '50px',
                    threshold: 0.1
                });

                // Aplicar observer para todas as imagens com data-src
                document.querySelectorAll('img[data-src]').forEach(img => {
                    imageObserver.observe(img);
                });
            } else {
                // Fallback para navegadores que não suportam IntersectionObserver
                document.querySelectorAll('img[data-src]').forEach(img => {
                    img.src = img.getAttribute('data-src');
                    img.removeAttribute('data-src');
                });
            }
            console.log("Lazy loading configurado");
        },

        // Otimiza todas as imagens do site (WebP)
        otimizarTodasImagens: async function () {
            console.log("Otimizando imagens");
            // Verificar se o navegador suporta WebP
            const suportaWebP = await this.verificarSuporteWebP();

            if (suportaWebP) {
                console.log("Navegador suporta WebP, trocando formato de imagens");
                // Trocar extensões de imagens para WebP quando o navegador suportar
                document.querySelectorAll('img:not([src^="data:"])').forEach(img => {
                    const src = img.getAttribute('src');
                    if (src && (src.endsWith('.jpg') || src.endsWith('.jpeg') || src.endsWith('.png'))) {
                        // Construir caminho para versão WebP
                        const novoCaminho = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
                        img.setAttribute('src', novoCaminho);
                    }
                });
            } else {
                console.log("Navegador não suporta WebP, mantendo formato original das imagens");
            }
        },

        // Carrega a imagem de fundo do cabeçalho
        carregarImagemFundo: function () {
            console.log("Carregando imagem de fundo do cabeçalho");
            const header = document.querySelector('header');
            if (header) {
                // Adicionar apenas a classe unificada para evitar redundância
                header.classList.add('bg-loaded');
            }
        },

        // Inicializa todas as otimizações de imagem
        inicializar: function () {
            // Registrar métricas para análise
            if ('PerformanceObserver' in window) {
                try {
                    // Observar métricas de web vitals
                    new PerformanceObserver((entryList) => {
                        for (const entry of entryList.getEntries()) {
                            // Log para debug
                            console.debug(`[Performance] ${entry.name}: ${entry.startTime.toFixed(0)}ms`);
                        }
                    }).observe({ type: 'largest-contentful-paint', buffered: true });
                } catch (e) {
                    console.error('Erro ao configurar PerformanceObserver', e);
                }
            }

            // Usar requestIdleCallback para operações não-críticas
            if ('requestIdleCallback' in window) {
                requestIdleCallback(() => {
                    this.carregarImagemFundo();
                    setTimeout(() => this.configurarLazyLoading(), 100);
                    setTimeout(() => this.otimizarTodasImagens(), 200);
                }, { timeout: 1000 });
            } else {
                // Fallback se requestIdleCallback não estiver disponível
                setTimeout(() => {
                    this.carregarImagemFundo();
                    setTimeout(() => this.configurarLazyLoading(), 100);
                    setTimeout(() => this.otimizarTodasImagens(), 200);
                }, 500);
            }
        }
    };

    // Priorizar a renderização do texto do LCP
    const applyLcpOptimizations = () => {
        // Localizar o elemento LCP (texto do cargo)
        const lcpElement = document.querySelector('header p[data-i18n="header.role"]');

        if (lcpElement) {
            // Usar classes CSS em vez de estilos inline
            lcpElement.classList.add('lcp-priority');
            lcpElement.classList.add('lcp-element');

            // Marcar como elemento de prioridade máxima
            lcpElement.setAttribute('fetchpriority', 'high');
        }
    };

    // Aplicar otimizações o mais cedo possível
    if (document.readyState === 'loading') {
        // Se o DOM ainda estiver carregando, aguardar o primeiro parser yield
        document.addEventListener('readystatechange', () => {
            if (document.readyState === 'interactive') {
                applyLcpOptimizations();
            }
        });
    } else {
        // Se o DOM já estiver interativo ou completo, aplicar imediatamente
        applyLcpOptimizations();
    }

    // Monitorar o progresso de renderização - Centralizado aqui
    if ('PerformanceObserver' in window) {
        const lcpObserver = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];

            // Registrar no console para depuração
            console.log('LCP:', lastEntry.startTime, lastEntry);

            // Após registrar o LCP, iniciar gerenciador de imagens
            window.ImageManager.inicializar();

            // Desconectar após registrar o LCP
            lcpObserver.disconnect();
        });

        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } else {
        // Se PerformanceObserver não estiver disponível, iniciar gerenciador de imagens diretamente
        setTimeout(() => window.ImageManager.inicializar(), 300);
    }
})();

// Inicializar ImageManager após o DOMContentLoaded para garantir que funcione mesmo se o LCP falhar
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se já foi inicializado pelo LCP
    if (!document.querySelector('header.bg-loaded')) {
        console.log("Inicializando gerenciador de imagens via DOMContentLoaded (fallback)");
        window.ImageManager.inicializar();
    }
});