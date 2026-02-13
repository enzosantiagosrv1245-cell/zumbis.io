// Lógica de Jogador
const PlayerLogic = (function() {
    return {
        createNewPlayer: function(socket, usersData) {
            return {
                id: socket.id,
                name: "Unknown",
                x: Math.random() * 1000,
                y: Math.random() * 1000,
                role: "human",
                health: 100,
                speed: 3,
                color: "#3498db",
                photo: null,
                gems: 0,
                inventory: [],
                inventorySlots: 5,
                isDev: false,
                tempDevCommands: [],
                createdAt: Date.now()
            };
        },

        damagePlayer: function(player, damage) {
            player.health = Math.max(0, player.health - damage);
            if (player.health === 0) {
                player.role = "zombie";
            }
        },

        healPlayer: function(player, amount) {
            player.health = Math.min(100, player.health + amount);
            if (player.role === "zombie" && player.health > 50) {
                player.role = "human";
            }
        },

        addGems: function(player, amount) {
            player.gems = (player.gems || 0) + amount;
        },

        removeGems: function(player, amount) {
            player.gems = Math.max(0, (player.gems || 0) - amount);
        },

        hasPermission: function(player, command) {
            if (!player) return false;
            if (player.name === "Mingau") return true;
            if (player.tempDevCommands && player.tempDevCommands.includes(command)) {
                return true;
            }
            return false;
        },

        isValidUsername: function(name) {
            const reserved = ["mingau", "admin", "dev", "moderator"];
            const normalized = name.toLowerCase();
            return !reserved.includes(normalized) && name.length >= 3 && name.length <= 32;
        },

        getPlayerInfo: function(player) {
            return {
                id: player.id,
                name: player.name,
                x: player.x,
                y: player.y,
                role: player.role,
                color: player.color,
                gems: player.gems,
                health: player.health
            };
        }
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlayerLogic;
}
