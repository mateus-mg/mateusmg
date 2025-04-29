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
});