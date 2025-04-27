// Variáveis globais importantes
let sidebar;
let toggleButton;
let idiomaAtualProjetos = 'pt';

// Garantir que código crítico é executado antes de referenciar os elementos
document.addEventListener('DOMContentLoaded', function () {
    console.log("Inicializando o site...");

    // Inicializar elementos importantes do DOM
    sidebar = document.getElementById('sidebar');
    toggleButton = document.getElementById('toggle-button');

    if (!sidebar || !toggleButton) {
        console.error('Elementos críticos não encontrados: sidebar ou toggleButton');
        return;
    }

    console.log("Elementos críticos inicializados com sucesso");

    // Configurar botão toggle
    toggleButton.addEventListener('click', function () {
        console.log("Botão toggle clicado");
        toggleSidebar();
    });

    // Garantir que o overlay existe
    const overlay = criarOverlaySidebar();

    // Iniciar animações
    iniciarAnimacaoSections();

    // Configurar seletor de idiomas
    configurarSeletorIdiomas();

    // Inicializar carrosséis
    inicializarCarrosseis();

    // Inicializar o portfólio
    inicializarPortfolio();

    // Configurar demais eventos da UI
    configurarOutrosEventos();

    // Verificar se há um idioma salvo no localStorage
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
        if (sidebar) {
            sidebar.classList.remove('open');
            overlay.classList.remove('ativo');
            if (toggleButton) {
                toggleButton.setAttribute('aria-expanded', 'false');
                toggleButton.innerHTML = `<span class="icone-menu entrando">☰</span>`;
            }
        }
    });

    return overlay;
}

// Função para abrir/fechar o sidebar
function toggleSidebar() {
    console.log("Executando toggleSidebar()");
    if (!sidebar) {
        console.error("Sidebar não encontrado");
        return;
    }

    const overlay = document.getElementById('sidebar-overlay');

    // Toggle das classes
    sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('ativo');

    // Atualizar atributos ARIA
    const isOpen = sidebar.classList.contains('open');
    sidebar.setAttribute('aria-hidden', !isOpen);
    toggleButton.setAttribute('aria-expanded', isOpen);

    // Atualizar ícone
    atualizarIconeSidebar(isOpen);

    console.log("Sidebar " + (isOpen ? "aberto" : "fechado"));
}

