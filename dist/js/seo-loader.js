// Script para carregar os dados de SEO JSON-LD
document.addEventListener('DOMContentLoaded', function () {
    fetch('js/seo.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Falha ao carregar dados SEO');
            }
            return response.json();
        })
        .then(data => {
            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.textContent = JSON.stringify(data);
            document.head.appendChild(script);
            console.log('Dados de SEO carregados com sucesso');
        })
        .catch(error => {
            console.error('Erro ao carregar dados SEO JSON-LD:', error);
            // Fallback para caso o Cloudflare Pages tenha problemas com o tipo MIME
            fetch('js/seo.json', {
                headers: { 'Accept': 'text/plain' }
            })
                .then(response => response.text())
                .then(text => {
                    try {
                        const data = JSON.parse(text);
                        const script = document.createElement('script');
                        script.type = 'application/ld+json';
                        script.textContent = JSON.stringify(data);
                        document.head.appendChild(script);
                        console.log('Dados de SEO carregados via fallback');
                    } catch (e) {
                        console.error('Erro no fallback:', e);
                    }
                });
        });
});