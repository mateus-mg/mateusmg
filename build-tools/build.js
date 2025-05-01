/**
 * Script principal de build para o portfólio de Mateus Galvão
 * Minifica arquivos CSS e JavaScript para produção
 */

const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');

// Caminhos importantes
const ROOT_DIR = path.resolve(__dirname, '../');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

console.log('🚀 Iniciando build do portfólio para produção...');

// Criar diretório de distribuição se não existir
fs.ensureDirSync(DIST_DIR);

// Limpar diretório dist
console.log('🧹 Limpando diretório de distribuição...');
fs.emptyDirSync(DIST_DIR);

// Primeiro, copiar todos os arquivos
console.log('📂 Copiando arquivos...');
fs.copySync(ROOT_DIR, DIST_DIR, {
    filter: (src) => {
        // Ignorar diretórios e arquivos específicos
        const relativePath = path.relative(ROOT_DIR, src);
        return ![
            'node_modules',
            'build-tools',
            'dist',
            'package.json',
            'package-lock.json'
        ].some(excluded => relativePath.startsWith(excluded));
    }
});

// Executar scripts de minificação
console.log('🔧 Minificando arquivos CSS...');
exec('node build-tools/minify-css.js', (error, stdout, stderr) => {
    if (error) {
        console.error(`❌ Erro na minificação CSS: ${error.message}`);
        return;
    }
    console.log(stdout);

    console.log('🔧 Minificando arquivos JavaScript...');
    exec('node build-tools/minify-js.js', (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Erro na minificação JavaScript: ${error.message}`);
            return;
        }
        console.log(stdout);

        console.log('✅ Build concluído com sucesso! Os arquivos estão na pasta dist/');
    });
});