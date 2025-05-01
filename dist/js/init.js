// Script de inicialização rápida para garantir interatividade básica
document.addEventListener('DOMContentLoaded', function () {
    // Verificar se o ImageManager já está disponível
    if (window.ImageManager) {
        console.log("ImageManager já está disponível, iniciando precarregamento");
        inicializarFuncionalidadesBasicas();
    } else {
        // Se o optimizer.js ainda não terminou de carregar (devido ao defer)
        console.log("Aguardando carregamento do optimizer.js");
        // Criamos um intervalo para verificar quando o ImageManager estiver disponível
        const checkInterval = setInterval(function () {
            if (window.ImageManager) {
                clearInterval(checkInterval);
                console.log("ImageManager detectado, iniciando funcionalidades");
                inicializarFuncionalidadesBasicas();
            }
        }, 50);

        // Failsafe: após 2 segundos, inicializar de qualquer forma
        setTimeout(function () {
            if (!window.ImageManager) {
                console.warn("ImageManager não detectado após timeout, criando fallback");
                // Criar um objeto ImageManager básico como fallback
                window.ImageManager = {
                    precarregarImagensCriticas: function () {
                        console.log("Fallback: Precarregando imagens críticas");
                    },
                    aplicarRedimensionamentoResponsivo: function () {
                        console.log("Fallback: Tentativa de redimensionamento");
                    }
                };
            }
            clearInterval(checkInterval);
            inicializarFuncionalidadesBasicas();
        }, 2000);
    }

    function inicializarFuncionalidadesBasicas() {
        // Iniciar precarregamento de imagens críticas imediatamente
        if (window.ImageManager.precarregarImagensCriticas) {
            console.log("Iniciando precarregamento de imagens críticas");
            window.ImageManager.precarregarImagensCriticas();
        }

        // Garantir que o redimensionamento de imagens seja aplicado
        if (window.ImageManager.aplicarRedimensionamentoResponsivo) {
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
    }
});