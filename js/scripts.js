// Função para criar os carrosséis
function criarCarrossel(config) {
    const barras = document.querySelectorAll(config.barraSeletor);
    const btnAnterior = document.querySelector(config.btnAnteriorSeletor);
    const btnProximo = document.querySelector(config.btnProximoSeletor);
    let indiceAtual = 0;

    if (!barras.length || !btnAnterior || !btnProximo) {
        console.warn('Elementos do carrossel não encontrados');
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
    }

    // Adicionar event listeners para os botões
    btnAnterior.addEventListener('click', () => mostrar(indiceAtual - 1));
    btnProximo.addEventListener('click', () => mostrar(indiceAtual + 1));

    return {
        mostrar,
        getAtual: () => indiceAtual
    };
}

// Função para criar overlay do sidebar se não existir
function criarOverlaySidebar() {
    let overlay = document.getElementById('sidebar-overlay');

    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'sidebar-overlay';
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }

    return overlay;
}

// Função otimizada para animação das seções
function iniciarAnimacaoSections() {
    const sections = document.querySelectorAll('section');

    // Primeiro, garantimos que as seções sejam visíveis se não houver suporte a IntersectionObserver
    if (!('IntersectionObserver' in window)) {
        sections.forEach(section => {
            section.classList.add('visivel');
        });
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Adicionando a classe 'visivel' para ativar a animação via CSS
                entry.target.classList.add('visivel');

                // Desregistrar observer após a animação
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        // Performance: Adicionar rootMargin para carregar seções ligeiramente antes de chegarem à viewport
        rootMargin: '50px'
    });

    sections.forEach(section => {
        observer.observe(section);
    });
}

// Função para animações suaves
function animacaoSuave(elemento, propriedade, valorInicial, valorFinal, duracao = 400) {
    const inicio = performance.now();
    const mudanca = valorFinal - valorInicial;

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3); // Curva de Bezier simplificada
    }

    function animar(tempo) {
        const decorrido = tempo - inicio;
        const fracao = Math.min(decorrido / duracao, 1);
        const valorAtual = valorInicial + mudanca * easeOutCubic(fracao);

        elemento.style[propriedade] = valorAtual + (typeof valorFinal === 'number' ? 'px' : '');

        if (fracao < 1) {
            requestAnimationFrame(animar);
        }
    }

    requestAnimationFrame(animar);
}

// Destacar item de menu ativo durante scroll
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

// Melhorar tratamento de erros no formulário
function tratarErroFormulario(error, mensagemContainer) {
    console.error('Erro no envio do formulário:', error);

    // Mensagem de erro mais detalhada
    let mensagemErro = 'Erro de conexão. Por favor, verifique sua internet e tente novamente.';

    if (error.message) {
        if (error.message.includes('timeout')) {
            mensagemErro = 'Tempo limite excedido. O servidor está demorando para responder.';
        } else if (error.message.includes('NetworkError')) {
            mensagemErro = 'Erro de rede. Verifique sua conexão com a internet.';
        }
    }

    mensagemContainer.innerHTML = `
        <div class="form-mensagem erro">
            <i class="fas fa-exclamation-circle"></i>
            ${mensagemErro}
        </div>
    `;
}

// ------- Códigos originais com ajustes -------

// Verifica se o navegador suporta WebP
let suportaWebP = false;
(function () {
    const img = new Image();
    img.onload = function () {
        suportaWebP = (img.width > 0) && (img.height > 0);
        // Atualiza as imagens já renderizadas após verificar suporte
        if (suportaWebP) {
            atualizarImagensParaWebP();
        }
    };
    img.onerror = function () {
        suportaWebP = false;
    };
    img.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
})();

// Converte caminhos de imagens para WebP quando suportado
function obterCaminhoImagem(caminhoOriginal) {
    if (!suportaWebP) return caminhoOriginal;

    // Extrai o nome e a extensão do arquivo
    const regexNomeArquivo = /img\/(.*)\.(jpg|jpeg|png|gif)$/i;
    const matches = caminhoOriginal.match(regexNomeArquivo);

    if (matches) {
        // Substitui pelo caminho WebP
        return `img/webp/${matches[1]}.webp`;
    }

    return caminhoOriginal;
}

