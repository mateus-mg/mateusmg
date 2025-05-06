// Código para gerenciar a exibição de detalhes do projeto
document.addEventListener('DOMContentLoaded', function () {
    console.log("Inicializando página de detalhes do projeto");

    // Obter o ID do projeto da URL
    const urlParams = new URLSearchParams(window.location.search);
    const projetoId = urlParams.get('id');

    if (!projetoId) {
        // Se não houver ID, mostrar erro e link para voltar
        console.error("ID do projeto não encontrado na URL");
        mostrarErro('Nenhum projeto especificado');
        return;
    }

    console.log(`Carregando detalhes do projeto: ${projetoId}`);

    // Usar sessionStorage para consistência com o resto da aplicação
    const idiomaPadrao = 'pt';
    const idiomaAtual = sessionStorage.getItem('idioma') || idiomaPadrao;

    // Atualizar a indicação visual do idioma atual
    document.querySelector('.idioma-atual').textContent = idiomaAtual.toUpperCase();
    document.querySelectorAll('.seletor-idioma').forEach(btn => {
        btn.classList.remove('ativo');
        if (btn.getAttribute('data-idioma') === idiomaAtual) {
            btn.classList.add('ativo');
        }
    });

    // Carregar detalhes do projeto
    carregarDetalhes(projetoId, idiomaAtual);

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
    }

    // Configurar seleção de idioma
    document.querySelectorAll('.seletor-idioma').forEach(botao => {
        botao.addEventListener('click', function () {
            const novoIdioma = this.getAttribute('data-idioma');
            // Usar sessionStorage de forma consistente
            sessionStorage.setItem('idioma', novoIdioma);
            // Recarregar detalhes no novo idioma
            carregarDetalhes(projetoId, novoIdioma);

            // Atualizar indicação visual de idioma ativo
            document.querySelectorAll('.seletor-idioma').forEach(btn => {
                btn.classList.remove('ativo');
            });
            this.classList.add('ativo');
            document.querySelector('.idioma-atual').textContent = novoIdioma.toUpperCase();

            // Fechar menu de idiomas
            menuIdiomas.classList.remove('ativo');
            menuIdiomasToggle.setAttribute('aria-expanded', 'false');
        });
    });

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
 * Carrega os detalhes do projeto com base no ID e idioma selecionado
 * @param {string} projetoId - O identificador único do projeto
 * @param {string} idioma - O código do idioma atual (pt, en, es)
 */
function carregarDetalhes(projetoId, idioma) {
    console.log(`Carregando detalhes do projeto ${projetoId} no idioma ${idioma}`);

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
            document.getElementById('projeto-titulo').textContent = projeto.titulo;

            // Inserir descrição curta
            document.getElementById('projeto-descricao-curta').textContent = projeto.descricao;

            // Inserir descrição longa (se existir)
            const descricaoLonga = document.getElementById('projeto-descricao-longa');
            if (projeto.descricao_longa) {
                descricaoLonga.innerHTML = projeto.descricao_longa;
                descricaoLonga.style.display = 'block';
            } else {
                descricaoLonga.style.display = 'none';
            }

            // Inserir tecnologias
            const tagsContainer = document.querySelector('.tags-container');
            tagsContainer.innerHTML = projeto.tecnologias.map(tech =>
                `<span class="portfolio-tag">${tech}</span>`
            ).join('');

            // Inserir relatório (se existir)
            const relatorioContainer = document.getElementById('projeto-relatorio');
            const relatorioConteudo = relatorioContainer.querySelector('.relatorio-conteudo');

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

            // Atualizar link para GitHub
            document.querySelector('.github-btn').href = `https://github.com/mateus-mg/${projetoId}`;

            // Configurar meta tags para SEO dinâmico
            atualizarMetaTags(projeto.titulo, projeto.descricao);

            console.log("Detalhes do projeto carregados com sucesso");
        })
        .catch(error => {
            console.error('Erro ao carregar detalhes do projeto:', error);
            mostrarErro(`Erro ao carregar as traduções para ${idioma}. Por favor, tente novamente.`);
        });
}

/**
 * Exibe uma mensagem de erro na página
 * @param {string} mensagem - A mensagem de erro a ser exibida
 */
function mostrarErro(mensagem) {
    const container = document.querySelector('.projeto-detalhes');
    container.innerHTML = `
        <div class="erro-container">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #dc3545; margin-bottom: 1rem;"></i>
            <h2>Oops! Algo deu errado</h2>
            <p>${mensagem}</p>
            <a href="index.html#portfolio" class="botao voltar-btn">Voltar ao Portfólio</a>
        </div>
    `;
}

/**
 * Atualiza as meta tags da página para melhorar o SEO
 * @param {string} titulo - O título do projeto
 * @param {string} descricao - A descrição do projeto
 */
function atualizarMetaTags(titulo, descricao) {
    // Atualizar meta tags para SEO
    document.querySelector('meta[name="description"]').setAttribute('content', descricao);
    document.querySelector('meta[property="og:title"]').setAttribute('content', `${titulo} - Mateus Galvão`);
    document.querySelector('meta[property="og:description"]').setAttribute('content', descricao);
}