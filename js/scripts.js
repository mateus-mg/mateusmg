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

// Variáveis globais para o portfólio - adicionadas para corrigir problema de escopo
let idiomaAtual = 'pt';
let projetosPorPagina = 3;
let paginaAtual = 0;

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
    },

    // Implementa transição de saída ao navegar entre páginas
    handleNavigationWithTransition: (event) => {
        const link = event.target.closest('a[href]');
        if (!link) return;
        const href = link.getAttribute('href');
        if (href.startsWith('#') || href.startsWith('http') || link.target === '_blank') return;
        event.preventDefault();
        // Inicia transição de saída
        document.body.classList.remove('fade-in');
        document.body.classList.add('fade-out');
        setTimeout(() => {
            window.location.href = href;
        }, 400);
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
    document.addEventListener('click', handlers.handleNavigationWithTransition);

    // Inicializações
    criarOverlaySidebar();
    configurarEventosTeclado();
    iniciarAnimacaoSections();
    configurarSeletorIdiomas();
    inicializarCarrosseis();
    inicializarPortfolio();
    configurarFormularioContato();
    configurarOutrosEventos();
    // Inicializar navegação das experiências
    inicializarNavegacaoExperiencias();

    // Verificar idioma salvo
    const idiomaArmazenado = localStorage.getItem('idioma');
    if (idiomaArmazenado) {
        // Uso do novo sistema de i18n para traduzir a página
        window.alterarIdioma(idiomaArmazenado);
    }

    console.log("Inicialização do site concluída");
});

/**
 * Função de compatibilidade para projetos antigos que ainda usam traduzirPagina()
 * Esta função agora atua como um wrapper para o novo sistema window.alterarIdioma()
 */
