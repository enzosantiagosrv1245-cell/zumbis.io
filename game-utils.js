// Utilitários de jogo - Anti-hack
const GameUtils = (function() {
    // Mapa privado de funções
    const _functions = {};

    // Função para gerar IDs únicos seguramente
    _functions.generateUniqueId = function(prefix = 'ID') {
        return prefix + Math.random().toString(36).substr(2, 9).toUpperCase();
    };

    // Função para calcular distância
    _functions.distance = function(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    };

    // Função para detectar colisão
    _functions.isColliding = function(rect1, rect2) {
        return !(rect1.x + rect1.width < rect2.x || 
                 rect2.x + rect2.width < rect1.x ||
                 rect1.y + rect1.height < rect2.y ||
                 rect2.y + rect2.height < rect1.y);
    };

    // Função para normalizador de entrada
    _functions.normalizeInput = function(input) {
        if (typeof input !== 'number') return 0;
        return Math.max(-1, Math.min(1, input));
    };

    // Função para limitar velocidade
    _functions.clampSpeed = function(speed, maxSpeed) {
        if (typeof speed !== 'number' || typeof maxSpeed !== 'number') return 0;
        return Math.min(Math.abs(speed), maxSpeed);
    };

    // Função para verificar se posição é válida
    _functions.isValidPosition = function(x, y, worldWidth, worldHeight) {
        return x >= 0 && x <= worldWidth && y >= 0 && y <= worldHeight;
    };

    // Função para sanitizar nome
    _functions.sanitizeName = function(name) {
        if (typeof name !== 'string') return 'Player';
        return name.replace(/[<>\"'`]/g, '').substring(0, 20).trim() || 'Player';
    };

    // Função para calcular hash
    _functions.calculateHash = function(str) {
        let hash = 0;
        if (str.length === 0) return hash;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    };

    // Função para comparar hashes com segurança
    _functions.constantTimeCompare = function(a, b) {
        if (!a || !b) return false;
        const aStr = String(a);
        const bStr = String(b);
        if (aStr.length !== bStr.length) return false;
        
        let result = 0;
        for (let i = 0; i < aStr.length; i++) {
            result |= aStr.charCodeAt(i) ^ bStr.charCodeAt(i);
        }
        return result === 0;
    };

    // Função para gerar seed aleatório seguro
    _functions.secureSeed = function() {
        const arr = new Uint8Array(4);
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            crypto.getRandomValues(arr);
        } else {
            for(let i = 0; i < arr.length; i++) {
                arr[i] = Math.floor(Math.random() * 256);
            }
        }
        return Array.from(arr).reduce((acc, val) => acc * 256 + val, 0);
    };

    // Função para profundidade de clonagem segura
    _functions.deepClone = function(obj, depth = 3) {
        if (depth <= 0 || obj === null || typeof obj !== 'object') return obj;
        
        if (Array.isArray(obj)) {
            return obj.map(item => _functions.deepClone(item, depth - 1));
        }
        
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = _functions.deepClone(obj[key], depth - 1);
            }
        }
        return cloned;
    };

    // Interface pública
    return {
        generateId: _functions.generateUniqueId,
        distance: _functions.distance,
        isColliding: _functions.isColliding,
        normalizeInput: _functions.normalizeInput,
        clampSpeed: _functions.clampSpeed,
        isValidPosition: _functions.isValidPosition,
        sanitizeName: _functions.sanitizeName,
        hash: _functions.calculateHash,
        compare: _functions.constantTimeCompare,
        randSeed: _functions.secureSeed,
        clone: _functions.deepClone
    };
})();

// Exportar para Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameUtils;
}
