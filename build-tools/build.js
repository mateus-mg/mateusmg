/**
 * Script principal de build para o portfólio de Mateus Galvão
 * Executa extração de traduções e minificação de arquivos CSS e JavaScript para produção
 */

const fs = require('fs-extra');
const path = require('path');
const { exec, execSync } = require('child_process');
const { extractTranslations } = require('./extract-translations');

// Caminhos importantes
const ROOT_DIR = path.resolve(__dirname, '../');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

console.log('🚀 Iniciando build do portfólio para produção...');

// Criar diretório de distribuição se não existir
fs.ensureDirSync(DIST_DIR);

// Limpar diretório dist
console.log('🧹 Limpando diretório de distribuição...');
fs.emptyDirSync(DIST_DIR);

// Copiar arquivos de forma seletiva em vez de copiar tudo
console.log('📂 Copiando arquivos...');

// Lista de diretórios para copiar
const dirsToCopy = [
    { src: path.join(ROOT_DIR, 'css'), dest: path.join(DIST_DIR, 'css') },
    { src: path.join(ROOT_DIR, 'js'), dest: path.join(DIST_DIR, 'js') },
    { src: path.join(ROOT_DIR, 'img'), dest: path.join(DIST_DIR, 'img') },
    { src: path.join(ROOT_DIR, 'fonts'), dest: path.join(DIST_DIR, 'fonts') },
    { src: path.join(ROOT_DIR, 'i18n'), dest: path.join(DIST_DIR, 'i18n') },
    { src: path.join(ROOT_DIR, 'pdf'), dest: path.join(DIST_DIR, 'pdf') }
];

// Copiar diretórios
dirsToCopy.forEach(dir => {
    if (fs.existsSync(dir.src)) {
        fs.copySync(dir.src, dir.dest);
        console.log(`✅ Copiado: ${path.relative(ROOT_DIR, dir.src)} → ${path.relative(ROOT_DIR, dir.dest)}`);
    }
});

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

// Copiar arquivos individuais
filesToCopy.forEach(file => {
    const srcFile = path.join(ROOT_DIR, file);
    const destFile = path.join(DIST_DIR, file);

    if (fs.existsSync(srcFile)) {
        fs.copySync(srcFile, destFile);
        console.log(`✅ Copiado: ${file}`);
    }
});

// Primeiro executar a extração de traduções, depois minificar
console.log('🔍 Extraindo traduções...');

// Função para executar o processo de build com async/await
async function executarBuild() {
    try {        // Extrair traduções (primeiro passo)
        console.log('⏱️ Início da extração de traduções: ' + new Date().toTimeString());
        await extractTranslations();
        console.log('⏱️ Fim da extração de traduções: ' + new Date().toTimeString());

        // Copiar os arquivos atualizados de tradução para o diretório dist
        fs.copySync(path.join(ROOT_DIR, 'i18n'), path.join(DIST_DIR, 'i18n'));
        console.log('✅ Arquivos de tradução atualizados copiados para dist/i18n');

        // Executar a minificação CSS
        console.log('🔧 Minificando arquivos CSS...');
        const resultCSS = execSync('node build-tools/minify-css.js', { encoding: 'utf-8' });
        console.log(resultCSS);

        // Executar a minificação JavaScript
        console.log('🔧 Minificando arquivos JavaScript...');
        const resultJS = execSync('node build-tools/minify-js.js', { encoding: 'utf-8' });
        console.log(resultJS);

        console.log('✅ Build concluído com sucesso! Os arquivos estão na pasta dist/');
    } catch (error) {
        console.error(`❌ Erro no processo de build: ${error}`);
        process.exit(1);
    }
}

// Iniciar o processo de build
executarBuild();