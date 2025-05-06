// i18n.js - Sistema de internacionalização centralizado
/**
 * Sistema de internacionalização com mecanismo de fallback robusto
 * Implementa um sistema hierárquico para fallback de traduções ausentes:
 * 1. Tradução do idioma solicitado
 * 2. Tradução do idioma padrão (português)
 * 3. Chave de tradução original
 * 4. Valor padrão opcional fornecido
 */

// Configurações do sistema de tradução
const I18nConfig = {
    // Idioma padrão para fallback
    idiomaDefault: 'pt',

    // Idiomas suportados
    idiomasSuportados: ['pt', 'en', 'es'],

    // Configuração de cache com versionamento
    cache: {
        versao: '1.0.1',
        tempoExpiracaoCache: 7 * 24 * 60 * 60 * 1000, // 7 dias em milissegundos
        prefixoChave: 'portfolio_'
    },

    // Logs detalhados para ajudar na depuração
    debug: false
};

// Armazenará o cache de traduções em memória
const traducoesCache = {
    // Exemplo: { pt: {...}, en: {...} }
};

// Classe do sistema de internacionalização
class I18nManager {
    constructor() {
        this.idiomaAtual = localStorage.getItem('idioma') || I18nConfig.idiomaDefault;
        this.traducoes = {}; // Cache em memória das traduções
        this.carregando = {}; // Para controlar solicitações de carregamento pendentes
        this.callbacks = []; // Lista de callbacks para executar após mudança de idioma

        // Garantir que os idiomas padrão e atual sejam carregados
        this.precarregarIdiomas();
    }

    /**
     * Carrega previamente o idioma atual e o idioma padrão para garantir
     * que as traduções estejam disponíveis rapidamente.
     */
    async precarregarIdiomas() {
        try {
            // Sempre carregar o idioma padrão primeiro para servir como base de fallback
            if (this.idiomaAtual !== I18nConfig.idiomaDefault) {
                await this.carregarTraducoes(I18nConfig.idiomaDefault);
            }

            // Carregar o idioma atual por último para substituir quaisquer chaves do idioma padrão
            await this.carregarTraducoes(this.idiomaAtual);

            // Indicar que o sistema está pronto
            if (I18nConfig.debug) {
                console.log(`[I18n] Sistema inicializado com o idioma: ${this.idiomaAtual}`);
            }
        } catch (error) {
            console.error('[I18n] Erro ao pré-carregar traduções:', error);
        }
    }

    /**
     * Carrega as traduções de um idioma específico
     * @param {string} idioma - Código do idioma a ser carregado
     * @returns {Promise<object>} - Objeto com as traduções
     */
    async carregarTraducoes(idioma) {
        // Se já temos as traduções em cache na memória, retorná-las imediatamente
        if (this.traducoes[idioma]) {
            return this.traducoes[idioma];
        }

        // Se já estamos carregando esse idioma, aguardar a promessa existente
        if (this.carregando[idioma]) {
            return this.carregando[idioma];
        }

        // Verificar cache no localStorage
        const cacheKey = `${I18nConfig.cache.prefixoChave}traducao_${idioma}`;
        const cacheKeyVersao = `${I18nConfig.cache.prefixoChave}traducao_versao_${idioma}`;
        const cacheKeyData = `${I18nConfig.cache.prefixoChave}traducao_data_${idioma}`;

        const cachedVersion = localStorage.getItem(cacheKeyVersao);
        const cachedDate = localStorage.getItem(cacheKeyData);
        const cachedTranslation = localStorage.getItem(cacheKey);

        // Verificar se o cache está válido
        const isCacheValid = cachedVersion === I18nConfig.cache.versao &&
            cachedDate &&
            (Date.now() - parseInt(cachedDate)) < I18nConfig.cache.tempoExpiracaoCache &&
            cachedTranslation;

        if (isCacheValid) {
            if (I18nConfig.debug) {
                console.log(`[I18n] Usando traduções em cache para o idioma ${idioma}`);
            }

            try {
                const traducoes = JSON.parse(cachedTranslation);
                this.traducoes[idioma] = traducoes;
                return traducoes;
            } catch (error) {
                console.error(`[I18n] Erro ao processar cache de traduções para ${idioma}:`, error);
                // Se houver erro no cache, continuar e buscar do servidor
            }
        }

        // Criar uma promessa de carregamento e armazená-la
        this.carregando[idioma] = new Promise(async (resolve, reject) => {
            try {
                if (I18nConfig.debug) {
                    console.log(`[I18n] Buscando traduções do servidor para ${idioma}`);
                }

                const response = await fetch(`i18n/${idioma}.json`);

                if (!response.ok) {
                    throw new Error(`Falha ao carregar arquivo de tradução para ${idioma}: ${response.status}`);
                }

                const traducoes = await response.json();

                // Salvar no cache local
                try {
                    localStorage.setItem(cacheKey, JSON.stringify(traducoes));
                    localStorage.setItem(cacheKeyVersao, I18nConfig.cache.versao);
                    localStorage.setItem(cacheKeyData, Date.now().toString());

                    if (I18nConfig.debug) {
                        console.log(`[I18n] Traduções para ${idioma} armazenadas em cache`);
                    }
                } catch (cacheError) {
                    console.warn(`[I18n] Não foi possível armazenar traduções em cache:`, cacheError);
                    this.limparCacheAntigo(); // Tentar limpar cache antigo para liberar espaço
                }

                // Armazenar no cache em memória
                this.traducoes[idioma] = traducoes;

                // Finalizar e remover da lista de carregamentos pendentes
                delete this.carregando[idioma];

                resolve(traducoes);
            } catch (error) {
                console.error(`[I18n] Erro ao carregar traduções para ${idioma}:`, error);

                // Se falhar no carregamento do idioma não-padrão, tentar carregar o idioma padrão
                if (idioma !== I18nConfig.idiomaDefault) {
                    console.log(`[I18n] Tentando fallback para o idioma padrão (${I18nConfig.idiomaDefault})`);

                    try {
                        const traducoesPadrao = await this.carregarTraducoes(I18nConfig.idiomaDefault);
                        resolve(traducoesPadrao);
                    } catch (fallbackError) {
                        console.error(`[I18n] Também falhou ao carregar o idioma padrão:`, fallbackError);
                        reject(error); // Rejeitar com o erro original
                    }
                } else {
                    // Se falhar no idioma padrão, rejeitar com o erro
                    reject(error);
                }

                // Finalizar e remover da lista de carregamentos pendentes
                delete this.carregando[idioma];
            }
        });

        return this.carregando[idioma];
    }

