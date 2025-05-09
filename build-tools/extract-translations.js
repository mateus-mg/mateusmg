/**
 * Extrator de traduções para o portfólio - Mateus Galvão
 * Script para extrair automaticamente todas as chaves de tradução do site
 */

const fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');
const glob = require('glob');

// Caminhos importantes
const ROOT_DIR = path.resolve(__dirname, '../');
const I18N_DIR = path.join(ROOT_DIR, 'i18n');
const HTML_FILES = ['index.html', 'projeto.html', '404.html', '500.html'];

// Configuração
const CONFIG = {
    verbose: true, // Mostrar logs detalhados
    defaultLang: 'pt', // Idioma padrão (português)
    supportedLangs: ['pt', 'en', 'es'], // Idiomas suportados
    autoAddAttributes: true, // Adicionar automaticamente atributos de tradução aos elementos HTML
    updateHtmlFiles: true, // Atualizar os arquivos HTML com atributos de tradução
    attributesMap: {
        'data-i18n': { type: 'text' },
        'data-i18n-aria': { type: 'attribute', attribute: 'aria-label' },
        'data-i18n-botao': { type: 'text' },
        'data-i18n-title': { type: 'attribute', attribute: 'title' },
        'data-i18n-placeholder': { type: 'attribute', attribute: 'placeholder' },
        'data-i18n-alt': { type: 'attribute', attribute: 'alt' },
        'data-i18n-value': { type: 'attribute', attribute: 'value' }
    },
    // Seletores adicionais para elementos que podem conter textos traduzíveis mas não têm atributos data-i18n
    additionalSelectors: [
        'h1:not([data-i18n])',
        'h2:not([data-i18n])',
        'h3:not([data-i18n])',
        'h4:not([data-i18n])',
        'h5:not([data-i18n])',
        'h6:not([data-i18n])',
        'p:not([data-i18n])',
        'button:not([data-i18n]):not(.seletor-idioma)',
        'a:not([data-i18n])',
        'label:not([data-i18n])',
        'input[type="submit"]',
        'input[type="button"]',
        'input[type="text"][placeholder]:not([data-i18n])',
        'input[type="email"][placeholder]:not([data-i18n])',
        'input[type="tel"][placeholder]:not([data-i18n])',
        'textarea[placeholder]:not([data-i18n])',
        'select:not([data-i18n])',
        'option:not([data-i18n])',
        '.form-label:not([data-i18n])',
        '.tooltip:not([data-i18n])',
        '.modal-title:not([data-i18n])',
        '.modal-body:not([data-i18n-container]) > :not([data-i18n])',
        '.popup-feedback:not([data-i18n-container]) *:not([data-i18n])',
        '.alert:not([data-i18n])',
        '.notification:not([data-i18n])',
        '.badge:not([data-i18n])',
        '.card-title:not([data-i18n])',
        '.card-text:not([data-i18n])',
        'th:not([data-i18n])',
        'td:not([data-i18n])',
        'figcaption:not([data-i18n])'
    ]
};

// Armazenar todas as chaves de tradução encontradas
const translationKeys = {};

// Para armazenar as traduções existentes
const existingTranslations = {};

/**
 * Função principal para extrair traduções
 */
async function extractTranslations() {
    console.log('🔍 Iniciando extração de chaves de tradução...');

    // Carregar traduções existentes
    await loadExistingTranslations();

    // Processar arquivos HTML
    for (const htmlFile of HTML_FILES) {
        const htmlPath = path.join(ROOT_DIR, htmlFile);
        if (fs.existsSync(htmlPath)) {
            await processHTMLFile(htmlPath);
        } else {
            console.warn(`⚠️ Arquivo não encontrado: ${htmlFile}`);
        }
    }

    // Mesclar as novas chaves com as traduções existentes
    mergeTranslations();

    // Salvar os arquivos de tradução atualizados (com await para aguardar o término)
    await saveTranslationFiles();

    console.log('✅ Extração de traduções concluída com sucesso!');
}

/**
 * Carregar os arquivos de tradução existentes
 */
async function loadExistingTranslations() {
    console.log('📚 Carregando arquivos de tradução existentes...');

    for (const lang of CONFIG.supportedLangs) {
        const filePath = path.join(I18N_DIR, `${lang}.json`);

        if (fs.existsSync(filePath)) {
            try {
                const content = await fs.readFile(filePath, 'utf8');
                existingTranslations[lang] = JSON.parse(content);
                console.log(`✅ Carregado: ${lang}.json`);
            } catch (error) {
                console.error(`❌ Erro ao carregar ${lang}.json:`, error);
                existingTranslations[lang] = {};
            }
        } else {
            console.warn(`⚠️ Arquivo de tradução não encontrado: ${lang}.json`);
            existingTranslations[lang] = {};
        }
    }
}

