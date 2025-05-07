// Código para gerenciar a exibição de detalhes do projeto
document.addEventListener('DOMContentLoaded', function () {
    console.log("Inicializando página de detalhes do projeto");

    try {
        // Obter o ID do projeto da URL
        const urlParams = new URLSearchParams(window.location.search || "");
        const projetoId = urlParams.get('id');

        // Verificação explícita para garantir que o ID existe e não é nulo
        if (!projetoId) {
            console.error("ID do projeto não encontrado na URL");

            // Verificar se estamos na página de projeto ou na página principal
            const isProjetoPage = window.location.pathname.includes('projeto.html') ||
                window.location.pathname.endsWith('/projeto');

            if (isProjetoPage) {
                // Estamos na página de projeto mas sem ID - redirecionar para o portfólio
                console.log("Redirecionando para a seção de portfólio");
                window.location.href = 'index.html#portfolio';
                return;
            } else {
                // Não estamos na página de projeto, provavelmente estamos na página principal
                // Não é necessário mostrar erro, deixar a página carregar normalmente
                console.log("Sem ID de projeto na URL, mas não estamos na página de projeto");
                return;
            }
        }

        console.log(`Carregando detalhes do projeto: ${projetoId}`);

        // Usar o idioma atual do estado ou fallback para localStorage/sessionStorage
        // para compatibilidade com instâncias onde o AppState ainda não foi inicializado
        let idiomaAtual = 'pt'; // Valor padrão

        try {
            if (typeof window.AppState !== 'undefined' && window.AppState !== null) {
                idiomaAtual = window.AppState.idiomaAtual || 'pt';
                console.log("Utilizando idioma do AppState:", idiomaAtual);
            } else {
                // Tentar obter de localStorage (onde é salvo na página principal)
                const idiomaLocalStorage = localStorage.getItem('idioma');

                // Se não encontrar em localStorage, tentar sessão
                const idiomaSessionStorage = sessionStorage.getItem('idioma');

                // Usar o primeiro valor não-nulo que encontrarmos
                idiomaAtual = idiomaLocalStorage || idiomaSessionStorage || 'pt';

                console.log("AppState não disponível, usando idioma de armazenamento local:", idiomaAtual);
            }
        } catch (err) {
            console.error("Erro ao obter o idioma:", err);
            // Fallback para português em caso de erro
        }

        // Atualizar a indicação visual do idioma atual
        const idiomaAtualElement = document.querySelector('.idioma-atual');
        if (idiomaAtualElement) {
            idiomaAtualElement.textContent = idiomaAtual.toUpperCase();
        }

        document.querySelectorAll('.seletor-idioma').forEach(btn => {
            btn.classList.remove('ativo');
            if (btn.getAttribute('data-idioma') === idiomaAtual) {
                btn.classList.add('ativo');
            }
        });

        // Carregar detalhes do projeto
        carregarDetalhes(projetoId, idiomaAtual);
    } catch (error) {
        console.error("Erro na inicialização da página de detalhes:", error);
        mostrarErro('Ocorreu um erro ao carregar a página de detalhes');
    }

    // Configurar menu de idiomas
    const menuIdiomasToggle = document.querySelector('.menu-idiomas-toggle');
    const menuIdiomas = document.querySelector('.menu-idiomas');

    if (menuIdiomasToggle && menuIdiomas) {
        menuIdiomasToggle.addEventListener('click', function () {
            menuIdiomas.classList.toggle('ativo');
            const isOpen = menuIdiomas.classList.contains('ativo');
            menuIdiomasToggle.setAttribute('aria-expanded', isOpen);
        });

        // Fechar menu ao clicar fora
        document.addEventListener('click', function (event) {
            if (!menuIdiomasToggle.contains(event.target) && !menuIdiomas.contains(event.target)) {
                menuIdiomas.classList.remove('ativo');
                menuIdiomasToggle.setAttribute('aria-expanded', 'false');
            }
        });

        // Fechar menu ao pressionar ESC
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && menuIdiomas.classList.contains('ativo')) {
                menuIdiomas.classList.remove('ativo');
                menuIdiomasToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Configurar seleção de idioma
    document.querySelectorAll('.seletor-idioma').forEach(botao => {
        botao.addEventListener('click', function () {
            const novoIdioma = this.getAttribute('data-idioma');

            // Tentar obter o projeto ID novamente (em caso de manipulação da URL)
            const urlParams = new URLSearchParams(window.location.search);
            const projetoId = urlParams.get('id');

            // Atualizar o estado central se disponível
            try {
                if (typeof AppState !== 'undefined' && AppState !== null) {
                    AppState.setIdiomaAtual(novoIdioma);
                    console.log("Idioma atualizado via AppState:", novoIdioma);
                } else {
                    // Fallback para localStorage e sessionStorage
                    localStorage.setItem('idioma', novoIdioma);
                    sessionStorage.setItem('idioma', novoIdioma);
                    console.log("Idioma salvo em localStorage/sessionStorage:", novoIdioma);
                }
            } catch (error) {
                console.error("Erro ao atualizar idioma:", error);
            }

            // Recarregar detalhes no novo idioma apenas se tivermos um ID de projeto
            if (projetoId) {
                carregarDetalhes(projetoId, novoIdioma);
            } else {
                console.warn("Não foi possível recarregar detalhes: ID de projeto não encontrado");
            }

            // Atualizar indicação visual de idioma ativo
            document.querySelectorAll('.seletor-idioma').forEach(btn => {
                btn.classList.remove('ativo');
            });
            this.classList.add('ativo');

            const idiomaAtualElement = document.querySelector('.idioma-atual');
            if (idiomaAtualElement) {
                idiomaAtualElement.textContent = novoIdioma.toUpperCase();
            }

            // Fechar menu de idiomas
            if (menuIdiomas) {
                menuIdiomas.classList.remove('ativo');
            }
            if (menuIdiomasToggle) {
                menuIdiomasToggle.setAttribute('aria-expanded', 'false');
            }
        });
    });

    // Inscrever-se para eventos de alteração de idioma
    try {
        if (typeof PubSub !== 'undefined' && PubSub !== null) {
            PubSub.subscribe('idioma:alterado', function (dados) {
                console.log(`Página de detalhes recebeu notificação de alteração de idioma: ${dados.antigo} -> ${dados.novo}`);

                // Tentar obter o projeto ID novamente (em caso de manipulação da URL)
                const urlParams = new URLSearchParams(window.location.search);
                const projetoId = urlParams.get('id');

                // Verificar se é necessário recarregar detalhes (idioma diferente do atual)
                const idiomaAtualUI = document.querySelector('.seletor-idioma.ativo')?.getAttribute('data-idioma');
                if (dados.novo !== idiomaAtualUI) {
                    // Atualizar UI para refletir a mudança de idioma
                    const idiomaAtualElement = document.querySelector('.idioma-atual');
                    if (idiomaAtualElement) {
                        idiomaAtualElement.textContent = dados.novo.toUpperCase();
                    }

                    document.querySelectorAll('.seletor-idioma').forEach(btn => {
                        btn.classList.remove('ativo');
                        if (btn.getAttribute('data-idioma') === dados.novo) {
                            btn.classList.add('ativo');
                        }
                    });

                    // Recarregar detalhes no novo idioma apenas se tivermos um ID de projeto
                    if (projetoId) {
                        carregarDetalhes(projetoId, dados.novo);
                    } else {
                        console.warn("Não foi possível recarregar detalhes: ID de projeto não encontrado");
                    }
                }
            });
        }
    } catch (error) {
        console.error("Erro ao configurar inscrição PubSub:", error);
    }

    // Configurar botão voltar ao topo
    const btnTopo = document.getElementById('btn-topo');
    if (btnTopo) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 200) {
                btnTopo.classList.add('mostrar');
            } else {
                btnTopo.classList.remove('mostrar');
            }
        });

        btnTopo.addEventListener('click', function (e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});

