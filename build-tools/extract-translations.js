/**
 * Script para extrair traduções dos arquivos HTML do projeto
 * Este script analisa os arquivos HTML e JavaScript para encontrar chaves de tradução
 * e atualizar os arquivos i18n/pt.json, en.json e es.json
 */

const fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');
const glob = require('glob');

// Conjunto de ícones para mensagens de console
const icons = {
    init: '🚀',
    scan: '🔍',
    html: '📄',
    js: '📜',
    extract: '🔎',
    portfolio: '🖼️',
    save: '💾',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    processing: '⚙️',
    time: '⏱️'
};

// Caminhos importantes
const ROOT_DIR = path.resolve(__dirname, '../');
const HTML_FILES = ['index.html', 'projeto.html', '404.html', '500.html'];
const JS_FILES = glob.sync('js/**/*.js', { cwd: ROOT_DIR });
const I18N_DIR = path.join(ROOT_DIR, 'i18n');
const PT_JSON_PATH = path.join(I18N_DIR, 'pt.json');

// Função para carregar um arquivo JSON
function carregarJSON(caminho) {
    try {
        return fs.readJsonSync(caminho);
    } catch (error) {
        console.error(`Erro ao carregar ${caminho}:`, error);
        return {};
    }
}

// Função auxiliar para definir um valor em um objeto aninhado usando um caminho de chaves (ex: "nav.home")
function setNestedValue(obj, path, value) {
    const parts = path.split('.');
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part] || typeof current[part] !== 'object') {
            current[part] = {};
        }
        current = current[part];
    }

    const lastPart = parts[parts.length - 1];
    // Só substitui se for string vazia ou não existir
    if (!current[lastPart] || current[lastPart] === "") {
        current[lastPart] = value;
    }
}

// Função para extrair chaves de data-i18n dos arquivos HTML
function extrairChavesHTML(caminhoArquivo) {
    try {
        console.log(`${icons.html} Processando arquivo HTML: ${path.basename(caminhoArquivo)}`);
        const html = fs.readFileSync(caminhoArquivo, 'utf8');
        const $ = cheerio.load(html);
        const chaves = new Map();

        // Extrair data-i18n regular
        $('[data-i18n]').each(function () {
            const chave = $(this).attr('data-i18n');
            const texto = $(this).text().trim();

            if (chave && texto && !chave.startsWith('auto.')) {
                chaves.set(chave, texto);
            }
        });

        // Extrair attributos data-i18n-* (data-i18n-title, data-i18n-aria, etc)
        $('*').each(function () {
            const elemento = $(this);
            const atributos = elemento.attr();

            if (!atributos) return;

            Object.keys(atributos).forEach(attr => {
                if (attr.startsWith('data-i18n-')) {
                    const tipoAtributo = attr.replace('data-i18n-', '');
                    const chave = elemento.attr(attr);

                    if (!chave || chave.startsWith('auto.')) return;

                    // Obter o valor do atributo correspondente
                    const nomeAtributoReal = tipoAtributo;
                    const valorAtributo = elemento.attr(nomeAtributoReal);

                    if (valorAtributo) {
                        chaves.set(chave, valorAtributo);
                    }
                }
            });
        });

        return chaves;
    } catch (error) {
        console.error(`Erro ao processar ${caminhoArquivo}:`, error);
        return new Map();
    }
}

