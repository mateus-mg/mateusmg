/**
 * Script para tradução automática dos textos do arquivo pt.json para en.json e es.json
 * Utiliza um mecanismo local de tradução baseado em regras e dicionários sem dependência
 * de APIs externas para manter a independência
 */

const fs = require('fs-extra');
const path = require('path');

// Conjunto de ícones para mensagens de console
const icons = {
    init: '🚀',
    translate: '🌐',
    dictionary: '📚',
    en: '🇬🇧',
    es: '🇪🇸',
    pt: '🇧🇷',
    save: '💾',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    processing: '⚙️',
    time: '⏱️',
    merge: '🔄'
};

// Caminhos importantes
const ROOT_DIR = path.resolve(__dirname, '../');
const I18N_DIR = path.join(ROOT_DIR, 'i18n');
const PT_JSON_PATH = path.join(I18N_DIR, 'pt.json');
const EN_JSON_PATH = path.join(I18N_DIR, 'en.json');
const ES_JSON_PATH = path.join(I18N_DIR, 'es.json');

// Dicionários básicos para tradução
// Nota: Em um projeto real, esses dicionários seriam mais completos e específicos para o domínio
const dicionarioPtEn = {
    // Navegação
    'Sobre mim': 'About Me',
    'Experiências': 'Experience',
    'Portfólio': 'Portfolio',
    'Projetos': 'Projects',
    'Serviços': 'Services',
    'Contato': 'Contact',
    'Voltar': 'Back',

    // Botões comuns
    'Enviar': 'Send',
    'Enviar Mensagem': 'Send Message',
    'Anterior': 'Previous',
    'Próximo': 'Next',
    'Ver mais': 'View More',
    'Ver no GitHub': 'View on GitHub',
    'Baixe meu CV': 'Download my CV',
    'Voltar para a Página Inicial': 'Back to Home Page',
    'Voltar ao topo': 'Back to Top',

    // Títulos de seção
    'Sobre mim': 'About Me',
    'Experiência': 'Experience',
    'Formação': 'Education',
    'Habilidades': 'Skills',
    'Contato': 'Contact',
    'Tecnologias': 'Technologies',
    'Descrição': 'Description',
    'Relatório do Projeto': 'Project Report',

    // Formulário de contato
    'Nome': 'Name',
    'Email': 'Email',
    'Assunto': 'Subject',
    'Mensagem': 'Message',
    'Telefone': 'Phone',
    'Orçamento': 'Budget',
    'Parceria': 'Partnership',
    'Proposta de Emprego': 'Job Opportunity',
    'Outro': 'Other',
    'Selecione um assunto': 'Select a subject',

    // Níveis de idioma
    'Nativo': 'Native',
    'Fluente': 'Fluent',
    'Intermediário': 'Intermediate',
    'Básico': 'Basic',
    'Avançado': 'Advanced',

    // Frases comuns
    'Olá, seja bem-vindo!': 'Hello, welcome!',
    'Arquiteto de Dados': 'Data Architect',
    'Cientista de Dados': 'Data Scientist',
    'Engenheiro de Dados': 'Data Engineer',
    'Analista de Dados': 'Data Analyst',
};