// Atualiza todas as imagens já renderizadas para WebP
function atualizarImagensParaWebP() {
    document.querySelectorAll('img').forEach(img => {
        const src = img.getAttribute('src');
        if (src && (src.includes('.jpg') || src.includes('.jpeg') || src.includes('.png') || src.includes('.gif'))) {
            img.setAttribute('src', obterCaminhoImagem(src));
        }
    });
}

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
        sidebar.classList.remove('open');
        document.getElementById('sidebar-overlay')?.classList.remove('ativo');
        atualizarIconeSidebar(false);
    }
});

const toggleButton = document.getElementById('toggle-button');
const sidebar = document.getElementById('sidebar');
const sidebarLinks = sidebar.querySelectorAll('a');

// Adicionar atributos ARIA para acessibilidade
sidebar.setAttribute('aria-hidden', !sidebar.classList.contains('open'));
toggleButton.setAttribute('aria-expanded', sidebar.classList.contains('open'));

function toggleSidebar() {
    sidebar.classList.toggle('open');
    const overlay = document.getElementById('sidebar-overlay');
    overlay?.classList.toggle('ativo');

    // Atualizar atributos ARIA
    const isOpen = sidebar.classList.contains('open');
    sidebar.setAttribute('aria-hidden', !isOpen);
    toggleButton.setAttribute('aria-expanded', isOpen);

    const iconeAtual = toggleButton.querySelector('.icone-menu');
    if (iconeAtual) {
        toggleButton.classList.add('trocando');
        iconeAtual.classList.remove('entrando');
        setTimeout(() => {
            const icone = isOpen ? '✖' : '☰';
            toggleButton.innerHTML = `<span class="icone-menu entrando">${icone}</span>`;
            setTimeout(() => {
                const novoIcone = toggleButton.querySelector('.icone-menu');
                if (novoIcone) novoIcone.classList.add('entrando');
                toggleButton.classList.remove('trocando');
            }, 10);
        }, 140);
    }
}

const iconeInicial = sidebar.classList.contains('open') ? '✖' : '☰';
toggleButton.innerHTML = `<span class="icone-menu entrando">${iconeInicial}</span>`;

document.addEventListener('click', (e) => {
    const isClickInsideSidebar = sidebar.contains(e.target);
    const isClickOnButton = toggleButton.contains(e.target);

    // Verifica se o menu está aberto antes de tentar fechá-lo
    if (sidebar.classList.contains('open') && !isClickInsideSidebar && !isClickOnButton) {
        sidebar.classList.remove('open');
        document.getElementById('sidebar-overlay')?.classList.remove('ativo');

        // Atualizar atributos ARIA
        sidebar.setAttribute('aria-hidden', true);
        toggleButton.setAttribute('aria-expanded', false);

        const iconeAtual = toggleButton.querySelector('.icone-menu');
        if (iconeAtual) {
            toggleButton.classList.add('trocando');
            iconeAtual.classList.remove('entrando');
            setTimeout(() => {
                toggleButton.innerHTML = `<span class="icone-menu entrando">☰</span>`;
                setTimeout(() => {
                    const novoIcone = toggleButton.querySelector('.icone-menu');
                    if (novoIcone) novoIcone.classList.add('entrando');
                    toggleButton.classList.remove('trocando');
                }, 10);
            }, 140);
        }
    }
});

sidebarLinks.forEach(link => {
    link.addEventListener('click', () => {
        sidebar.classList.remove('open');
        document.getElementById('sidebar-overlay')?.classList.remove('ativo');

        // Atualizar atributos ARIA
        sidebar.setAttribute('aria-hidden', true);
        toggleButton.setAttribute('aria-expanded', false);
    });
});

// Substituir código duplicado do carrossel com a função genérica
const carrosselIdiomas = criarCarrossel({
    barraSeletor: '.idioma-barra',
    btnAnteriorSeletor: '.idiomas-carrossel .carrossel-btn.anterior',
    btnProximoSeletor: '.idiomas-carrossel .carrossel-btn.proximo'
});

