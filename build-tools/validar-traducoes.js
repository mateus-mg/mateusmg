/**
 * Script de validação automatizada para traduções
 * Este script é usado para verificar se todos os textos do site estão
 * configurados para serem extraídos para tradução automaticamente.
 */

const fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');
const glob = require('glob');
const { execSync } = require('child_process');
const chalk = require('chalk');

// Importar a função de extração de traduções
let extractTranslations;
try {
    extractTranslations = require('./extract-translations').extractTranslations;
} catch (err) {
    console.error('Erro ao importar o módulo extract-translations:', err);
    process.exit(1);
}

// Ícones para o console
const icons = {
    start: '🚀',
    check: '🔍',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    info: 'ℹ️'
};

// Caminhos importantes
const ROOT_DIR = path.resolve(__dirname, '../');
const HTML_FILES = ['index.html', 'projeto.html', '404.html', '500.html'].map(f => path.join(ROOT_DIR, f));
const JS_FILES = glob.sync('js/**/*.js', { cwd: ROOT_DIR }).map(f => path.join(ROOT_DIR, f));
const I18N_DIR = path.join(ROOT_DIR, 'i18n');
const PT_JSON_PATH = path.join(I18N_DIR, 'pt.json');

// Configuração de validação
const config = {
    // Elementos que devem ter o atributo data-i18n ou ser capturados automaticamente
    elementosParaTraduzir: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',       // Títulos
        'p:not(.copyright)', 'li:not(.no-i18n)',  // Parágrafos e itens de lista (exceto alguns)
        'button', '.btn', '.botao',               // Botões
        'a:not([href^="http"])',                  // Links internos
        'label', 'input[placeholder]',            // Elementos de formulário
        '.titulo-section', '.card-title',         // Elementos de UI específicos
        '.feedback-titulo', '.feedback-mensagem'  // Elementos do feedback popup
    ],

    // Atributos que devem ser traduzidos
    atributosParaTraduzir: [
        'placeholder', 'title', 'aria-label', 'alt'
    ],

    // Elementos que devem ser ignorados na validação
    elementosIgnorar: [
        'script', 'style', 'noscript', 'svg', 'code',
        'pre', 'iframe', '.no-i18n', '[data-no-i18n]',
        'link', 'meta', 'br', 'hr'
    ]
};

/**
 * Função principal que executa todos os testes de validação
 */
async function validarTraducoes() {
    console.log(`\n${icons.start} Iniciando validação de traduções...`);

    const resultados = {
        html: await validarArquivosHTML(),
        js: await validarArquivosJS(),
        extrator: await testarExtracao(),
        resultadoFinal: true
    };

    // Determinar o resultado final
    resultados.resultadoFinal = resultados.html.sucesso &&
        resultados.js.sucesso &&
        resultados.extrator.sucesso;

    // Exibir resumo
    console.log('\n=================================================');
    console.log('RESUMO DA VALIDAÇÃO DE TRADUÇÕES');
    console.log('=================================================');

    console.log(`Arquivos HTML: ${formatarResultado(resultados.html.sucesso)}`);
    if (resultados.html.avisos.length > 0) {
        console.log(`  ${icons.warning} ${resultados.html.avisos.length} avisos`);
    }

    console.log(`Arquivos JS: ${formatarResultado(resultados.js.sucesso)}`);
    if (resultados.js.avisos.length > 0) {
        console.log(`  ${icons.warning} ${resultados.js.avisos.length} avisos`);
    }

    console.log(`Extração: ${formatarResultado(resultados.extrator.sucesso)}`);
    console.log(`\nResultado final: ${formatarResultado(resultados.resultadoFinal)}`);

    // Retornar o resultado da validação
    return {
        sucesso: resultados.resultadoFinal,
        ...resultados
    };
}

/**
 * Valida os arquivos HTML em busca de textos não traduzíveis
 */
