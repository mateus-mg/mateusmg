/**
 * Script de otimização de imagens para melhorar o LCP
 * Este arquivo é carregado de forma assíncrona e não bloqueia o carregamento inicial
 */

// Função para otimizar imagens background
function otimizarBackgroundImages() {
    // Pré-carregar a imagem do header (já feito via preload no HTML)
    const headerImg = new Image();
    headerImg.src = 'img/webp/header-bg.webp';

    // Verificar se há suporte para WebP
    const suportaWebP = document.createElement('canvas')
        .toDataURL('image/webp')
        .indexOf('data:image/webp') === 0;

    // Aplicar otimizações específicas para o elemento LCP
    const header = document.querySelector('header');
    if (header) {
        header.classList.add('imagem-carregada');
    }
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

// Inicializar otimizações de imagem após o LCP
document.addEventListener('DOMContentLoaded', () => {
    // Executar imediatamente a otimização da imagem do header (LCP)
    otimizarBackgroundImages();

    // Configurar lazy loading para outras imagens (após o LCP)
    setTimeout(configurarLazyLoading, 100);

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