const carrosselSkills = criarCarrossel({
    barraSeletor: '.skills-barra',
    btnAnteriorSeletor: '.skills-carrossel .carrossel-btn.anterior',
    btnProximoSeletor: '.skills-carrossel .carrossel-btn.proximo'
});

// Adicionar suporte a navegação por teclado
document.addEventListener('keydown', (e) => {
    // Verificar se o foco está dentro de um dos carrosséis
    const focusIsInIdiomasCarousel = document.activeElement.closest('.idiomas-carrossel');
    const focusIsInSkillsCarousel = document.activeElement.closest('.skills-carrossel');

    if (focusIsInIdiomasCarousel) {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            carrosselIdiomas.mostrar(carrosselIdiomas.getAtual() - 1);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            carrosselIdiomas.mostrar(carrosselIdiomas.getAtual() + 1);
        }
    } else if (focusIsInSkillsCarousel) {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            carrosselSkills.mostrar(carrosselSkills.getAtual() - 1);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            carrosselSkills.mostrar(carrosselSkills.getAtual() + 1);
        }
    }
});

const btnTopo = document.getElementById('btn-topo');
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

// Função para determinar quantos cards mostrar por aba baseado no tamanho da tela
function getCardsPorAba() {
    if (window.innerWidth < 600) return 1;
    if (window.innerWidth < 900) return 2;
    return 3;
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

// Definir projetos com suporte a múltiplos idiomas
let projetosPortfolio = {
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
    // Outros idiomas serão carregados dinamicamente a partir dos arquivos de tradução
    en: [],
    es: []
};

// Idioma atual dos projetos
let idiomaAtualProjetos = 'pt';

document.addEventListener('DOMContentLoaded', function () {
    // Iniciar animações das seções
    iniciarAnimacaoSections();

    // Criar overlay do sidebar se necessário
    const overlay = criarOverlaySidebar();

    // Verificar se há um idioma salvo no localStorage
    const idiomaArmazenado = localStorage.getItem('idioma');
    if (idiomaArmazenado) {
        traduzirPagina(idiomaArmazenado);
    }

    // Adicionar event listeners para os botões de idioma
    document.querySelectorAll('.seletor-idioma').forEach(botao => {
        botao.addEventListener('click', function () {
            const idioma = this.getAttribute('data-idioma');
            traduzirPagina(idioma);
        });
    });

    const portfolioContainer = document.querySelector('.portfolio-container');
    if (portfolioContainer) {
        // Configuração de paginação
        const projetosPorPagina = 3;
        let paginaAtual = 0;
        let totalPaginas = Math.ceil(projetosPortfolio.pt.length / projetosPorPagina);

        // Função otimizada para renderizar os cards com carregamento progressivo
        function renderizarProjetos(projetosFiltrados) {
            // Usar projetos filtrados se fornecidos, caso contrário usar todos
            const projsParaRenderizar = projetosFiltrados || projetosPortfolio[idiomaAtualProjetos];

            // Limpa o container
            portfolioContainer.innerHTML = '';

            // Calcula índices de início e fim para a página atual
            const inicio = paginaAtual * projetosPorPagina;
            const fim = Math.min(inicio + projetosPorPagina, projsParaRenderizar.length);

            // Seleciona os projetos da página atual
            const projetosAtuais = projsParaRenderizar.slice(inicio, fim);

            // Atualiza o total de páginas (pode mudar se for um conjunto filtrado)
            totalPaginas = Math.ceil(projsParaRenderizar.length / projetosPorPagina);

            // Usar requestAnimationFrame para renderizar os cards progressivamente
            // e evitar o bloqueio da UI
            let index = 0;

            function renderizarProximoCard() {
                if (index >= projetosAtuais.length) {
                    // Todos os cards foram renderizados, agora renderiza a navegação
                    renderizarNavegacao();
                    return;
                }

                const projeto = projetosAtuais[index];
                const card = document.createElement('div');
                card.className = 'portfolio-card';
                // Adicionar data-id para as regras CSS específicas do CloudFlare Pages
                card.setAttribute('data-id', projeto.id);

                // Cria as tags de tecnologias
                const tagsHTML = projeto.tecnologias.map(tech =>
                    `<span class="portfolio-tag">${tech}</span>`
                ).join('');

                // Determinar o texto do botão baseado no idioma atual
                let textoBotao = 'Ver Projeto';
                if (idiomaAtualProjetos === 'en' && projetosPortfolio.en.length > 0) {
                    textoBotao = 'View Project';
                } else if (idiomaAtualProjetos === 'es' && projetosPortfolio.es.length > 0) {
                    textoBotao = 'Ver Proyecto';
                }

                // Implementando a abordagem com picture que funcionou no teste
                const webpPath = projeto.imagem.replace('img/', 'img/webp/').replace(/\.(jpg|jpeg|png|gif)$/, '.webp');

                // Importante: Usar fetchpriority="low" para imagens e loading="lazy"
                const pictureHTML = `<div class="portfolio-image-container">
                    <picture>
                        <source srcset="${webpPath}" type="image/webp" fetchpriority="low">
                        <img src="${projeto.imagem}" alt="${projeto.alt}" loading="lazy" fetchpriority="low">
                    </picture>
                </div>`;

                card.innerHTML = `
                    ${pictureHTML}
                    <div class="portfolio-card-content">
                        <h3 class="portfolio-title">${projeto.titulo}</h3>
                        <p class="portfolio-desc">${projeto.descricao}</p>
                        <div class="portfolio-tags">
                            ${tagsHTML}
                        </div>
                        <a href="${projeto.link}" target="_blank" rel="noopener noreferrer" class="portfolio-btn">
                            <i class="fas fa-external-link-alt"></i> ${textoBotao}
                        </a>
                    </div>
                `;

                // Adicionar o card ao container
                portfolioContainer.appendChild(card);

                // Avançar para o próximo card
                index++;

                // Agendar o próximo card com um pequeno atraso para liberar a UI
                setTimeout(() => requestAnimationFrame(renderizarProximoCard), 10);
            }

            // Iniciar a renderização
            requestAnimationFrame(renderizarProximoCard);
        }

        // Função para renderizar botões de navegação
        function renderizarNavegacao() {
            // Remove navegação existente se houver
            const navegacaoExistente = document.querySelector('.portfolio-navegacao');
            if (navegacaoExistente) {
                navegacaoExistente.remove();
            }

            // Só renderiza navegação se houver mais de uma página
            if (totalPaginas <= 1) return;

            // Cria o container de navegação
            const navegacao = document.createElement('div');
            navegacao.className = 'portfolio-navegacao';

            // Textos dos botões baseados no idioma atual
            let textoBtnAnterior = 'Anterior';
            let textoBtnProximo = 'Próximo';

            if (idiomaAtualProjetos === 'en' && projetosPortfolio.en.length > 0) {
                textoBtnAnterior = 'Previous';
                textoBtnProximo = 'Next';
            } else if (idiomaAtualProjetos === 'es' && projetosPortfolio.es.length > 0) {
                textoBtnAnterior = 'Anterior';
                textoBtnProximo = 'Siguiente';
            }

            // Adiciona botão "Anterior"
            const btnAnterior = document.createElement('button');
            btnAnterior.className = 'portfolio-nav-btn anterior';
            btnAnterior.innerHTML = `<i class="fas fa-chevron-left"></i> ${textoBtnAnterior}`;
            btnAnterior.disabled = paginaAtual === 0;
            btnAnterior.addEventListener('click', () => {
                if (paginaAtual > 0) {
                    // Adicionar efeito de fade-out antes de mudar de página
                    portfolioContainer.style.opacity = '0';

                    // Aguardar a animação de fade-out terminar antes de trocar as páginas
                    setTimeout(() => {
                        paginaAtual--;
                        renderizarProjetos();

                        // Rolagem suave para o topo da seção portfólio
                        document.getElementById('portfolio').scrollIntoView({ behavior: 'smooth' });

                        // Adicionar um pequeno atraso antes do fade-in para uma transição mais suave
                        setTimeout(() => {
                            portfolioContainer.style.opacity = '1';
                        }, 50);
                    }, 300); // Tempo correspondente à duração da transição de opacidade no CSS
                }
            });
            navegacao.appendChild(btnAnterior);

            // Adiciona botão "Próximo"
            const btnProximo = document.createElement('button');
            btnProximo.className = 'portfolio-nav-btn proximo';
            btnProximo.innerHTML = `${textoBtnProximo} <i class="fas fa-chevron-right"></i>`;
            btnProximo.disabled = paginaAtual === totalPaginas - 1;
            btnProximo.addEventListener('click', () => {
                if (paginaAtual < totalPaginas - 1) {
                    // Adicionar efeito de fade-out antes de mudar de página
                    portfolioContainer.style.opacity = '0';

                    // Aguardar a animação de fade-out terminar antes de trocar as páginas
                    setTimeout(() => {
                        paginaAtual++;
                        renderizarProjetos();

                        // Rolagem suave para o topo da seção portfólio
                        document.getElementById('portfolio').scrollIntoView({ behavior: 'smooth' });

                        // Adicionar um pequeno atraso antes do fade-in para uma transição mais suave
                        setTimeout(() => {
                            portfolioContainer.style.opacity = '1';
                        }, 50);
                    }, 300); // Tempo correspondente à duração da transição de opacidade no CSS
                }
            });
            navegacao.appendChild(btnProximo);

            // Adiciona navegação após o container
            portfolioContainer.after(navegacao);
        }

        // Expor função de renderização para uso na tradução
        window.renderizarPortfolio = renderizarProjetos;

        // Renderiza projetos iniciais
        renderizarProjetos();

        // Implementar navegação por swipe para o portfólio
        adicionarSwipe(portfolioContainer,
            () => {
                // Swipe para esquerda (próximo)
                if (paginaAtual < totalPaginas - 1) {
                    paginaAtual++;
                    renderizarProjetos();
                    document.getElementById('portfolio').scrollIntoView({ behavior: 'smooth' });
                }
            },
            () => {
                // Swipe para direita (anterior)
                if (paginaAtual > 0) {
                    paginaAtual--;
                    renderizarProjetos();
                    document.getElementById('portfolio').scrollIntoView({ behavior: 'smooth' });
                }
            }
        );
    }

    // Adicionar feedback do formulário de contato via AJAX
    const formularioContato = document.getElementById('formulario-contato');
    if (formularioContato) {
        formularioContato.addEventListener('submit', function (evento) {
            // Prevenir o comportamento padrão
            evento.preventDefault();

            // Pegar dados do formulário
            const formData = new FormData(formularioContato);

            // Enviar dados usando XMLHttpRequest
            const xhr = new XMLHttpRequest();
            xhr.open('POST', formularioContato.action, true);
            xhr.setRequestHeader('Accept', 'application/json');
            xhr.send(formData);
        });
    }
});

// Portfólio - Navegação por abas
const bolinhasPortfolio = document.querySelectorAll('.bolinha-portfolio');
let abaAtual = 0;
bolinhasPortfolio.forEach((bolinha, idx) => {
    bolinha.addEventListener('click', () => {
        abaAtual = idx;
        const offset = idx * 100;
        portfolioContainer.style.transform = `translateX(-${offset}%)`;
        bolinhasPortfolio.forEach(b => b.classList.remove('ativo'));
        bolinha.classList.add('ativo');
    });
});

// --- Código migrado do index.html ---
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

// Scroll suave para o ícone de e-mail
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

// Corrigir inconsistências no overlay do menu lateral
const overlayElement = document.getElementById('sidebar-overlay');
const toggleBtn = document.getElementById('toggle-button');
toggleBtn.addEventListener('click', function () {
    overlayElement.classList.toggle('ativo');
});
overlayElement.addEventListener('click', function () {
    overlayElement.classList.remove('ativo');
    sidebar.classList.remove('open'); // Corrigido de 'ativo' para 'open'

    // Atualizar atributos ARIA
    sidebar.setAttribute('aria-hidden', true);
    toggleButton.setAttribute('aria-expanded', false);
});

// Otimizar imagens
document.querySelectorAll('img').forEach(img => {
    if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
    }
    // Adicionar dimensões explícitas para prevenir layout shifts
    if (!img.hasAttribute('width') && !img.hasAttribute('height')) {
        img.style.aspectRatio = '16/9';
    }
});