/**
 * Processa um arquivo HTML para extrair chaves de tradução
 */
async function processHTMLFile(filePath) {
    const fileName = path.basename(filePath);
    console.log(`🔍 Processando ${fileName}...`);

    const html = await fs.readFile(filePath, 'utf8');
    const $ = cheerio.load(html);

    // Contador para chaves encontradas
    let keysFound = 0;

    // Processar elementos com atributos de tradução
    Object.keys(CONFIG.attributesMap).forEach(attr => {
        $(`[${attr}]`).each((i, element) => {
            const key = $(element).attr(attr);
            if (key && key.trim()) {
                addTranslationKey(key);
                keysFound++;
            }
        });
    });

    // Processar elementos adicionais que podem precisar de tradução
    CONFIG.additionalSelectors.forEach(selector => {
        $(selector).each((i, element) => {
            const text = $(element).text().trim();

            // Verificar se o texto existe e não é apenas espaços em branco
            if (text && !isJustCode(text)) {
                // Gerar uma chave baseada no texto e na localização do elemento
                const generatedKey = generateTranslationKey(text, element.name);

                if (CONFIG.verbose) {
                    console.log(`  → Sugerindo tradução para: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}" (${generatedKey})`);
                }

                addTranslationKey(generatedKey, text);

                // Adicionar automaticamente o atributo data-i18n ao elemento
                if (CONFIG.autoAddAttributes) {
                    $(element).attr('data-i18n', generatedKey);
                }

                keysFound++;
            }

            // Verificar atributos que precisam de tradução
            processElementAttributes(element, $, keysFound);
        });
    });

    console.log(`✅ ${fileName}: Encontradas ${keysFound} chaves de tradução.`);

    // Se configurado para atualizar arquivos HTML com atributos de tradução
    if (CONFIG.updateHtmlFiles) {
        const updatedHtml = $.html();
        await fs.writeFile(filePath, updatedHtml, 'utf8');
        console.log(`📝 Arquivo HTML atualizado: ${fileName}`);
    }
}

/**
 * Processa atributos de um elemento que podem precisar de tradução
 */
function processElementAttributes(element, $, keysFound) {
    const attributesToTranslate = [
        'placeholder', 'title', 'alt', 'aria-label', 'value'
    ];

    attributesToTranslate.forEach(attr => {
        const attrValue = $(element).attr(attr);
        if (attrValue && attrValue.trim() && !isJustCode(attrValue)) {
            // Ignorar valores que são caminhos, URLs ou valores numéricos
            if (!/^(https?:\/\/|www\.|\/|#|\d+(\.\d+)?%?$)/.test(attrValue)) {
                const elementType = element.name;
                const generatedKey = generateTranslationKey(attrValue, `${elementType}_${attr}`);

                if (CONFIG.verbose) {
                    console.log(`  → Sugerindo tradução para atributo ${attr}: "${attrValue.substring(0, 30)}${attrValue.length > 30 ? '...' : ''}" (${generatedKey})`);
                }

                addTranslationKey(generatedKey, attrValue);

                // Adicionar automaticamente o atributo de tradução ao elemento
                if (CONFIG.autoAddAttributes) {
                    const attrToAdd = getTranslationAttributeForType(attr);
                    if (attrToAdd) {
                        $(element).attr(attrToAdd, generatedKey);
                    }
                }

                keysFound++;
            }
        }
    });
}

/**
 * Obtém o atributo de tradução correspondente para um tipo de atributo
 */
function getTranslationAttributeForType(attributeType) {
    const attributeMap = {
        'placeholder': 'data-i18n-placeholder',
        'title': 'data-i18n-title',
        'alt': 'data-i18n-alt',
        'aria-label': 'data-i18n-aria',
        'value': 'data-i18n-value'
    };

    return attributeMap[attributeType] || null;
}

/**
 * Verifica se o texto parece ser apenas código ou conteúdo não traduzível
 */
function isJustCode(text) {
    // Textos muito curtos (como ícones ou números isolados)
    if (text.length < 2) return true;

    // Textos que parecem ser código JS, URLs, ou outros conteúdos não traduzíveis
    if (/^({.*}|\[.*\]|https?:\/\/|www\.|<.*>)$/.test(text)) return true;

    return false;
}

/**
 * Gera uma chave de tradução baseada no texto e tipo de elemento
 */
function generateTranslationKey(text, elementType) {
    // Simplificar o texto para criar uma chave
    const simplifiedText = text
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // Remover caracteres especiais
        .replace(/\s+/g, '_')    // Substituir espaços por underscores
        .substring(0, 30);       // Limitar tamanho

    // Prefixo baseado no tipo de elemento
    const prefixMap = {
        h1: 'titulo',
        h2: 'subtitulo',
        h3: 'titulo_secao',
        p: 'paragrafo',
        button: 'botao',
        a: 'link',
        label: 'label',
        input: 'input'
    };

    const prefix = prefixMap[elementType] || 'texto';

    return `auto.${prefix}.${simplifiedText}`;
}

/**
 * Adiciona uma chave de tradução à lista global
 */
function addTranslationKey(key, defaultText = null) {
    // Ignorar chaves vazias
    if (!key || key.trim() === '') return;

    // Verificar se a chave já existe no objeto de traduções
    const parts = key.split('.');

    // Navegar pela estrutura de objetos para chegar ao ponto correto
    let current = translationKeys;
    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) {
            current[part] = {};
        } else if (typeof current[part] !== 'object') {
            // Converter chave simples em objeto para comportar novas subchaves
            current[part] = { '_value': current[part] };
        }
        current = current[part];
    }

    // Último nível - definir o valor com texto padrão 
    const lastPart = parts[parts.length - 1];
    if (!current[lastPart]) {
        current[lastPart] = defaultText || key; // Usar o texto padrão ou a própria chave como valor inicial
    }
}

