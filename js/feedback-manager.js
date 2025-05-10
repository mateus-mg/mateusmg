/**
 * Gerenciador de Popups de Feedback
 * Este módulo gerencia a exibição de popups de feedback para o usuário,
 * com suporte completo para internacionalização (i18n).
 * 
 * Como este módulo se integra ao sistema i18n:
 * 1. Todas as strings visíveis são obtidas através do sistema i18n usando window.i18n.traduzir()
 * 2. O popup é totalmente traduzido para o idioma atual do usuário
 * 3. As chaves de tradução usam o formato 'feedback.tipo.chave' para organização
 * 4. Os templates suportam parâmetros dinâmicos para personalização das mensagens
 * 
 * Uso:
 * const feedback = gerenciarFeedbackPopup();
 * feedback.mostrar('Mensagem de sucesso', 'Sucesso!', 'success');
 */

// Função factory que retorna um gerenciador de feedback popups
function gerenciarFeedbackPopup() {
    // Armazenar referência ao popup (criado dinamicamente quando necessário)
    let feedbackPopup = null;

    // Cache de traduções para evitar chamadas repetidas
    const traducoesCache = {};

    /**
     * Traduz um texto usando o sistema i18n
     * @param {string} chave - A chave de tradução
     * @param {object} params - Parâmetros para substituição na string traduzida
     * @returns {Promise<string>} - A string traduzida
     */
    async function traduzir(chave, params = {}) {
        // Se não tivermos i18n, retornar o valor padrão ou a própria chave
        if (!window.i18n) {
            return params.valorPadrao || chave;
        }

        try {
            // Tentar obter do cache primeiro
            const cacheKey = chave + JSON.stringify(params);
            if (traducoesCache[cacheKey]) {
                return traducoesCache[cacheKey];
            }

            // Caso contrário, traduzir e armazenar no cache
            const traducao = await window.i18n.traduzir(chave, params);
            traducoesCache[cacheKey] = traducao;
            return traducao;
        } catch (error) {
            console.error('Erro ao traduzir feedback:', error);
            return params.valorPadrao || chave;
        }
    }

    /**
     * Cria o elemento do popup de feedback se ainda não existir
     * @returns {HTMLElement} - O elemento do popup
     */
    function criarPopupSeNecessario() {
        if (feedbackPopup) {
            return feedbackPopup;
        }

        // Criar elementos do popup
        feedbackPopup = document.createElement('div');
        feedbackPopup.className = 'feedback-popup';

        // Estrutura interna do popup
        feedbackPopup.innerHTML = `
            <div class="feedback-content">
                <div class="feedback-icon"></div>
                <div class="feedback-titulo"></div>
                <div class="feedback-mensagem"></div>
                <button class="botao feedback-fechar"></button>
            </div>
        `;

        // Adicionar comportamento ao botão de fechar
        const btnFechar = feedbackPopup.querySelector('.feedback-fechar');
        btnFechar.addEventListener('click', () => {
            fecharPopup();
        });

        // Adicionar comportamento para fechar com tecla ESC
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && feedbackPopup.classList.contains('ativo')) {
                fecharPopup();
            }
        });

        // Adicionar ao DOM
        document.body.appendChild(feedbackPopup);

        return feedbackPopup;
    }

    /**
     * Fecha o popup se estiver aberto
     */
    function fecharPopup() {
        if (feedbackPopup && feedbackPopup.classList.contains('ativo')) {
            feedbackPopup.classList.remove('ativo');
        }
    }

    /**
     * Obtém o título traduzido para um popup de sucesso no envio de formulário
     * @returns {Promise<string>} - O título traduzido
     */
    async function obterTituloTraduzido() {
        return traduzir('feedback.sucesso.titulo', { valorPadrao: 'Mensagem enviada!' });
    }

    /**
     * Formata e traduz uma mensagem de sucesso no envio do formulário
     * @param {string} nome - Nome da pessoa que enviou o formulário
     * @param {string} assunto - Assunto do formulário enviado
     * @returns {Promise<string>} - A mensagem formatada e traduzida
     */
    async function mensagemEnvio(nome, assunto) {
        // Se não temos nome ou assunto, usar versão simplificada
        if (!nome || !assunto) {
            return traduzir('feedback.sucesso.mensagem_simples', {
                valorPadrao: 'Sua mensagem foi enviada com sucesso! Entraremos em contato em breve.'
            });
        }

        // Versão completa com parâmetros
        return traduzir('feedback.sucesso.mensagem_completa', {
            nome: nome,
            assunto: assunto,
            valorPadrao: `Obrigado ${nome}! Sua mensagem sobre "${assunto}" foi enviada com sucesso. Entraremos em contato em breve.`
        });
    }

    return {
        /**
         * Mostra um popup de feedback
         * @param {string} mensagem - A mensagem a ser exibida
         * @param {string} titulo - O título do popup
         * @param {string} tipo - O tipo de feedback ('success', 'error', 'info', 'warning')
         */
        mostrar: async function (mensagem, titulo, tipo = 'success') {
            // Criar ou obter referência ao popup
            const popup = criarPopupSeNecessario();

            // Traduzir botão fechar
            const btnFechar = popup.querySelector('.feedback-fechar');
            btnFechar.textContent = await traduzir('feedback.botao.fechar', { valorPadrao: 'Fechar' });

            // Configurar ícone baseado no tipo
            const iconElement = popup.querySelector('.feedback-icon');
            let iconClass = 'fa-check-circle';

            switch (tipo) {
                case 'error':
                    iconClass = 'fa-times-circle';
                    break;
                case 'warning':
                    iconClass = 'fa-exclamation-triangle';
                    break;
                case 'info':
                    iconClass = 'fa-info-circle';
                    break;
                // 'success' é o padrão
            }

            // Definir ícone e textos
            iconElement.innerHTML = `<i class="fas ${iconClass}"></i>`;
            popup.querySelector('.feedback-titulo').textContent = titulo;
            popup.querySelector('.feedback-mensagem').textContent = mensagem;

            // Adicionar classe para mostrar
            popup.classList.add('ativo');
        },

        // Exportar métodos auxiliares
        obterTituloTraduzido,
        mensagemEnvio,
        fecharPopup
    };
}

// Tornar disponível globalmente
window.gerenciarFeedbackPopup = gerenciarFeedbackPopup;