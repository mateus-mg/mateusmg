/**
 * Script otimizado unificado para melhorar o desempenho do site
 * Combina otimizações de LCP e gerenciamento de imagens
 */

// Otimizações de LCP - Executar imediatamente
(function () {
    // ----- OTIMIZAÇÕES DE LCP -----

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

    // Adiar carregamento de recursos não críticos
    const loadBackgroundImage = () => {
        const header = document.querySelector('header');
        if (header) {
            // Adicionar classe para carregar a imagem de fundo
            header.classList.add('bg-loaded');
            header.classList.add('imagem-carregada');
        }
    };

    // Usar requestIdleCallback para operações não-críticas
    const scheduleNonCriticalOperations = () => {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                loadBackgroundImage();
            }, { timeout: 1000 });
        } else {
            // Fallback se requestIdleCallback não estiver disponível
            setTimeout(loadBackgroundImage, 500);
        }
    };

    // Monitorar o progresso de renderização
    if ('PerformanceObserver' in window) {
        const lcpObserver = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];

            // Após registrar o LCP, podemos iniciar operações não-críticas
            scheduleNonCriticalOperations();

            // Desconectar após registrar o LCP
            lcpObserver.disconnect();
        });

        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } else {
        // Se PerformanceObserver não estiver disponível, adiar carregamento por tempo
        setTimeout(scheduleNonCriticalOperations, 300);
    }
})();

// ----- OTIMIZAÇÕES DE IMAGEM -----

// Função para verificar suporte a WebP
function verificarSuporteWebP() {
    return new Promise(resolve => {
        const webP = new Image();
        webP.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
        webP.onload = webP.onerror = function () {
            resolve(webP.width > 0 && webP.height > 0);
        };
    });
}

// Função para aplicar lazy loading em imagens não críticas
function configurarLazyLoading() {
    // Observer para lazy loading de imagens
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
}

// Função para otimizar imagens em toda a página
function otimizarTodasImagens() {
    // Verificar se o navegador suporta WebP
    verificarSuporteWebP().then(suporta => {
        if (suporta) {
            // Trocar extensões de imagens para WebP quando o navegador suportar
            document.querySelectorAll('img:not([src^="data:"])').forEach(img => {
                const src = img.getAttribute('src');
                if (src && (src.endsWith('.jpg') || src.endsWith('.jpeg') || src.endsWith('.png'))) {
                    // Construir caminho para versão WebP
                    const novoCaminho = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
                    img.setAttribute('src', novoCaminho);
                }
            });
        }
    });
}

// Inicializar otimizações de imagem após o DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Configurar lazy loading para outras imagens (após o LCP)
    setTimeout(configurarLazyLoading, 100);

    // Otimizar todas as imagens
    otimizarTodasImagens();

    // Reportar métricas para análise
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
});