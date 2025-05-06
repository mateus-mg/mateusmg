// Cache de elementos DOM frequentemente usados
const domCache = {
    sidebar: null,
    toggleButton: null,
    menuIdiomas: null,
    portfolioContainer: null,
    form: null
};

// Variáveis globais importantes
let idiomaAtualProjetos = 'pt';

// Configuração de cache com versionamento
const CONFIG_CACHE = {
    versao: '1.0.1', // Incrementar esta versão quando atualizar traduções
    tempoExpiracaoCache: 7 * 24 * 60 * 60 * 1000, // 7 dias em milissegundos
    prefixoChave: 'portfolio_'
};

// Garantir que window.carrosseis existe globalmente
window.carrosseis = window.carrosseis || {};

// Função para inicializar cache do DOM
function initDOMCache() {
    domCache.sidebar = document.getElementById('sidebar');
    domCache.toggleButton = document.getElementById('toggle-button');
    domCache.menuIdiomas = document.querySelector('.menu-idiomas');
    domCache.portfolioContainer = document.querySelector('.portfolio-container');
    domCache.form = document.getElementById('formulario-contato');
}

// Função para gerenciar o ícone do menu
// Esta função é definida primeiro para garantir que esteja disponível para uso
function atualizarIconeSidebar(isOpen) {
    console.log("Atualizando ícone do sidebar para:", isOpen ? "X" : "☰");

    if (!domCache.toggleButton) return;

    // Adiciona a classe 'trocando' para iniciar a animação de fade out
    domCache.toggleButton.classList.add('trocando');

    // Espera a animação de fade out terminar antes de trocar o ícone
    setTimeout(function () {
        // Atualiza o ícone baseado no estado do menu
        domCache.toggleButton.innerHTML = isOpen
            ? `<span class="icone-menu entrando">✕</span>`
            : `<span class="icone-menu entrando">☰</span>`;

        // Remove a classe 'trocando' após um pequeno delay para permitir a animação de fade in
        setTimeout(function () {
            domCache.toggleButton.classList.remove('trocando');
        }, 50);
    }, 140); // Tempo correspondente à duração da transição CSS
}

// Event handlers reutilizáveis
const handlers = {
    toggleSidebar: () => {
        if (!domCache.sidebar) return;

        // Toggle da classe 'open' no sidebar
        domCache.sidebar.classList.toggle('open');
        const isOpen = domCache.sidebar.classList.contains('open');

        // Atualizar atributos ARIA
        domCache.sidebar.setAttribute('aria-hidden', !isOpen);
        domCache.toggleButton.setAttribute('aria-expanded', isOpen);

        // Chamar a função para atualizar o ícone
        atualizarIconeSidebar(isOpen);

        // Toggle da classe 'ativo' no overlay
        const overlay = document.getElementById('sidebar-overlay');
        if (overlay) overlay.classList.toggle('ativo');
    },

    closeMenus: (event) => {
        // Fechar sidebar se clicar fora
        if (domCache.sidebar && domCache.sidebar.classList.contains('open')) {
            if (!domCache.sidebar.contains(event.target) && !domCache.toggleButton.contains(event.target)) {
                handlers.toggleSidebar();
            }
        }

        // Fechar menu de idiomas se clicar fora
        if (domCache.menuIdiomas && domCache.menuIdiomas.classList.contains('ativo')) {
            const toggleIdiomas = document.querySelector('.menu-idiomas-toggle');
            if (!toggleIdiomas.contains(event.target) && !domCache.menuIdiomas.contains(event.target)) {
                domCache.menuIdiomas.classList.remove('ativo');
            }
        }
    },

    handleEscape: (event) => {
        if (event.key === 'Escape') {
            if (domCache.sidebar && domCache.sidebar.classList.contains('open')) {
                handlers.toggleSidebar();
            }
            if (domCache.menuIdiomas) {
                domCache.menuIdiomas.classList.remove('ativo');
            }
        }
    }
};

