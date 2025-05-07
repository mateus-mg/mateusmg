/**
 * Script para minificar arquivos JavaScript do portfólio
 * Usa terser para obter arquivos otimizados para produção
 */

const fs = require('fs-extra');
const path = require('path');
const { minify } = require('terser');

// Configuração
const ROOT_DIR = path.resolve(__dirname, '../');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const JS_DIR = path.join(ROOT_DIR, 'js');
const DIST_JS_DIR = path.join(DIST_DIR, 'js');

// Opções de minificação
const terserOptions = {
    compress: {
        dead_code: true,
        drop_console: false, // Manter console.logs para poder debugar
        drop_debugger: true,
        passes: 2
    },
    mangle: true,
    format: {
        comments: false,
        ascii_only: true,
    },
    sourceMap: {
        filename: 'script.js',
        url: 'script.js.map'
    }
};

// Garantir que o diretório JS exista no destino
fs.ensureDirSync(DIST_JS_DIR);

/**
 * Processa um arquivo JavaScript: lê, minifica e salva
 * @param {string} filename - Nome do arquivo JavaScript
 */
async function processJS(filename) {
    const sourcePath = path.join(JS_DIR, filename);
    const destPath = path.join(DIST_JS_DIR, filename);
    const minDestPath = path.join(DIST_JS_DIR, filename.replace('.js', '.min.js'));

    try {
        // Ler o conteúdo do arquivo
        const code = fs.readFileSync(sourcePath, 'utf8');

        // Minificar JS
        const minified = await minify({ [filename]: code }, terserOptions);

        if (!minified.code) {
            console.error(`❌ Erro ao minificar ${filename}: Nenhum código gerado`);
            return;
        }

        // Copiar arquivo original (não minificado)
        fs.copySync(sourcePath, destPath);

        // Salvar versão minificada
        fs.writeFileSync(minDestPath, minified.code);

        // Salvar sourcemap se disponível
        if (minified.map) {
            fs.writeFileSync(minDestPath + '.map', minified.map);
        }

        // Estatísticas
        const originalSize = (code.length / 1024).toFixed(2);
        const minifiedSize = (minified.code.length / 1024).toFixed(2);
        const reduction = (100 - (minified.code.length / code.length * 100)).toFixed(2);

        console.log(`✅ ${filename}: ${originalSize} KB → ${minifiedSize} KB (${reduction}% redução)`);
    } catch (error) {
        console.error(`❌ Erro ao processar ${filename}:`, error.message);
    }
}

// Listar arquivos JS e processá-los
async function minifyAllJS() {
    try {
        const jsFiles = fs.readdirSync(JS_DIR).filter(file => file.endsWith('.js'));

        if (jsFiles.length === 0) {
            console.log('⚠️ Nenhum arquivo JavaScript encontrado.');
            return;
        }

        console.log(`🔍 Encontrados ${jsFiles.length} arquivos JavaScript para minificar.`);

        // Processar cada arquivo individualmente
        const promises = jsFiles.map(processJS);
        await Promise.all(promises);

        // Criar arquivo com todos os JS combinados (ideal para produção)
        console.log('🔄 Criando arquivo JavaScript combinado...');

        // Ordem de importância para combinar os scripts
        const orderedFiles = [
            'core/pubsub.js',  // Carregado primeiro: sistema de pub/sub
            'core/state.js',   // Carregado segundo: gerenciador de estado (depende do pub/sub)
            'init.js',         // Inicialização
            'optimizer.js',    // Otimizador
            'i18n.js',         // Internacionalização
            'scripts.js',      // Scripts principais 
            'projeto-detalhe.js', // Scripts da página de detalhes
            'seo-loader.js'    // Carregador de SEO
        ].filter(file => {
            // Verificar se o arquivo existe antes de incluir
            const fullPath = path.join(JS_DIR, file);
            const exists = fs.existsSync(fullPath);
            if (!exists) {
                console.log(`⚠️ Arquivo ordenado não encontrado: ${file}, será ignorado`);
            }
            return exists;
        });

        // Adicionar arquivos restantes que não estão na ordem definida
        const allFiles = [];
        function collectFilesRecursively(dir, baseDir = '') {
            const files = fs.readdirSync(dir);
            files.forEach(file => {
                const filePath = path.join(dir, file);
                const relativePath = path.join(baseDir, file);

                if (fs.statSync(filePath).isDirectory()) {
                    // Se for um diretório, processe recursivamente
                    collectFilesRecursively(filePath, path.join(baseDir, file));
                } else if (file.endsWith('.js')) {
                    // Se for um arquivo .js, adicione à lista
                    allFiles.push(relativePath);
                }
            });
        }

        collectFilesRecursively(JS_DIR);

        const remainingFiles = allFiles.filter(file =>
            !orderedFiles.includes(file)
        );

        const finalOrderedFiles = [...orderedFiles, ...remainingFiles];
        console.log(`📄 Ordem de arquivos para minificação: ${finalOrderedFiles.join(', ')}`);

        const allJsContent = {};
        finalOrderedFiles.forEach(file => {
            const filePath = path.join(JS_DIR, file);
            if (fs.existsSync(filePath)) {
                allJsContent[file] = fs.readFileSync(filePath, 'utf8');
                console.log(`✅ Adicionado ao pacote combinado: ${file}`);
            }
        });

        const combinedMinified = await minify(allJsContent, {
            ...terserOptions,
            sourceMap: false // Desativar sourcemap para versão combinada
        });

        fs.writeFileSync(
            path.join(DIST_JS_DIR, 'scripts.combined.min.js'),
            combinedMinified.code
        );

        const combinedSize = (combinedMinified.code.length / 1024).toFixed(2);
        console.log(`✅ scripts.combined.min.js: ${combinedSize} KB`);

        // Atualizar o HTML para usar o script combinado na versão de produção
        updateHTML();

        console.log('🎉 Minificação JavaScript concluída com sucesso!');
    } catch (error) {
        console.error('❌ Erro durante a minificação JavaScript:', error);
    }
}

