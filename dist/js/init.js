// Script de inicialização rápida para garantir interatividade básica
document.addEventListener('DOMContentLoaded', async function () {
    console.log("Iniciando carregamento do site...");

    // Verificar se o ImageManager já está disponível
    if (window.ImageManager) {
        console.log("ImageManager já está disponível, iniciando precarregamento");
        await inicializarFuncionalidadesBasicas();
    } else {
        console.log("Aguardando carregamento do optimizer.js");
        await new Promise((resolve) => {
            const checkInterval = setInterval(function () {
                if (window.ImageManager) {
                    clearInterval(checkInterval);
                    console.log("ImageManager detectado, iniciando funcionalidades");
                    resolve();
                }
            }, 50);

            // Failsafe: após 2 segundos, inicializar de qualquer forma
            setTimeout(function () {
                if (!window.ImageManager) {
                    console.warn("ImageManager não detectado após timeout, criando fallback");
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
                resolve();
            }, 2000);
        });
        await inicializarFuncionalidadesBasicas();
    }
});

async function inicializarFuncionalidadesBasicas() {
    try {
        console.log("Iniciando funcionalidades básicas...");

        // 1. Iniciar precarregamento de imagens críticas
        if (window.ImageManager.precarregarImagensCriticas) {
            console.log("Iniciando precarregamento de imagens críticas");
            await window.ImageManager.precarregarImagensCriticas();
        }

        // 2. Aplicar redimensionamento responsivo às imagens
        if (window.ImageManager.aplicarRedimensionamentoResponsivo) {
            console.log("Aplicando redimensionamento responsivo a todas as imagens");
            document.querySelectorAll('img:not([src^="data:"])').forEach(img => {
                if (img.complete) {
                    window.ImageManager.aplicarRedimensionamentoResponsivo(img);
                } else {
                    img.onload = function () {
                        window.ImageManager.aplicarRedimensionamentoResponsivo(this);
                    };
                }
            });
        }

        // 3. Inicializar sistema de tradução
        if (window.i18n) {
            console.log("Inicializando sistema de tradução");

            // Verificar idioma armazenado ou usar preferência do navegador
            const idiomaArmazenado = localStorage.getItem('idioma');
            if (idiomaArmazenado) {
                await window.alterarIdioma(idiomaArmazenado);
            } else {
                // Usar idioma do navegador ou pt como fallback
                const idiomaNavegador = navigator.language.split('-')[0];
                const idiomasPossiveis = ['pt', 'en', 'es'];
                const idiomaPadrao = idiomasPossiveis.includes(idiomaNavegador) ? idiomaNavegador : 'pt';
                await window.alterarIdioma(idiomaPadrao);
            }

            // Traduzir elementos da página
            await window.i18n.traduzirElementos();
        } else {
            console.error("Sistema de tradução não encontrado");
        }

        // 4. Inicializar AppState se necessário
        if (window.AppState && !window.AppState.isInitialized) {
            console.log("Inicializando AppState");
            await window.AppState.carregarEstado();
        }

        // 5. Verificar parâmetros da URL para funcionalidades específicas
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('enviado') && urlParams.get('enviado') === 'sucesso') {
            // Mostrar popup de sucesso no envio do formulário
            console.log("Detectado parâmetro de sucesso no envio do formulário");
            const popup = gerenciarFeedbackPopup();
            const nome = localStorage.getItem('ultimo_contato_nome');
            const assunto = localStorage.getItem('ultimo_assunto');

            const mensagem = await popup.mensagemEnvio(nome, assunto);
            const titulo = await popup.obterTituloTraduzido();
            popup.mostrar(mensagem, titulo);
        }

        console.log("Inicialização de funcionalidades básicas concluída");
    } catch (error) {
        console.error("Erro durante a inicialização:", error);
        // Implementar fallback ou notificação de erro se necessário
    }
}