/**
 * Exibe uma mensagem de erro na página
 * @param {string} mensagem - A mensagem de erro a ser exibida
 */
function mostrarErro(mensagem) {
    console.log("Mostrando mensagem de erro:", mensagem);

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
        // Fallback caso não encontre o container principal
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

/**
 * Carrega os detalhes do projeto com base no ID e idioma selecionado
 * @param {string} projetoId - O identificador único do projeto
 * @param {string} idioma - O código do idioma atual (pt, en, es)
 */
function carregarDetalhes(projetoId, idioma) {
    console.log(`Carregando detalhes do projeto ${projetoId} no idioma ${idioma}`);

    // Verificar se estamos na página correta antes de continuar
    const elementosNecessarios = [
        { id: 'projeto-titulo', tipo: 'ID' },
        { selector: '.projeto-conteudo', tipo: 'Class' },
        { id: 'projeto-descricao-curta', tipo: 'ID' },
        { id: 'projeto-descricao-longa', tipo: 'ID' }
    ];

    // Contabilizar quantos elementos críticos estão faltando
    const elementosFaltantes = elementosNecessarios.filter(el => {
        if (el.tipo === 'ID') {
            return !document.getElementById(el.id);
        } else {
            return !document.querySelector(el.selector);
        }
    });

    if (elementosFaltantes.length > 0) {
        console.warn(`Elementos críticos não encontrados (${elementosFaltantes.length}): `,
            elementosFaltantes.map(el => el.tipo === 'ID' ? el.id : el.selector).join(', '));

        // Se estamos na página errada ou elementos críticos estão faltando, verificar se estamos na página correta
        const isProjetoPage = window.location.pathname.includes('projeto.html') ||
            window.location.pathname.endsWith('/projeto');

        // Se não estamos na página correta, redirecionar
        if (!isProjetoPage) {
            console.log("Tentativa de carregar projeto na página errada. Redirecionando para página de projeto...");
            window.location.href = `projeto.html?id=${projetoId}`;
            return;
        }

        // Se estamos na página correta mas elementos estão faltando, 
        // pode ser que a página ainda não foi completamente carregada
        console.log("Na página correta, mas elementos críticos estão faltando. Criando estrutura básica...");
        criarEstruturaBasica(projetoId);
    }

    // Adicionar cache busting para resolver problemas de cache
    const timestamp = new Date().getTime();

    // Buscar os dados completos do projeto
    fetch(`i18n/${idioma}.json?v=${timestamp}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao carregar arquivo de tradução: ${response.status}`);
            }
            return response.json();
        })
        .then(traducoes => {
            if (!traducoes.projetos || !traducoes.projetos[projetoId]) {
                mostrarErro(`Projeto não encontrado no idioma ${idioma}`);
                return;
            }

            const projeto = traducoes.projetos[projetoId];

            // Preencher os detalhes na página
            document.title = `${projeto.titulo} - Mateus Galvão`;

            const tituloElement = document.getElementById('projeto-titulo');
            if (tituloElement) {
                tituloElement.textContent = projeto.titulo;
            }

            // Inserir descrição curta
            const descCurtaElement = document.getElementById('projeto-descricao-curta');
            if (descCurtaElement) {
                descCurtaElement.textContent = projeto.descricao;
            }

            // Inserir descrição longa (se existir)
            const descricaoLonga = document.getElementById('projeto-descricao-longa');
            if (descricaoLonga) {
                if (projeto.descricao_longa) {
                    descricaoLonga.innerHTML = projeto.descricao_longa;
                    descricaoLonga.style.display = 'block';
                } else {
                    descricaoLonga.style.display = 'none';
                }
            }

            // Inserir tecnologias
            const tagsContainer = document.querySelector('.tags-container');
            if (tagsContainer && projeto.tecnologias && Array.isArray(projeto.tecnologias)) {
                tagsContainer.innerHTML = projeto.tecnologias.map(tech =>
                    `<span class="portfolio-tag">${tech}</span>`
                ).join('');
            }

            // Inserir relatório (se existir)
            const relatorioContainer = document.getElementById('projeto-relatorio');
            if (relatorioContainer) {
                const relatorioConteudo = relatorioContainer.querySelector('.relatorio-conteudo');
                if (relatorioConteudo) {
                    if (projeto.relatorio) {
                        relatorioConteudo.innerHTML = projeto.relatorio;
                        relatorioContainer.style.display = 'block';
                    } else {
                        relatorioConteudo.innerHTML = `
                            <p>Relatório detalhado em desenvolvimento.</p>
                            <p>Este projeto está sendo documentado e em breve teremos informações mais detalhadas sobre seu desenvolvimento, desafios enfrentados e soluções implementadas.</p>
                        `;
                        relatorioContainer.style.display = 'block';
                    }
                }
            }

            // Atualizar link para GitHub
            const githubBtn = document.querySelector('.github-btn');
            if (githubBtn) {
                githubBtn.href = `https://github.com/mateus-mg/${projetoId}`;
            }

            // Configurar meta tags para SEO dinâmico
            atualizarMetaTags(projeto.titulo, projeto.descricao);

            // Notificar via pub/sub que os detalhes foram carregados (se disponível)
            if (typeof PubSub !== 'undefined') {
                PubSub.publish('projeto:detalhesCarregados', {
                    projetoId,
                    idioma,
                    titulo: projeto.titulo
                });
            }

            console.log("Detalhes do projeto carregados com sucesso");
        })
        .catch(error => {
            console.error('Erro ao carregar detalhes do projeto:', error);
            mostrarErro(`Erro ao carregar as traduções para ${idioma}. Por favor, tente novamente.`);

            // Notificar erro via pub/sub (se disponível)
            if (typeof PubSub !== 'undefined') {
                PubSub.publish('projeto:erroCarregamento', {
                    projetoId,
                    idioma,
                    erro: error.message
                });
            }
        });
}

/**
 * Cria uma estrutura básica para a página de projeto caso os elementos não sejam encontrados
 * @param {string} projetoId - ID do projeto para carregar
 */
function criarEstruturaBasica(projetoId) {
    // Verificar se temos um elemento main-content
    const mainContent = document.querySelector('.main-content');

    if (!mainContent) {
        console.error("Elemento main-content não encontrado. Impossível criar estrutura básica.");
        return;
    }

    // Limpar conteúdo atual
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
                    <a href="#" class="botao github-btn" target="_blank">
                        <i class="fab fa-github"></i> Ver no GitHub
                    </a>
                    <a href="index.html#portfolio" class="botao">Voltar ao Portfólio</a>
                </div>
            </div>
        </div>
    `;

    console.log("Estrutura básica criada para o projeto:", projetoId);
}

/**
 * Atualiza as meta tags para melhor SEO
 * @param {string} titulo - O título do projeto
 * @param {string} descricao - A descrição do projeto
 */
function atualizarMetaTags(titulo, descricao) {
    // Meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        metaDesc.setAttribute('content', descricao);
    }

    // Open Graph tags
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