async function validarArquivosHTML() {
    console.log(`\n${icons.check} Validando arquivos HTML...`);

    const resultado = {
        sucesso: true,
        arquivos: {},
        avisos: [],
        erros: []
    };

    for (const arquivo of HTML_FILES) {
        const nomeArquivo = path.basename(arquivo);
        console.log(`\nVerificando ${nomeArquivo}...`);

        try {
            if (!fs.existsSync(arquivo)) {
                console.log(`  ${icons.warning} Arquivo não encontrado, pulando`);
                resultado.avisos.push(`Arquivo ${nomeArquivo} não encontrado`);
                continue;
            }

            const html = fs.readFileSync(arquivo, 'utf8');
            const $ = cheerio.load(html);

            // Armazenar estatísticas por arquivo
            const estatisticas = {
                elementosVerificados: 0,
                elementosComDataI18n: 0,
                elementosAutoCapturados: 0,
                elementosSemTraducao: [],
                atributosSemTraducao: []
            };

            // 1. Verificar elementos de texto que devem ser traduzidos
            const seletorElementos = config.elementosParaTraduzir.join(', ');
            const seletorIgnorar = config.elementosIgnorar.join(', ');

            $(seletorElementos).not(seletorIgnorar).each(function () {
                const $el = $(this);
                estatisticas.elementosVerificados++;

                // Verificar se o elemento tem data-i18n
                if ($el.attr('data-i18n')) {
                    estatisticas.elementosComDataI18n++;
                    return; // Este elemento está OK
                }

                // Verificar se o texto é candidato para tradução automática
                const texto = $el.text().trim();
                if (!texto || texto.length < 2) {
                    return; // Texto vazio ou muito curto, não precisa traduzir
                }

                // Verificar se o elemento será capturado automaticamente
                let seraCapturado = false;

                // Botões, links e menus são capturados automaticamente
                if ($el.is('button, .btn, .botao, a, .menu-item, nav a')) {
                    seraCapturado = true;
                    estatisticas.elementosAutoCapturados++;
                }
                // Títulos de seção são capturados automaticamente
                else if ($el.is('h1, h2, h3, h4, h5, h6, .titulo-section')) {
                    seraCapturado = true;
                    estatisticas.elementosAutoCapturados++;
                }
                // Parágrafos com texto longo são capturados automaticamente
                else if ($el.is('p') && texto.length > 10) {
                    seraCapturado = true;
                    estatisticas.elementosAutoCapturados++;
                }
                // Labels e campos de formulário são capturados automaticamente
                else if ($el.is('label, input[type="text"], input[type="email"], textarea, select, option')) {
                    seraCapturado = true;
                    estatisticas.elementosAutoCapturados++;
                }

                if (!seraCapturado) {
                    estatisticas.elementosSemTraducao.push({
                        elemento: $el.prop('tagName').toLowerCase(),
                        texto: texto.substring(0, 40) + (texto.length > 40 ? '...' : ''),
                        caminho: obterCaminhoElemento($, $el)
                    });
                }
            });

            // 2. Verificar atributos que devem ser traduzidos
            config.atributosParaTraduzir.forEach(atributo => {
                const seletorAtributo = `[${atributo}]:not(${seletorIgnorar})`;
                $(seletorAtributo).each(function () {
                    const $el = $(this);
                    const valorAtributo = $el.attr(atributo);

                    if (!valorAtributo || valorAtributo.length < 2) {
                        return; // Atributo vazio ou muito curto
                    }

                    // Verificar se o atributo tem data-i18n-*
                    const dataI18nAttr = `data-i18n-${atributo}`;
                    if ($el.attr(dataI18nAttr)) {
                        return; // Este atributo está OK
                    }

                    // Verificar se é capturado automaticamente
                    if ($el.is('[aria-label], [title]')) {
                        return; // Atributos aria-label e title são capturados
                    }

                    estatisticas.atributosSemTraducao.push({
                        elemento: $el.prop('tagName').toLowerCase(),
                        atributo,
                        valor: valorAtributo.substring(0, 40) + (valorAtributo.length > 40 ? '...' : ''),
                        caminho: obterCaminhoElemento($, $el)
                    });
                });
            });

            // Exibir estatísticas
            console.log(`  Elementos verificados: ${estatisticas.elementosVerificados}`);
            console.log(`  Com data-i18n: ${estatisticas.elementosComDataI18n}`);
            console.log(`  Capturados automaticamente: ${estatisticas.elementosAutoCapturados}`);

            const elementosSemTraducao = estatisticas.elementosSemTraducao.length;
            const atributosSemTraducao = estatisticas.atributosSemTraducao.length;

            if (elementosSemTraducao > 0) {
                console.log(`  ${icons.warning} Elementos sem tradução: ${elementosSemTraducao}`);
                estatisticas.elementosSemTraducao.forEach(item => {
                    resultado.avisos.push(`${nomeArquivo}: Elemento <${item.elemento}> sem tradução: "${item.texto}"`);
                });
            }

            if (atributosSemTraducao > 0) {
                console.log(`  ${icons.warning} Atributos sem tradução: ${atributosSemTraducao}`);
                estatisticas.atributosSemTraducao.forEach(item => {
                    resultado.avisos.push(
                        `${nomeArquivo}: Atributo [${item.atributo}] em <${item.elemento}> sem tradução: "${item.valor}"`
                    );
                });
            }

            // Armazenar resultado deste arquivo
            resultado.arquivos[nomeArquivo] = {
                ...estatisticas,
                valido: elementosSemTraducao === 0 && atributosSemTraducao === 0
            };

            // Atualizar resultado geral
            if (!resultado.arquivos[nomeArquivo].valido) {
                resultado.sucesso = false;
            }

        } catch (erro) {
            console.error(`  ${icons.error} Erro ao validar ${nomeArquivo}:`, erro);
            resultado.erros.push(`Erro ao validar ${nomeArquivo}: ${erro.message}`);
            resultado.sucesso = false;
        }
    }

    return resultado;
}