// Inicialização do site
document.addEventListener('DOMContentLoaded', function () {
    console.log("Inicializando o site...");

    // Inicializar cache do DOM
    initDOMCache();

    if (!domCache.sidebar || !domCache.toggleButton) {
        console.error('Elementos críticos não encontrados');
        return;
    }

    // Event Listeners
    domCache.toggleButton.addEventListener('click', handlers.toggleSidebar);
    document.addEventListener('click', handlers.closeMenus);
    document.addEventListener('keydown', handlers.handleEscape);

    // Inicializações
    criarOverlaySidebar();
    configurarEventosTeclado();
    iniciarAnimacaoSections();
    configurarSeletorIdiomas();
    inicializarCarrosseis();
    inicializarPortfolio();
    configurarFormularioContato();
    configurarOutrosEventos();

    // Verificar idioma salvo
    const idiomaArmazenado = localStorage.getItem('idioma');
    if (idiomaArmazenado) {
        traduzirPagina(idiomaArmazenado);
    }

    console.log("Inicialização do site concluída");
});

// Função para criar overlay do sidebar
function criarOverlaySidebar() {
    console.log("Criando/verificando overlay do sidebar");
    let overlay = document.getElementById('sidebar-overlay');

    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'sidebar-overlay';
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
        console.log("Overlay criado");
    }

    // Garantir que o evento de clique está atribuído
    overlay.addEventListener('click', function () {
        console.log("Overlay clicado - fechando sidebar");
        if (domCache.sidebar) {
            domCache.sidebar.classList.remove('open');
            overlay.classList.remove('ativo');
            if (domCache.toggleButton) {
                domCache.toggleButton.setAttribute('aria-expanded', 'false');
                // Em vez de usar atualizarIconeSidebar, usar a mesma lógica do toggleSidebar
                domCache.toggleButton.innerHTML = `<span class="icone-menu">☰</span>`;
                domCache.toggleButton.classList.remove('menu-aberto');
            }
        }
    });

    return overlay;
}

// Exportar para uso global (referenciada em init.js)
window.atualizarIconeSidebar = atualizarIconeSidebar;

// Configurar o seletor de idiomas
function configurarSeletorIdiomas() {
    console.log("Configurando seletor de idiomas");

    const menuIdiomasToggle = document.querySelector('.menu-idiomas-toggle');
    const menuIdiomas = document.querySelector('.menu-idiomas');

    if (!menuIdiomasToggle || !menuIdiomas) {
        console.error("Elementos do seletor de idiomas não encontrados");
        return;
    }

    // Abrir/fechar menu ao clicar no botão
    menuIdiomasToggle.addEventListener('click', () => {
        console.log("Botão de idiomas clicado");
        menuIdiomas.classList.toggle('ativo');
    });

    // Fechar menu quando clicar fora dele
    document.addEventListener('click', (event) => {
        if (!menuIdiomasToggle.contains(event.target) && !menuIdiomas.contains(event.target)) {
            menuIdiomas.classList.remove('ativo');
        }
    });

    // Nota: O tratamento de ESC foi movido para a função centralizadaconfigurarEventosTeclado()

    // Adicionar eventos aos botões de idioma
    document.querySelectorAll('.menu-idiomas .seletor-idioma').forEach(botao => {
        botao.addEventListener('click', function () {
            const idioma = this.getAttribute('data-idioma');
            console.log("Idioma selecionado:", idioma);
            traduzirPagina(idioma);
            menuIdiomas.classList.remove('ativo');
        });
    });

    console.log("Seletor de idiomas configurado");
}

