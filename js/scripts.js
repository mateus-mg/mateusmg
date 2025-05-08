// Cache de elementos DOM frequentemente usados
const domCache = {
    sidebar: null,
    toggleButton: null,
    menuIdiomas: null,
    portfolioContainer: null,
    form: null
};

// Configuração de cache com versionamento - Mantida para compatibilidade temporária
// Será eventualmente migrada totalmente para AppState
const CONFIG_CACHE = {
    versao: AppState ? AppState.configCache.versao : '1.0.1',
    tempoExpiracaoCache: AppState ? AppState.configCache.tempoExpiracaoCache : 7 * 24 * 60 * 60 * 1000, // 7 dias
    prefixoChave: AppState ? AppState.configCache.prefixoChave : 'portfolio_'
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

        // Atualizar atributos ARIA - Corrigido para melhorar acessibilidade
        // Não usar aria-hidden em elementos com conteúdo focável
        // Em vez disso, usar aria-expanded para indicar estado
        domCache.toggleButton.setAttribute('aria-expanded', isOpen);

        // Adicionar aria-label para leitores de tela
        domCache.sidebar.setAttribute('aria-label', isOpen ? 'Menu de navegação aberto' : 'Menu de navegação fechado');

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

    // Adicionar eventos aos botões de idioma
    document.querySelectorAll('.menu-idiomas .seletor-idioma').forEach(botao => {
        botao.addEventListener('click', async function () {
            const idioma = this.getAttribute('data-idioma');
            console.log("Idioma selecionado:", idioma);

            // Usar o novo sistema i18n em vez da função traduzirPagina
            await window.alterarIdioma(idioma);

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

    // Verificar se estamos na página de detalhes ou na página principal
    const isProjetoPage = window.location.pathname.includes('projeto.html') ||
        window.location.pathname.endsWith('/projeto');

    // Se estivermos na página de detalhes de projeto, não renderizar o portfolio
    if (isProjetoPage) {
        console.log("Estamos na página de projeto, não inicializando portfólio");
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
    const idiomaAtual = AppState.idiomaProjetoAtual;
    if (!window.projetosPortfolio || !window.projetosPortfolio[idiomaAtual] || window.projetosPortfolio[idiomaAtual].length === 0) {
        console.warn("Nenhum projeto encontrado para o idioma atual:", idiomaAtual);
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
    let paginaAtual = AppState.paginaAtualPortfolio || 0;

    // Armazenar o estado de transição no AppState em vez de variável local
    let emTransicao = AppState.emTransicaoPortfolio;

    // Atualizar o número de projetos por página quando a janela for redimensionada
    window.addEventListener('resize', () => {
        const novoProjetosPorPagina = getProjetosPorPagina();
        if (novoProjetosPorPagina !== projetosPorPagina) {
            projetosPorPagina = novoProjetosPorPagina;
            // Recalcular a página atual para manter a posição proporcional
            const projetos = window.projetosPortfolio[idiomaAtual];
            const totalPaginas = Math.ceil(projetos.length / projetosPorPagina);
            if (paginaAtual >= totalPaginas) {
                paginaAtual = Math.max(0, totalPaginas - 1);
                AppState.setPaginaPortfolio(paginaAtual);
            }
            // Re-renderizar com a nova configuração
            renderizarCards('avançar', 'redimensionamento');
        }
    });

    // Inscrever-se para receber atualizações quando o idioma for alterado
    PubSub.subscribe('idioma:alterado', (dados) => {
        console.log(`Portfolio recebeu notificação de alteração de idioma: ${dados.antigo} -> ${dados.novo}`);
        // Se não temos projetos para este idioma ainda e ele não estiver carregado, reinicializamos o portfolio
        if (!window.projetosPortfolio[dados.novo] || window.projetosPortfolio[dados.novo].length === 0) {
            console.log(`Reinicializando portfolio para o idioma ${dados.novo}`);

            // Carregar projetos usando o sistema i18n
            window.i18n.traduzir(`projetos`).then(projetosTraducao => {
                if (projetosTraducao && typeof projetosTraducao === 'object') {
                    const projetosConvertidos = [];

                    Object.keys(projetosTraducao).forEach(id => {
                        const proj = projetosTraducao[id];

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
                    window.projetosPortfolio[dados.novo] = projetosConvertidos;

                    // Renderizar projetos com o novo idioma
                    renderizarCards('avançar', 'idioma');
                }
            });
        } else {
            console.log(`Renderizando portfolio existente para o idioma ${dados.novo}`);
            // Já temos os projetos para este idioma, apenas renderizá-los
            renderizarCards('avançar', 'idioma');
        }
    });

    // Função para renderizar os projetos
    function renderizarCards(direcao = 'avançar', tipoTransicao = 'navegacao') {
        // Se já estiver em transição, não fazer nada
        if (AppState.emTransicaoPortfolio) {
            return;
        }

        // Atualizar estado de transição
        AppState.setTransicaoPortfolio(true);

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

                    // Usar o idioma atual do AppState
                    const idiomaAtual = AppState.idiomaProjetoAtual;
                    const projetos = window.projetosPortfolio[idiomaAtual];
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

                        // WebP path com suporte para diferentes tamanhos
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
                                <div class="portfolio-buttons">
                                    <a href="${projeto.link}" target="_blank" rel="noopener noreferrer" class="portfolio-btn">
                                        <i class="fas fa-external-link-alt"></i> Ver GitHub
                                    </a>
                                    <a href="projeto.html?id=${projeto.id}" class="portfolio-btn relatorio-btn">
                                        <i class="fas fa-file-alt"></i> Relatório
                                    </a>
                                </div>
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

                        // Adicionar o card ao container
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
                                    // Atualizar o estado de transição
                                    AppState.setTransicaoPortfolio(false);
                                } catch (err) {
                                    console.error("Erro ao finalizar transição:", err);
                                    AppState.setTransicaoPortfolio(false); // Garantir que o estado é resetado mesmo em caso de erro
                                }
                            }, 400); // Duração da transição
                        } catch (err) {
                            console.error("Erro durante a transição de entrada:", err);
                            AppState.setTransicaoPortfolio(false); // Garantir que o estado é resetado mesmo em caso de erro
                        }
                    }, 50);
                } catch (err) {
                    console.error("Erro durante a renderização dos cards:", err);
                    domCache.portfolioContainer.style.opacity = '1'; // Garantir que o conteúdo fique visível
                    AppState.setTransicaoPortfolio(false); // Garantir que o estado é resetado mesmo em caso de erro
                    renderizarBotoesNavegacao(); // Tentar renderizar os botões de navegação
                }
            }, 400); // Duração da transição de saída
        } catch (err) {
            console.error("Erro inicial na transição:", err);
            AppState.setTransicaoPortfolio(false); // Garantir que o estado é resetado mesmo em caso de erro
        }
    }

    // Função para renderizar botões de navegação
    function renderizarBotoesNavegacao() {
        const idiomaAtual = AppState.idiomaProjetoAtual;
        const totalPaginas = Math.ceil(window.projetosPortfolio[idiomaAtual].length / projetosPorPagina);

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
            if (paginaAtual > 0 && !AppState.emTransicaoPortfolio) {
                paginaAtual--;
                AppState.setPaginaPortfolio(paginaAtual);
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
            if (paginaAtual < totalPaginas - 1 && !AppState.emTransicaoPortfolio) {
                paginaAtual++;
                AppState.setPaginaPortfolio(paginaAtual);
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
            const idiomaAtual = AppState.idiomaProjetoAtual;
            const totalPaginas = Math.ceil(window.projetosPortfolio[idiomaAtual].length / projetosPorPagina);
            if (paginaAtual < totalPaginas - 1 && !AppState.emTransicaoPortfolio) {
                paginaAtual++;
                AppState.setPaginaPortfolio(paginaAtual);
                renderizarCards('avançar');
            }
        },
        () => {
            if (paginaAtual > 0 && !AppState.emTransicaoPortfolio) {
                paginaAtual--;
                AppState.setPaginaPortfolio(paginaAtual);
                renderizarCards('voltar');
            }
        }
    );

    // Expor a função para uso em outras partes do código
    window.renderizarPortfolio = renderizarCards;

    console.log("Inicialização do portfólio concluída");
}