/**
 * Atualiza o HTML para usar versões minificadas na produção
 */
function updateHTML() {
    // Lista de arquivos HTML a serem processados
    const htmlFiles = [
        path.join(DIST_DIR, 'index.html'),
        path.join(DIST_DIR, 'projeto.html')
    ];

    htmlFiles.forEach(htmlPath => {
        if (!fs.existsSync(htmlPath)) {
            console.log(`⚠️ Arquivo HTML não encontrado: ${path.basename(htmlPath)}`);
            return;
        }

        try {
            console.log(`🔄 Processando ${path.basename(htmlPath)}...`);
            let html = fs.readFileSync(htmlPath, 'utf8');
            let htmlOriginal = html; // Para comparar mudanças no final

            // Substituir referências aos arquivos CSS
            // 1. Remover a tag fonts.css completamente
            html = html.replace(
                /<link href="css\/fonts\.css" rel="stylesheet".*?>/g,
                ''
            );

            // 2. Substituir style.css pelo arquivo combinado - atualiza a tag já existente
            html = html.replace(
                /<link href="css\/style\.css" rel="stylesheet".*?>/g,
                '<link href="css/styles.combined.min.css" rel="stylesheet">'
            );

            // 3. Garantir que não haja referências duplicadas ao arquivo combinado
            if (!html.includes('<link href="css/styles.combined.min.css" rel="stylesheet">')) {
                // Se ainda não tem a referência ao CSS combinado, adicionar após a tag head
                html = html.replace(
                    /<head>/,
                    '<head>\n    <link href="css/styles.combined.min.css" rel="stylesheet">'
                );
            }

            // Lidar com todos os scripts: reunir todas as ocorrências primeiro
            const scriptTags = [];
            let match;
            const scriptRegex = /<script.*?src="js\/(.*?)\.js".*?><\/script>/g;

            // Encontrar todas as tags de script
            while ((match = scriptRegex.exec(html)) !== null) {
                scriptTags.push({
                    fullMatch: match[0],
                    filename: match[1],
                    position: match.index
                });
            }

            console.log(`   - Encontradas ${scriptTags.length} tags de script em ${path.basename(htmlPath)}`);

            if (scriptTags.length > 0) {
                // Ordenar por posição no documento para substituir na ordem correta
                scriptTags.sort((a, b) => a.position - b.position);

                // Adicionar o script combinado no lugar do primeiro script
                html = html.replace(
                    scriptTags[0].fullMatch,
                    '<script src="js/scripts.combined.min.js"></script>'
                );

                // Remover todas as demais tags de script JS
                for (let i = 1; i < scriptTags.length; i++) {
                    html = html.replace(scriptTags[i].fullMatch, '');
                }
            }

            // Verificar se foram feitas alterações
            const tagsAlteradas = htmlOriginal !== html;

            // Salvar o HTML atualizado
            fs.writeFileSync(htmlPath, html);
            console.log(`✅ ${path.basename(htmlPath)} atualizado para usar arquivos minificados e combinados (${tagsAlteradas ? 'alterações aplicadas' : 'sem alterações'})`);

            // Informações detalhadas sobre as alterações
            console.log(`   - ${scriptTags.length} tags de script manipuladas`);
            console.log(`   - Arquivo CSS combinado: ${html.includes('styles.combined.min.css') ? 'Aplicado' : 'Não aplicado'}`);
            console.log(`   - Arquivo JS combinado: ${html.includes('scripts.combined.min.js') ? 'Aplicado' : 'Não aplicado'}`);

        } catch (error) {
            console.error(`❌ Erro ao atualizar ${path.basename(htmlPath)}:`, error.message);
        }
    });
}

// Executar minificação
minifyAllJS();