/**
 * Valida os arquivos JavaScript para uso correto de i18n.traduzir()
 */
async function validarArquivosJS() {
    console.log(`\n${icons.check} Validando arquivos JavaScript...`);

    const resultado = {
        sucesso: true,
        arquivos: {},
        avisos: [],
        erros: []
    };

    // Expressões regulares para encontrar strings que devem ser traduzidas
    const regexs = [
        // Textos apresentados ao usuário sem tradução
        {
            pattern: /alert\(['"`](.*?)['"`]\)/g,
            mensagem: 'alert() com texto hardcoded'
        },
        {
            pattern: /console\.(log|error|warn|info)\(['"`](.*?(?:erro|mensagem|texto|exibir|mostrar)).*?['"`]/gi,
            mensagem: 'console.* com mensagem ao usuário hardcoded'
        },
        {
            pattern: /\.innerHTML\s*=\s*['"`](.*?)['"`]/g,
            mensagem: 'innerHTML com texto hardcoded'
        },
        {
            pattern: /\.textContent\s*=\s*['"`](.*?)['"`]/g,
            mensagem: 'textContent com texto hardcoded'
        },
        {
            pattern: /\.value\s*=\s*['"`](.*?)['"`]/g,
            mensagem: 'value com texto hardcoded'
        }
    ];

    for (const arquivo of JS_FILES) {
        // Ignorar arquivos minificados e bibliotecas externas
        if (arquivo.includes('.min.js') || arquivo.includes('vendor/')) {
            continue;
        }

        const nomeArquivo = path.relative(ROOT_DIR, arquivo);
        console.log(`\nVerificando ${nomeArquivo}...`);

        try {
            if (!fs.existsSync(arquivo)) {
                console.log(`  ${icons.warning} Arquivo não encontrado, pulando`);
                resultado.avisos.push(`Arquivo ${nomeArquivo} não encontrado`);
                continue;
            }

            const conteudo = fs.readFileSync(arquivo, 'utf8');

            // Estatísticas por arquivo
            const estatisticas = {
                chamadasi18n: 0,
                hardcodedStrings: []
            };

            // 1. Contar chamadas ao sistema i18n
            const regex18n = /i18n\.(traduzir|traduzirSync)\(/g;
            let match;
            while ((match = regex18n.exec(conteudo)) !== null) {
                estatisticas.chamadasi18n++;
            }

            // 2. Procurar por strings hardcoded que deveriam ser traduzidas
            regexs.forEach(regex => {
                let match;
                while ((match = regex.pattern.exec(conteudo)) !== null) {
                    const texto = match[1];

                    // Ignorar strings vazias ou muito curtas
                    if (!texto || texto.length < 5 || texto.trim() === '') {
                        continue;
                    }

                    // Ignorar URLs
                    if (texto.match(/^https?:\/\//)) {
                        continue;
                    }

                    // Ignorar tokens e seletores
                    if (texto.match(/^[#.][a-zA-Z0-9_-]+$/) ||
                        texto.match(/^[\w-]+$/) ||
                        texto.match(/^[<>/]/) ||
                        texto.startsWith('<i class=')) {
                        continue;
                    }

                    estatisticas.hardcodedStrings.push({
                        texto: texto.substring(0, 40) + (texto.length > 40 ? '...' : ''),
                        linha: conteudo.substring(0, match.index).split('\n').length,
                        tipo: regex.mensagem
                    });
                }
            });

            // Mostrar estatísticas
            console.log(`  Chamadas ao sistema i18n: ${estatisticas.chamadasi18n}`);

            const hardcodedCount = estatisticas.hardcodedStrings.length;
            if (hardcodedCount > 0) {
                console.log(`  ${icons.warning} Strings hardcoded encontradas: ${hardcodedCount}`);
                estatisticas.hardcodedStrings.forEach(item => {
                    const aviso = `${nomeArquivo}:${item.linha} - ${item.tipo}: "${item.texto}"`;
                    console.log(`    - ${aviso}`);
                    resultado.avisos.push(aviso);
                });
            } else {
                console.log(`  ${icons.success} Nenhuma string hardcoded encontrada`);
            }

            // Armazenar resultado deste arquivo
            resultado.arquivos[nomeArquivo] = {
                ...estatisticas,
                valido: hardcodedCount === 0
            };

            // Em JavaScript, strings hardcoded são apenas avisos, não erros
            // O resultado continua positivo

        } catch (erro) {
            console.error(`  ${icons.error} Erro ao validar ${nomeArquivo}:`, erro);
            resultado.erros.push(`Erro ao validar ${nomeArquivo}: ${erro.message}`);
            resultado.sucesso = false;
        }
    }

    return resultado;
}

/**
 * Testa o processo de extração de traduções
 */
async function testarExtracao() {
    console.log(`\n${icons.check} Testando extração de traduções...`);

    const resultado = {
        sucesso: true,
        totalChaves: 0,
        erros: [],
        avisos: []
    };

    try {
        // Executar a extração de traduções
        console.log('Executando extractTranslations()...');
        const resultadoExtracao = await extractTranslations();
        resultado.totalChaves = resultadoExtracao.totalChaves;

        console.log(`  ${icons.success} Extração concluída com ${resultado.totalChaves} chaves encontradas`);

        // Verificar se o arquivo pt.json foi criado e tem conteúdo
        if (!fs.existsSync(PT_JSON_PATH)) {
            const erro = `Arquivo ${path.basename(PT_JSON_PATH)} não foi criado`;
            console.error(`  ${icons.error} ${erro}`);
            resultado.erros.push(erro);
            resultado.sucesso = false;
            return resultado;
        }

        // Verificar o conteúdo do arquivo pt.json
        const ptJson = fs.readJsonSync(PT_JSON_PATH);
        const chavesNoArquivo = contarChavesRecursivas(ptJson);

        console.log(`  Chaves no arquivo pt.json: ${chavesNoArquivo}`);

        // Verificar se o número de chaves bate com o relatado
        if (chavesNoArquivo < resultado.totalChaves * 0.8) {
            const aviso = `Discrepância no número de chaves: ${resultado.totalChaves} extraídas vs ${chavesNoArquivo} no arquivo`;
            console.log(`  ${icons.warning} ${aviso}`);
            resultado.avisos.push(aviso);
        }

        // Verificar seções importantes que devem existir
        const secoesEsperadas = ['nav', 'header', 'botoes', 'feedback'];
        const secoesAusentes = secoesEsperadas.filter(secao => !ptJson[secao]);

        if (secoesAusentes.length > 0) {
            resultado.avisos.push(`Seções ausentes no arquivo de tradução: ${secoesAusentes.join(', ')}`);
            console.log(`  ${icons.warning} Seções ausentes: ${secoesAusentes.join(', ')}`);
        } else {
            console.log(`  ${icons.success} Todas as seções esperadas estão presentes`);
        }

    } catch (erro) {
        console.error(`  ${icons.error} Erro ao testar extração:`, erro);
        resultado.erros.push(`Erro ao testar extração: ${erro.message}`);
        resultado.sucesso = false;
    }

    return resultado;
}

/**
 * Utilitário para obter o caminho de um elemento no DOM
 */
function obterCaminhoElemento($, elemento, maxNiveis = 3) {
    try {
        const caminho = [];
        let atual = elemento;
        let nivel = 0;

        while (atual.length && nivel < maxNiveis) {
            let seletor = atual.prop('tagName').toLowerCase();

            // Adicionar id se existir
            const id = atual.attr('id');
            if (id) {
                seletor += `#${id}`;
                caminho.unshift(seletor);
                break;
            }

            // Adicionar classe principal se existir
            const classes = atual.attr('class');
            if (classes) {
                const classesPrincipais = classes.split(' ')
                    .filter(c => c && !c.includes('active') && !c.includes('hover') && !c.includes('show'))
                    .slice(0, 1);

                if (classesPrincipais.length) {
                    seletor += `.${classesPrincipais[0]}`;
                }
            }

            caminho.unshift(seletor);
            atual = atual.parent();
            nivel++;
        }

        return caminho.join(' > ');
    } catch (erro) {
        return '[erro ao obter caminho]';
    }
}

/**
 * Utilitário para contar chaves em um objeto JSON recursivamente
 */
function contarChavesRecursivas(obj, prefixo = '') {
    if (!obj || typeof obj !== 'object') {
        return 0;
    }

    let contador = 0;

    for (const [chave, valor] of Object.entries(obj)) {
        const chaveCompleta = prefixo ? `${prefixo}.${chave}` : chave;

        if (typeof valor === 'object' && valor !== null) {
            contador += contarChavesRecursivas(valor, chaveCompleta);
        } else {
            contador++;
        }
    }

    return contador;
}

/**
 * Formata um resultado booleano com cor para o console
 */
function formatarResultado(sucesso) {
    return sucesso
        ? chalk.green(`${icons.success} PASSOU`)
        : chalk.red(`${icons.error} FALHOU`);
}

// Executar validação se este script for executado diretamente
if (require.main === module) {
    validarTraducoes().then((resultado) => {
        console.log('\n=================================================');
        if (resultado.sucesso) {
            console.log(chalk.green(`${icons.success} TODOS OS TESTES PASSARAM`));
            process.exit(0);
        } else {
            console.log(chalk.yellow(`${icons.warning} ALGUNS TESTES FALHARAM`));

            if (resultado.html.erros.length > 0) {
                console.log('\nErros em HTML:');
                resultado.html.erros.forEach(e => console.log(`- ${e}`));
            }

            if (resultado.js.erros.length > 0) {
                console.log('\nErros em JavaScript:');
                resultado.js.erros.forEach(e => console.log(`- ${e}`));
            }

            if (resultado.extrator.erros.length > 0) {
                console.log('\nErros na extração:');
                resultado.extrator.erros.forEach(e => console.log(`- ${e}`));
            }

            process.exit(1);
        }
    }).catch((erro) => {
        console.error(chalk.red(`\n${icons.error} FALHA NA VALIDAÇÃO:`));
        console.error(erro);
        process.exit(1);
    });
}

// Exportar funções para uso em outros scripts
module.exports = {
    validarTraducoes,
    validarArquivosHTML,
    validarArquivosJS,
    testarExtracao
};