// Código para o sistema de navegação das subseções de experiências
document.addEventListener('DOMContentLoaded', function () {
    // Configuração do sistema de navegação para as experiências
    const setupExperienciaNavegacao = (containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        const paginas = container.querySelectorAll('.experiencia-pagina');
        const totalPaginas = paginas.length;
        const btnAnterior = document.querySelector(`.experiencia-nav-btn.anterior[data-target="${containerId}"]`);
        const btnProximo = document.querySelector(`.experiencia-nav-btn.proximo[data-target="${containerId}"]`);

        let paginaAtual = 1;

        // Inicializar páginas e garantir que apenas a primeira esteja visível
        paginas.forEach((pagina, index) => {
            if (index === 0) {
                pagina.classList.add('ativo');
                pagina.style.display = 'block';
                pagina.style.opacity = '1';
                pagina.style.transform = 'translateX(0)';
            } else {
                pagina.classList.remove('ativo');
                pagina.style.display = 'none';
                pagina.style.opacity = '0';
            }
        });

        // Função para atualizar os botões
        const atualizarBotoes = () => {
            if (btnAnterior) btnAnterior.disabled = paginaAtual === 1;
            if (btnProximo) btnProximo.disabled = paginaAtual === totalPaginas;
        };

        // Função para navegar para uma página específica
        const navegarPara = (pagina) => {
            if (pagina < 1 || pagina > totalPaginas || pagina === paginaAtual) return;

            const direcao = pagina > paginaAtual ? 'proximo' : 'anterior';
            const paginaAnteriorEl = container.querySelector(`.experiencia-pagina[data-pagina="${paginaAtual}"]`);
            const proximaPaginaEl = container.querySelector(`.experiencia-pagina[data-pagina="${pagina}"]`);

            if (!paginaAnteriorEl || !proximaPaginaEl) return;

            // Esconder a página atual com fade-out
            paginaAnteriorEl.style.opacity = '0';
            paginaAnteriorEl.style.transform = direcao === 'proximo' ? 'translateX(-30px)' : 'translateX(30px)';

            // Aguardar a animação de saída terminar
            setTimeout(() => {
                // Remover a página anterior da visualização
                paginaAnteriorEl.classList.remove('ativo');
                paginaAnteriorEl.style.display = 'none';

                // Preparar a próxima página para entrada
                proximaPaginaEl.style.display = 'block';
                proximaPaginaEl.style.opacity = '0';
                proximaPaginaEl.style.transform = direcao === 'proximo' ? 'translateX(30px)' : 'translateX(-30px)';

                // Forçar reflow para garantir que a transição ocorra
                void proximaPaginaEl.offsetWidth;

                // Mostrar a nova página com fade-in
                proximaPaginaEl.style.opacity = '1';
                proximaPaginaEl.style.transform = 'translateX(0)';

                // Atualizar a página atual e os botões
                paginaAtual = pagina;
                atualizarBotoes();

                // Adicionar classe ativo após a animação
                proximaPaginaEl.classList.add('ativo');
            }, 300); // Tempo para completar a animação de saída
        };

        // Configura os event listeners para os botões
        if (btnAnterior) {
            btnAnterior.addEventListener('click', () => {
                navegarPara(paginaAtual - 1);
            });
        }

        if (btnProximo) {
            btnProximo.addEventListener('click', () => {
                navegarPara(paginaAtual + 1);
            });
        }

        // Inicializa o estado dos botões
        atualizarBotoes();
    };

    // Configura a navegação para cada container
    setupExperienciaNavegacao('formacoes-container');
    setupExperienciaNavegacao('cursos-container');
});