    /**
     * Obtém o valor de uma tradução com sistema de fallback hierárquico
     * @param {string} chave - Chave da tradução no formato "secao.subsecao.chave"
     * @param {object} params - Parâmetros para substituição em marcadores de placeholder
     * @param {string} idioma - Idioma específico para buscar (opcional, usa o atual por padrão)
     * @param {string} valorPadrao - Valor padrão caso a tradução não seja encontrada
     * @returns {string} - Texto traduzido ou valor de fallback
     */
    async traduzir(chave, params = {}, idioma = null, valorPadrao = null) {
        const idiomaAlvo = idioma || this.idiomaAtual;

        try {
            // Primeiro tentar obter tradução do idioma solicitado
            const traducoes = await this.carregarTraducoes(idiomaAlvo);
            let valor = this.buscarValorPorChave(traducoes, chave);

            // Se não encontrar a tradução e não for o idioma padrão, tentar o idioma padrão
            if ((valor === null || valor === undefined) && idiomaAlvo !== I18nConfig.idiomaDefault) {
                if (I18nConfig.debug) {
                    console.log(`[I18n] Chave "${chave}" não encontrada em ${idiomaAlvo}, usando fallback para ${I18nConfig.idiomaDefault}`);
                }

                const traducoesDefault = await this.carregarTraducoes(I18nConfig.idiomaDefault);
                valor = this.buscarValorPorChave(traducoesDefault, chave);
            }

            // Se ainda não encontrar, usar o valor padrão ou a própria chave como fallback final
            if (valor === null || valor === undefined) {
                valor = valorPadrao !== null ? valorPadrao : chave;

                if (I18nConfig.debug) {
                    console.warn(`[I18n] Chave "${chave}" não encontrada em nenhum idioma. Usando fallback:`, valor);
                }
            }

            // Lidar com formatos diferentes de traduções (objeto vs string)
            // Ex: Em pt.json botões são strings, em en.json são {original, traducao}
            if (typeof valor === 'object' && valor !== null && valor.traducao) {
                valor = valor.traducao;
            }

            // Aplicar substituição de parâmetros se houver
            if (params && Object.keys(params).length > 0) {
                valor = this.substituirParametros(valor, params);
            }

            return valor;
        } catch (error) {
            console.error(`[I18n] Erro ao buscar tradução para "${chave}":`, error);

            // Retornar valorPadrao ou a chave como último fallback
            return valorPadrao !== null ? valorPadrao : chave;
        }
    }