// Inicializar carrosséis
function inicializarCarrosseis() {
    console.log("Inicializando carrosséis");

    // Carrossel de idiomas
    const idiomasCarrossel = criarCarrossel({
        barraSeletor: '.idioma-barra',
        btnAnteriorSeletor: '.idiomas-carrossel .carrossel-btn.anterior',
        btnProximoSeletor: '.idiomas-carrossel .carrossel-btn.proximo'
    });

    // Carrossel de skills
    const skillsCarrossel = criarCarrossel({
        barraSeletor: '.skills-barra',
        btnAnteriorSeletor: '.skills-carrossel .carrossel-btn.anterior',
        btnProximoSeletor: '.skills-carrossel .carrossel-btn.proximo'
    });

    // Armazenar carrosséis no objeto global para acesso pelo handler central de teclas
    window.carrosseis.idiomas = idiomasCarrossel;
    window.carrosseis.skills = skillsCarrossel;

    console.log("Carrosséis inicializados");
}

// Função para criar carrossel
function criarCarrossel(config) {
    console.log("Criando carrossel:", config.barraSeletor);

    const barras = document.querySelectorAll(config.barraSeletor);
    const btnAnterior = document.querySelector(config.btnAnteriorSeletor);
    const btnProximo = document.querySelector(config.btnProximoSeletor);
    let indiceAtual = 0;

    if (!barras.length || !btnAnterior || !btnProximo) {
        console.warn('Elementos do carrossel não encontrados para:', config.barraSeletor);
        return {
            mostrar: () => { },
            getAtual: () => 0
        };
    }

    function mostrar(indice) {
        // Garantir que o índice esteja dentro dos limites
        if (indice < 0) indice = barras.length - 1;
        if (indice >= barras.length) indice = 0;

        // Atualizar o índice atual
        indiceAtual = indice;

        // Remover a classe ativo de todas as barras
        barras.forEach(barra => barra.classList.remove('ativo'));

        // Adicionar a classe ativo à barra atual
        barras[indiceAtual].classList.add('ativo');

        console.log(`Carrossel ${config.barraSeletor} mostrando índice:`, indiceAtual);
    }

    // Adicionar event listeners para os botões
    btnAnterior.addEventListener('click', () => {
        console.log(`Botão anterior clicado em ${config.barraSeletor}`);
        mostrar(indiceAtual - 1);
    });

    btnProximo.addEventListener('click', () => {
        console.log(`Botão próximo clicado em ${config.barraSeletor}`);
        mostrar(indiceAtual + 1);
    });

    return {
        mostrar,
        getAtual: () => indiceAtual
    };
}

