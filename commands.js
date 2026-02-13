// Sistema de Comandos DEV
const CommandSystem = (function() {
    const _commands = {};

    const DEV_COMMANDS = {
        kill: {
            name: "KILL",
            args: "<player|everyone>",
            desc: "Mata um jogador ou todos",
            execute: (executor, args, gameState, io, socket) => {
                if (!args[0]) return { error: "Uso: /kill <player|everyone>" };
                const target = normalizeUsername(args[0]);
                
                if (target === "everyone") {
                    Object.values(gameState.players).forEach(p => {
                        if (p.id !== executor.id) {
                            p.role = "zombie";
                            p.health = 0;
                        }
                    });
                    io.emit("serverMessage", { text: `${executor.name} matou TODOS!`, color: "#FF0000" });
                    return { success: true };
                }
                
                const player = findPlayerByName(gameState.players, target);
                if (!player) return { error: `Jogador ${args[0]} não encontrado` };
                player.role = "zombie";
                player.health = 0;
                return { success: true, msg: `${player.name} foi morto!` };
            }
        },
        
        tp: {
            name: "TP",
            args: "<player>",
            desc: "Teleportar para um jogador",
            execute: (executor, args, gameState, io, socket) => {
                if (!args[0]) return { error: "Uso: /tp <player>" };
                const target = normalizeUsername(args[0]);
                const player = findPlayerByName(gameState.players, target);
                if (!player) return { error: `Jogador ${args[0]} não encontrado` };
                
                executor.x = player.x + 50;
                executor.y = player.y + 50;
                return { success: true, msg: `Teleportado para ${player.name}!` };
            }
        },
        
        heal: {
            name: "HEAL",
            args: "[player]",
            desc: "Curar a si ou outro jogador",
            execute: (executor, args, gameState, io, socket) => {
                if (!args[0]) {
                    executor.role = "human";
                    executor.health = 100;
                    return { success: true, msg: "Você foi curado!" };
                }
                
                const target = normalizeUsername(args[0]);
                const player = findPlayerByName(gameState.players, target);
                if (!player) return { error: `Jogador ${args[0]} não encontrado` };
                player.role = "human";
                player.health = 100;
                return { success: true, msg: `${player.name} foi curado!` };
            }
        },
        
        speed: {
            name: "SPEED",
            args: "[player] <valor>",
            desc: "Modificar velocidade",
            execute: (executor, args, gameState, io, socket) => {
                if (!args[0]) return { error: "Uso: /speed <valor>" };
                let target = executor;
                let speed = parseFloat(args[0]);
                
                if (args.length > 1) {
                    target = findPlayerByName(gameState.players, normalizeUsername(args[0]));
                    speed = parseFloat(args[1]);
                    if (!target) return { error: `Jogador ${args[0]} não encontrado` };
                }
                
                target.speed = Math.min(speed, 20);
                return { success: true, msg: `Velocidade alterada para ${target.speed}` };
            }
        },
        
        gems: {
            name: "GEMS",
            args: "<player> <quantidade>",
            desc: "Dar gemas a um jogador",
            execute: (executor, args, gameState, io, socket) => {
                if (!args[0] || !args[1]) return { error: "Uso: /gems <player> <qty>" };
                const target = findPlayerByName(gameState.players, normalizeUsername(args[0]));
                const amount = parseInt(args[1]);
                
                if (!target) return { error: `Jogador ${args[0]} não encontrado` };
                target.gems = (target.gems || 0) + amount;
                return { success: true, msg: `${amount} gemas adicionadas a ${target.name}` };
            }
        },
        
        restart: {
            name: "RESTART",
            args: "",
            desc: "Reiniciar a rodada",
            execute: (executor, args, gameState, io, socket) => {
                gameState.timeLeft = 120;
                gameState.gamePhase = "playing";
                io.emit("serverMessage", { text: "Rodada reiniciada!", color: "#FFD700" });
                return { success: true };
            }
        },
        
        givcmd: {
            name: "GIVCMD",
            args: "<player> <command>",
            desc: "Dar permissão de comando a outro dev",
            execute: (executor, args, gameState, io, socket) => {
                if (!args[0] || !args[1]) return { error: "Uso: /givcmd <player> <cmd>" };
                const target = findPlayerByName(gameState.players, normalizeUsername(args[0]));
                if (!target) return { error: `Jogador ${args[0]} não encontrado` };
                
                const cmd = args[1].toUpperCase();
                if (!DEV_COMMANDS[cmd.toLowerCase()]) {
                    return { error: `Comando ${cmd} inválido` };
                }
                
                target.tempDevCommands = target.tempDevCommands || [];
                if (!target.tempDevCommands.includes(cmd)) {
                    target.tempDevCommands.push(cmd);
                }
                
                io.emit("serverMessage", { 
                    text: `${executor.name} deu acesso ao comando ${cmd} para ${target.name}`, 
                    color: "#00FF00" 
                });
                return { success: true };
            }
        },
        
        commandlist: {
            name: "COMMANDLIST",
            args: "",
            desc: "Mostrar lista de comandos",
            execute: (executor, args, gameState, io, socket) => {
                return { success: true, showList: true };
            }
        }
    };

    function normalizeUsername(name) {
        return name.toLowerCase().trim();
    }

    function normalizeUnicode(str) {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    function findPlayerByName(players, query) {
        const normalized = normalizeUnicode(normalizeUsername(query));
        return Object.values(players).find(p => 
            normalizeUnicode(normalizeUsername(p.name)) === normalized
        );
    }

    return {
        execute: function(executor, commandText, gameState, io, socket) {
            const parts = commandText.trim().split(/\s+/);
            const cmdName = parts[0].substring(1).toLowerCase();
            const args = parts.slice(1);

            const cmd = DEV_COMMANDS[cmdName];
            if (!cmd) {
                return { error: `Comando /${cmdName} não encontrado` };
            }

            return cmd.execute(executor, args, gameState, io, socket);
        },

        getList: function() {
            return Object.entries(DEV_COMMANDS).map(([key, cmd]) => ({
                name: `/${cmd.name}`,
                args: cmd.args,
                desc: cmd.desc
            }));
        },

        isCommand: function(text) {
            return text.startsWith('/');
        },

        normalizeUnicode: normalizeUnicode,
        normalizeUsername: normalizeUsername,
        findPlayerByName: findPlayerByName
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CommandSystem;
}