// Função centralizada para gerenciar o popup de feedback
function gerenciarFeedbackPopup() {
    // Singleton - cria o popup apenas uma vez
    let feedbackPopup = document.getElementById('feedback-popup');

    // Criar elemento se não existir
    if (!feedbackPopup) {
        console.log("Criando popup de feedback");
        feedbackPopup = document.createElement('div');
        feedbackPopup.id = 'feedback-popup';
        feedbackPopup.className = 'feedback-popup';
        feedbackPopup.innerHTML = `
            <div class="feedback-content">
                <div class="feedback-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h3 class="feedback-titulo" data-i18n="formulario.feedback.titulo">Mensagem Enviada!</h3>
                <p class="feedback-mensagem" data-i18n="formulario.feedback.mensagem">Sua mensagem foi recebida e será analisada com prioridade. Aguarde retorno em breve.</p>
                <button class="botao feedback-fechar" data-i18n="formulario.feedback.fechar">Fechar</button>
            </div>
        `;
        document.body.appendChild(feedbackPopup);

        // Configurar botão de fechar (apenas uma vez)
        const fecharBtn = feedbackPopup.querySelector('.feedback-fechar');
        if (fecharBtn) {
            fecharBtn.addEventListener('click', () => {
                esconderPopup();
            });
        }
    }

    // Métodos para manipular o popup
    function mostrarPopup(mensagem, titulo) {
        // Atualizar conteúdo se necessário
        if (mensagem) {
            const mensagemEl = feedbackPopup.querySelector('.feedback-mensagem');
            if (mensagemEl) mensagemEl.innerHTML = mensagem;
        }

        if (titulo) {
            const tituloEl = feedbackPopup.querySelector('.feedback-titulo');
            if (tituloEl) tituloEl.textContent = titulo;
        }

        // Traduzir os elementos estáticos do popup que não são dinâmicos
        traduzirElementosPopup();

        // Mostrar popup com animação
        feedbackPopup.style.display = 'flex';
        feedbackPopup.offsetHeight; // Forçar reflow
        setTimeout(() => {
            feedbackPopup.classList.add('ativo');
        }, 10);
    }

    function esconderPopup() {
        feedbackPopup.classList.remove('ativo');
        setTimeout(() => {
            feedbackPopup.style.display = 'none';

            // Remover o parâmetro "enviado=sucesso" da URL
            if (window.location.search.includes('enviado=sucesso')) {
                // Usar History API para mudar a URL sem recarregar a página
                const urlSemParametro = window.location.pathname + window.location.hash;
                history.replaceState(null, '', urlSemParametro);
                console.log("Parâmetro 'enviado=sucesso' removido da URL");
            }
        }, 300);
    }

    // Função auxiliar para traduzir os elementos estáticos do popup
    function traduzirElementosPopup() {
        // Obter o idioma atual
        const idiomaAtual = localStorage.getItem('idioma') || 'pt';

        // Verificar se temos a tradução em cache no localStorage
        const cacheKey = `feedback_popup_${idiomaAtual}`;
        const cachedTranslation = localStorage.getItem(cacheKey);

        if (cachedTranslation) {
            // Usar tradução em cache para resposta imediata
            const fecharBtn = feedbackPopup.querySelector('.feedback-fechar');
            if (fecharBtn) {
                fecharBtn.textContent = cachedTranslation;
            }

            console.log(`Usando tradução em cache para o botão fechar (${idiomaAtual})`);
            return;
        }

        // Buscar as traduções para o botão de fechar
        fetch(`i18n/${idiomaAtual}.json`)
            .then(response => response.json())
            .then(traducoes => {
                const fecharBtn = feedbackPopup.querySelector('.feedback-fechar');
                if (fecharBtn && traducoes.formulario?.feedback?.fechar) {
                    fecharBtn.textContent = traducoes.formulario.feedback.fechar;

                    // Armazenar em cache para uso futuro
                    localStorage.setItem(cacheKey, traducoes.formulario.feedback.fechar);
                }
            })
            .catch(error => {
                console.error(`Erro ao traduzir elementos do popup: ${error}`);
            });
    }

    function atualizarMensagemEnvio(nome, assunto) {
        if (!nome) nome = localStorage.getItem('ultimo_contato_nome') || 'usuário';
        if (!assunto) assunto = localStorage.getItem('ultimo_assunto') || '';

        // Usar o sistema i18n em vez de fetch direto
        return window.i18n.traduzir('formulario.feedback.sucesso')
            .then(traducao => {
                if (traducao && typeof traducao === 'string') {
                    // Substituir placeholders na mensagem de sucesso
                    return traducao
                        .replace(/{{nome}}/g, nome)
                        .replace(/{{assunto}}/g, assunto);
                } else {
                    // Fallback para mensagem padrão
                    return `
                        <strong>Olá ${nome}!</strong><br>
                        Sua mensagem ${assunto ? `sobre "<em>${assunto}</em>" ` : ''}foi enviada com sucesso!<br>
                        Agradecemos seu contato e entraremos em contato o mais breve possível.
                    `;
                }
            })
            .catch(error => {
                console.error(`Erro ao buscar traduções: ${error}`);
                // Fallback para mensagem padrão
                return `
                    <strong>Olá ${nome}!</strong><br>
                    Sua mensagem ${assunto ? `sobre "<em>${assunto}</em>" ` : ''}foi enviada com sucesso!<br>
                    Agradecemos seu contato e entraremos em contato o mais breve possível.
                `;
            });
    }

    function atualizarMensagemEnviando(nome) {
        if (!nome) nome = localStorage.getItem('ultimo_contato_nome') || 'usuário';

        // Usar o sistema i18n
        return window.i18n.traduzir('formulario.feedback.enviando')
            .then(traducao => {
                if (traducao && typeof traducao === 'string') {
                    // Substituir placeholders na mensagem de enviando
                    return traducao.replace(/{{nome}}/g, nome);
                } else {
                    // Fallback para mensagem padrão
                    return `"${nome}", Estamos enviando sua mensagem...`;
                }
            })
            .catch(error => {
                console.error(`Erro ao buscar traduções: ${error}`);
                // Fallback para mensagem padrão
                return `"${nome}", Estamos enviando sua mensagem...`;
            });
    }

    // Função para obter o título traduzido
    function obterTituloTraduzido(tipo = 'titulo') {
        const chave = tipo === 'enviando' ? 'formulario.feedback.enviando_titulo' : 'formulario.feedback.titulo';

        // Usar o sistema i18n
        return window.i18n.traduzir(chave)
            .then(traducao => {
                if (traducao && typeof traducao === 'string') {
                    return traducao;
                } else {
                    // Fallback para título padrão
                    return tipo === 'enviando' ? 'Enviando Mensagem...' : 'Mensagem Enviada!';
                }
            })
            .catch(error => {
                console.error(`Erro ao buscar traduções para título: ${error}`);
                // Fallback para título padrão
                return tipo === 'enviando' ? 'Enviando Mensagem...' : 'Mensagem Enviada!';
            });
    }

    // Expor interface pública com métodos assíncronos para suportar traduções
    return {
        elemento: feedbackPopup,
        mostrar: mostrarPopup,
        esconder: esconderPopup,
        mensagemEnvio: atualizarMensagemEnvio,
        mensagemEnviando: atualizarMensagemEnviando,
        obterTituloTraduzido: obterTituloTraduzido
    };
}