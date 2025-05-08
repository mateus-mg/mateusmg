/**
 * state.js - Módulo de gerenciamento de estado global da aplicação
 * 
 * Este módulo implementa um padrão de gerenciamento de estado centralizado 
 * para encapsular variáveis globais e fornecer uma API consistente para acessá-las.
 */

// Objeto de estado centralizado
const AppState = {
    // Estado privado
    _state: {
        idioma: {
            atual: localStorage.getItem('idioma') || 'pt',
            projetosCarregados: ['pt'] // idiomas para os quais já temos projetos carregados
        },
        portfolio: {
            paginaAtual: 0,
            emTransicao: false
        },
        cache: {
            versao: '1.0.1',
            tempoExpiracaoCache: 7 * 24 * 60 * 60 * 1000, // 7 dias em milissegundos
            prefixoChave: 'portfolio_'
        },
        isInitialized: false
    },

    // Getters - Acessores para o estado
    get isInitialized() {
        return this._state.isInitialized;
    },

    get idiomaAtual() {
        return this._state.idioma.atual;
    },

    get idiomaProjetoAtual() {
        return this._state.idioma.atual;
    },

    get paginaAtualPortfolio() {
        return this._state.portfolio.paginaAtual;
    },

    get emTransicaoPortfolio() {
        return this._state.portfolio.emTransicao;
    },

    get configCache() {
        return { ...this._state.cache }; // Retornar cópia para evitar mutação direta
    },

    get idiomasProjetosCarregados() {
        return [...this._state.idioma.projetosCarregados]; // Retornar cópia para evitar mutação direta
    },

    // Setters - Modificadores para o estado
    setIdiomaAtual(novoIdioma) {
        if (!novoIdioma) return this._state.idioma.atual;

        const idiomaAntigo = this._state.idioma.atual;
        this._state.idioma.atual = novoIdioma;

        // Salvar no localStorage
        localStorage.setItem('idioma', novoIdioma);
        localStorage.setItem('idioma_versao', this._state.cache.versao);
        localStorage.setItem('idioma_data', Date.now().toString());

        // Verificar se devemos usar o sistema i18n.js para a mudança de idioma
        if (window.i18n && typeof window.alterarIdioma === 'function') {
            // Não publicamos evento aqui, o i18n já vai cuidar disso e chamar traduzirElementos
            // Apenas atualizamos o estado interno
        } else {
            // Se o i18n não estiver disponível, disparar evento como fallback
            if (window.PubSub) {
                PubSub.publish('idioma:alterado', {
                    novo: novoIdioma,
                    antigo: idiomaAntigo
                });
            }
        }

        return novoIdioma;
    },

    setPaginaPortfolio(novaPagina) {
        const paginaAntiga = this._state.portfolio.paginaAtual;
        this._state.portfolio.paginaAtual = novaPagina;

        // Disparar evento para notificar a alteração de página
        if (window.PubSub) {
            PubSub.publish('portfolio:paginaAlterada', {
                nova: novaPagina,
                antiga: paginaAntiga
            });
        }

        return novaPagina;
    },

    setTransicaoPortfolio(emTransicao) {
        this._state.portfolio.emTransicao = emTransicao;

        // Disparar evento relacionado à transição
        if (window.PubSub) {
            PubSub.publish('portfolio:transicao', {
                emTransicao
            });
        }

        return emTransicao;
    },

    adicionarIdiomaCarregado(idioma) {
        if (!this._state.idioma.projetosCarregados.includes(idioma)) {
            this._state.idioma.projetosCarregados.push(idioma);

            // Disparar evento para notificar idioma carregado
            if (window.PubSub) {
                PubSub.publish('portfolio:idiomaCarregado', { idioma });
            }
        }
    },

    // Métodos para persistência de estado
    salvarEstado() {
        try {
            const estadoParaSalvar = {
                idioma: this._state.idioma,
                portfolio: {
                    paginaAtual: this._state.portfolio.paginaAtual
                    // Não persistimos emTransicao pois é um estado temporário
                }
                // Não persistimos configurações de cache pois são constantes
            };

            localStorage.setItem('app_state', JSON.stringify(estadoParaSalvar));
            return true;
        } catch (error) {
            console.error('Erro ao salvar estado da aplicação:', error);
            return false;
        }
    },

    carregarEstado() {
        try {
            const estadoSalvo = localStorage.getItem('app_state');
            if (estadoSalvo) {
                const estado = JSON.parse(estadoSalvo);

                // Restaurar apenas os valores persistidos, mantendo os padrões para o resto
                if (estado.idioma) {
                    this._state.idioma = {
                        ...this._state.idioma,
                        ...estado.idioma
                    };
                }

                if (estado.portfolio) {
                    this._state.portfolio.paginaAtual = estado.portfolio.paginaAtual;
                }
            }

            // Registrar ouvinte para alterações de idioma via i18n
            if (window.i18n) {
                window.i18n.onIdiomaAlterado((idioma) => {
                    // Quando i18n alterar o idioma, atualize nosso estado também
                    // Isto não dispara evento, já que está apenas sincronizando com i18n
                    this._state.idioma.atual = idioma;
                });
            }

            // Marcar como inicializado
            this._state.isInitialized = true;
            return true;
        } catch (error) {
            console.error('Erro ao carregar estado da aplicação:', error);
            this._state.isInitialized = true; // Marcar como inicializado mesmo em caso de erro
            return false;
        }
    },

    resetarEstado() {
        this._state.idioma.atual = 'pt';
        this._state.portfolio.paginaAtual = 0;
        this._state.portfolio.emTransicao = false;
        localStorage.removeItem('app_state');

        // Disparar evento de reset
        if (window.PubSub) {
            PubSub.publish('app:estadoResetado', {});
        }
    }
};

// Inicializar o estado ao carregar o módulo - apenas se PubSub estiver disponível
// Caso contrário, aguardamos até que init.js chame carregarEstado explicitamente
if (window.PubSub && document.readyState !== 'loading') {
    AppState.carregarEstado();
} else if (window.PubSub) {
    document.addEventListener('DOMContentLoaded', () => {
        AppState.carregarEstado();
    });
}

// Exportar para uso global
window.AppState = AppState;