function traduzirPagina(idioma) {
    console.log("Chamando função legada traduzirPagina(), redirecionando para window.alterarIdioma()");
    if (window.alterarIdioma && typeof window.alterarIdioma === 'function') {
        window.alterarIdioma(idioma);
    } else {
        console.error("Função window.alterarIdioma não disponível");
    }
}

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
        menuIdiomasToggle.setAttribute('aria-expanded', menuIdiomas.classList.contains('ativo'));
    });

    // Fechar menu quando clicar fora dele
    document.addEventListener('click', (event) => {
        if (!menuIdiomasToggle.contains(event.target) && !menuIdiomas.contains(event.target)) {
            menuIdiomas.classList.remove('ativo');
            menuIdiomasToggle.setAttribute('aria-expanded', 'false');
        }
    });

    // Adicionar eventos aos botões de idioma
    document.querySelectorAll('.menu-idiomas .seletor-idioma').forEach(botao => {
        botao.addEventListener('click', async function () {
            const idioma = this.getAttribute('data-idioma');
            console.log("Idioma selecionado:", idioma);

            // Usar o novo sistema i18n em vez da função traduzirPagina
            await window.alterarIdioma(idioma);

            // Atualizar UI
            document.querySelectorAll('.seletor-idioma').forEach(btn => {
                btn.classList.remove('ativo');
            });
            this.classList.add('ativo');

            // Atualizar o texto do botão de seleção
            const idiomaAtualElement = document.querySelector('.idioma-atual');
            if (idiomaAtualElement) {
                idiomaAtualElement.textContent = idioma.toUpperCase();
            }

            menuIdiomas.classList.remove('ativo');
            menuIdiomasToggle.setAttribute('aria-expanded', 'false');
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
            entries.forEach((entry) => {
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
                    imagem: 'vendas.jpg',
                    alt: 'Dashboard de vendas criado no Power BI mostrando gráficos de faturamento, produtos e regiões',
                    link: 'https://github.com/mateus-mg/powerbi-vendas',
                    descricao: 'Dashboard interativo para análise de vendas utilizando Power BI. Inclui segmentação por período, produtos e regiões, com insights visuais para tomada de decisão.',
                    tecnologias: ['Power BI', 'DAX', 'Visualização']
                },
                {
                    id: "previsao_casas",
                    titulo: 'Previsão de Preços de Casas (Python)',
                    imagem: 'preços-casas.jpg',
                    alt: 'Gráfico de dispersão de preços de casas previsto por modelo de machine learning',
                    link: 'https://github.com/mateus-mg/house-prices-prediction',
                    descricao: 'Modelo de machine learning para prever preços de casas com Python. Utiliza regressão, análise exploratória e validação cruzada.',
                    tecnologias: ['Python', 'Pandas', 'Scikit-learn']
                },
                {
                    id: "dashboard_rh",
                    titulo: 'Dashboard de RH',
                    imagem: 'rh.jpg',
                    alt: 'Dashboard de RH com indicadores de turnover, absenteísmo e satisfação dos colaboradores',
                    link: 'https://github.com/mateus-mg/dashboard-rh',
                    descricao: 'Visualização de indicadores de RH em dashboard dinâmico. Permite análise de turnover, absenteísmo e satisfação dos colaboradores.',
                    tecnologias: ['Power BI', 'Excel', 'RH']
                },
                {
                    id: "analise_vendas",
                    titulo: 'Análise de Vendas com Power BI',
                    imagem: 'vendas.jpg',
                    alt: 'Dashboard de vendas criado no Power BI mostrando gráficos de faturamento, produtos e regiões',
                    link: 'https://github.com/mateus-mg/powerbi-vendas',
                    descricao: 'Dashboard interativo para análise de vendas utilizando Power BI. Inclui segmentação por período, produtos e regiões, com insights visuais para tomada de decisão.',
                    tecnologias: ['Power BI', 'DAX', 'Visualização']
                },
                {
                    id: "previsao_casas",
                    titulo: 'Previsão de Preços de Casas (Python)',
                    imagem: 'preços-casas.jpg',
                    alt: 'Gráfico de dispersão de preços de casas previsto por modelo de machine learning',
                    link: 'https://github.com/mateus-mg/house-prices-prediction',
                    descricao: 'Modelo de machine learning para prever preços de casas com Python. Utiliza regressão, análise exploratória e validação cruzada.',
                    tecnologias: ['Python', 'Pandas', 'Scikit-learn']
                },
                {
                    id: "dashboard_rh",
                    titulo: 'Dashboard de RH',
                    imagem: 'rh.jpg',
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

    // CORREÇÃO: Adicionando projetos padrão para idiomas sem conteúdo
    if (window.projetosPortfolio) {
        // Se não temos projetos em inglês, copiar de português
        if (!window.projetosPortfolio.en || window.projetosPortfolio.en.length === 0) {
            console.log("Copiando projetos PT para EN como fallback");
            window.projetosPortfolio.en = JSON.parse(JSON.stringify(window.projetosPortfolio.pt));
        }

        // Se não temos projetos em espanhol, copiar de português
        if (!window.projetosPortfolio.es || window.projetosPortfolio.es.length === 0) {
            console.log("Copiando projetos PT para ES como fallback");
            window.projetosPortfolio.es = JSON.parse(JSON.stringify(window.projetosPortfolio.pt));
        }
    }

    // Verificar se temos projetos para exibir
    let idiomaAtual = 'pt'; // Default seguro

    // Verificar se i18n está disponível
    if (window.i18n && typeof window.i18n.getIdiomaAtual === 'function') {
        idiomaAtual = window.i18n.getIdiomaAtual();
    } else if (window.i18n && window.i18n.idiomaAtual) {
        idiomaAtual = window.i18n.idiomaAtual;
    } else {
        idiomaAtual = localStorage.getItem('idioma') || 'pt';
    }

    // Garantir que estamos usando um idioma que tem projetos
    if (!window.projetosPortfolio[idiomaAtual]) {
        console.log(`Idioma ${idiomaAtual} não tem projetos definidos. Usando 'pt' como fallback.`);
        idiomaAtual = 'pt'; // Fallback para pt
    }

    // Verificar se temos projetos para o idioma atual
    if (!window.projetosPortfolio[idiomaAtual] || window.projetosPortfolio[idiomaAtual].length === 0) {
        console.warn("Nenhum projeto encontrado para o idioma atual:", idiomaAtual);
        domCache.portfolioContainer.innerHTML = '<p class="portfolio-sem-projetos">Nenhum projeto disponível no momento.</p>';
        return;
    }

    // Configuração de paginação
    const getProjetosPorPagina = function () {
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
    let paginaAtual = 0; // Sempre começar da página 0 para evitar problemas

    // Tentar usar o AppState se disponível
    if (window.AppState && typeof AppState.paginaAtualPortfolio === 'number') {
        paginaAtual = AppState.paginaAtualPortfolio;
    }

    // Definir as variáveis globais para navegação do portfólio
    window.idiomaAtual = idiomaAtual;
    window.projetosPorPagina = projetosPorPagina;
    window.paginaAtual = paginaAtual;

    // Renderizar os cards do portfólio
    renderizarCards();

    // Função para renderizar os cards
    function renderizarCards() {
        try {
            // Limpar conteúdo anterior
            domCache.portfolioContainer.innerHTML = '';

            // Usar o idioma atual
            const projetos = window.projetosPortfolio[idiomaAtual];
            const inicio = paginaAtual * projetosPorPagina;
            const fim = Math.min(inicio + projetosPorPagina, projetos.length);
            const projetosAtuais = projetos.slice(inicio, fim);

            console.log(`Renderizando ${projetosAtuais.length} projetos (página ${paginaAtual + 1} de ${Math.ceil(projetos.length / projetosPorPagina)})`);

            // Criar cards
            projetosAtuais.forEach(projeto => {
                const card = document.createElement('div');
                card.className = 'portfolio-card';
                card.setAttribute('data-id', projeto.id);

                // Criar tags HTML para as tecnologias
                const tagsHTML = projeto.tecnologias.map(tech =>
                    `<span class="portfolio-tag">${tech}</span>`
                ).join('');

                // Template do card com picture para suporte a WebP com fallback para JPG
                card.innerHTML = `
                    <div class="portfolio-image-container">
                        <picture>
                            <source srcset="img/webp/${projeto.imagem.replace(/\.(jpg|jpeg|png)$/i, '.webp')}" type="image/webp">
                            <img src="img/${projeto.imagem}" alt="${projeto.alt}" class="portfolio-img">
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

                // Adicionar o card ao container
                domCache.portfolioContainer.appendChild(card);
            });

            // Renderizar os botões de navegação sempre após adicionar os cards
            // Forçar um timeout para garantir que o DOM foi atualizado
            setTimeout(() => {
                renderizarBotoesNavegacao();
            }, 50);

        } catch (err) {
            console.error("Erro durante a renderização dos cards:", err);
        }
    }

    // Exportar renderizarCards para o escopo global (correção do bug de navegação)
    window.renderizarCards = renderizarCards;

    // Função para renderizar botões de navegação
    function renderizarBotoesNavegacao() {
        console.log("Renderizando botões de navegação do portfólio");

        const projetos = window.projetosPortfolio[idiomaAtual];
        const totalProjetos = projetos.length;
        const totalPaginas = Math.ceil(totalProjetos / projetosPorPagina);

        console.log(`Total de projetos: ${totalProjetos}, Projetos por página: ${projetosPorPagina}, Total de páginas: ${totalPaginas}`);

        // Remover navegação existente para evitar duplicação
        const navegacaoExistente = document.querySelector('.portfolio-navegacao');
        const navegacaoContainerExistente = document.querySelector('.portfolio-navegacao-container');

        if (navegacaoContainerExistente) {
            console.log("Removendo container de navegação existente");
            navegacaoContainerExistente.remove();
        } else if (navegacaoExistente) {
            console.log("Removendo navegação existente");
            navegacaoExistente.remove();
        }

        // Se só temos uma página, não precisamos de botões de navegação
        if (totalPaginas <= 1) {
            console.log("Apenas uma página de projetos. Navegação não necessária.");
            return;
        }

        console.log("Criando novos botões de navegação");

        // Obter a seção do portfólio
        const portfolioSection = document.getElementById('portfolio');
        if (!portfolioSection) {
            console.error("Seção de portfólio não encontrada");
            return;
        }

        // Criar navegação
        const navegacao = document.createElement('div');
        navegacao.className = 'portfolio-navegacao';

        // Adicionar estilos inline diretamente para garantir visibilidade
        Object.assign(navegacao.style, {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '20px',
            margin: '30px auto',
            padding: '20px 0',
            visibility: 'visible',
            opacity: '1',
            width: '100%',
            maxWidth: '300px',
            position: 'relative',
            zIndex: '100'
        });

        // Botão Anterior
        const btnAnterior = document.createElement('button');
        btnAnterior.className = 'portfolio-nav-btn anterior';
        btnAnterior.innerHTML = '<i class="fas fa-chevron-left"></i> Anterior';
        btnAnterior.disabled = paginaAtual <= 0;

        // Estilos inline para o botão anterior
        Object.assign(btnAnterior.style, {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px 20px',
            backgroundColor: 'var(--cor-destaque)',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: paginaAtual <= 0 ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            minWidth: '100px',
            opacity: paginaAtual <= 0 ? '0.5' : '1'
        });

        btnAnterior.addEventListener('click', () => {
            console.log("Botão anterior clicado");
            if (paginaAtual > 0) {
                paginaAtual--;
                if (window.AppState) AppState.setPaginaPortfolio(paginaAtual);
                renderizarCards();
            }
        });

        // Botão Próximo
        const btnProximo = document.createElement('button');
        btnProximo.className = 'portfolio-nav-btn proximo';
        btnProximo.innerHTML = 'Próximo <i class="fas fa-chevron-right"></i>';
        btnProximo.disabled = paginaAtual >= totalPaginas - 1;

        // Estilos inline para o botão próximo
        Object.assign(btnProximo.style, {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px 20px',
            backgroundColor: 'var(--cor-destaque)',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: paginaAtual >= totalPaginas - 1 ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            minWidth: '100px',
            opacity: paginaAtual >= totalPaginas - 1 ? '0.5' : '1'
        });

        btnProximo.addEventListener('click', () => {
            console.log("Botão próximo clicado");
            if (paginaAtual < totalPaginas - 1) {
                paginaAtual++;
                if (window.AppState) AppState.setPaginaPortfolio(paginaAtual);
                renderizarCards();
            }
        });

        // Adicionar elementos ao container de navegação
        navegacao.appendChild(btnAnterior);
        navegacao.appendChild(btnProximo);

        // Obter o conteúdo da seção portfolio
        const conteudoSection = portfolioSection.querySelector('.conteudo-section');

        // Inserir a navegação diretamente após o container de cards
        if (conteudoSection && domCache.portfolioContainer) {
            conteudoSection.appendChild(navegacao);
            console.log("Botões de navegação inseridos diretamente após os cards");
        } else {
            console.error("Não foi possível encontrar o local adequado para inserir os botões");
            // Fallback: adicionar ao final da seção portfolio
            portfolioSection.appendChild(navegacao);
            console.log("Botões inseridos no final da seção portfolio (fallback)");
        }

        console.log("Verificação final da navegação:");
        setTimeout(() => {
            const navInserida = document.querySelector('.portfolio-navegacao');
            if (navInserida) {
                console.log("✅ Navegação inserida com sucesso!");
            } else {
                console.error("❌ Falha ao inserir navegação");
            }
        }, 0);
    }

    // Ajustar ao redimensionar a janela
    window.addEventListener('resize', () => {
        const novoProjetosPorPagina = getProjetosPorPagina();
        if (novoProjetosPorPagina !== projetosPorPagina) {
            projetosPorPagina = novoProjetosPorPagina;
            window.projetosPorPagina = projetosPorPagina;
            renderizarCards();
        }
    });
}

// Exportar inicializarPortfolio para o escopo global para garantir que o fallback funcione
window.inicializarPortfolio = inicializarPortfolio;

// Função para inicializar a navegação das seções de experiência (cursos e formações)
function inicializarNavegacaoExperiencias() {
    console.log("Inicializando navegação das experiências (cursos e formações)");

    // Selecionando todos os botões de navegação das experiências
    const botoes = document.querySelectorAll('.experiencia-nav-btn');

    botoes.forEach(botao => {
        botao.addEventListener('click', () => {
            // Obter o container alvo (formacoes-container ou cursos-container)
            const targetContainerId = botao.getAttribute('data-target');
            const container = document.getElementById(targetContainerId);

            if (!container) {
                console.error(`Container ${targetContainerId} não encontrado`);
                return;
            }

            // Obter as páginas dentro do container
            const paginas = container.querySelectorAll('.experiencia-pagina');
            if (paginas.length <= 1) {
                console.log("Apenas uma página disponível, navegação desnecessária");
                return;
            }

            // Encontrar a página atual (com classe 'ativo')
            let paginaAtualIndex = 0;
            paginas.forEach((pagina, index) => {
                if (pagina.classList.contains('ativo')) {
                    paginaAtualIndex = index;
                }
            });

            // Determinar a próxima página com base na direção (anterior ou próximo)
            const isAnterior = botao.classList.contains('anterior');
            let novaPaginaIndex = isAnterior ? paginaAtualIndex - 1 : paginaAtualIndex + 1;

            // Garantir que o índice esteja dentro dos limites
            if (novaPaginaIndex < 0) novaPaginaIndex = 0;
            if (novaPaginaIndex >= paginas.length) novaPaginaIndex = paginas.length - 1;

            // Se não houver mudança, não fazer nada
            if (novaPaginaIndex === paginaAtualIndex) {
                return;
            }

            // Remover classe 'ativo' de todas as páginas
            paginas.forEach(pagina => pagina.classList.remove('ativo'));

            // Adicionar classe 'ativo' à nova página
            paginas[novaPaginaIndex].classList.add('ativo');

            // Atualizar estado dos botões de navegação
            const botoesContainer = botao.parentElement;
            const botaoAnterior = botoesContainer.querySelector('.anterior');
            const botaoProximo = botoesContainer.querySelector('.proximo');

            // Desabilitar/habilitar botões conforme necessário
            if (botaoAnterior) {
                botaoAnterior.disabled = novaPaginaIndex === 0;
            }

            if (botaoProximo) {
                botaoProximo.disabled = novaPaginaIndex === paginas.length - 1;
            }

            console.log(`Navegação em ${targetContainerId}: movido para página ${novaPaginaIndex + 1} de ${paginas.length}`);
        });
    });

    console.log("Navegação das experiências inicializada");
}

// Configurar eventos de teclado
function configurarEventosTeclado() {
    console.log("Configurando eventos de teclado");

    // Fechar sidebar com a tecla Esc
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (domCache.sidebar && domCache.sidebar.classList.contains('open')) {
                handlers.toggleSidebar();
            }
            if (domCache.menuIdiomas) {
                domCache.menuIdiomas.classList.remove('ativo');
            }
        }
    });

    // Navegação entre links do sidebar com teclas de seta
    const sidebarLinks = domCache.sidebar ? domCache.sidebar.querySelectorAll('a') : [];
    sidebarLinks.forEach((link, index) => {
        link.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                // Calcular o próximo índice
                let nextIndex = index + (event.key === 'ArrowDown' ? 1 : -1);
                if (nextIndex < 0) nextIndex = sidebarLinks.length - 1;
                if (nextIndex >= sidebarLinks.length) nextIndex = 0;

                // Focar no próximo link
                sidebarLinks[nextIndex].focus();
            }
        });
    });

    console.log("Eventos de teclado configurados");
}

// Função para copiar texto para a área de transferência
function copiarTexto(texto) {
    navigator.clipboard.writeText(texto).then(() => {
        console.log('Texto copiado para a área de transferência:', texto);
    }).catch(err => {
        console.error('Erro ao copiar texto:', err);
    });
}

// Exibir mensagem de sucesso ao copiar
function exibirMensagemCopiar() {
    const mensagem = document.createElement('div');
    mensagem.className = 'mensagem-copiar';
    mensagem.innerText = 'Texto copiado!';
    document.body.appendChild(mensagem);

    setTimeout(() => {
        mensagem.classList.add('mostrar');
    }, 10);

    setTimeout(() => {
        mensagem.classList.remove('mostrar');
        setTimeout(() => {
            document.body.removeChild(mensagem);
        }, 300);
    }, 2000);
}

// Configurar botão de copiar
function configurarBotaoCopiar() {
    const btnCopiar = document.getElementById('btn-copiar-email');
    if (!btnCopiar) return;

    btnCopiar.addEventListener('click', () => {
        copiarTexto('mateus.mg@outlook.com');
        exibirMensagemCopiar();
    });
}

// Inicializar função de copiar
configurarBotaoCopiar();

// Função para configurar o formulário de contato
function configurarFormularioContato() {
    console.log("Configurando formulário de contato");

    if (!domCache.form) {
        console.warn("Formulário de contato não encontrado");
        return;
    }

    domCache.form.addEventListener('submit', async function (e) {
        e.preventDefault();

        console.log("Formulário de contato enviado");

        // Obter dados do formulário
        const nome = document.getElementById('nome').value;
        const email = document.getElementById('email').value;
        const assunto = document.getElementById('assunto').value;
        const mensagem = document.getElementById('mensagem').value;

        // Armazenar dados do último contato para feedback
        localStorage.setItem('ultimo_contato_nome', nome);
        localStorage.setItem('ultimo_contato_email', email);
        localStorage.setItem('ultimo_assunto', assunto);

        // Simulação de envio de formulário
        const btnSubmit = document.querySelector('#formulario-contato button[type="submit"]');
        const btnTextOriginal = btnSubmit.innerHTML;

        try {
            // Mudar texto do botão para indicar envio
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

            // Simular tempo de processamento no servidor
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Simulação de sucesso
            console.log("Formulário enviado com sucesso");

            // Limpar campos
            domCache.form.reset();

            // Redirecionar com parâmetro de sucesso - isto mostrará um popup via gerenciarFeedbackPopup
            window.location.href = "?enviado=sucesso";

        } catch (error) {
            console.error("Erro ao enviar formulário:", error);
            alert("Erro ao enviar formulário. Por favor, tente novamente.");

            // Restaurar botão
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = btnTextOriginal;
        }
    });

    console.log("Formulário de contato configurado");
}

// Função global para navegação do portfólio (chamada pelos botões HTML)
window.navegarPortfolio = function (direcao) {
    console.log(`Botão de navegação ${direcao} clicado`);

    // Verificar que temos acesso aos projetos
    if (!window.projetosPortfolio) {
        console.error("Array de projetos não encontrado");
        return;
    }

    // Usar variáveis do escopo window para garantir que estejam acessíveis
    // após a minificação
    const projetos = window.projetosPortfolio[window.idiomaAtual];

    if (!projetos || projetos.length === 0) {
        console.error("Nenhum projeto encontrado para o idioma atual:", window.idiomaAtual);
        return;
    }

    const totalPaginas = Math.ceil(projetos.length / window.projetosPorPagina);

    // Navegar para a página apropriada
    if (direcao === 'anterior' && window.paginaAtual > 0) {
        window.paginaAtual--;
        if (window.AppState) window.AppState.setPaginaPortfolio(window.paginaAtual);
    } else if (direcao === 'proximo' && window.paginaAtual < totalPaginas - 1) {
        window.paginaAtual++;
        if (window.AppState) window.AppState.setPaginaPortfolio(window.paginaAtual);
    } else {
        console.log(`Navegação ${direcao} não possível: página atual = ${window.paginaAtual}, total de páginas = ${totalPaginas}`);
        return;
    }

    // Atualizar botões conforme necessidade
    const btnAnterior = document.querySelector('.portfolio-navegacao .anterior');
    const btnProximo = document.querySelector('.portfolio-navegacao .proximo');

    if (btnAnterior) {
        btnAnterior.disabled = window.paginaAtual <= 0;
        btnAnterior.style.opacity = window.paginaAtual <= 0 ? '0.5' : '1';
        btnAnterior.style.cursor = window.paginaAtual <= 0 ? 'not-allowed' : 'pointer';
    }

    if (btnProximo) {
        btnProximo.disabled = window.paginaAtual >= totalPaginas - 1;
        btnProximo.style.opacity = window.paginaAtual >= totalPaginas - 1 ? '0.5' : '1';
        btnProximo.style.cursor = window.paginaAtual >= totalPaginas - 1 ? 'not-allowed' : 'pointer';
    }

    // Garantir que os botões são visíveis
    const navegacao = document.querySelector('.portfolio-navegacao');
    if (navegacao) {
        navegacao.style.display = 'flex';
        navegacao.style.visibility = 'visible';
        navegacao.style.opacity = '1';
    }

    // Renderizar os novos cards
    if (typeof window.renderizarCards === 'function') {
        window.renderizarCards();
    } else {
        console.log("Função renderizarCards não está acessível, tentando inicializarPortfolio");
        if (typeof window.inicializarPortfolio === 'function') {
            window.inicializarPortfolio();
        }
    }
};

// Ao carregar a página, aplica classe para transição de entrada
window.addEventListener('load', () => {
    document.body.classList.add('fade-in');
});

console.log("Script principal carregado com sucesso");