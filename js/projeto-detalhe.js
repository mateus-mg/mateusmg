// Código para gerenciar a exibição de detalhes do projeto
document.addEventListener('DOMContentLoaded', async function () {
    console.log("Inicializando página de detalhes do projeto");

    try {
        // Obter o ID do projeto da URL
        const urlParams = new URLSearchParams(window.location.search || "");
        const projetoId = urlParams.get('id');

        if (!projetoId) {
            console.error("ID do projeto não encontrado na URL");
            const isProjetoPage = window.location.pathname.includes('projeto.html') ||
                window.location.pathname.endsWith('/projeto');

            if (isProjetoPage) {
                window.location.href = 'index.html#portfolio';
                return;
            } else {
                return;
            }
        }

        console.log(`Carregando detalhes do projeto: ${projetoId}`);

        // Aguardar a inicialização do AppState
        if (!window.AppState?.isInitialized) {
            console.log("Aguardando inicialização do AppState...");
            await new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    if (window.AppState?.isInitialized) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);

                // Timeout após 3 segundos
                setTimeout(() => {
                    clearInterval(checkInterval);
                    resolve();
                }, 3000);
            });
        }

        // Aguardar inicialização do i18n se estiver disponível
        if (window.i18n && !window.i18n.initialized) {
            console.log("Aguardando inicialização do sistema i18n...");
            await new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    // Verificar se foi inicializado checando se tem traduções carregadas
                    if (window.i18n.getIdiomaAtual) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);

                // Timeout após 3 segundos
                setTimeout(() => {
                    clearInterval(checkInterval);
                    resolve();
                }, 3000);
            });
        }

        // Usar o idioma do AppState ou fallback
        const idiomaAtual = window.AppState?.idiomaAtual || window.i18n?.getIdiomaAtual() || localStorage.getItem('idioma') || 'pt';
        console.log("Usando idioma:", idiomaAtual);

        // Atualizar UI do idioma
        atualizarUIIdioma(idiomaAtual);

        // Carregar detalhes do projeto
        await carregarDetalhes(projetoId, idiomaAtual);
    } catch (error) {
        console.error("Erro na inicialização da página de detalhes:", error);
        mostrarErro('Ocorreu um erro ao carregar a página de detalhes');
    }

    // Configurar menu de idiomas usando window.i18n
    configMenuIdiomas();
});

