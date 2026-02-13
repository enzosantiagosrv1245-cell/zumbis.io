// Sistema de autenticação seguro
const fs = require('fs-extra');
const path = require('path');

class AuthManager {
    constructor(usersFile) {
        this.usersFile = usersFile;
        this.users = {};
        this.sessions = new Map();
        this.loadUsers();
    }

    loadUsers() {
        try {
            if (fs.existsSync(this.usersFile)) {
                this.users = fs.readJsonSync(this.usersFile);
            }
        } catch (err) {
            console.error('Erro ao carregar usuários:', err);
            this.users = {};
        }
    }

    saveUsers() {
        try {
            fs.writeJsonSync(this.usersFile, this.users, { spaces: 2 });
        } catch (err) {
            console.error('Erro ao salvar usuários:', err);
        }
    }

    register(username, password) {
        // Sanitizar entrada
        username = String(username).trim();
        password = String(password);

        if (!username || username.length < 3) {
            return { success: false, message: 'Nome de usuário inválido' };
        }

        if (!password || password.length < 4) {
            return { success: false, message: 'Senha muito curta' };
        }

        // BLOQUEAR criação de conta com nome "Mingau"
        if (username.toLowerCase() === 'mingau') {
            return { success: false, message: 'Este nome está reservado' };
        }

        if (this.users[username]) {
            return { success: false, message: 'Usuário já existe' };
        }

        // Criar novo usuário
        this.users[username] = {
            id: this._generateId(),
            username,
            password: this._hashPassword(password),
            color: '#3498db',
            photo: null,
            editedName: false,
            friends: [],
            requests: [],
            createdAt: Date.now()
        };

        this.saveUsers();
        return { success: true, message: 'Conta criada com sucesso' };
    }

    login(username, password) {
        username = String(username).trim();
        password = String(password);

        const user = this.users[username];
        if (!user) {
            return { success: false, message: 'Usuário não encontrado' };
        }

        if (user.password !== this._hashPassword(password)) {
            return { success: false, message: 'Senha incorreta' };
        }

        // Criar sessão
        const sessionId = this._generateSessionId();
        this.sessions.set(sessionId, {
            username,
            userId: user.id,
            createdAt: Date.now()
        });

        return { 
            success: true, 
            sessionId,
            user: {
                id: user.id,
                username: user.username,
                color: user.color,
                photo: user.photo
            }
        };
    }

    validateSession(sessionId) {
        if (!this.sessions.has(sessionId)) return null;
        
        const session = this.sessions.get(sessionId);
        const timeout = 3600000; // 1 hora

        if (Date.now() - session.createdAt > timeout) {
            this.sessions.delete(sessionId);
            return null;
        }

        return this.users[session.username];
    }

    _hashPassword(password) {
        // Hash simples (em produção usar bcrypt)
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    }

    _generateId() {
        return 'ID' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }

    _generateSessionId() {
        return Math.random().toString(36).substr(2) + Date.now().toString(36);
    }

    getUser(username) {
        return this.users[username] || null;
    }

    updateUser(username, updates) {
        if (!this.users[username]) return false;

        const user = this.users[username];
        Object.assign(user, updates);
        this.saveUsers();
        return true;
    }
}

module.exports = AuthManager;
