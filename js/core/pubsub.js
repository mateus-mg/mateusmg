/**
 * pubsub.js - Sistema simples de publicação/assinatura (pub/sub)
 * 
 * Este módulo implementa um padrão pub/sub que permite componentes se
 * comunicarem sem conhecimento direto uns dos outros, promovendo
 * baixo acoplamento e melhor organização do código.
 */

// Implementação do sistema de pub/sub
const PubSub = {
    // Armazenamento dos inscritos por evento
    _subscribers: {},

    /**
     * Inscreve uma função para ser executada quando um evento for publicado
     * @param {string} event - O nome do evento para assinar
     * @param {Function} callback - A função a ser chamada quando o evento ocorrer
     * @returns {object} Um objeto com método para cancelar a inscrição
     */
    subscribe(event, callback) {
        if (!this._subscribers[event]) {
            this._subscribers[event] = [];
        }

        // Adicionar o callback à lista de inscritos
        const index = this._subscribers[event].push(callback) - 1;

        // Retornar um objeto com método para cancelar a inscrição
        return {
            unsubscribe: () => {
                this._subscribers[event].splice(index, 1);

                // Limpar o array se não houver mais inscritos
                if (this._subscribers[event].length === 0) {
                    delete this._subscribers[event];
                }
            }
        };
    },

    /**
     * Publica um evento com dados opcionais
     * @param {string} event - O nome do evento a ser publicado
     * @param {*} data - Os dados a serem passados para os callbacks
     */
    publish(event, data) {
        if (!this._subscribers[event]) {
            return; // Ninguém está inscrito neste evento
        }

        // Chamar todos os callbacks inscritos neste evento
        this._subscribers[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Erro em um subscriber do evento ${event}:`, error);
            }
        });
    },

    /**
     * Remove todas as inscrições para um evento específico
     * @param {string} event - O nome do evento para limpar
     */
    clearEvent(event) {
        delete this._subscribers[event];
    },

    /**
     * Remove todas as inscrições de todos os eventos
     */
    clearAllEvents() {
        this._subscribers = {};
    },

    /**
     * Retorna os nomes de todos os eventos que têm inscritos
     * @returns {string[]} Array com os nomes dos eventos
     */
    getEvents() {
        return Object.keys(this._subscribers);
    },

    /**
     * Retorna o número de inscritos em um evento específico
     * @param {string} event - O nome do evento
     * @returns {number} O número de inscritos
     */
    getSubscribersCount(event) {
        return this._subscribers[event]?.length || 0;
    }
};

// Exportar para uso global
window.PubSub = PubSub;