// Adicionar funcionalidade ao menu de idiomas
const menuIdiomasToggle = document.querySelector('.menu-idiomas-toggle');
const menuIdiomas = document.querySelector('.menu-idiomas');

if (menuIdiomasToggle && menuIdiomas) {
    // Abrir/fechar menu ao clicar no botão
    menuIdiomasToggle.addEventListener('click', () => {
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

    // Fechar menu após selecionar um idioma
    document.querySelectorAll('.menu-idiomas .seletor-idioma').forEach(botao => {
        botao.addEventListener('click', () => {
            menuIdiomas.classList.remove('ativo');
        });
    });
}

// Função de tradução - melhorada para tratar todos os idiomas da mesma forma
function traduzirPagina(idioma) {
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
            // Título da página
            document.title = traducoes.tituloDocumento;

            // Meta descrição
            document.querySelector('meta[name="description"]').setAttribute('content', traducoes.metaDescricao);

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
                if (paragrafos[0]) {
                    paragrafos[0].textContent = traducoes.header.welcome;
                }
                const h1 = header.querySelector('h1');
                if (h1) {
                    h1.textContent = traducoes.header.name;
                }
                if (paragrafos[1]) {
                    paragrafos[1].textContent = traducoes.header.role;
                }
            }

            // Títulos de seções
            const titulosSecoes = document.querySelectorAll('.titulo-section');
            if (titulosSecoes.length > 0) {
                titulosSecoes[0].textContent = traducoes.sobre;
                titulosSecoes[1].textContent = traducoes.experiencias;
                titulosSecoes[2].textContent = traducoes.portfolio;
                titulosSecoes[3].textContent = traducoes.servicos;
                titulosSecoes[4].textContent = traducoes.contato;
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
                        imagem: imagemPath, // Caminho corrigido da imagem
                        alt: proj.alt,
                        link: `https://github.com/mateus-mg/${id}`, // Assumindo que os links seguem o padrão de ID
                        descricao: proj.descricao,
                        tecnologias: proj.tecnologias
                    });
                });

                // Atualizar os projetos para o idioma atual
                projetosPortfolio[idioma] = projetosConvertidos;

                // Renderizar projetos com o novo idioma
                if (window.renderizarPortfolio) {
                    window.renderizarPortfolio();
                }
            }

            // Marcar o botão do idioma atual como ativo
            document.querySelectorAll('.seletor-idioma').forEach(botao => {
                if (botao.getAttribute('data-idioma') === idioma) {
                    botao.classList.add('ativo');
                } else {
                    botao.classList.remove('ativo');
                }
            });
        })
        .catch(error => {
            console.error('Erro ao traduzir a página:', error);
        });
}

