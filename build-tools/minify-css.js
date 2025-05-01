/**
 * Script para minificar arquivos CSS do portfólio
 * Usa clean-css para obter arquivos otimizados para produção
 */

const fs = require('fs-extra');
const path = require('path');
const CleanCSS = require('clean-css');

// Configuração
const ROOT_DIR = path.resolve(__dirname, '../');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const CSS_DIR = path.join(ROOT_DIR, 'css');
const DIST_CSS_DIR = path.join(DIST_DIR, 'css');

// Opções de minificação
const cssOptions = {
    level: {
        1: {
            all: true,
        },
        2: {
            restructureRules: true,
            mergeMedia: true,
            mergeNonAdjacentRules: true,
            mergeIntoShorthands: true,
            mergeSemantically: true,
        }
    },
    sourceMap: true
};

// Garantir que o diretório CSS exista no destino
fs.ensureDirSync(DIST_CSS_DIR);

/**
 * Processa um arquivo CSS: lê, minifica e salva
 * @param {string} filename - Nome do arquivo CSS
 */
function processCSS(filename) {
    const sourcePath = path.join(CSS_DIR, filename);
    const destPath = path.join(DIST_CSS_DIR, filename);
    const minDestPath = path.join(DIST_CSS_DIR, filename.replace('.css', '.min.css'));

    // Ler o conteúdo do arquivo
    const css = fs.readFileSync(sourcePath, 'utf8');

    // Minificar CSS
    const minified = new CleanCSS(cssOptions).minify(css);

    if (minified.errors.length) {
        console.error(`❌ Erro ao minificar ${filename}:`, minified.errors);
        return;
    }

    if (minified.warnings.length) {
        console.warn(`⚠️ Avisos ao minificar ${filename}:`, minified.warnings);
    }

    // Copiar arquivo original (não minificado)
    fs.copySync(sourcePath, destPath);

    // Salvar versão minificada
    fs.writeFileSync(minDestPath, minified.styles);

    // Estatísticas
    const originalSize = (css.length / 1024).toFixed(2);
    const minifiedSize = (minified.styles.length / 1024).toFixed(2);
    const reduction = (100 - (minified.styles.length / css.length * 100)).toFixed(2);

    console.log(`✅ ${filename}: ${originalSize} KB → ${minifiedSize} KB (${reduction}% redução)`);
}

// Listar arquivos CSS e processá-los
try {
    const cssFiles = fs.readdirSync(CSS_DIR).filter(file => file.endsWith('.css'));

    if (cssFiles.length === 0) {
        console.log('⚠️ Nenhum arquivo CSS encontrado.');
    } else {
        console.log(`🔍 Encontrados ${cssFiles.length} arquivos CSS para minificar.`);
        cssFiles.forEach(processCSS);
    }

    // Criar arquivo com todas as CSS combinadas (ideal para produção)
    console.log('🔄 Criando arquivo CSS combinado...');

    const allCssContent = cssFiles
        .map(file => fs.readFileSync(path.join(CSS_DIR, file), 'utf8'))
        .join('\n');

    const combinedMinified = new CleanCSS(cssOptions).minify(allCssContent);
    fs.writeFileSync(path.join(DIST_CSS_DIR, 'styles.combined.min.css'), combinedMinified.styles);

    console.log(`✅ styles.combined.min.css: ${(combinedMinified.styles.length / 1024).toFixed(2)} KB`);
    console.log('🎉 Minificação CSS concluída com sucesso!');
} catch (error) {
    console.error('❌ Erro durante a minificação CSS:', error);
}