const dicionarioPtEs = {
    // Navegação
    'Sobre mim': 'Sobre mí',
    'Experiências': 'Experiencias',
    'Portfólio': 'Portafolio',
    'Projetos': 'Proyectos',
    'Serviços': 'Servicios',
    'Contato': 'Contacto',
    'Voltar': 'Volver',

    // Botões comuns
    'Enviar': 'Enviar',
    'Enviar Mensagem': 'Enviar Mensaje',
    'Anterior': 'Anterior',
    'Próximo': 'Siguiente',
    'Ver mais': 'Ver más',
    'Ver no GitHub': 'Ver en GitHub',
    'Baixe meu CV': 'Descargar mi CV',
    'Voltar para a Página Inicial': 'Volver a la Página Principal',
    'Voltar ao topo': 'Volver arriba',

    // Títulos de seção
    'Sobre mim': 'Sobre mí',
    'Experiência': 'Experiencia',
    'Formação': 'Formación',
    'Habilidades': 'Habilidades',
    'Contato': 'Contacto',
    'Tecnologias': 'Tecnologías',
    'Descrição': 'Descripción',
    'Relatório do Projeto': 'Informe del Proyecto',

    // Formulário de contato
    'Nome': 'Nombre',
    'Email': 'Correo',
    'Assunto': 'Asunto',
    'Mensagem': 'Mensaje',
    'Telefone': 'Teléfono',
    'Orçamento': 'Presupuesto',
    'Parceria': 'Asociación',
    'Proposta de Emprego': 'Oferta de Empleo',
    'Outro': 'Otro',
    'Selecione um assunto': 'Seleccione un asunto',

    // Níveis de idioma
    'Nativo': 'Nativo',
    'Fluente': 'Fluido',
    'Intermediário': 'Intermedio',
    'Básico': 'Básico',
    'Avançado': 'Avanzado',

    // Frases comuns
    'Olá, seja bem-vindo!': '¡Hola, bienvenido!',
    'Arquiteto de Dados': 'Arquitecto de Datos',
    'Cientista de Dados': 'Científico de Datos',
    'Engenheiro de Dados': 'Ingeniero de Datos',
    'Analista de Dados': 'Analista de Datos',
};

// Função para traduzir textos simples usando dicionários
function traduzirTextoSimples(texto, dicionario) {
    if (!texto || typeof texto !== 'string') {
        return texto;
    }

    // Verificar se há uma tradução direta no dicionário
    if (dicionario[texto]) {
        return dicionario[texto];
    }

    // Para textos longos, tentar substituir palavras/frases conhecidas
    let traduzido = texto;

    // Ordenar entradas por comprimento (do mais longo para o mais curto)
    // para evitar substituições parciais inadequadas
    const entradas = Object.entries(dicionario)
        .sort((a, b) => b[0].length - a[0].length);

    for (const [original, traducao] of entradas) {
        // Criar um RegExp para substituir a palavra apenas se for uma palavra completa
        // ou se for parte de uma frase maior
        const regex = new RegExp(`\\b${escapeRegExp(original)}\\b`, 'gi');
        traduzido = traduzido.replace(regex, traducao);
    }

    return traduzido;
}

// Escapar caracteres especiais para uso em RegExp
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Função para traduzir um objeto JSON recursivamente
function traduzirObjetoJson(obj, dicionario) {
    if (!obj) return {};

    const resultado = {};

    for (const chave in obj) {
        const valor = obj[chave];

        if (typeof valor === 'string') {
            resultado[chave] = traduzirTextoSimples(valor, dicionario);
        } else if (typeof valor === 'object' && valor !== null) {
            resultado[chave] = traduzirObjetoJson(valor, dicionario);
        } else {
            resultado[chave] = valor;
        }
    }

    return resultado;
}

// Função auxiliar para contar número total de chaves em um objeto (incluindo aninhadas)
function contarChaves(obj) {
    if (!obj || typeof obj !== 'object') return 0;

    let count = 0;

    for (const key in obj) {
        count += 1;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            count += contarChaves(obj[key]);
        }
    }

    return count;
}

// Função para mesclar dois objetos JSON, preservando valores existentes
function mesclarJsons(existente, novo) {
    const resultado = { ...existente };

    // Função recursiva para mesclar propriedades
    function mesclarRecursivamente(destino, origem) {
        for (const chave in origem) {
            // Se a chave não existe no destino ou é uma string vazia, copiar do novo
            if (destino[chave] === undefined ||
                (typeof destino[chave] === 'string' && destino[chave].trim() === '')) {
                destino[chave] = origem[chave];
            }
            // Se ambos são objetos, mesclar recursivamente
            else if (typeof destino[chave] === 'object' &&
                typeof origem[chave] === 'object' &&
                destino[chave] !== null &&
                origem[chave] !== null) {
                mesclarRecursivamente(destino[chave], origem[chave]);
            }
            // Caso contrário, manter o valor existente
        }
    }

    mesclarRecursivamente(resultado, novo);
    return resultado;
}

