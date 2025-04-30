// Script de inicialização rápida para garantir interatividade básica sem bloquear o LCP
document.addEventListener('DOMContentLoaded', function () {
    // Verificar se o monitoramento LCP já está sendo feito pelo optimizer.js
    // Se não estiver, só então inicializar o monitoramento aqui
    if (!window.lcpMonitoringActive && window.PerformanceObserver) {
        console.log("Inicializando monitoramento LCP fallback");
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            console.log('LCP (fallback):', lastEntry.startTime, lastEntry);
        });
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
    }

    // Iniciar precarregamento de imagens críticas imediatamente
    if (window.ImageManager && window.ImageManager.precarregarImagensCriticas) {
        console.log("Iniciando precarregamento de imagens críticas");
        window.ImageManager.precarregarImagensCriticas();
    }

    // Garantir que o redimensionamento de imagens seja aplicado
    if (window.ImageManager && window.ImageManager.aplicarRedimensionamentoResponsivo) {
        console.log("Aplicando redimensionamento responsivo a todas as imagens");
        document.querySelectorAll('img:not([src^="data:"])').forEach(img => {
            // Quando a imagem for carregada, aplicar redimensionamento responsivo
            if (img.complete) {
                window.ImageManager.aplicarRedimensionamentoResponsivo(img);
            } else {
                img.onload = function () {
                    window.ImageManager.aplicarRedimensionamentoResponsivo(this);
                };
            }
        });
    }
});