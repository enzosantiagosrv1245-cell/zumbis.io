// Configuração do Discord - Ofuscada
(function() {
    const _dcfg = {
        INVITE: 'jShcFcguUw',
        BASE_URL: 'https://discord.gg/',
        BUTTON_ID: 'discordBtn'
    };

    // Verificar se estamos no navegador
    if (typeof window !== 'undefined') {
        window.DiscordConfig = _dcfg;
        
        // Aguardar o DOM estar pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', _initDiscordButton);
        } else {
            _initDiscordButton();
        }
    }

    function _initDiscordButton() {
        const btn = document.getElementById(_dcfg.BUTTON_ID);
        if (btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                window.open(_dcfg.BASE_URL + _dcfg.INVITE, '_blank', 'noopener,noreferrer');
            });
        }
    }

    // Se for Node.js (servidor)
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            DISCORD_INVITE: 'https://discord.gg/jShcFcguUw'
        };
    }
})();
