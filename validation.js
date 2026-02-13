// Sistema de validação anti-hack
const CONFIG = require('./config');

class SecurityValidator {
    constructor() {
        this.rateLimitMap = new Map();
        this.sessionMap = new Map();
        this.suspiciousActions = new Map();
    }

    validatePlayerAction(socketId, action, data) {
        if (!CONFIG.SECURITY.ENABLE_VALIDATION) return true;

        // Validar tipo de ação
        if (!this._isValidActionType(action)) {
            this._logSuspiciousActivity(socketId, 'Invalid action type', action);
            return false;
        }

        // Validar taxa de requisições
        if (!this._checkRateLimit(socketId)) {
            this._logSuspiciousActivity(socketId, 'Rate limit exceeded', action);
            return false;
        }

        // Validar integridade de dados
        if (!this._validateDataIntegrity(data)) {
            this._logSuspiciousActivity(socketId, 'Data integrity check failed', action);
            return false;
        }

        // Verificar atividades suspeitas
        if (this._isSuspiciousPattern(socketId, action)) {
            this._logSuspiciousActivity(socketId, 'Suspicious pattern detected', action);
            return false;
        }

        return true;
    }

    _isValidActionType(action) {
        const validActions = [
            'movement', 'attack', 'chat', 'pickup', 'drop', 
            'use_item', 'command', 'spawn', 'spawn_zombie'
        ];
        return validActions.includes(action);
    }

    _checkRateLimit(socketId) {
        if (!this.rateLimitMap.has(socketId)) {
            this.rateLimitMap.set(socketId, { count: 1, time: Date.now() });
            return true;
        }

        const record = this.rateLimitMap.get(socketId);
        const now = Date.now();

        if (now - record.time > CONFIG.SECURITY.RATE_LIMIT_TIME) {
            record.count = 1;
            record.time = now;
            return true;
        }

        record.count++;
        return record.count <= CONFIG.SECURITY.RATE_LIMIT_MESSAGES;
    }

    _validateDataIntegrity(data) {
        if (!data || typeof data !== 'object') return false;
        
        // Verificar se há campos suspeitos
        const suspiciousFields = ['__proto__', 'constructor', 'prototype'];
        for (let field of suspiciousFields) {
            if (field in data) return false;
        }

        return true;
    }

    _isSuspiciousPattern(socketId, action) {
        if (!this.suspiciousActions.has(socketId)) {
            this.suspiciousActions.set(socketId, []);
        }

        const actions = this.suspiciousActions.get(socketId);
        actions.push({ action, time: Date.now() });

        // Manter apenas os últimos 10 segundos
        const recentActions = actions.filter(a => Date.now() - a.time < 10000);
        this.suspiciousActions.set(socketId, recentActions);

        // Se muitas attacks em pouco tempo = suspeito
        const attackCount = recentActions.filter(a => a.action === 'attack').length;
        return attackCount > 20;
    }

    _logSuspiciousActivity(socketId, reason, action) {
        console.warn(`[SECURITY] Socket ${socketId} - ${reason} (${action})`);
    }

    validateDevCode(code) {
        // Hash simples para validação
        let hash = 0;
        for (let i = 0; i < code.length; i++) {
            hash = ((hash << 5) - hash) + code.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16) === CONFIG.DEV_CODE_HASH;
    }

    sanitizeUsername(username) {
        if (typeof username !== 'string') return null;
        // Remove caracteres suspeitos
        return username.replace(/[<>\"'`]/g, '').substring(0, 32).trim();
    }

    sanitizeMessage(message) {
        if (typeof message !== 'string') return null;
        // Remove comando injection
        return message.replace(/[><;|&]/g, '').substring(0, 256);
    }
}

module.exports = new SecurityValidator();
