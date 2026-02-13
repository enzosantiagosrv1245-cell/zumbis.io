// Constantes do jogo - Divididas e ofuscadas
const GameConstants = (function() {
    const _private = {};

    // ÁREAS DO MUNDO
    _private.SAND_AREA = Object.freeze({
        x: 4080, y: 0, width: 1850, height: 2000
    });

    _private.SEA_AREA = Object.freeze({
        x: 4965, y: 0, width: 2600, height: 4000
    });

    _private.SINKING_AREA = Object.freeze({
        x: 5165, y: 0, width: 2400, height: 4000
    });

    // VELOCIDADES E TAMANHOS
    _private.PLAYER = Object.freeze({
        INITIAL_SIZE: 35,
        INITIAL_SPEED: 3,
        MAX_SPEED: 5,
        ACCELERATION: 1.2,
        FRICTION: 0.90
    });

    _private.ZOMBIE = Object.freeze({
        SPEED_BOOST: 1.50,
        PUSH_MODIFIER: 2,
        MIN_SPEED: 3
    });

    _private.SHARK = Object.freeze({
        BASE_SPEED: 1.5
    });

    // HABILIDADES
    _private.ABILITIES = Object.freeze({
        SPRINT: {
            DURATION: 10000,
            COOLDOWN: 30000
        },
        SPY: {
            DURATION: 15000,
            COOLDOWN: 30000
        },
        BUTTERFLY: {
            DURATION: 5000,
            SPEED: 4
        },
        RHINOCEROS: {
            FORCE: 1.5,
            RADIUS: 150,
            COOLDOWN: 2000
        },
        RUNNING_TENNIS: {
            SPEED_BOOST: 5
        }
    });

    // ITENS E EQUIPAMENTOS
    _private.ITEMS = Object.freeze({
        INVISIBILITY_CLOAK: {
            BREAK_DISTANCE: 250
        },
        SKATEBOARD: {
            SPEED_BOOST: 5,
            WIDTH: 90,
            HEIGHT: 35
        },
        DRONE: {
            MAX_AMMO: 10,
            FOLLOW_FACTOR: 0.05
        },
        GRENADE: {
            FUSE_TIME: 1500,
            RADIUS: 200,
            KNOCKBACK: 30
        },
        ARROW: {
            SPEED: 30,
            KNOCKBACK: 0.4,
            LIFESPAN_AFTER_HIT: 3000,
            SPAWN_OFFSET: 120
        },
        MINE: {
            SIZE: 40,
            EXPLOSION_RADIUS: 100,
            PRIMARY_KNOCKBACK: 20,
            SPLASH_KNOCKBACK: 15
        },
        CANNON: {
            COOLDOWN: 2000,
            FRONT_OFFSET: 100,
            LARGE_BALL_SPEED: 12,
            LARGE_BALL_RADIUS: 25
        },
        TRAP: {
            DURATION: 1000,
            SIZE: 40
        },
        PORTAL: {
            SIZE: 60,
            COOLDOWN: 1000
        },
        DUCT: {
            TRAVEL_TIME: 1000 / 20
        }
    });

    // CUSTOS DE FUNÇÕES
    _private.FUNCTION_COSTS = Object.freeze({
        athlete: 500,
        engineer: 500,
        spy: 500,
        butterfly: 1000,
        rhinoceros: 1000
    });

    _private.ZOMBIE_ABILITY_COSTS = Object.freeze({
        trap: 50,
        mine: 50
    });

    // CATEGORIAS DE COLISÃO
    _private.COLLISION = Object.freeze({
        PLAYER: 0x0002,
        WALL: 0x0004,
        MOVABLE_OBJECT: 0x0008,
        CANNONBALL: 0x0010
    });

    // RETORNAR INTERFCE PÚBLICA
    return {
        AREAS: _private.SAND_AREA ? {
            SAND: _private.SAND_AREA,
            SEA: _private.SEA_AREA,
            SINKING: _private.SINKING_AREA
        } : {},
        PLAYER: _private.PLAYER,
        ZOMBIE: _private.ZOMBIE,
        SHARK: _private.SHARK,
        ABILITIES: _private.ABILITIES,
        ITEMS: _private.ITEMS,
        FUNCTION_COSTS: _private.FUNCTION_COSTS,
        ZOMBIE_ABILITY_COSTS: _private.ZOMBIE_ABILITY_COSTS,
        COLLISION: _private.COLLISION,
        
        // Método seguro para acessar constantes
        get: function(key) {
            const keys = key.split('.');
            let value = _private;
            for (let k of keys) {
                if (value && typeof value === 'object') {
                    value = value[k];
                } else {
                    return null;
                }
            }
            return value;
        }
    };
})();

// Exportar para Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameConstants;
}