// Função principal de auto tradução
async function realizarAutoTraducao() {
    try {
        console.log(`\n${icons.init} Iniciando tradução automática...`);
        console.log(`${icons.time} Início: ${new Date().toLocaleTimeString()}`);

        // Verificar se o arquivo pt.json existe
        if (!fs.existsSync(PT_JSON_PATH)) {
            console.error(`${icons.error} Arquivo pt.json não encontrado. Execute primeiro a extração de traduções.`);
            return false;
        }

        // Carregar o arquivo pt.json
        console.log(`${icons.pt} Carregando arquivo de origem pt.json...`);
        const ptJson = fs.readJsonSync(PT_JSON_PATH);
        console.log(`${icons.dictionary} Dicionário português carregado com ${contarChaves(ptJson)} entradas totais`);

        // Carregar arquivos existentes (para preservar traduções já existentes)
        let enJson = {};
        let esJson = {};

        if (fs.existsSync(EN_JSON_PATH)) {
            console.log(`${icons.en} Carregando arquivo en.json existente...`);
            enJson = fs.readJsonSync(EN_JSON_PATH);
            console.log(`${icons.dictionary} Dicionário inglês existente tem ${contarChaves(enJson)} entradas`);
        }

        if (fs.existsSync(ES_JSON_PATH)) {
            console.log(`${icons.es} Carregando arquivo es.json existente...`);
            esJson = fs.readJsonSync(ES_JSON_PATH);
            console.log(`${icons.dictionary} Dicionário espanhol existente tem ${contarChaves(esJson)} entradas`);
        }

        // Traduzir para inglês
        console.log(`${icons.translate} Traduzindo para inglês...`);
        const enJsonNovo = traduzirObjetoJson(ptJson, dicionarioPtEn);
        console.log(`${icons.success} Tradução para inglês concluída`);

        // Traduzir para espanhol
        console.log(`${icons.translate} Traduzindo para espanhol...`);
        const esJsonNovo = traduzirObjetoJson(ptJson, dicionarioPtEs);
        console.log(`${icons.success} Tradução para espanhol concluída`);

        // Mesclar com arquivos existentes (mantendo traduções já existentes)
        console.log(`${icons.merge} Mesclando com traduções existentes em inglês...`);
        const enJsonFinal = mesclarJsons(enJson, enJsonNovo);

        console.log(`${icons.merge} Mesclando com traduções existentes em espanhol...`);
        const esJsonFinal = mesclarJsons(esJson, esJsonNovo);

        // Salvar os arquivos
        await fs.writeJson(EN_JSON_PATH, enJsonFinal, { spaces: 2 });
        console.log(`${icons.save} Arquivo ${path.relative(ROOT_DIR, EN_JSON_PATH)} atualizado com ${contarChaves(enJsonFinal)} entradas.`);

        await fs.writeJson(ES_JSON_PATH, esJsonFinal, { spaces: 2 });
        console.log(`${icons.save} Arquivo ${path.relative(ROOT_DIR, ES_JSON_PATH)} atualizado com ${contarChaves(esJsonFinal)} entradas.`);

        console.log(`${icons.success} Tradução automática concluída com sucesso!`);
        console.log(`${icons.time} Fim: ${new Date().toLocaleTimeString()}`);

        return true;
    } catch (error) {
        console.error(`${icons.error} Erro durante a tradução automática:`, error);
        return false;
    }
}

// Executar a função se este arquivo for chamado diretamente (não importado como módulo)
if (require.main === module) {
    console.log(`${icons.init} Executando auto-tradução como script independente`);

    realizarAutoTraducao()
        .then(result => {
            if (result) {
                process.exit(0);
            } else {
                process.exit(1);
            }
        })
        .catch(err => {
            console.error(`${icons.error} Erro inesperado:`, err);
            process.exit(1);
        });
}

// Exportar a função como módulo
module.exports = realizarAutoTraducao;