    /**
     * Versão síncrona simplificada de traduzir que usa o cache em memória
     * Útil para situações onde o carregamento assíncrono já foi concluído
     * @param {string} chave - Chave da tradução
     * @param {object} params - Parâmetros para substituição
     * @param {string} valorPadrao - Valor padrão se não encontrar tradução
     * @returns {string} - Texto traduzido ou fallback
     */
    traduzirSync(chave, params = {}, valorPadrao = null) {
        // Tentar obter do idioma atual
        let valor = null;

        if (this.traducoes[this.idiomaAtual]) {
            valor = this.buscarValorPorChave(this.traducoes[this.idiomaAtual], chave);
        }

        // Fallback para o idioma padrão
        if ((valor === null || valor === undefined) && this.idiomaAtual !== I18nConfig.idiomaDefault) {
            if (this.traducoes[I18nConfig.idiomaDefault]) {
                valor = this.buscarValorPorChave(this.traducoes[I18nConfig.idiomaDefault], chave);
            }
        }

        // Último fallback
        if (valor === null || valor === undefined) {
            valor = valorPadrao !== null ? valorPadrao : chave;
        }

        // Lidar com diferentes formatos
        if (typeof valor === 'object' && valor !== null && valor.traducao) {
            valor = valor.traducao;
        }

        // Aplicar substituição de parâmetros
        if (params && Object.keys(params).length > 0) {
            valor = this.substituirParametros(valor, params);
        }

        return valor;
    }

    /**
     * Busca um valor em um objeto usando uma chave no formato de caminho "a.b.c"
     * @param {object} obj - Objeto a ser buscado
     * @param {string} chave - Chave no formato de caminho
     * @returns {*} - Valor encontrado ou null
     */
    buscarValorPorChave(obj, chave) {
        if (!obj || !chave) return null;

        const partes = chave.split('.');
        let valor = obj;

        for (let i = 0; i < partes.length; i++) {
            if (valor === null || valor === undefined || typeof valor !== 'object') {
                return null;
            }

            valor = valor[partes[i]];
        }

        return valor;
    }

    /**
     * Substitui parâmetros no formato {{nome}} no texto
     * @param {string} texto - Texto com marcadores de placeholder
     * @param {object} params - Objeto com valores para substituição
     * @returns {string} - Texto com parâmetros substituídos
     */
    substituirParametros(texto, params) {
        if (typeof texto !== 'string') return texto;

        let resultado = texto;

        for (const [chave, valor] of Object.entries(params)) {
            const regex = new RegExp(`{{${chave}}}`, 'g');
            resultado = resultado.replace(regex, valor);
        }

        return resultado;
    }

    /**
     * Altera o idioma atual e carrega as traduções
     * @param {string} idioma - Código do idioma para alterar
     * @returns {Promise<boolean>} - Sucesso da operação
     */
    async alterarIdioma(idioma) {
        if (!I18nConfig.idiomasSuportados.includes(idioma)) {
            console.error(`[I18n] Idioma não suportado: ${idioma}`);
            return false;
        }

        try {
            // Salvar o idioma selecionado no localStorage com controle de versão
            localStorage.setItem('idioma', idioma);
            localStorage.setItem('idioma_versao', I18nConfig.cache.versao);
            localStorage.setItem('idioma_data', Date.now().toString());

            // Atualizar o idioma atual
            this.idiomaAtual = idioma;

            // Pré-carregar as traduções (se não estiverem em cache)
            await this.carregarTraducoes(idioma);

            // Disparar callbacks de alteração de idioma
            for (const callback of this.callbacks) {
                try {
                    await callback(idioma);
                } catch (e) {
                    console.error(`[I18n] Erro em callback de alteração de idioma:`, e);
                }
            }

            return true;
        } catch (error) {
            console.error(`[I18n] Erro ao alterar idioma para ${idioma}:`, error);
            return false;
        }
    }

    /**
     * Registra um callback para ser executado quando o idioma for alterado
     * @param {Function} callback - Função a ser executada
     */
    onIdiomaAlterado(callback) {
        if (typeof callback === 'function') {
            this.callbacks.push(callback);
        }
    }

    /**
     * Limpa callbacks de alteração de idioma
     * @param {Function} callback - Callback específico para remover, ou null para remover todos
     */
    removerCallback(callback = null) {
        if (callback === null) {
            this.callbacks = [];
        } else {
            this.callbacks = this.callbacks.filter(cb => cb !== callback);
        }
    }

