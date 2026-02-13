// Configuração centralizada - OFUSCADA
let CONFIG = {};

(function() {
    const _secret = Buffer.from([71,97,109,101,67,111,110,102,105,103,50,48,50,52]).toString();
    
    CONFIG = {
        PORT: process.env.PORT || 3000,
        TICK_RATE: 1000 / 60,
        WORLD_WIDTH: 6000,
        WORLD_HEIGHT: 4000,
        ROUND_DURATION: 120,
        ADMIN_USER: 'Mingau',
        DEV_CODE_HASH: _generateHash('Mingau_dev#2011'),
        MAX_PLAYERS: 100,
        SAVE_INTERVAL: 1000,
        FILES: {
            USERS: 'users.json',
            MESSAGES: 'messages.json',
            LINKS: 'links.json'
        },
        SECURITY: {
            ENABLE_VALIDATION: true,
            ENABLE_RATE_LIMIT: true,
            RATE_LIMIT_MESSAGES: 5,
            RATE_LIMIT_TIME: 1000,
            SESSION_TIMEOUT: 3600000
        }
    };

    function _generateHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }
})();

module.exports = CONFIG;
