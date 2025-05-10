/**
 * Ferramentas de Desenvolvimento para i18n
 * Este arquivo contém utilitários para ajudar no desenvolvimento e teste
 * do sistema de internacionalização.
 */

// Namespace global para as ferramentas de i18n
window.I18nDevTools = {
    /**
     * Realça visualmente textos que não possuem traduções
     * 
     * Esta função procura elementos no DOM com atributos data-i18n
     * e verifica se suas traduções existem no idioma atual.
     * Elementos sem tradução são destacados com uma borda vermelha pontilhada.
     * 
     * @param {boolean} enabled - Ativa ou desativa o destaque
     * @param {object} options - Opções de configuração
     */
    highlightUntranslatedTexts: function (enabled = true, options = {}) {
        // Opções padrão
        const config = {
            borderStyle: '2px dashed red',
            backgroundColor: 'rgba(255, 0, 0, 0.05)',
            showTooltip: true,
            highlightInlineAttributes: true, // Destacar títulos, aria-labels, etc
            ...options
        };

        if (!window.i18n) {
            console.warn('Sistema i18n não encontrado, não é possível verificar traduções.');
            return;
        }

        // Remover destaques anteriores
        document.querySelectorAll('.i18n-dev-highlight').forEach(el => {
            el.classList.remove('i18n-dev-highlight');
            el.style.border = '';
            el.style.backgroundColor = '';

            if (el._originalTitle) {
                el.title = el._originalTitle;
                delete el._originalTitle;
            }
        });

        if (!enabled) return;

        // Obter o idioma atual
        const idiomaAtual = window.i18n.getIdiomaAtual();
        console.log(`Verificando textos não traduzidos para o idioma: ${idiomaAtual}`);

        // Função que verifica se uma chave de tradução existe e tem valor
        const chaveExiste = window.i18n.temTraducao || function (chave) {
            try {
                const traducoes = window.i18n._obterTraducoes(idiomaAtual);
                const partes = chave.split('.');
                let atual = traducoes;

                for (const parte of partes) {
                    if (!atual || typeof atual !== 'object') return false;
                    atual = atual[parte];
                }

                return atual !== undefined && atual !== '';
            } catch (error) {
                console.error('Erro ao verificar chave de tradução:', error);
                return true; // Assume que existe em caso de erro
            }
        };

        // 1. Verificar elementos com data-i18n
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const chave = el.getAttribute('data-i18n');
            if (!chave) return;

            if (!chaveExiste(chave)) {
                destacarElemento(el, `Chave não traduzida: ${chave}`, config);
            }
        });

        // 2. Verificar atributos data-i18n-*
        if (config.highlightInlineAttributes) {
            document.querySelectorAll('*[data-i18n-aria], *[data-i18n-title], *[data-i18n-placeholder], *[data-i18n-alt]').forEach(el => {
                for (const attr of el.attributes) {
                    if (attr.name.startsWith('data-i18n-')) {
                        const tipoAttr = attr.name.replace('data-i18n-', '');
                        const chave = attr.value;

                        if (!chave) continue;

                        if (!chaveExiste(chave)) {
                            destacarElemento(el, `Atributo não traduzido (${tipoAttr}): ${chave}`, config);
                        }
                    }
                }
            });
        }

        console.log('Verificação de traduções concluída');

        // Função auxiliar para destacar um elemento
        function destacarElemento(el, mensagem, config) {
            el.classList.add('i18n-dev-highlight');
            el.style.border = config.borderStyle;
            el.style.backgroundColor = config.backgroundColor;

            if (config.showTooltip) {
                // Guardar o título original se existir
                if (el.title) {
                    el._originalTitle = el.title;
                }
                el.title = mensagem;
            }
        }
    },

    /**
     * Verifica e relata todas as traduções ausentes no idioma atual
     * @returns {Promise<object>} - Objeto com estatísticas e chaves ausentes
     */
    verificarTraducoesAusentes: async function () {
        if (!window.i18n) {
            console.warn('Sistema i18n não encontrado, não é possível verificar traduções.');
            return {
                status: 'erro',
                mensagem: 'Sistema i18n não encontrado'
            };
        }

        const idiomaAtual = window.i18n.getIdiomaAtual();
        console.log(`Analisando traduções ausentes para o idioma: ${idiomaAtual}`);

        const resultado = {
            idioma: idiomaAtual,
            chavesAusentes: [],
            total: {
                encontradas: 0,
                ausentes: 0,
                percentualCompleto: 0
            }
        };

        try {
            // 1. Obter todas as chaves do idioma padrão
            const idiomaDefault = window.i18n.getIdiomaDefault();
            const todasChaves = await this.extrairTodasChaves(idiomaDefault);
            resultado.total.encontradas = todasChaves.length;

            // 2. Verificar cada chave no idioma atual
            for (const chave of todasChaves) {
                try {
                    const traduzido = await window.i18n.traduzirSync(chave);
                    const valorPadrao = await window.i18n.traduzirSync(chave, {}, idiomaDefault);

                    // Se a tradução for igual à do idioma padrão, consideramos ausente
                    if (traduzido === valorPadrao && idiomaAtual !== idiomaDefault) {
                        resultado.chavesAusentes.push({
                            chave,
                            valorPadrao
                        });
                    }
                } catch (error) {
                    resultado.chavesAusentes.push({
                        chave,
                        erro: error.message
                    });
                }
            }

            resultado.total.ausentes = resultado.chavesAusentes.length;
            resultado.total.percentualCompleto = Math.round(
                ((resultado.total.encontradas - resultado.total.ausentes) / resultado.total.encontradas) * 100
            );

            // Exibir resultados no console
            console.log(`Análise de traduções ausentes concluída para ${idiomaAtual}:`);
            console.log(`- Total de chaves: ${resultado.total.encontradas}`);
            console.log(`- Chaves ausentes: ${resultado.total.ausentes}`);
            console.log(`- Percentual completo: ${resultado.total.percentualCompleto}%`);

            if (resultado.chavesAusentes.length > 0) {
                console.group('Chaves ausentes:');
                resultado.chavesAusentes.slice(0, 10).forEach(item => {
                    console.log(`${item.chave}: "${item.valorPadrao || ''}"`);
                });

                if (resultado.chavesAusentes.length > 10) {
                    console.log(`... e mais ${resultado.chavesAusentes.length - 10} chaves`);
                }
                console.groupEnd();
            }

            return resultado;

        } catch (error) {
            console.error('Erro ao verificar traduções ausentes:', error);
            return {
                status: 'erro',
                mensagem: error.message,
                erro: error
            };
        }
    },

    /**
     * Extrai todas as chaves disponíveis em um idioma específico
     * @param {string} idioma - O idioma para extrair as chaves
     * @returns {Promise<string[]>} - Lista de chaves de tradução
     */
    extrairTodasChaves: async function (idioma = 'pt') {
        if (!window.i18n) {
            throw new Error('Sistema i18n não encontrado');
        }

        try {
            // Tenta obter as traduções através da API interna do i18n
            const traducoes = await window.i18n._obterTraducoes(idioma);

            if (!traducoes || typeof traducoes !== 'object') {
                throw new Error(`Não foi possível obter traduções para ${idioma}`);
            }

            const chaves = [];

            // Função recursiva para extrair chaves
            function extrairChaves(obj, prefixo = '') {
                for (const [chave, valor] of Object.entries(obj)) {
                    const chaveCompleta = prefixo ? `${prefixo}.${chave}` : chave;

                    if (typeof valor === 'object' && valor !== null) {
                        extrairChaves(valor, chaveCompleta);
                    } else {
                        chaves.push(chaveCompleta);
                    }
                }
            }

            extrairChaves(traducoes);
            return chaves;

        } catch (error) {
            console.error('Erro ao extrair chaves de tradução:', error);
            throw error;
        }
    },

    /**
     * Mostra um painel de desenvolvedor para diagnóstico do sistema i18n
     */
    mostrarPainel: function () {
        // Verificar se o painel já existe
        let painel = document.getElementById('i18n-dev-panel');

        if (painel) {
            painel.style.display = painel.style.display === 'none' ? 'block' : 'none';
            return;
        }

        // Criar painel
        painel = document.createElement('div');
        painel.id = 'i18n-dev-panel';
        painel.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            width: 300px;
            max-height: 400px;
            overflow-y: auto;
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            font-family: monospace;
            font-size: 12px;
            padding: 10px;
            border-radius: 5px;
            z-index: 9999;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
        `;

        // Adicionar conteúdo
        const idiomaAtual = window.i18n?.getIdiomaAtual() || 'desconhecido';
        const idiomaDefault = window.i18n?.getIdiomaDefault() || 'pt';

        painel.innerHTML = `
            <h3 style="margin: 0 0 10px 0; border-bottom: 1px solid #555; padding-bottom: 5px;">i18n Dev Tools</h3>
            
            <div>
                <p>Idioma atual: <strong>${idiomaAtual}</strong></p>
                <p>Idioma padrão: <strong>${idiomaDefault}</strong></p>
            </div>
            
            <div style="margin-top: 10px;">
                <button id="i18n-highlight-btn" style="background: #333; color: white; border: 1px solid #555; padding: 5px; margin-right: 5px;">
                    Destacar não traduzidos
                </button>
                <button id="i18n-check-btn" style="background: #333; color: white; border: 1px solid #555; padding: 5px;">
                    Verificar traduções
                </button>
            </div>
            
            <div id="i18n-status" style="margin-top: 10px; color: #aaa;"></div>
            
            <div style="margin-top: 10px; text-align: right;">
                <button id="i18n-close-btn" style="background: #555; color: white; border: none; padding: 3px 8px;">×</button>
            </div>
        `;

        document.body.appendChild(painel);

        // Adicionar comportamentos
        document.getElementById('i18n-close-btn').addEventListener('click', () => {
            painel.style.display = 'none';
        });

        let destacando = false;
        document.getElementById('i18n-highlight-btn').addEventListener('click', () => {
            destacando = !destacando;
            this.highlightUntranslatedTexts(destacando);
            document.getElementById('i18n-status').textContent = destacando ?
                'Textos não traduzidos destacados' :
                'Destaques removidos';
            document.getElementById('i18n-highlight-btn').textContent = destacando ?
                'Remover destaques' : 'Destacar não traduzidos';
        });

        document.getElementById('i18n-check-btn').addEventListener('click', async () => {
            document.getElementById('i18n-status').textContent = 'Verificando traduções...';
            const resultado = await this.verificarTraducoesAusentes();

            if (resultado.status === 'erro') {
                document.getElementById('i18n-status').textContent = `Erro: ${resultado.mensagem}`;
                return;
            }

            document.getElementById('i18n-status').innerHTML = `
                Idioma: ${resultado.idioma}<br>
                Total de chaves: ${resultado.total.encontradas}<br>
                Chaves ausentes: ${resultado.total.ausentes}<br>
                Completo: ${resultado.total.percentualCompleto}%
            `;
        });
    }
};

// Adicionar estilo global para o indicador visual de desenvolvimento
(function () {
    const style = document.createElement('style');
    style.textContent = `
        /* Estilo para o modo de desenvolvimento - não afeta a produção */
        .i18n-dev-mode {
            position: fixed;
            top: 0;
            right: 0;
            background-color: rgba(255, 0, 0, 0.8);
            color: white;
            padding: 5px 10px;
            font-size: 12px;
            z-index: 9999;
            font-family: monospace;
        }
        
        /* Botão para abrir o painel de debug */
        .i18n-dev-button {
            position: fixed;
            bottom: 10px;
            right: 10px;
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            font-size: 18px;
            cursor: pointer;
            z-index: 9998;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    `;
    document.head.appendChild(style);

    // Detectar se estamos em ambiente de desenvolvimento
    const isDev = window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.includes('.local') ||
        window.location.search.includes('i18n-debug=true');

    if (isDev) {
        document.addEventListener('DOMContentLoaded', () => {
            // Adicionar indicador de modo de desenvolvimento
            const devMode = document.createElement('div');
            devMode.className = 'i18n-dev-mode';
            devMode.textContent = 'i18n DEV';
            document.body.appendChild(devMode);

            // Adicionar botão para abrir o painel
            const button = document.createElement('button');
            button.className = 'i18n-dev-button';
            button.innerHTML = '<span>i18n</span>';
            button.title = 'Abrir painel de desenvolvimento i18n';
            button.addEventListener('click', () => {
                window.I18nDevTools.mostrarPainel();
            });
            document.body.appendChild(button);
        });
    }
})();