/**
 * Mescla as novas chaves encontradas com as traduções existentes
 */
function mergeTranslations() {
    console.log('🔄 Mesclando traduções novas com existentes...');

    // Para cada idioma suportado
    for (const lang of CONFIG.supportedLangs) {
        // Se for o idioma padrão, usar as chaves extraídas como base
        if (lang === CONFIG.defaultLang) {
            existingTranslations[lang] = deepMerge(existingTranslations[lang] || {}, translationKeys);
        }
        // Para outros idiomas, garantir que todas as chaves estejam presentes, mas manter as traduções existentes
        else {
            existingTranslations[lang] = ensureAllKeys(existingTranslations[lang] || {}, translationKeys);
        }
    }
}

/**
 * Função recursiva para mesclar objetos de forma profunda
 */
function deepMerge(target, source) {
    const output = Object.assign({}, target);

    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    output[key] = source[key];
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                output[key] = source[key];
            }
        });
    }

    return output;
}

/**
 * Verifica se o valor é um objeto
 */
function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Garante que todas as chaves do source existem no target
 */
function ensureAllKeys(target, source) {
    const output = Object.assign({}, target);

    if (isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    // Se a chave não existe no target, copiar do source
                    output[key] = source[key];
                } else if (isObject(target[key])) {
                    // Se ambos são objetos, continuar recursivamente
                    output[key] = ensureAllKeys(target[key], source[key]);
                } else {
                    // Se target[key] não é objeto mas source[key] é, criar estrutura no target
                    output[key] = ensureAllKeys({}, source[key]);
                }
            } else if (!(key in target)) {
                // Se é um valor simples e não existe no target, copiar e marcar como "NEEDS TRANSLATION"
                output[key] = `[NEEDS TRANSLATION] ${source[key]}`;
            }
            // Se a chave já existe no target como valor simples, manter a tradução existente
        });
    }

    return output;
}

/**
 * Salva os arquivos de tradução atualizados
 */
async function saveTranslationFiles() {
    console.log('💾 Salvando arquivos de tradução atualizados... ' + new Date().toTimeString());

    // Garantir que o diretório i18n exista
    await fs.ensureDir(I18N_DIR);

    // Para cada idioma suportado
    for (const lang of CONFIG.supportedLangs) {
        const filePath = path.join(I18N_DIR, `${lang}.json`);

        try {
            // Salvar o arquivo formatado para fácil leitura
            await fs.writeFile(filePath, JSON.stringify(existingTranslations[lang], null, 4), 'utf8');
            console.log(`✅ Salvo: ${lang}.json (${new Date().toTimeString()})`);
        } catch (error) {
            console.error(`❌ Erro ao salvar ${lang}.json:`, error);
        }
    }
}

// Exportar função principal
module.exports = {
    extractTranslations
};

// Se executado diretamente
if (require.main === module) {
    extractTranslations().catch(error => {
        console.error('❌ Erro durante a extração de traduções:', error);
        process.exit(1);
    });
}
