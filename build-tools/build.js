/**
 * Script principal de build para o portfólio de Mateus Galvão
 * Executa extração de traduções e minificação de arquivos CSS e JavaScript para produção
 */

const fs = require('fs-extra');
const path = require('path');
const { exec, execSync } = require('child_process');

// Conjunto de ícones para mensagens de console
const icons = {
    init: '🚀',
    clean: '🧹',
    copy: '📂',
    translate: '🌐',
    extract: '🔎',
    minify: '🔧',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    processing: '⚙️',
    time: '⏱️',
    file: '📄'
};

// Importar as funções de extração de tradução, auto tradução e validação
// Utilizamos require dinâmico pois os arquivos podem não existir no primeiro run
let extractTranslations;
let autoTranslate;
let validarTraducoes;

try {
    extractTranslations = require('./extract-translations').extractTranslations;
} catch (err) {
    console.warn(`${icons.warning} Módulo extract-translations não encontrado, será ignorado:`, err.message);
    extractTranslations = async () => ({ totalChaves: 0 });
}

try {
    // Importar a função de auto-tradução
    autoTranslate = require('./auto-translate');
    console.log(`${icons.success} Módulo auto-translate carregado com sucesso.`);
} catch (err) {
    console.warn(`${icons.warning} Módulo auto-translate não encontrado, será ignorado:`, err.message);
    autoTranslate = async () => false;
}

try {
    // Importar a função de validação de traduções
    validarTraducoes = require('./validar-traducoes').validarTraducoes;
    console.log(`${icons.success} Módulo validar-traducoes carregado com sucesso.`);
} catch (err) {
    console.warn(`${icons.warning} Módulo validar-traducoes não encontrado, será ignorado:`, err.message);
    validarTraducoes = async () => ({ sucesso: true, avisos: [] });
}

// Caminhos importantes
const ROOT_DIR = path.resolve(__dirname, '../');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

imprimirSeparador('INICIANDO PROCESSO DE BUILD');
const inicioTotal = new Date();
console.log(`${icons.init} Iniciando build do portfólio para produção...`);
console.log(`${icons.time} Início: ${new Date().toTimeString().split(' ')[0]}`);

// Criar diretório de distribuição se não existir
fs.ensureDirSync(DIST_DIR);

// Limpar diretório dist
console.log(`\n${icons.clean} Limpando diretório de distribuição...`);
fs.emptyDirSync(DIST_DIR);

// Lista de diretórios para copiar
const dirsToCopy = [
    { src: path.join(ROOT_DIR, 'css'), dest: path.join(DIST_DIR, 'css') },
    { src: path.join(ROOT_DIR, 'js'), dest: path.join(DIST_DIR, 'js') },
    { src: path.join(ROOT_DIR, 'img'), dest: path.join(DIST_DIR, 'img') },
    { src: path.join(ROOT_DIR, 'fonts'), dest: path.join(DIST_DIR, 'fonts') },
    { src: path.join(ROOT_DIR, 'i18n'), dest: path.join(DIST_DIR, 'i18n') },
    { src: path.join(ROOT_DIR, 'pdf'), dest: path.join(DIST_DIR, 'pdf') }
];

// Lista de arquivos para copiar na raiz
const filesToCopy = [
    'index.html',
    'projeto.html',
    '404.html',
    '500.html',
    '_headers',
    '_routes.json',
    'cloudflare-pages.json',
    'LICENSE'
];

// Função para imprimir separador de seção no log
function imprimirSeparador(titulo) {
    const largura = 80;
    const separador = '='.repeat(largura);
    const espacos = ' '.repeat(Math.max(0, Math.floor((largura - titulo.length - 4) / 2)));

    console.log('\n' + separador);
    console.log(`${espacos}== ${titulo} ==`);
    console.log(separador + '\n');
}

// Função para executar o processo de extração e tradução com async/await
async function atualizarTraducoes() {
    try {
        imprimirSeparador('ATUALIZAÇÃO DE TRADUÇÕES');
        // Passo 1: Validar configuração inicial de traduções
        console.log(`${icons.check} Validando configuração de traduções...`);
        const validacaoInicial = await executarValidacao(false); // validação silenciosa inicial

        // Passo 2: Extrair traduções
        console.log(`\n${icons.extract} Extraindo traduções...`);
        console.log(`${icons.time} Início da extração de traduções: ${new Date().toTimeString()}`);
        try {
            const resultado = await extractTranslations();
            console.log(`${icons.success} Extração concluída! Total de chaves encontradas: ${resultado.totalChaves}`);
        } catch (extractError) {
            console.error(`${icons.error} Erro na extração de traduções:`, extractError);
            console.log(`${icons.warning} Continuando o build apesar do erro na extração de traduções...`);
        }
        console.log(`${icons.time} Fim da extração de traduções: ${new Date().toTimeString()}`);

        // Passo 3: Executar a auto tradução 
        console.log(`\n${icons.translate} Executando auto tradução...`);
        try {
            // Executa o script de tradução diretamente como um processo separado
            const { spawnSync } = require('child_process');
            const resultado = spawnSync('node', ['build-tools/auto-translate.js'], {
                stdio: 'inherit',
                cwd: ROOT_DIR
            });

            if (resultado.status === 0) {
                console.log(`${icons.success} Auto tradução concluída com sucesso!`);
            } else {
                console.warn(`${icons.warning} Auto tradução não foi completada totalmente. Continuando build...`);
            }
        } catch (translateError) {
            console.error(`${icons.error} Erro na auto tradução:`, translateError);
            console.log(`${icons.warning} Continuando o build apesar do erro na auto tradução...`);
        }

        // Passo 4: Validar resultados após extração e tradução
        console.log(`\n${icons.check} Validando resultado das traduções...`);
        const validacaoFinal = await executarValidacao(true); // validação completa

        // Se a validação inicial tinha problemas mas a final está ok,
        // isso significa que o sistema de extração está funcionando bem
        if (!validacaoInicial.sucesso && validacaoFinal.sucesso) {
            console.log(`${icons.success} O sistema de extração de traduções corrigiu todos os problemas detectados!`);
        }

        return validacaoFinal.sucesso;
    } catch (error) {
        console.error(`${icons.error} Erro ao atualizar traduções: ${error}`);
        return false;
    }
}

