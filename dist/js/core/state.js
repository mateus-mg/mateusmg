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
        }
    },

    // Getters - Acessores para o estado
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
        const idiomaAntigo = this._state.idioma.atual;
        this._state.idioma.atual = novoIdioma;

        // Salvar no localStorage
        localStorage.setItem('idioma', novoIdioma);
        localStorage.setItem('idioma_versao', this._state.cache.versao);
        localStorage.setItem('idioma_data', Date.now().toString());

        // Disparar evento para notificar a alteração de idioma
        PubSub.publish('idioma:alterado', {
            novo: novoIdioma,
            antigo: idiomaAntigo
        });

        return novoIdioma;
    },

    setPaginaPortfolio(novaPagina) {
        const paginaAntiga = this._state.portfolio.paginaAtual;
        this._state.portfolio.paginaAtual = novaPagina;

        // Disparar evento para notificar a alteração de página
        PubSub.publish('portfolio:paginaAlterada', {
            nova: novaPagina,
            antiga: paginaAntiga
        });

        return novaPagina;
    },

    setTransicaoPortfolio(emTransicao) {
        this._state.portfolio.emTransicao = emTransicao;

        // Disparar evento relacionado à transição
        PubSub.publish('portfolio:transicao', {
            emTransicao
        });

        return emTransicao;
    },

    adicionarIdiomaCarregado(idioma) {
        if (!this._state.idioma.projetosCarregados.includes(idioma)) {
            this._state.idioma.projetosCarregados.push(idioma);

            // Disparar evento para notificar idioma carregado
            PubSub.publish('portfolio:idiomaCarregado', { idioma });
        }
    },

    // Métodos para persistência de estado (opcional)
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

                return true;
            }
            return false;
        } catch (error) {
            console.error('Erro ao carregar estado da aplicação:', error);
            return false;
        }
    },

    resetarEstado() {
        this._state.idioma.atual = 'pt';
        this._state.portfolio.paginaAtual = 0;
        this._state.portfolio.emTransicao = false;
        localStorage.removeItem('app_state');

        // Disparar evento de reset
        PubSub.publish('app:estadoResetado', {});
    }
};

// Inicializar o estado ao carregar o módulo
document.addEventListener('DOMContentLoaded', () => {
    AppState.carregarEstado();
});

// Exportar para uso global
window.AppState = AppState;