// Função para extrair textos estáticos de botões, menus e outros elementos
function extrairTextosEstaticos(caminhoArquivo) {
    try {
        console.log(`${icons.extract} Extraindo textos estáticos de: ${path.basename(caminhoArquivo)}`);
        const html = fs.readFileSync(caminhoArquivo, 'utf8');
        const $ = cheerio.load(html);
        const chaves = new Map();

        // Extrair textos de botões
        $('button, .botao, .btn').each(function () {
            const texto = $(this).text().trim();
            if (texto && !$(this).attr('data-i18n')) {
                const chave = `auto.botao.${normalizarChave(texto)}`;
                chaves.set(chave, texto);
            }
        });

        // Extrair textos de links/menus de navegação
        $('a, .menu-item, nav a, .seletor-idioma').each(function () {
            const texto = $(this).text().trim();
            if (texto && !$(this).attr('data-i18n')) {
                const chave = `auto.link.${normalizarChave(texto)}`;
                chaves.set(chave, texto);
            }
        });

        // Extrair textos de títulos de seção
        $('h1, h2, h3, h4, h5, h6, .titulo-section').each(function () {
            const texto = $(this).text().trim();
            if (texto && !$(this).attr('data-i18n')) {
                const chave = `auto.titulo_secao.${normalizarChave(texto)}`;
                chaves.set(chave, texto);
            }
        });

        // Extrair textos de parágrafos
        $('p').each(function () {
            const texto = $(this).text().trim();
            if (texto && !$(this).attr('data-i18n') && texto.length > 10) {
                const chave = `auto.paragrafo.${normalizarChave(texto)}`;
                chaves.set(chave, texto);
            }
        });

        // Extrair textos de labels e campos de formulário
        $('label, input[type="text"], input[type="email"], textarea, select, option').each(function () {
            let texto = $(this).text().trim();

            // Para inputs, verificar placeholder ou value
            if ($(this).is('input') || $(this).is('textarea')) {
                texto = $(this).attr('placeholder') || $(this).attr('value') || '';
            }

            if (texto && !$(this).attr('data-i18n')) {
                const chave = `auto.texto.${normalizarChave(texto)}`;
                chaves.set(chave, texto);
            }
        });

        // Extrair textos de atributos aria e titles
        $('[aria-label], [title]').each(function () {
            const ariaText = $(this).attr('aria-label');
            const titleText = $(this).attr('title');

            if (ariaText && !$(this).attr('data-i18n-aria')) {
                const chave = `auto.texto.${normalizarChave(ariaText)}`;
                chaves.set(chave, ariaText);
            }

            if (titleText && !$(this).attr('data-i18n-title')) {
                const chave = `auto.texto.${normalizarChave(titleText)}`;
                chaves.set(chave, titleText);
            }
        });

        return chaves;
    } catch (error) {
        console.error(`Erro ao extrair textos estáticos de ${caminhoArquivo}:`, error);
        return new Map();
    }
}

