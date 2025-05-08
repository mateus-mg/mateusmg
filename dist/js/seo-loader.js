// Script para carregar os dados de SEO JSON-LD com suporte a idiomas
document.addEventListener('DOMContentLoaded', async function () {
    try {
        // Verificar se temos idioma atual definido
        let idiomaAtual;

        // Primeiro tentar obter do sistema i18n
        if (window.i18n && window.i18n.getIdiomaAtual) {
            idiomaAtual = window.i18n.getIdiomaAtual();
        }
        // Depois verificar no AppState
        else if (window.AppState) {
            idiomaAtual = window.AppState.idiomaAtual;
        }
        // Por último, usar localStorage ou padrão
        else {
            idiomaAtual = localStorage.getItem('idioma') || 'pt';
        }

        console.log('Carregando dados de SEO para o idioma:', idiomaAtual);

        // Carregar os dados base de SEO
        const response = await fetch('js/seo.json');
        if (!response.ok) {
            throw new Error('Falha ao carregar dados SEO');
        }

        const dadosSEO = await response.json();

        // Aplicar traduções se o sistema i18n estiver disponível
        if (window.i18n) {
            try {
                // Traduzir elementos chave, mas apenas se o idioma não for o padrão (pt)
                if (idiomaAtual !== 'pt') {
                    // Traduzir o nome e descrição
                    dadosSEO.description = await window.i18n.traduzir('seo.description') || dadosSEO.description;

                    if (dadosSEO["@graph"]) {
                        for (const item of dadosSEO["@graph"]) {
                            if (item.name) {
                                item.name = await window.i18n.traduzir('seo.name') || item.name;
                            }
                            if (item.description) {
                                item.description = await window.i18n.traduzir('seo.description') || item.description;
                            }
                            if (item.headline) {
                                item.headline = await window.i18n.traduzir('seo.headline') || item.headline;
                            }
                            if (item.jobTitle) {
                                item.jobTitle = await window.i18n.traduzir('header.role') || item.jobTitle;
                            }
                        }
                    }
                }
            } catch (e) {
                console.error('Erro ao traduzir dados de SEO:', e);
            }
        }

        // Inserir os dados no head
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(dadosSEO);
        document.head.appendChild(script);
        console.log('Dados de SEO carregados com sucesso');

    } catch (error) {
        console.error('Erro ao carregar dados SEO JSON-LD:', error);

        // Fallback para caso o Cloudflare Pages tenha problemas com o tipo MIME
        try {
            const responseFallback = await fetch('js/seo.json', {
                headers: { 'Accept': 'text/plain' }
            });

            const textData = await responseFallback.text();
            const dadosSEO = JSON.parse(textData);

            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.textContent = JSON.stringify(dadosSEO);
            document.head.appendChild(script);
            console.log('Dados de SEO carregados via fallback');

        } catch (fallbackError) {
            console.error('Erro no fallback de SEO:', fallbackError);
        }
    }
});