// Função para ajustar dinamicamente o nível das barras
// Adicionar log específico para barras com 100% de preenchimento
function ajustarNiveisBarras() {
    const barras = document.querySelectorAll('.barra-nivel .nivel');

    barras.forEach(barra => {
        const nivel = barra.getAttribute('data-nivel');
        console.log(`Processando barra com nível: ${nivel}`); // Log para depuração

        // Aplicar porcentagens consistentes com os valores definidos no CSS
        if (nivel) {
            let porcentagem;
            switch (nivel.toLowerCase()) {
                case 'nativo':
                case 'avançado':
                    porcentagem = '100%';
                    break;
                case 'fluente':
                    porcentagem = '75%';
                    break;
                case 'intermediário':
                    porcentagem = '66.66%'; // Corrigido para corresponder ao CSS
                    break;
                case 'básico':
                    porcentagem = '33.33%'; // Corrigido para corresponder ao CSS
                    break;
                default:
                    porcentagem = '0';
            }

            // Somente aplicar estilo se não tiver !important no CSS
            const isIdiomaOuSkills =
                barra.closest('#idioma-barras-container') ||
                barra.closest('#skills-barras-container');

            if (!isIdiomaOuSkills) {
                barra.style.width = porcentagem;
            }

            if (porcentagem === '100%') {
                console.log(`Barra com 100% de preenchimento: ${barra.outerHTML}`); // Log específico
            }
        }
    });
}

// Chamar a função ao carregar a página
document.addEventListener('DOMContentLoaded', ajustarNiveisBarras);