// Função para extrair chaves de tradução de arquivos JavaScript
function extrairChavesJS(caminhoArquivo) {
    try {
        console.log(`${icons.js} Processando arquivo JS: ${path.basename(caminhoArquivo)}`);
        const conteudo = fs.readFileSync(caminhoArquivo, 'utf8');
        const chaves = new Map();

        // Procurar por padrões como i18n.traduzir('chave.exemplo'), i18n.traduzirSync('chave.exemplo')
        const regex = /[i]18n\.(traduzir|traduzirSync)\(['"]([\w\.]+)['"]/g;
        let match;

        while ((match = regex.exec(conteudo)) !== null) {
            const chave = match[2];
            if (chave && !chave.startsWith('auto.')) {
                // Não temos o valor, então apenas registramos a chave
                chaves.set(chave, "");
            }
        }

        return chaves;
    } catch (error) {
        console.error(`Erro ao processar ${caminhoArquivo}:`, error);
        return new Map();
    }
}

// Função para extrair chaves de tradução dos cards da seção portfolio
function extrairChavesPortfolio(caminhoArquivo) {
    try {
        console.log(`${icons.portfolio} Extraindo chaves dos cards de portfólio: ${path.basename(caminhoArquivo)}`);
        const conteudo = fs.readFileSync(caminhoArquivo, 'utf8');
        const chaves = new Map();

        // Procurar por definições de projetos em JavaScript
        // Este regex é uma aproximação e pode precisar ser ajustado para o formato exato dos dados
        const regexProjetos = /\{[\s\n]*id:[\s\n]*['"]([^'"]+)['"][\s\n]*,[\s\n]*titulo:[\s\n]*['"]([^'"]+)['"][\s\n]*,[\s\n]*descricao:[\s\n]*['"]([^'"]+)['"][\s\n]*,/g;
        let match;

        while ((match = regexProjetos.exec(conteudo)) !== null) {
            const id = match[1];
            const titulo = match[2];
            const descricao = match[3];

            if (titulo) {
                chaves.set(`portfolio.${id}.titulo`, titulo);
            }

            if (descricao) {
                chaves.set(`portfolio.${id}.descricao`, descricao);
            }
        }

        // Extrair botões de navegação do portfólio
        const regexBotoes = /botao_anterior['"]\s*:\s*['"]([^'"]+)['"]/;
        const regexBotoesNext = /botao_proximo['"]\s*:\s*['"]([^'"]+)['"]/;

        const matchAnterior = regexBotoes.exec(conteudo);
        if (matchAnterior && matchAnterior[1]) {
            chaves.set('portfolio.navegacao.anterior', matchAnterior[1]);
        }

        const matchProximo = regexBotoesNext.exec(conteudo);
        if (matchProximo && matchProximo[1]) {
            chaves.set('portfolio.navegacao.proximo', matchProximo[1]);
        }

        return chaves;
    } catch (error) {
        console.error(`Erro ao extrair chaves de portfólio ${caminhoArquivo}:`, error);
        return new Map();
    }
}

// Função para normalizar texto para usar como chave
function normalizarChave(texto) {
    return texto
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '_')
        .substring(0, 40); // Limitar tamanho da chave
}

// Função principal para extrair todas as chaves e atualizar os arquivos JSON
async function extractTranslations() {
    console.log(`\n${icons.init} Iniciando extração de traduções...`);
    console.log(`${icons.time} Início: ${new Date().toLocaleTimeString()}`);

    // Criar diretório i18n se não existir
    fs.ensureDirSync(I18N_DIR);

    // Carregar o arquivo pt.json existente
    const ptJson = carregarJSON(PT_JSON_PATH) || {};

    // Mapa para armazenar todas as chaves e valores encontrados
    const todasChaves = new Map();

    // Processar arquivos HTML
    for (const arquivo of HTML_FILES) {
        const caminhoCompleto = path.join(ROOT_DIR, arquivo);
        if (fs.existsSync(caminhoCompleto)) {
            // Extrair chaves já marcadas com data-i18n
            const chaves = extrairChavesHTML(caminhoCompleto);
            for (const [chave, valor] of chaves.entries()) {
                todasChaves.set(chave, valor);
            }

            // Extrair textos estáticos
            const textosEstaticos = extrairTextosEstaticos(caminhoCompleto);
            for (const [chave, valor] of textosEstaticos.entries()) {
                todasChaves.set(chave, valor);
            }
        }
    }

    // Processar arquivos JavaScript para buscar chaves de tradução
    for (const arquivo of JS_FILES) {
        const caminhoCompleto = path.join(ROOT_DIR, arquivo);
        if (fs.existsSync(caminhoCompleto)) {
            const chaves = extrairChavesJS(caminhoCompleto);
            for (const [chave, valor] of chaves.entries()) {
                todasChaves.set(chave, valor);
            }

            // Se for o arquivo que contém a definição dos projetos, extrair chaves dos cards
            if (arquivo.includes('scripts.js') || arquivo.includes('portfolio.js')) {
                const chavesPortfolio = extrairChavesPortfolio(caminhoCompleto);
                for (const [chave, valor] of chavesPortfolio.entries()) {
                    todasChaves.set(chave, valor);
                }
            }
        }
    }

    // Atualizar o objeto ptJson com as chaves encontradas
    for (const [chave, valor] of todasChaves.entries()) {
        setNestedValue(ptJson, chave, valor);
    }

    // Escrever o arquivo pt.json atualizado
    await fs.writeJson(PT_JSON_PATH, ptJson, { spaces: 2 });
    console.log(`${icons.save} Arquivo ${path.relative(ROOT_DIR, PT_JSON_PATH)} atualizado com ${todasChaves.size} chaves de tradução.`);
    console.log(`${icons.success} Extração de traduções concluída com sucesso!`);
    console.log(`${icons.time} Fim: ${new Date().toLocaleTimeString()}`);

    return { totalChaves: todasChaves.size };
}

// Executar a função quando o script é chamado diretamente
if (require.main === module) {
    console.log(`${icons.init} Executando extração de traduções como script independente`);
    extractTranslations()
        .then(result => {
            console.log(`${icons.success} Total de chaves extraídas: ${result.totalChaves}`);
            process.exit(0);
        })
        .catch(error => {
            console.error(`${icons.error} Erro ao extrair traduções:`, error);
            process.exit(1);
        });
}

module.exports = { extractTranslations };

// Executar a função se este arquivo for chamado diretamente (não importado como módulo)
if (require.main === module) {
    console.log('Executando extração de traduções como script principal...');
    extractTranslations()
        .then(resultado => {
            console.log(`Extração concluída com sucesso! Total de ${resultado.totalChaves} chaves.`);
        })
        .catch(err => {
            console.error('Erro durante a extração de traduções:', err);
            process.exit(1);
        });
}
