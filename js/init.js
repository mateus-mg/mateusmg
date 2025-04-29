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

    // Apenas referência à função centralizada de atualização de ícones
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.getElementById('sidebar')?.classList.remove('open');
            document.getElementById('sidebar-overlay')?.classList.remove('ativo');
            // Usar função global se disponível, evitando duplicação
            if (window.atualizarIconeSidebar) {
                window.atualizarIconeSidebar(false);
            } else {
                // Fallback mínimo se a função principal ainda não estiver carregada
                const toggleButton = document.getElementById('toggle-button');
                if (toggleButton) {
                    toggleButton.innerHTML = `<span class="icone-menu entrando">☰</span>`;
                }
            }
        }
    });
});