    /**
     * Traduz elementos HTML com atributos data-i18n
     * @param {HTMLElement} container - Elemento contêiner para traduzir, ou document para toda a página
     * @returns {Promise<void>}
     */
    async traduzirElementos(container = document) {
        try {
            // Tradução de títulos de documento
            if (container === document) {
                const tituloDoc = await this.traduzir('tituloDocumento');
                document.title = tituloDoc;

                // Meta descrição
                const metaDesc = document.querySelector('meta[name="description"]');
                if (metaDesc) {
                    const descricao = await this.traduzir('metaDescricao');
                    metaDesc.setAttribute('content', descricao);
                }
            }

            // Elementos com atributo data-i18n
            container.querySelectorAll('[data-i18n]').forEach(async (elemento) => {
                const chave = elemento.getAttribute('data-i18n');
                const texto = await this.traduzir(chave);
                elemento.textContent = texto;
            });

            // Elementos com atributo data-i18n-html (para conteúdo HTML)
            container.querySelectorAll('[data-i18n-html]').forEach(async (elemento) => {
                const chave = elemento.getAttribute('data-i18n-html');
                const html = await this.traduzir(chave);
                elemento.innerHTML = html;
            });

            // Botões especiais
            container.querySelectorAll('[data-i18n-botao]').forEach(async (botao) => {
                const chave = botao.getAttribute('data-i18n-botao');
                const chaveBotao = chave.split('.').pop();
                const caminho = `botoes.${chaveBotao}`;
                const html = await this.traduzir(caminho);
                botao.innerHTML = html;
            });

            // Placeholder para elementos de formulário
            container.querySelectorAll('[data-i18n-placeholder]').forEach(async (elemento) => {
                const chave = elemento.getAttribute('data-i18n-placeholder');
                const texto = await this.traduzir(chave);
                elemento.setAttribute('placeholder', texto);
            });

            // Alt para imagens
            container.querySelectorAll('[data-i18n-alt]').forEach(async (elemento) => {
                const chave = elemento.getAttribute('data-i18n-alt');
                const texto = await this.traduzir(chave);
                elemento.setAttribute('alt', texto);
            });
        } catch (error) {
            console.error(`[I18n] Erro ao traduzir elementos:`, error);
        }
    }

    /**
     * Limpa cache antigo quando o armazenamento estiver cheio
     */
    limparCacheAntigo() {
        console.log("[I18n] Limpando cache antigo para liberar espaço");

        try {
            // Coletar todas as chaves relacionadas a traduções
            const chavesDeTradução = [];
            const prefixo = `${I18nConfig.cache.prefixoChave}traducao_`;

            for (let i = 0; i < localStorage.length; i++) {
                const chave = localStorage.key(i);
                if (chave && chave.startsWith(prefixo)) {
                    // Coletar informações para decidir o que remover
                    const idioma = chave.replace(prefixo, '').split('_')[0]; // Extrair o idioma
                    const data = localStorage.getItem(`${I18nConfig.cache.prefixoChave}traducao_data_${idioma}`);

                    chavesDeTradução.push({
                        chave,
                        idioma,
                        data: data ? parseInt(data) : 0
                    });
                }
            }

            // Ordenar por data (mais antigas primeiro)
            chavesDeTradução.sort((a, b) => a.data - b.data);

            // Remover a metade mais antiga
            const removerQuantidade = Math.ceil(chavesDeTradução.length / 2);
            for (let i = 0; i < removerQuantidade && i < chavesDeTradução.length; i++) {
                const item = chavesDeTradução[i];
                localStorage.removeItem(item.chave); // Remover a tradução
                localStorage.removeItem(`${I18nConfig.cache.prefixoChave}traducao_versao_${item.idioma}`); // Remover a versão
                localStorage.removeItem(`${I18nConfig.cache.prefixoChave}traducao_data_${item.idioma}`); // Remover a data

                if (I18nConfig.debug) {
                    console.log(`[I18n] Cache removido: ${item.chave}`);
                }
            }

            console.log(`[I18n] ${removerQuantidade} itens de cache antigos removidos`);
        } catch (error) {
            console.error("[I18n] Erro ao limpar cache:", error);
        }
    }

    /**
     * Obtém o idioma atual
     * @returns {string} Código do idioma atual
     */
    getIdiomaAtual() {
        return this.idiomaAtual;
    }

    /**
     * Obtém a lista de idiomas suportados
     * @returns {string[]} Array com códigos dos idiomas suportados
     */
    getIdiomasSuportados() {
        return I18nConfig.idiomasSuportados;
    }
}

// Exportar uma instância única para toda a aplicação (Singleton)
window.i18n = new I18nManager();

// Carregar traduções imediatamente ao importar este script
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se o script foi carregado após o DOMContentLoaded
    if (document.readyState === 'loading') {
        if (I18nConfig.debug) {
            console.log('[I18n] Aguardando DOMContentLoaded para inicializar as traduções');
        }
    } else {
        if (I18nConfig.debug) {
            console.log('[I18n] DOM já carregado, inicializando traduções');
        }
        window.i18n.traduzirElementos();
    }
});

// Exportar funções para facilitar o uso global
window.t = async function (chave, params, valorPadrao) {
    return await window.i18n.traduzir(chave, params, null, valorPadrao);
};

// Versão síncrona para uso mais simples em situações onde a promessa já pode estar resolvida
window.tSync = function (chave, params, valorPadrao) {
    return window.i18n.traduzirSync(chave, params, valorPadrao);
};

// Expor alteração de idioma como uma função global
window.alterarIdioma = async function (idioma) {
    const resultado = await window.i18n.alterarIdioma(idioma);
    if (resultado) {
        await window.i18n.traduzirElementos();
    }
    return resultado;
};