// Função para atualizar o ícone do botão toggle
function atualizarIconeSidebar(aberto) {
    if (!toggleButton) return;

    const icone = aberto ? '✖' : '☰';
    toggleButton.classList.add('trocando');

    const iconeAtual = toggleButton.querySelector('.icone-menu');
    if (iconeAtual) iconeAtual.classList.remove('entrando');

    setTimeout(() => {
        toggleButton.innerHTML = `<span class="icone-menu entrando">${icone}</span>`;
        setTimeout(() => {
            const novoIcone = toggleButton.querySelector('.icone-menu');
            if (novoIcone) novoIcone.classList.add('entrando');
            toggleButton.classList.remove('trocando');
        }, 10);
    }, 140);
}

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

    // Fechar menu ao pressionar ESC
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            menuIdiomas.classList.remove('ativo');
        }
    });

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

    // Adicionar suporte a navegação por teclado
    document.addEventListener('keydown', (e) => {
        const focusIsInIdiomasCarousel = document.activeElement.closest('.idiomas-carrossel');
        const focusIsInSkillsCarousel = document.activeElement.closest('.skills-carrossel');

        if (focusIsInIdiomasCarousel) {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                idiomasCarrossel.mostrar(idiomasCarrossel.getAtual() - 1);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                idiomasCarrossel.mostrar(idiomasCarrossel.getAtual() + 1);
            }
        } else if (focusIsInSkillsCarousel) {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                skillsCarrossel.mostrar(skillsCarrossel.getAtual() - 1);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                skillsCarrossel.mostrar(skillsCarrossel.getAtual() + 1);
            }
        }
    });

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
    if (sidebar) {
        const sidebarLinks = sidebar.querySelectorAll('a');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault(); // Previne o comportamento padrão

                // Fecha o menu lateral
                sidebar.classList.remove('open');
                document.getElementById('sidebar-overlay')?.classList.remove('ativo');
                sidebar.setAttribute('aria-hidden', true);
                toggleButton.setAttribute('aria-expanded', false);
                atualizarIconeSidebar(false);

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

    // Tecla ESC para fechar sidebar
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar) {
            sidebar.classList.remove('open');
            document.getElementById('sidebar-overlay')?.classList.remove('ativo');
            if (toggleButton) {
                toggleButton.setAttribute('aria-expanded', false);
                atualizarIconeSidebar(false);
            }
        }
    });

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

    const portfolioContainer = document.querySelector('.portfolio-container');
    if (!portfolioContainer) {
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
                },
                {
                    id: "dashboard_rh2",
                    titulo: 'Dashboard de RH',
                    imagem: 'img/rh.jpg',
                    alt: 'Dashboard de RH com indicadores de turnover, absenteísmo e satisfação dos colaboradores',
                    link: 'https://github.com/mateus-mg/dashboard-rh',
                    descricao: 'Visualização de indicadores de RH em dashboard dinâmico. Permite análise de turnover, absenteísmo e satisfação dos colaboradores.',
                    tecnologias: ['Power BI', 'Excel', 'RH']
                },
                {
                    id: "previsao_casas2",
                    titulo: 'Previsão de Preços de Casas (Python)',
                    imagem: 'img/preços-casas.jpg',
                    alt: 'Gráfico de dispersão de preços de casas previsto por modelo de machine learning',
                    link: 'https://github.com/mateus-mg/house-prices-prediction',
                    descricao: 'Modelo de machine learning para prever preços de casas com Python. Utiliza regressão, análise exploratória e validação cruzada.',
                    tecnologias: ['Python', 'Pandas', 'Scikit-learn']
                },
                {
                    id: "dashboard_rh3",
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
        portfolioContainer.innerHTML = '<p class="portfolio-sem-projetos">Nenhum projeto disponível no momento.</p>';
        return;
    }

    // Configuração de paginação
    const projetosPorPagina = 3;
    let paginaAtual = 0;

    // Função para renderizar os projetos
    function renderizarCards() {
        portfolioContainer.innerHTML = '';
        portfolioContainer.style.opacity = '0';

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

            // WebP path
            const webpPath = projeto.imagem.replace('img/', 'img/webp/').replace(/\.(jpg|jpeg|png|gif)$/, '.webp');

            // Template do card
            card.innerHTML = `
                <div class="portfolio-image-container">
                    <picture>
                        <source srcset="${webpPath}" type="image/webp" fetchpriority="low">
                        <img src="${projeto.imagem}" alt="${projeto.alt}" loading="lazy" fetchpriority="low">
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

            portfolioContainer.appendChild(card);
        });

        // Fade in dos cards
        setTimeout(() => {
            portfolioContainer.style.opacity = '1';
        }, 50);

        // Renderizar navegação
        renderizarBotoesNavegacao();
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
            if (paginaAtual > 0) {
                paginaAtual--;
                renderizarCards();
            }
        });

        // Botão Próximo
        const btnProximo = document.createElement('button');
        btnProximo.className = 'portfolio-nav-btn proximo';
        btnProximo.innerHTML = 'Próximo <i class="fas fa-chevron-right"></i>';
        btnProximo.disabled = paginaAtual >= totalPaginas - 1;
        btnProximo.addEventListener('click', () => {
            console.log("Botão próximo do portfólio clicado");
            if (paginaAtual < totalPaginas - 1) {
                paginaAtual++;
                renderizarCards();
            }
        });

        navegacao.appendChild(btnAnterior);
        navegacao.appendChild(btnProximo);

        // Adicionar navegação após o container
        portfolioContainer.parentNode.insertBefore(navegacao, portfolioContainer.nextSibling);
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
    adicionarSwipe(portfolioContainer,
        () => {
            const totalPaginas = Math.ceil(window.projetosPortfolio[idiomaAtualProjetos].length / projetosPorPagina);
            if (paginaAtual < totalPaginas - 1) {
                paginaAtual++;
                renderizarCards();
            }
        },
        () => {
            if (paginaAtual > 0) {
                paginaAtual--;
                renderizarCards();
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

    // Salvar o idioma selecionado no localStorage
    localStorage.setItem('idioma', idioma);

    // Atualizar o idioma atual dos projetos
    idiomaAtualProjetos = idioma;

    // Carregar arquivo de tradução
    fetch(`i18n/${idioma}.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao carregar arquivo de tradução: ${response.status}`);
            }
            return response.json();
        })
        .then(traducoes => {
            console.log("Arquivo de tradução carregado com sucesso:", idioma);

            // Título da página
            document.title = traducoes.tituloDocumento;

            // Meta descrição
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) metaDesc.setAttribute('content', traducoes.metaDescricao);

            // Navegação
            const links = document.querySelectorAll('nav.sidebar a');
            if (links.length > 0) {
                links[0].textContent = traducoes.nav.sobre;
                links[1].textContent = traducoes.nav.experiencias;
                links[2].textContent = traducoes.nav.portfolio;
                links[3].textContent = traducoes.nav.servicos;
                links[4].textContent = traducoes.nav.contato;
            }

            // Cabeçalho
            const header = document.querySelector('header');
            if (header) {
                const paragrafos = header.querySelectorAll('p');
                if (paragrafos.length > 0) {
                    paragrafos[0].textContent = traducoes.header.welcome;
                    if (paragrafos.length > 1) {
                        paragrafos[1].textContent = traducoes.header.role;
                    }
                }

                const h1 = header.querySelector('h1');
                if (h1) {
                    h1.textContent = traducoes.header.name;
                }
            }

            // Títulos de seções
            const titulosSecoes = document.querySelectorAll('.titulo-section');
            if (titulosSecoes.length > 0) {
                titulosSecoes[0].textContent = traducoes.sobre;
                if (titulosSecoes.length > 1) titulosSecoes[1].textContent = traducoes.experiencias;
                if (titulosSecoes.length > 2) titulosSecoes[2].textContent = traducoes.portfolio;
                if (titulosSecoes.length > 3) titulosSecoes[3].textContent = traducoes.servicos;
                if (titulosSecoes.length > 4) titulosSecoes[4].textContent = traducoes.contato;
            }

            // Descrições de seções
            const sobreDesc = document.querySelector('#sobre .conteudo-section > p');
            if (sobreDesc) {
                sobreDesc.textContent = traducoes.sobre_descricao;
            }

            const expDesc = document.querySelector('#experiencias .conteudo-section > p');
            if (expDesc) {
                expDesc.textContent = traducoes.experiencias_descricao;
            }

            const portfolioDesc = document.querySelector('#portfolio .conteudo-section > p');
            if (portfolioDesc) {
                portfolioDesc.textContent = traducoes.portfolio_descricao;
            }

            const servicosDesc = document.querySelector('#servicos .conteudo-section > p');
            if (servicosDesc) {
                servicosDesc.textContent = traducoes.servicos_descricao;
            }

            const contatoDesc = document.querySelector('#contato .conteudo-section > p');
            if (contatoDesc) {
                contatoDesc.textContent = traducoes.contato_descricao;
            }

            // Botões
            const botaoContato = document.querySelector('.botao.fale-comigo');
            if (botaoContato) {
                botaoContato.textContent = traducoes.botoes.faleComigo.traducao;
            }

            const botaoCV = document.querySelector('.botao[download]');
            if (botaoCV) {
                botaoCV.textContent = traducoes.botoes.baixeCV.traducao;
            }

            const botaoEnviar = document.querySelector('#botao-enviar');
            if (botaoEnviar) {
                botaoEnviar.textContent = traducoes.botoes.enviarMensagem.traducao;
            }

            // Elementos com atributo data-i18n
            document.querySelectorAll('[data-i18n]').forEach(elemento => {
                const chave = elemento.getAttribute('data-i18n');

                // Navegar pela estrutura de chaves usando o caminho da chave
                const caminhoChaves = chave.split('.');
                let valor = traducoes;

                // Percorrer caminho de chaves para encontrar o valor final
                for (const key of caminhoChaves) {
                    if (valor && valor[key] !== undefined) {
                        valor = valor[key];
                    } else {
                        console.warn(`Chave de tradução não encontrada: ${chave}`);
                        valor = null;
                        break;
                    }
                }

                // Se encontrou um valor e é uma string, aplicar tradução
                if (valor !== null && typeof valor === 'string') {
                    elemento.textContent = valor;
                }
                // Se for um objeto com propriedade "titulo" (para cards de serviços)
                else if (valor !== null && typeof valor === 'object' && valor.titulo) {
                    elemento.textContent = valor.titulo;
                }
            });

            // Formulário de contato
            document.querySelectorAll('[data-i18n^="formulario."]').forEach(elemento => {
                const chave = elemento.getAttribute('data-i18n');
                const partes = chave.split('.');
                if (partes.length >= 2) {
                    const campoFormulario = partes[1];
                    if (traducoes.formulario && traducoes.formulario[campoFormulario]) {
                        elemento.textContent = traducoes.formulario[campoFormulario];
                    }
                }
            });

            // Traduzir opções do select
            document.querySelectorAll('option[data-i18n^="formulario."]').forEach(opcao => {
                const chave = opcao.getAttribute('data-i18n');
                const partes = chave.split('.');
                if (partes.length >= 2) {
                    const campoFormulario = partes[1];
                    if (traducoes.formulario && traducoes.formulario[campoFormulario]) {
                        opcao.textContent = traducoes.formulario[campoFormulario];
                    }
                }
            });

            // Cards de serviços
            document.querySelectorAll('[data-i18n^="servicos_cards."]').forEach(elemento => {
                const chave = elemento.getAttribute('data-i18n');
                const partes = chave.split('.');
                if (partes.length >= 3) {
                    const cardServico = partes[1];
                    const propriedade = partes[2];
                    if (traducoes.servicos_cards &&
                        traducoes.servicos_cards[cardServico] &&
                        traducoes.servicos_cards[cardServico][propriedade]) {
                        elemento.textContent = traducoes.servicos_cards[cardServico][propriedade];
                    }
                }
            });

            // Carregar projetos do idioma selecionado
            if (traducoes.projetos) {
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
                    window.renderizarPortfolio();
                } else {
                    console.warn("Função renderizarPortfolio não encontrada, reinicializando portfólio");
                    inicializarPortfolio();
                }
            } else {
                console.warn("Nenhum projeto encontrado para o idioma:", idioma);
            }

            // Marcar o botão do idioma atual como ativo
            document.querySelectorAll('.seletor-idioma').forEach(botao => {
                const botaoIdioma = botao.getAttribute('data-idioma');
                if (botaoIdioma === idioma) {
                    botao.classList.add('ativo');
                    console.log(`Botão de idioma ${idioma} marcado como ativo`);
                } else {
                    botao.classList.remove('ativo');
                }
            });

            console.log("Tradução concluída para:", idioma);
        })
        .catch(error => {
            console.error('Erro ao traduzir a página:', error);
            alert(`Erro ao carregar as traduções para ${idioma}. Por favor, tente novamente.`);
        });
}