// Script de inicialização rápida para garantir interatividade básica sem bloquear o LCP
document.addEventListener('DOMContentLoaded', function () {
    // Registrar elemento LCP para medição de performance
    if (window.PerformanceObserver) {
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            // Registrar no console para depuração
            console.log('LCP:', lastEntry.startTime, lastEntry);
        });
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
    }

    // Função básica para sidebar que não depende do script principal
    function atualizarIconeSidebar(aberto) {
        const icone = aberto ? '✖' : '☰';
        toggleButton.classList.add('trocando');
        toggleButton.querySelector('.icone-menu')?.classList.remove('entrando');
        setTimeout(() => {
            toggleButton.innerHTML = `<span class="icone-menu entrando">${icone}</span>`;
            setTimeout(() => {
                toggleButton.querySelector('.icone-menu')?.classList.add('entrando');
                toggleButton.classList.remove('trocando');
            }, 10);
        }, 140);
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.getElementById('sidebar')?.classList.remove('open');
            document.getElementById('sidebar-overlay')?.classList.remove('ativo');
            atualizarIconeSidebar(false);
        }
    });
});