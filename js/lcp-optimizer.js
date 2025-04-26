/**
 * Script otimizado para reduzir o tempo de LCP
 * Foco específico em acelerar a renderização do elemento identificado como LCP:
 * <p data-i18n="header.role">Engenheiro de Dados | Cientista de Dados | Arquiteto de Dados</p>
 */

// Executar imediatamente, sem esperar o DOMContentLoaded
(function () {
    // Priorizar a renderização do texto do LCP
    const applyLcpOptimizations = () => {
        // Localizar o elemento LCP (texto do cargo)
        const lcpElement = document.querySelector('header p[data-i18n="header.role"]');

        if (lcpElement) {
            // Aplicar otimizações diretamente ao elemento LCP
            lcpElement.style.visibility = 'visible';
            lcpElement.style.display = 'block';
            lcpElement.style.opacity = '1';

            // Remover qualquer animação que possa atrasar a renderização
            lcpElement.style.animation = 'none';
            lcpElement.style.transition = 'none';

            // Marcar como elemento de prioridade máxima
            lcpElement.setAttribute('fetchpriority', 'high');

            // Adicionar classe para CSS identificar
            lcpElement.classList.add('lcp-element');
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
            // Definir a imagem de fundo agora que o LCP já foi renderizado
            const bgStyle = `
        header::after {
          background-image: url('img/webp/header-bg.webp');
          background-position: center center;
          background-size: cover;
          background-repeat: no-repeat;
        }
      `;

            const styleElement = document.createElement('style');
            styleElement.textContent = bgStyle;
            document.head.appendChild(styleElement);

            // Adicionar classe para efeito de fade-in na imagem de fundo
            header.classList.add('bg-loaded');
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