/**
 * Executa o processo de validação de traduções
 * @param {boolean} verbose - Se true, exibe detalhes completos da validação
 * @returns {Promise<object>} - Resultado da validação
 */
async function executarValidacao(verbose = false) {
    if (typeof validarTraducoes !== 'function') {
        console.warn(`${icons.warning} Função de validação não está disponível`);
        return { sucesso: true, avisos: [] };
    }

    try {
        // Se não for verbose, substituir temporariamente console.log
        let logOriginal;
        if (!verbose) {
            logOriginal = console.log;
            console.log = function () { };
        }

        // Executar validação
        const resultado = await validarTraducoes();

        // Restaurar console.log
        if (!verbose) {
            console.log = logOriginal;
        }

        // Exibir resultado resumido
        if (resultado.sucesso) {
            console.log(`${icons.success} Validação de traduções: OK`);
        } else {
            console.log(`${icons.warning} Validação de traduções: Encontrados ${resultado.html.avisos.length + resultado.js.avisos.length} avisos`);

            // Se for verbose, exibir detalhes dos avisos
            if (verbose) {
                if (resultado.html.avisos.length > 0) {
                    console.log(`\nAvisos em HTML:`);
                    resultado.html.avisos.slice(0, 10).forEach(aviso => {
                        console.log(`- ${aviso}`);
                    });
                    if (resultado.html.avisos.length > 10) {
                        console.log(`... e mais ${resultado.html.avisos.length - 10} avisos`);
                    }
                }

                if (resultado.js.avisos.length > 0) {
                    console.log(`\nAvisos em JavaScript:`);
                    resultado.js.avisos.slice(0, 10).forEach(aviso => {
                        console.log(`- ${aviso}`);
                    });
                    if (resultado.js.avisos.length > 10) {
                        console.log(`... e mais ${resultado.js.avisos.length - 10} avisos`);
                    }
                }
            }
        }

        return resultado;
    } catch (error) {
        console.error(`${icons.error} Erro durante a validação: ${error}`);
        return { sucesso: false, erro: error };
    }
}

// Função para executar o processo de build com async/await
async function executarBuild() {
    try {
        // Primeiro atualizar traduções antes de copiar os arquivos
        await atualizarTraducoes();

        // Depois copiar arquivos com traduções atualizadas
        imprimirSeparador('CÓPIA DE ARQUIVOS');
        console.log('📂 Copiando arquivos...');

        // Copiar diretórios
        dirsToCopy.forEach(dir => {
            if (fs.existsSync(dir.src)) {
                fs.copySync(dir.src, dir.dest);
                console.log(`${icons.copy} Copiado: ${path.relative(ROOT_DIR, dir.src)} → ${path.relative(ROOT_DIR, dir.dest)}`);
            }
        });

        // Copiar arquivos individuais
        filesToCopy.forEach(file => {
            const srcFile = path.join(ROOT_DIR, file);
            const destFile = path.join(DIST_DIR, file);

            if (fs.existsSync(srcFile)) {
                fs.copySync(srcFile, destFile);
                console.log(`${icons.file} Copiado: ${file}`);
            }
        });
        // Executar a minificação CSS
        imprimirSeparador('MINIFICAÇÃO DE ARQUIVOS');
        console.log(`${icons.minify} Minificando arquivos CSS...`);
        const resultCSS = execSync('node build-tools/minify-css.js', { encoding: 'utf-8' });
        console.log(resultCSS);

        // Executar a minificação JavaScript
        console.log(`\n${icons.minify} Minificando arquivos JavaScript...`);
        const resultJS = execSync('node build-tools/minify-js.js', { encoding: 'utf-8' });
        console.log(resultJS); imprimirSeparador('CONCLUSÃO DO PROCESSO');
        console.log(`${icons.success} Build concluído com sucesso! Os arquivos estão na pasta dist/`);
        console.log(`${icons.time} Fim: ${new Date().toTimeString().split(' ')[0]}`);

        const tempoTotal = (new Date() - inicioTotal) / 1000;
        console.log(`${icons.time} Tempo total de execução: ${tempoTotal.toFixed(2)} segundos`);
    } catch (error) {
        imprimirSeparador('ERRO NO PROCESSO');
        console.error(`${icons.error} Erro no processo de build: ${error}`);
        process.exit(1);
    }
}

// Iniciar o processo de build
executarBuild();