// Configuração do menu de idiomas
function configMenuIdiomas() {
    const menuIdiomasToggle = document.querySelector('.menu-idiomas-toggle');
    const menuIdiomas = document.querySelector('.menu-idiomas');

    if (menuIdiomasToggle && menuIdiomas) {
        menuIdiomasToggle.addEventListener('click', function () {
            menuIdiomas.classList.toggle('ativo');
            menuIdiomasToggle.setAttribute('aria-expanded', menuIdiomas.classList.contains('ativo'));
        });

        document.addEventListener('click', function (event) {
            if (!menuIdiomasToggle.contains(event.target) && !menuIdiomas.contains(event.target)) {
                menuIdiomas.classList.remove('ativo');
                menuIdiomasToggle.setAttribute('aria-expanded', 'false');
            }
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && menuIdiomas.classList.contains('ativo')) {
                menuIdiomas.classList.remove('ativo');
                menuIdiomasToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Configurar seleção de idioma usando window.i18n
    document.querySelectorAll('.seletor-idioma').forEach(botao => {
        botao.addEventListener('click', async function () {
            const novoIdioma = this.getAttribute('data-idioma');
            const urlParams = new URLSearchParams(window.location.search);
            const projetoId = urlParams.get('id');

            // Usar o sistema unificado de tradução
            if (window.i18n) {
                await window.alterarIdioma(novoIdioma);
            } else {
                // Fallback para sistema antigo
                localStorage.setItem('idioma', novoIdioma);
            }

            // Atualizar UI
            atualizarUIIdioma(novoIdioma);

            // Recarregar detalhes no novo idioma
            if (projetoId) {
                await carregarDetalhes(projetoId, novoIdioma);
            }

            // Fechar menu
            if (menuIdiomas) {
                menuIdiomas.classList.remove('ativo');
                if (menuIdiomasToggle) {
                    menuIdiomasToggle.setAttribute('aria-expanded', 'false');
                }
            }
        });
    });
}

// Atualizar UI do idioma
function atualizarUIIdioma(idioma) {
    const idiomaAtualElement = document.querySelector('.idioma-atual');
    if (idiomaAtualElement) {
        idiomaAtualElement.textContent = idioma.toUpperCase();
    }

    document.querySelectorAll('.seletor-idioma').forEach(btn => {
        btn.classList.remove('ativo');
        if (btn.getAttribute('data-idioma') === idioma) {
            btn.classList.add('ativo');
        }
    });
}

// Exibir erro
async function mostrarErro(mensagem) {
    console.log("Mostrando mensagem de erro:", mensagem);

    // Tentar obter mensagem de erro traduzida usando i18n
    if (window.i18n) {
        try {
            mensagem = await window.i18n.traduzir('erros.carregamento_projeto', {}, null, mensagem);
        } catch (e) {
            console.error("Erro ao traduzir mensagem de erro:", e);
            // Manter mensagem original
        }
    }

    const conteudoProjeto = document.querySelector('.projeto-conteudo');
    const titulo = document.getElementById('projeto-titulo');

    if (titulo) {
        titulo.textContent = 'Erro';
    }

    if (conteudoProjeto) {
        conteudoProjeto.innerHTML = `
            <div class="projeto-erro">
                <h2>Ocorreu um erro</h2>
                <p>${mensagem}</p>
                <a href="index.html#portfolio" class="botao">Voltar ao Portfólio</a>
            </div>
        `;
    } else {
        const main = document.querySelector('.main-content');
        if (main) {
            main.innerHTML = `
                <h1 class="projeto-titulo-simples">Erro</h1>
                <div class="projeto-conteudo">
                    <div class="projeto-erro">
                        <h2>Ocorreu um erro</h2>
                        <p>${mensagem}</p>
                        <a href="index.html#portfolio" class="botao">Voltar ao Portfólio</a>
                    </div>
                </div>
            `;
        }
    }
}

// Carregar detalhes do projeto
async function carregarDetalhes(projetoId, idioma) {
    console.log(`Carregando detalhes do projeto ${projetoId} no idioma ${idioma}`);

    // Verificar e criar estrutura básica se necessário
    const elementosNecessarios = [
        { id: 'projeto-titulo', tipo: 'ID' },
        { selector: '.projeto-conteudo', tipo: 'Class' },
        { id: 'projeto-descricao-curta', tipo: 'ID' },
        { id: 'projeto-descricao-longa', tipo: 'ID' }
    ];

    const elementosFaltantes = elementosNecessarios.filter(el => {
        return el.tipo === 'ID' ? !document.getElementById(el.id) : !document.querySelector(el.selector);
    });

    if (elementosFaltantes.length > 0) {
        const isProjetoPage = window.location.pathname.includes('projeto.html') ||
            window.location.pathname.endsWith('/projeto');

        if (!isProjetoPage) {
            window.location.href = `projeto.html?id=${projetoId}`;
            return;
        }

        criarEstruturaBasica(projetoId);
    }

    try {
        // Usar o sistema unificado de tradução para obter os dados do projeto
        let projeto;

        if (window.i18n) {
            // Usar o sistema i18n.js
            projeto = await window.i18n.traduzir(`projetos.${projetoId}`);

            // Verificar se o resultado é válido
            if (!projeto || typeof projeto === 'string') {
                throw new Error(`Projeto não encontrado no idioma ${idioma}`);
            }
        } else {
            // Fallback: tentar carregar diretamente do arquivo JSON
            const response = await fetch(`i18n/${idioma}.json`);
            if (!response.ok) {
                throw new Error(`Falha ao carregar arquivo de tradução para ${idioma}: ${response.status}`);
            }

            const traducoes = await response.json();
            projeto = traducoes.projetos?.[projetoId];

            if (!projeto) {
                throw new Error(`Projeto não encontrado no idioma ${idioma}`);
            }
        }

        // Atualizar o conteúdo
        document.title = `${projeto.titulo} - Mateus Galvão`;

        const tituloElement = document.getElementById('projeto-titulo');
        if (tituloElement) {
            tituloElement.textContent = projeto.titulo;
        }

        const descCurtaElement = document.getElementById('projeto-descricao-curta');
        if (descCurtaElement) {
            descCurtaElement.textContent = projeto.descricao;
        }

        const descricaoLonga = document.getElementById('projeto-descricao-longa');
        if (descricaoLonga) {
            if (projeto.descricao_longa) {
                descricaoLonga.innerHTML = projeto.descricao_longa;
                descricaoLonga.style.display = 'block';
            } else {
                descricaoLonga.style.display = 'none';
            }
        }

        const tagsContainer = document.querySelector('.tags-container');
        if (tagsContainer && projeto.tecnologias && Array.isArray(projeto.tecnologias)) {
            tagsContainer.innerHTML = projeto.tecnologias.map(tech =>
                `<span class="portfolio-tag">${tech}</span>`
            ).join('');
        }

        const relatorioContainer = document.getElementById('projeto-relatorio');
        if (relatorioContainer) {
            const relatorioConteudo = relatorioContainer.querySelector('.relatorio-conteudo');
            if (relatorioConteudo) {
                if (projeto.relatorio) {
                    relatorioConteudo.innerHTML = projeto.relatorio;
                    relatorioContainer.style.display = 'block';
                } else {
                    // Usar i18n para obter o texto padrão de relatório
                    const textoRelatorio = window.i18n ?
                        await window.i18n.traduzir('projetos.relatorio_padrao') :
                        "Este projeto ainda não possui um relatório detalhado.";

                    relatorioConteudo.innerHTML = textoRelatorio;
                    relatorioContainer.style.display = 'block';
                }
            }
        }

        const githubBtn = document.querySelector('.github-btn');
        if (githubBtn) {
            githubBtn.href = `https://github.com/mateus-mg/${projetoId}`;
        }

        atualizarMetaTags(projeto.titulo, projeto.descricao);

        // Notificar via pub/sub
        if (window.PubSub) {
            PubSub.publish('projeto:detalhesCarregados', {
                projetoId,
                idioma,
                titulo: projeto.titulo
            });
        }

    } catch (error) {
        console.error('Erro ao carregar detalhes do projeto:', error);

        let mensagemErro = 'Erro ao carregar detalhes do projeto';

        // Tentar obter mensagem traduzida
        if (window.i18n) {
            try {
                mensagemErro = await window.i18n.traduzir('erros.carregamento_projeto');
            } catch (e) {
                console.error("Erro ao traduzir mensagem de erro:", e);
            }
        }

        mostrarErro(mensagemErro);

        if (window.PubSub) {
            PubSub.publish('projeto:erroCarregamento', {
                projetoId,
                idioma,
                erro: error.message
            });
        }
    }
}

// Criar estrutura básica
function criarEstruturaBasica(projetoId) {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) {
        console.error("Elemento main-content não encontrado");
        return;
    }

    mainContent.innerHTML = `
        <div class="projeto-container">
            <h1 id="projeto-titulo">Carregando projeto...</h1>
            <p id="projeto-descricao-curta">Aguarde enquanto carregamos os detalhes do projeto.</p>
            
            <div class="projeto-conteudo">
                <div id="projeto-descricao-longa"></div>
                
                <div class="projeto-meta">
                    <h3>Tecnologias</h3>
                    <div class="tags-container">
                        <span class="portfolio-tag">Carregando...</span>
                    </div>
                </div>
                
                <div id="projeto-relatorio">
                    <h2>Relatório do Projeto</h2>
                    <div class="relatorio-conteudo"></div>
                </div>
                
                <div class="projeto-links">
                    <a href="#" class="botao github-btn" target="_blank" rel="noopener">
                        <i class="fab fa-github"></i> Ver no GitHub
                    </a>
                    <a href="index.html#portfolio" class="botao">Voltar ao Portfólio</a>
                </div>
            </div>
        </div>
    `;

    console.log("Estrutura básica criada para o projeto:", projetoId);
}

// Atualizar meta tags
function atualizarMetaTags(titulo, descricao) {
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        metaDesc.setAttribute('content', descricao);
    }

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
        ogTitle.setAttribute('content', `${titulo} - Mateus Galvão`);
    }

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) {
        ogDesc.setAttribute('content', descricao);
    }

    console.log("Meta tags atualizadas para SEO");
}