// Configura outros eventos da UI
function configurarOutrosEventos() {
    console.log("Configurando outros eventos da UI");

    // Links do sidebar
    if (domCache.sidebar) {
        const sidebarLinks = domCache.sidebar.querySelectorAll('a');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault(); // Previne o comportamento padrão

                // Fecha o menu lateral
                domCache.sidebar.classList.remove('open');
                document.getElementById('sidebar-overlay')?.classList.remove('ativo');
                domCache.sidebar.setAttribute('aria-hidden', true);
                domCache.toggleButton.setAttribute('aria-expanded', false);

                // Usar a mesma implementação direta em vez de chamar atualizarIconeSidebar
                domCache.toggleButton.innerHTML = `<span class="icone-menu">☰</span>`;
                domCache.toggleButton.classList.remove('menu-aberto');

                // Rola suavemente até a seção de destino
                const targetId = link.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);

                if (targetSection) {
                    targetSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Botão voltar ao topo
    const btnTopo = document.getElementById('btn-topo');
    if (btnTopo) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 200) {
                btnTopo.classList.add('mostrar');
            } else {
                btnTopo.classList.remove('mostrar');
            }
            // Atualizar menu ativo durante o scroll
            atualizarMenuAtivo();
        });

        btnTopo.addEventListener('click', function (e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Botão "Fale Comigo"
    const btnFaleComigo = document.querySelector('.botao.fale-comigo');
    if (btnFaleComigo) {
        btnFaleComigo.addEventListener('click', function (e) {
            e.preventDefault();
            const contato = document.getElementById('contato');
            if (contato) {
                contato.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // Botão "Sobre Mim" (header)
    const btnSobreMim = document.querySelector('.sobre-mim-btn');
    if (btnSobreMim) {
        btnSobreMim.addEventListener('click', function (e) {
            e.preventDefault();
            const sobre = document.getElementById('sobre');
            if (sobre) {
                sobre.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // Ícone de e-mail
    const emailIcon = document.querySelector('.header-icons .icon-link[href="#contato"]');
    if (emailIcon) {
        emailIcon.addEventListener('click', function (e) {
            e.preventDefault();
            const contato = document.getElementById('contato');
            if (contato) {
                contato.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    // Ícone de e-mail no banner
    const emailIconBanner = document.querySelector('.header-icons-bottom .icon-link[href="#contato"]');
    if (emailIconBanner) {
        emailIconBanner.addEventListener('click', function (e) {
            e.preventDefault();
            const contato = document.getElementById('contato');
            if (contato) {
                contato.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    console.log("Outros eventos da UI configurados");
}

// Função para atualizar menu ativo durante scroll
function atualizarMenuAtivo() {
    const secoes = document.querySelectorAll('section');
    const links = document.querySelectorAll('.sidebar a');

    secoes.forEach(secao => {
        const topo = secao.offsetTop - 100;
        const id = secao.getAttribute('id');

        if (window.scrollY >= topo) {
            links.forEach(link => {
                link.classList.remove('ativo');
                if (link.getAttribute('href') === `#${id}`) {
                    link.classList.add('ativo');
                }
            });
        }
    });
}

// Função otimizada para animação das seções
function iniciarAnimacaoSections() {
    console.log("Iniciando animação das seções");

    const sections = document.querySelectorAll('section');
    console.log(`Encontradas ${sections.length} seções para animar`);

    // Fallback: se algo der errado, torna todas as seções visíveis
    const tornarSecoesVisiveis = () => {
        sections.forEach(section => {
            section.classList.add('visivel');
            console.log(`Seção ${section.id || 'sem ID'} marcada como visível`);
        });
    };

    // Se não houver IntersectionObserver ou as seções não forem encontradas
    if (!('IntersectionObserver' in window) || sections.length === 0) {
        console.log('Usando fallback para animação das seções');
        tornarSecoesVisiveis();
        return;
    }

    try {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Adicionando a classe 'visivel' para ativar a animação via CSS
                    entry.target.classList.add('visivel');
                    console.log(`Seção ${entry.target.id || 'sem ID'} tornou-se visível`);
                    // Desregistrar observer após a animação
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });

        sections.forEach(section => {
            observer.observe(section);
            console.log(`Observando seção ${section.id || 'sem ID'}`);
        });
    } catch (erro) {
        console.error('Erro ao configurar o IntersectionObserver:', erro);
        tornarSecoesVisiveis(); // Fallback se algo der errado
    }

    console.log("Animação das seções inicializada");
}

// Inicialização do portfólio
function inicializarPortfolio() {
    console.log("Inicializando cards do portfólio");

    if (!domCache.portfolioContainer) {
        console.error("Container do portfólio não encontrado");
        return;
    }

    // Definição dos projetos (se ainda não estiver definido)
    if (typeof projetosPortfolio === 'undefined') {
        console.log("Definindo array de projetos do portfólio");
        window.projetosPortfolio = {
            pt: [
                {
                    id: "analise_vendas",
                    titulo: 'Análise de Vendas com Power BI',
                    imagem: 'img/vendas.jpg',
                    alt: 'Dashboard de vendas criado no Power BI mostrando gráficos de faturamento, produtos e regiões',
                    link: 'https://github.com/mateus-mg/powerbi-vendas',
                    descricao: 'Dashboard interativo para análise de vendas utilizando Power BI. Inclui segmentação por período, produtos e regiões, com insights visuais para tomada de decisão.',
                    tecnologias: ['Power BI', 'DAX', 'Visualização']
                },
                {
                    id: "previsao_casas",
                    titulo: 'Previsão de Preços de Casas (Python)',
                    imagem: 'img/preços-casas.jpg',
                    alt: 'Gráfico de dispersão de preços de casas previsto por modelo de machine learning',
                    link: 'https://github.com/mateus-mg/house-prices-prediction',
                    descricao: 'Modelo de machine learning para prever preços de casas com Python. Utiliza regressão, análise exploratória e validação cruzada.',
                    tecnologias: ['Python', 'Pandas', 'Scikit-learn']
                },
                {
                    id: "dashboard_rh",
                    titulo: 'Dashboard de RH',
                    imagem: 'img/rh.jpg',
                    alt: 'Dashboard de RH com indicadores de turnover, absenteísmo e satisfação dos colaboradores',
                    link: 'https://github.com/mateus-mg/dashboard-rh',
                    descricao: 'Visualização de indicadores de RH em dashboard dinâmico. Permite análise de turnover, absenteísmo e satisfação dos colaboradores.',
                    tecnologias: ['Power BI', 'Excel', 'RH']
                }
            ],
            en: [],
            es: []
        };
    }

    // Verificar se temos projetos para exibir
    if (!window.projetosPortfolio || !window.projetosPortfolio[idiomaAtualProjetos] || window.projetosPortfolio[idiomaAtualProjetos].length === 0) {
        console.warn("Nenhum projeto encontrado para o idioma atual:", idiomaAtualProjetos);
        domCache.portfolioContainer.innerHTML = '<p class="portfolio-sem-projetos">Nenhum projeto disponível no momento.</p>';
        return;
    }

    // Configuração de paginação
    const getProjetosPorPagina = () => {
        // Adaptar o número de projetos por página com base no tamanho da tela
        if (window.innerWidth <= 768) {
            return 1; // Em dispositivos móveis, mostrar apenas 1 projeto por página
        } else if (window.innerWidth <= 992) {
            return 2; // Em tablets, mostrar 2 projetos por página
        } else {
            return 3; // Em desktops, mostrar 3 projetos por página
        }
    };

    let projetosPorPagina = getProjetosPorPagina();
    let paginaAtual = 0;
    let emTransicao = false; // Flag para controlar se há uma transição em andamento

    // Atualizar o número de projetos por página quando a janela for redimensionada
    window.addEventListener('resize', () => {
        const novoProjetosPorPagina = getProjetosPorPagina();
        if (novoProjetosPorPagina !== projetosPorPagina) {
            projetosPorPagina = novoProjetosPorPagina;
            // Recalcular a página atual para manter a posição proporcional
            const projetos = window.projetosPortfolio[idiomaAtualProjetos];
            const totalPaginas = Math.ceil(projetos.length / projetosPorPagina);
            if (paginaAtual >= totalPaginas) {
                paginaAtual = Math.max(0, totalPaginas - 1);
            }
            // Re-renderizar com a nova configuração
            renderizarCards('avançar', 'redimensionamento');
        }
    });

    // Função para renderizar os projetos
    function renderizarCards(direcao = 'avançar', tipoTransicao = 'navegacao') {
        // Se já estiver em transição, não fazer nada
        if (emTransicao) {
            return;
        }

        emTransicao = true;

        try {
            // Adicionar classe para estado de transição de saída
            domCache.portfolioContainer.classList.add('portfolio-transitioning');
            domCache.portfolioContainer.classList.add(`portfolio-transitioning-${direcao}`);

            // Adicionar classe para indicar que é uma navegação ativa (não uma troca de idioma)
            if (tipoTransicao === 'navegacao') {
                domCache.portfolioContainer.classList.add('portfolio-navegacao-ativa');
            }

            // Fade out dos cards atuais
            domCache.portfolioContainer.style.opacity = '0';

            // Só aplicar a transformação se for uma navegação entre páginas
            if (tipoTransicao === 'navegacao') {
                domCache.portfolioContainer.style.transform = direcao === 'avançar' ? 'translateX(-5%)' : 'translateX(5%)';
            }

            setTimeout(() => {
                try {
                    // Limpar conteúdo após fade out
                    domCache.portfolioContainer.innerHTML = '';

                    const projetos = window.projetosPortfolio[idiomaAtualProjetos];
                    const inicio = paginaAtual * projetosPorPagina;
                    const fim = Math.min(inicio + projetosPorPagina, projetos.length);
                    const projetosAtuais = projetos.slice(inicio, fim);

                    console.log(`Renderizando ${projetosAtuais.length} projetos (página ${paginaAtual + 1})`);

                    // Criar cards
                    projetosAtuais.forEach(projeto => {
                        const card = document.createElement('div');
                        card.className = 'portfolio-card';
                        card.setAttribute('data-id', projeto.id);

                        // Criar tags HTML para as tecnologias
                        const tagsHTML = projeto.tecnologias.map(tech =>
                            `<span class="portfolio-tag">${tech}</span>`
                        ).join('');

                        // WebP path with support for different tamanhos
                        const imagemBase = projeto.imagem.replace(/\.(jpg|jpeg|png|gif)$/, '');
                        const webpBase = imagemBase.replace('img/', 'img/webp/') + '.webp';
                        const originalBase = projeto.imagem;

                        // Determinar fetchpriority com base na posição do card
                        const fetchPriority = projetosAtuais.indexOf(projeto) === 0 ? 'high' : 'low';

                        // Determinar loading com base na posição do card
                        const loadingStrategy = projetosAtuais.indexOf(projeto) === 0 ? 'eager' : 'lazy';

                        // Template do card com suporte a srcset para diferentes tamanhos
                        card.innerHTML = `
                            <div class="portfolio-image-container">
                                <picture>
                                    <source 
                                        srcset="${webpBase}"
                                        type="image/webp"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        fetchpriority="${fetchPriority}">
                                    <img 
                                        src="${originalBase}" 
                                        alt="${projeto.alt}" 
                                        loading="${loadingStrategy}" 
                                        fetchpriority="${fetchPriority}"
                                        width="600"
                                        height="400"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        class="portfolio-img">
                                </picture>
                            </div>
                            <div class="portfolio-card-content">
                                <h3 class="portfolio-title">${projeto.titulo}</h3>
                                <p class="portfolio-desc">${projeto.descricao}</p>
                                <div class="portfolio-tags">
                                    ${tagsHTML}
                                </div>
                                <a href="${projeto.link}" target="_blank" rel="noopener noreferrer" class="portfolio-btn">
                                    <i class="fas fa-external-link-alt"></i> Ver Projeto
                                </a>
                            </div>
                        `;

                        // Garantir que o redimensionamento responsivo seja aplicado após o carregamento
                        const imgElement = card.querySelector('img');
                        if (imgElement && window.ImageManager && window.ImageManager.aplicarRedimensionamentoResponsivo) {
                            // Verificar se a imagem já está carregada
                            if (imgElement.complete) {
                                // Dar tempo para o layout ser calculado
                                setTimeout(() => window.ImageManager.aplicarRedimensionamentoResponsivo(imgElement), 100);
                            } else {
                                imgElement.onload = function () {
                                    // Dar tempo para o layout ser calculado
                                    setTimeout(() => window.ImageManager.aplicarRedimensionamentoResponsivo(this), 100);
                                };
                            }
                        }

                        domCache.portfolioContainer.appendChild(card);
                    });

                    // Remover a classe de transição e configurar o estado de entrada
                    domCache.portfolioContainer.classList.remove('portfolio-transitioning');
                    domCache.portfolioContainer.classList.remove(`portfolio-transitioning-${direcao}`);
                    domCache.portfolioContainer.classList.add(`portfolio-entering-${direcao}`);

                    // Aplicar transformação inicial para entrada apenas se for navegação
                    if (tipoTransicao === 'navegacao') {
                        domCache.portfolioContainer.style.transform = direcao === 'avançar' ? 'translateX(5%)' : 'translateX(-5%)';
                    } else {
                        domCache.portfolioContainer.style.transform = 'translateX(0)';
                    }

                    // Fade in dos novos cards (com pequeno atraso para que a transformação seja aplicada)
                    setTimeout(() => {
                        try {
                            domCache.portfolioContainer.style.opacity = '1';
                            domCache.portfolioContainer.style.transform = 'translateX(0)';

                            // Renderizar navegação
                            renderizarBotoesNavegacao();

                            // Remover a classe de entrada após a animação terminar
                            setTimeout(() => {
                                try {
                                    domCache.portfolioContainer.classList.remove(`portfolio-entering-${direcao}`);
                                    // Remover a classe de navegação ativa
                                    domCache.portfolioContainer.classList.remove('portfolio-navegacao-ativa');
                                    emTransicao = false;
                                } catch (err) {
                                    console.error("Erro ao finalizar transição:", err);
                                    emTransicao = false; // Garantir que emTransicao seja resetado mesmo em caso de erro
                                }
                            }, 400); // Duração da transição
                        } catch (err) {
                            console.error("Erro durante a transição de entrada:", err);
                            emTransicao = false; // Garantir que emTransicao seja resetado mesmo em caso de erro
                        }
                    }, 50);
                } catch (err) {
                    console.error("Erro durante a renderização dos cards:", err);
                    domCache.portfolioContainer.style.opacity = '1'; // Garantir que o conteúdo fique visível
                    emTransicao = false; // Garantir que emTransicao seja resetado mesmo em caso de erro
                    renderizarBotoesNavegacao(); // Tentar renderizar os botões de navegação
                }
            }, 400); // Duração da transição de saída
        } catch (err) {
            console.error("Erro inicial na transição:", err);
            emTransicao = false; // Garantir que emTransicao seja resetado mesmo em caso de erro
        }
    }

    // Função para renderizar botões de navegação
    function renderizarBotoesNavegacao() {
        const totalPaginas = Math.ceil(window.projetosPortfolio[idiomaAtualProjetos].length / projetosPorPagina);

        // Remover navegação existente
        const navegacaoExistente = document.querySelector('.portfolio-navegacao');
        if (navegacaoExistente) {
            navegacaoExistente.remove();
        }

        // Só renderiza navegação se houver mais de uma página
        if (totalPaginas <= 1) return;

        // Criar container de navegação
        const navegacao = document.createElement('div');
        navegacao.className = 'portfolio-navegacao';

        // Botão Anterior
        const btnAnterior = document.createElement('button');
        btnAnterior.className = 'portfolio-nav-btn anterior';
        btnAnterior.innerHTML = '<i class="fas fa-chevron-left"></i> Anterior';
        btnAnterior.disabled = paginaAtual === 0;
        btnAnterior.addEventListener('click', () => {
            console.log("Botão anterior do portfólio clicado");
            if (paginaAtual > 0 && !emTransicao) {
                paginaAtual--;
                renderizarCards('voltar');
            }
        });

        // Botão Próximo
        const btnProximo = document.createElement('button');
        btnProximo.className = 'portfolio-nav-btn proximo';
        btnProximo.innerHTML = 'Próximo <i class="fas fa-chevron-right"></i>';
        btnProximo.disabled = paginaAtual >= totalPaginas - 1;
        btnProximo.addEventListener('click', () => {
            console.log("Botão próximo do portfólio clicado");
            if (paginaAtual < totalPaginas - 1 && !emTransicao) {
                paginaAtual++;
                renderizarCards('avançar');
            }
        });

        // Adicionar botões de navegação ao container
        navegacao.appendChild(btnAnterior);
        navegacao.appendChild(btnProximo);

        // Adicionar navegação após o container
        domCache.portfolioContainer.parentNode.insertBefore(navegacao, domCache.portfolioContainer.nextSibling);
    }

    // Função genérica para o swipe
    function adicionarSwipe(container, onSwipeLeft, onSwipeRight) {
        let touchStartX = 0;
        let touchEndX = 0;

        container.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });

        container.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            if (touchEndX < touchStartX - 50) onSwipeLeft();
            if (touchEndX > touchStartX + 50) onSwipeRight();
        });
    }

    // Iniciar a renderização
    renderizarCards();

    // Adicionar swipe para navegação em dispositivos móveis
    adicionarSwipe(domCache.portfolioContainer,
        () => {
            const totalPaginas = Math.ceil(window.projetosPortfolio[idiomaAtualProjetos].length / projetosPorPagina);
            if (paginaAtual < totalPaginas - 1 && !emTransicao) {
                paginaAtual++;
                renderizarCards('avançar');
            }
        },
        () => {
            if (paginaAtual > 0 && !emTransicao) {
                paginaAtual--;
                renderizarCards('voltar');
            }
        }
    );

    // Expor a função para uso em outras partes do código
    window.renderizarPortfolio = renderizarCards;

    console.log("Inicialização do portfólio concluída");
}

// Função de tradução completa
function traduzirPagina(idioma) {
    console.log("Traduzindo página para:", idioma);

    // Usar o sistema de internacionalização centralizado
    window.alterarIdioma(idioma).then(sucesso => {
        if (sucesso) {
            // Atualizar o idioma atual dos projetos
            idiomaAtualProjetos = idioma;

            // Carregar projetos do idioma selecionado
            carregarProjetosPorIdioma(idioma);

            // Marcar o botão do idioma atual como ativo
            document.querySelectorAll('.seletor-idioma').forEach(botao => {
                const botaoIdioma = botao.getAttribute('data-idioma');
                botao.classList.toggle('ativo', botaoIdioma === idioma);
            });
        } else {
            console.error(`Falha ao alterar para o idioma: ${idioma}`);
            alert(`Erro ao carregar as traduções para ${idioma}. Por favor, tente novamente.`);
        }
    });
}

// Nova função para carregar e renderizar projetos por idioma
async function carregarProjetosPorIdioma(idioma) {
    try {
        // Verificar se as traduções estão carregadas
        if (!window.i18n.traducoes[idioma] || !window.i18n.traducoes[idioma].projetos) {
            // Carregar traduções se necessário
            await window.i18n.carregarTraducoes(idioma);
        }

        const traducoes = window.i18n.traducoes[idioma];

        if (traducoes && traducoes.projetos) {
            // Converter estrutura de projetos para o formato esperado
            const projetosConvertidos = [];

            Object.keys(traducoes.projetos).forEach(id => {
                const proj = traducoes.projetos[id];

                // Mapeamento correto das imagens baseado no ID do projeto
                let imagemPath;
                if (id.includes('vendas')) {
                    imagemPath = 'img/vendas.jpg';
                } else if (id.includes('previsao_casas') || id.includes('casas')) {
                    imagemPath = 'img/preços-casas.jpg';
                } else if (id.includes('rh')) {
                    imagemPath = 'img/rh.jpg';
                } else {
                    // Imagem padrão caso não encontre correspondência
                    imagemPath = `img/${id}.jpg`;
                }

                projetosConvertidos.push({
                    id: id,
                    titulo: proj.titulo,
                    imagem: imagemPath,
                    alt: proj.alt,
                    link: `https://github.com/mateus-mg/${id}`,
                    descricao: proj.descricao,
                    tecnologias: proj.tecnologias
                });
            });

            // Atualizar os projetos para o idioma atual
            window.projetosPortfolio[idioma] = projetosConvertidos;

            console.log(`${projetosConvertidos.length} projetos carregados para o idioma ${idioma}`);

            // Renderizar projetos com o novo idioma
            if (window.renderizarPortfolio) {
                console.log("Renderizando portfólio após tradução");
                window.renderizarPortfolio('avançar', 'navegacao');
            } else {
                console.warn("Função renderizarPortfolio não encontrada, reinicializando portfólio");
                inicializarPortfolio();
            }
        } else {
            console.warn("Nenhum projeto encontrado para o idioma:", idioma);
        }
    } catch (error) {
        console.error("Erro ao carregar projetos para o idioma:", idioma, error);
    }
}

// Remover as funções que foram transferidas para o i18n.js
// Não precisamos mais da função aplicarTraducoes e limparCacheAntigo
// pois agora essa lógica está no arquivo i18n.js