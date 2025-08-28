const express = require('express');
const http = require('http');
const {
    Server
} = require("socket.io");
const Matter = require('matter-js');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));
app.use(express.json());

const USERS_FILE = path.join(__dirname, "users.json");
const MESSAGES_FILE = path.join(__dirname, "messages.json");
const LINKS_FILE = path.join(__dirname, "links.json");

let users = {};
let sockets = {};
let messages = {};
let links = [];

if (fs.existsSync(USERS_FILE)) users = fs.readJsonSync(USERS_FILE);
if (fs.existsSync(MESSAGES_FILE)) messages = fs.readJsonSync(MESSAGES_FILE);
if (fs.existsSync(LINKS_FILE)) links = fs.readJsonSync(LINKS_FILE);

function saveUsers() {
    fs.writeJsonSync(USERS_FILE, users, {
        spaces: 2
    });
}

function saveMessages() {
    fs.writeJsonSync(MESSAGES_FILE, messages, {
        spaces: 2
    });
}

function saveLinks() {
    fs.writeJsonSync(LINKS_FILE, links, {
        spaces: 2
    });
}

function generateID() {
    return "ID" + Math.floor(Math.random() * 1000000);
}

const TICK_RATE = 1000 / 60;
let engine, world;
let bodiesMap = {};
let gameState = {};
let nextArrowId = 0,
    nextGrenadeId = 0,
    nextTrapId = 0,
    nextMineId = 0,
    nextUniqueObjectId = 0;

const WORLD_WIDTH = 6000;
const WORLD_HEIGHT = 4000;
const ROUND_DURATION = 120;
const SAND_AREA = {
    x: 4080,
    y: 0,
    width: 1850,
    height: 2000
};
// ALTERADO: Largura do mar aumentada
const SEA_AREA = {
    x: 4965,
    y: 0,
    width: 2600,
    height: 4000
};

const SINKING_AREA = {
    x: 5165,
    y: 0,
    width: 2400, // <<-- Aumentamos a largura (era 2600)
    height: 4000
};

const SHARK_BASE_SPEED = 1.5;
const INITIAL_PLAYER_SIZE = 35;
const INITIAL_PLAYER_SPEED = 3;
const MAX_PLAYER_SPEED = 5;
const PLAYER_ACCELERATION = 1.2;
const PLAYER_FRICTION = 0.90;
const ZOMBIE_SPEED_BOOST = 1.50;
const ZOMBIE_PUSH_MODIFIER = 2;
const ZOMBIE_MIN_SPEED = 3;
const SPRINT_DURATION = 10000;
const SPRINT_COOLDOWN = 30000;
const SPY_DURATION = 15000;
const SPY_COOLDOWN = 30000;
const BUTTERFLY_DURATION = 5000;
const BUTTERFLY_SPEED = 4;
const INVISIBILITY_CLOAK_BREAK_DISTANCE = 250;
const SKATEBOARD_SPEED_BOOST = 5;
const SKATEBOARD_WIDTH = 90;
const SKATEBOARD_HEIGHT = 35;
const DRONE_FOLLOW_FACTOR = 0.05;
const DRONE_MAX_AMMO = 10;
const GRENADE_FUSE_TIME = 1500;
const GRENADE_RADIUS = 200;
const GRENADE_KNOCKBACK_IMPulse = 30;
const LARGE_BALL_SPEED = 12;
const LARGE_BALL_RADIUS = 25;
const CANNON_COOLDOWN = 2000;
const CANNON_FRONT_OFFSET = 100;
const TRAP_DURATION = 1000;
const TRAP_SIZE = 40;
const PORTAL_SIZE = 60;
const PORTAL_COOLDOWN = 1000;
const DROPPED_ITEM_SIZE = 40;
const PICKUP_RADIUS = 60;
const DUCT_TRAVEL_TIME = 1000 / 20;
const ARROW_SPEED = 30;
const ARROW_KNOCKBACK_IMPULSES = 0.4;
const ARROW_LIFESPAN_AFTER_HIT = 3000;
const ARROW_SPAWN_OFFSET = 120;
const MINE_SIZE = 40;
const MINE_EXPLOSION_RADIUS = 100;
const MINE_PRIMARY_KNOCKBACK = 20;
const MINE_SPLASH_KNOCKBACK = 15;
const BOX_PUSH_FORCE = 400;
const ROTATION_ON_COLLISION_FACTOR = 0.000002;
const FORCE_NORMAL_GLOVE_MULTIPLIER = 5;
const LARGE_BALL_OBJECT_KNOCKBACK = 0.5;
const LARGE_BALL_PLAYER_KNOCKBACK = 0.5;
const RHINOCEROS_FORCE = 1.5;
const RHINOCEROS_RADIUS = 150;
const RHINOCEROS_COOLDOWN = 2000;
const RUNNING_TENNIS_SPEED_BOOST = 5;
const SINKING_DURATION = 3000;

const FUNCTION_COSTS = {
    athlete: 500,
    engineer: 500,
    spy: 500,
    butterfly: 1000,
    rhinoceros: 1000,
};
const ZOMBIE_ABILITY_COSTS = {
    trap: 50,
    mine: 50
};

// Categorias de Colisão (RESTAURADO AO ORIGINAL)
const playerCategory = 0x0002;
const wallCategory = 0x0004;
const movableObjectCategory = 0x0008;
const cannonballCategory = 0x0010;

function getDensityById(id) {
    switch (id) {
        // ALTERADO: Densidade do carro muito aumentada
        case 'car':
            return 0.5;
        case 'big_table':
            return 0.0008;;
        case 'sofa':
        case 'big_bed':
        case 'big_bed2':
            return 0.0008;
        case 'box':
            return 0.0006;
        default:
            return 0.0005;
    }
}

function createPlayerBody(player) {
    const infectionRadius = player.width * 0.75;
    const physicsRadius = player.role === 'human' ?
        infectionRadius / 3 :
        infectionRadius / 2;

    const body = Matter.Bodies.circle(player.x, player.y, physicsRadius, {
        inertia: Infinity,
        frictionAir: 0.02,
        friction: 0,
        label: 'player',
        collisionFilter: {
            category: playerCategory,
            mask: 0xFFFFFFFF // RESTAURADO: Colide com tudo
        }
    });
    body.playerId = player.id;
    return body;
}


function initializeGame() {
    nextUniqueObjectId = 0;
    bodiesMap = {};
    engine = Matter.Engine.create();
    world = engine.world;
    world.gravity.y = 0;
    setupCollisionEvents();
    const currentPlayers = gameState.players || {};

    const originalDucts = [{
        x: 3150,
        y: 480,
        width: 80,
        height: 80
    }, {
        x: 275,
        y: 865,
        width: 80,
        height: 80
    }, {
        x: 2315,
        y: 275,
        width: 80,
        height: 80
    }, {
        x: 3940,
        y: 1440,
        width: 80,
        height: 80
    }, {
        x: 2075,
        y: 1845,
        width: 80,
        height: 80
    }];

    const originalSunshades = [{
        x: 4350,
        y: 600,
        width: 320,
        height: 340
    }, {
        x: 4440,
        y: 1400,
        width: 320,
        height: 340
    }];
    const mirroredSunshades = originalSunshades.map(s => ({ ...s,
        y: WORLD_HEIGHT - s.y - s.height
    }));

    gameState = {
        players: currentPlayers,
        arrows: [],
        blowdartArrows: [], // NOVO: Array para flechas do Blowdart
        drones: {},
        grenades: [],
        groundItems: [],
        traps: [],
        mines: [],
        largeBalls: [],
        portals: [],
        sharks: [],
        floatingTexts: [],
        objects: [],
        obstacles: [],
        takenFunctions: [],
        functionCosts: FUNCTION_COSTS,
        zombieAbilityCosts: ZOMBIE_ABILITY_COSTS,
        gamePhase: 'waiting',
        startTime: 60,
        timeLeft: ROUND_DURATION,
        postRoundTimeLeft: 10,
        lastPortalUseTimestamp: 0,
        hidingSpots: [{
            x: 3150,
            y: 2320,
            width: 80,
            height: 80,
            occupiedBy: null
        }, {
            x: 3940,
            y: 3520,
            width: 80,
            height: 80,
            occupiedBy: null
        }, ],
        skateboard: {
            id: 'skateboard',
            x: 0,
            y: 0,
            width: SKATEBOARD_WIDTH,
            height: SKATEBOARD_HEIGHT,
            spawned: false,
            ownerId: null
        },
        runningTennis: {
            id: 'runningTennis',
            x: 0,
            y: 0,
            width: 40,
            height: 40,
            spawned: false,
            ownerId: null
        },
        ducts: [...originalDucts],
        sunshades: [...originalSunshades, ...mirroredSunshades],
        house: {
            x: 200,
            y: 200,
            width: 2697,
            height: 1670,
            wallThickness: 70, // ALTERADO: Espessura da parede aumentada
            walls: []
        },
        garage: {
            x: 800,
            y: 1400,
            width: 700,
            height: 600,
            wallThickness: 70, // ALTERADO: Espessura da parede aumentada
            walls: []
        },
    };
    createWorldBodies();
    createSharks();
}

// ** INÍCIO DAS ALTERAÇÕES **
// Função para adicionar gemas e aumentar a velocidade do humano
function addGems(player, amount) {
    if (!player || amount <= 0) {
        if (player) player.gems += amount;
        return;
    }

    if (player.role === 'human') {
        const oldGems = player.gems;
        player.gems += amount;
        const newGems = player.gems;

        const milestonesPassed = Math.floor(newGems / 100) - Math.floor(oldGems / 100);
        if (milestonesPassed > 0) {
            let speedIncrease = 0;
            for (let i = 0; i < milestonesPassed; i++) {
                speedIncrease += Math.random() * (0.02 - 0.01) + 0.01;
            }
            player.speed += speedIncrease;
            player.originalSpeed += speedIncrease; // Aplica o bônus na velocidade base também
        }
    } else {
        // Se não for humano (ex: zumbi pegando gemas de humano infectado), apenas adiciona
        player.gems += amount;
    }
}

// Função para remover gemas e diminuir a velocidade do zumbi
function removeGems(player, amount) {
    if (!player || amount <= 0) return;

    const oldGems = player.gems;
    player.gems = Math.max(0, player.gems - amount);
    const newGems = player.gems;

    if (player.role === 'zombie') {
        const milestonesPassed = Math.floor(oldGems / 100) - Math.floor(newGems / 100);
        if (milestonesPassed > 0) {
            let speedDecrease = 0;
            for (let i = 0; i < milestonesPassed; i++) {
                speedDecrease += Math.random() * (0.02 - 0.01) + 0.01;
            }
            player.speed = Math.max(ZOMBIE_MIN_SPEED, player.speed - speedDecrease);
            player.originalSpeed = Math.max(ZOMBIE_MIN_SPEED, player.originalSpeed - speedDecrease);
        }
    }
}
// ** FIM DAS ALTERAÇÕES **

function createSharks() {
    gameState.sharks = [];
    for (let i = 0; i < 5; i++) {
        const sizeMultiplier = 0.8 + Math.random() * 0.7;
        const shark = {
            id: i,
            width: 150 * sizeMultiplier,
            height: 60 * sizeMultiplier,
            x: SEA_AREA.x + Math.random() * (SEA_AREA.width - 150),
            y: SEA_AREA.y + Math.random() * (SEA_AREA.height - 60),
            speed: (SHARK_BASE_SPEED + Math.random()) * (1 / sizeMultiplier),
            rotation: 0,
            state: 'patrolling', // states: patrolling, attacking, sleeping
            pauseUntil: 0,
            targetPlayerId: null,
            patrolTarget: null,
        };
        gameState.sharks.push(shark);
    }
}

function createWorldBodies() {
    const allBodies = [];
    const wallThickness = 50;
    const boundaries = [
        Matter.Bodies.rectangle(WORLD_WIDTH / 2, -wallThickness / 2, WORLD_WIDTH + (wallThickness * 2), wallThickness, {
            isStatic: true,
            label: 'boundary',
            collisionFilter: {
                category: wallCategory
            }
        }),
        Matter.Bodies.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT + wallThickness / 2, WORLD_WIDTH + (wallThickness * 2), wallThickness, {
            isStatic: true,
            label: 'boundary',
            collisionFilter: {
                category: wallCategory
            }
        }),
        Matter.Bodies.rectangle(-wallThickness / 2, WORLD_HEIGHT / 2, wallThickness, WORLD_HEIGHT + (wallThickness * 2), {
            isStatic: true,
            label: 'boundary',
            collisionFilter: {
                category: wallCategory
            }
        }),
        Matter.Bodies.rectangle(WORLD_WIDTH + wallThickness / 2, WORLD_HEIGHT / 2, wallThickness, WORLD_HEIGHT + (wallThickness * 2), {
            isStatic: true,
            label: 'boundary',
            collisionFilter: {
                category: wallCategory
            }
        })
    ];
    allBodies.push(...boundaries);

    const originalObjectData = [{
        // ... a lista de todos os objetos continua a mesma aqui ...
        id: 'atm',
        x: 3080,
        y: 1200,
        width: 150,
        height: 130,
        isStatic: true
    }, {
        id: 'small_bed',
        x: 280,
        y: 220,
        width: 138,
        height: 230
    }, {
        id: 'big_table',
        x: 1000,
        y: 1350,
        width: 380,
        height: 200
    }, {
        id: 'car',
        x: 3650,
        y: 300,
        width: 280,
        height: 450
    }, {
        id: 'small_bed',
        x: 700,
        y: 220,
        width: 138,
        height: 230
    }, {
        id: 'box',
        x: 2800,
        y: 1150,
        width: 192,
        height: 192,
        rotation: 300
    }, {
        id: 'big_bed',
        x: 1500,
        y: 275,
        width: 180,
        height: 260
    }, {
        id: 'sofa',
        x: 2590,
        y: 1000,
        width: 230,
        height: 100
    }, {
        id: 'square_table',
        x: 1700,
        y: 780,
        width: 170,
        height: 170
    }, {
        id: 'mini_sofa',
        x: 2450,
        y: 1000,
        width: 120,
        height: 100
    }, {
        id: 'park_bench',
        x: 4080,
        y: 300,
        width: 100,
        height: 240
    }, {
        id: 'park_bench',
        x: 4080,
        y: 2000,
        width: 100,
        height: 240,
    }, {
        id: 'park_bench',
        x: 4080,
        y: 3600,
        width: 100,
        height: 240
    }, {
        id: 'pool_table',
        x: 1000,
        y: 800,
        width: 340,
        height: 210
    }];

    const objectData = [...originalObjectData];

    objectData.forEach(data => {
        const uniqueId = nextUniqueObjectId++;
        const body = Matter.Bodies.rectangle(data.x + data.width / 2, data.y + data.height / 2, data.width, data.height, {
            isStatic: data.isStatic || false,
            angle: (data.rotation || 0) * (Math.PI / 180),
            friction: 0.000002,
            frictionAir: 0.07,
            restitution: 0.5,
            density: getDensityById(data.id),
            label: data.isStatic ? 'wall' : 'furniture',
            collisionFilter: {
                category: data.isStatic ? wallCategory : movableObjectCategory
            }
        });
        body.uniqueId = uniqueId;
        body.gameId = data.id;
        allBodies.push(body);
        bodiesMap[uniqueId] = body;
        gameState.objects.push({ ...data,
            uniqueId,
            vx: 0,
            vy: 0,
            angularVelocity: 0,
            draggedBy: null,
            draggedUntil: null
        });
    });

    buildWalls(gameState.house);
    buildWalls(gameState.garage);
    [...gameState.house.walls, ...gameState.garage.walls].forEach(wall => {
        allBodies.push(Matter.Bodies.rectangle(wall.x + wall.width / 2, wall.y + wall.height / 2, wall.width, wall.height, {
            isStatic: true,
            label: 'wall',
            collisionFilter: {
                category: wallCategory
            }
        }));
    });

    Matter.World.add(world, allBodies);
}

function buildWalls(structure) {
    const s = structure;
    const wt = s.wallThickness;
    s.walls = [];

    if (s === gameState.house) {
        // --- PARTE 1: DEFINIÇÃO DAS PAREDES DA CASA ORIGINAL (NÃO MEXA AQUI) ---
        const originalHouseWalls = [
            { x: s.x, y: s.y, width: s.width, height: wt },
            { x: s.x, y: s.y + s.height - wt - 200, width: s.width - 1300, height: wt },
            { x: s.x, y: s.y, width: wt, height: 820 },
            { x: s.x, y: s.y + 1020, width: wt, height: s.height - 1220 },
            { x: s.x + s.width - wt, y: s.y, width: wt, height: 250 },
            { x: s.x + s.width - wt, y: s.y + 650, width: wt, height: (s.height - 770) - 650 },
            { x: s.x + 900, y: s.y, width: wt, height: 470 },
            { x: s.x + 600, y: s.y + 1020, width: wt, height: 450 },
            { x: s.x + 1500, y: s.y, width: wt, height: 300 },
            { x: s.x + 1338, y: s.y + 1030, width: wt, height: 440 },
            { x: s.x + 2200, y: s.y, width: wt, height: 470 },
            { x: s.x + 2195, y: s.y + 750, width: wt, height: 150 },
            { x: s.x, y: s.y + 400, width: 700, height: wt },
            { x: s.x + 1800, y: s.y + 400, width: 270, height: wt },
            { x: s.x + 250, y: s.y + 1020, width: 850, height: wt },
            { x: s.x + 1150, y: s.y + 400, width: 720, height: wt },
            { x: s.x + 1800, y: s.y, width: wt, height: 400 + wt },
            { x: s.x, y: s.y + 750, width: 550, height: wt },
            { x: s.x + 1330, y: s.y + 830, width: 533, height: wt },
            { x: s.x + 2000, y: s.y + 830, width: 697, height: wt },
            { x: s.x + 480, y: s.y + 620, width: wt, height: 200 }
        ];
        s.walls.push(...originalHouseWalls);

        // --- PARTE 2: DEFINIÇÃO DAS PAREDES DA CASA DUPLICADA (MODIFICADA) ---
        // ALTERADO: Estrutura da casa de baixo modificada
        const mirroredHouseWalls = [
            // As coordenadas 'y' são calculadas para espelhar a posição da parede original
            { x: s.x, y: WORLD_HEIGHT - s.y - wt, width: s.width, height: wt },
            { x: s.x, y: WORLD_HEIGHT - (s.y + s.height - wt - 200) - wt, width: s.width - 1300, height: wt },
            { x: s.x, y: WORLD_HEIGHT - s.y - 820, width: wt, height: 820 },
            { x: s.x, y: WORLD_HEIGHT - (s.y + 1020) - (s.height - 1220), width: wt, height: s.height - 1220 },
            { x: s.x + s.width - wt, y: WORLD_HEIGHT - s.y - 250, width: wt, height: 250 },
            { x: s.x + s.width - wt, y: WORLD_HEIGHT - (s.y + 650) - ((s.height - 770) - 650), width: wt, height: (s.height - 770) - 650 },
            { x: s.x + 900, y: WORLD_HEIGHT - s.y - 470, width: wt, height: 470 },
            // { x: s.x + 600, y: WORLD_HEIGHT - (s.y + 1020) - 450, width: wt, height: 450 }, // <-- PAREDE REMOVIDA PARA CRIAR UM CORREDOR
            { x: s.x + 1500, y: WORLD_HEIGHT - s.y - 300, width: wt, height: 300 },
            { x: s.x + 1338, y: WORLD_HEIGHT - (s.y + 1030) - 440, width: wt, height: 440 },
            { x: s.x + 2200, y: WORLD_HEIGHT - s.y - 470, width: wt, height: 470 },
            { x: s.x + 2195, y: WORLD_HEIGHT - (s.y + 750) - 150, width: wt, height: 150 },
            { x: s.x, y: WORLD_HEIGHT - (s.y + 400) - wt, width: 700, height: wt },
            { x: s.x + 1800, y: WORLD_HEIGHT - (s.y + 400) - wt, width: 270, height: wt },
            { x: s.x + 250, y: WORLD_HEIGHT - (s.y + 1020) - wt, width: 850, height: wt },
            // { x: s.x + 1150, y: WORLD_HEIGHT - (s.y + 400) - wt, width: 720, height: wt }, // <-- PAREDE LONGA SUBSTITUÍDA PELAS DUAS ABAIXO
            { x: s.x + 1150, y: WORLD_HEIGHT - (s.y + 400) - wt, width: 300, height: wt }, // <-- Pedaço 1 da parede, criando uma porta
            { x: s.x + 1570, y: WORLD_HEIGHT - (s.y + 400) - wt, width: 300, height: wt }, // <-- Pedaço 2 da parede, criando uma porta
            { x: s.x + 1800, y: WORLD_HEIGHT - s.y - (400 + wt), width: wt, height: 400 + wt },
            { x: s.x, y: WORLD_HEIGHT - (s.y + 750) - wt, width: 550, height: wt },
            { x: s.x + 1330, y: WORLD_HEIGHT - (s.y + 830) - wt, width: 533, height: wt },
            { x: s.x + 2000, y: WORLD_HEIGHT - (s.y + 830) - wt, width: 697, height: wt },
            { x: s.x + 480, y: WORLD_HEIGHT - (s.y + 620) - 200, width: wt, height: 200 }
        ];
        s.walls.push(...mirroredHouseWalls);

    } else if (s === gameState.garage) {
        // --- PARTE 3: DEFINIÇÃO DAS PAREDES DA GARAGEM (NÃO É DUPLICADA) ---
        const doorHeight = 150;
        const wallChunk = (s.height - doorHeight) / 2;
        s.walls.push({ x: s.x + 1400, y: s.y, width: s.width - 200, height: wt });
        s.walls.push({ x: s.x + 1200, y: s.y + s.height - wt, width: s.width, height: wt });
        s.walls.push({ x: s.x + 1200, y: s.y, width: wt, height: wallChunk });
        s.walls.push({ x: s.x + 1200, y: s.y + wallChunk + doorHeight, width: wt, height: wallChunk });
        s.walls.push({ x: s.x + s.width - wt + 1200, y: s.y, width: wt, height: s.height - 460 });
        s.walls.push({ x: s.x + s.width - wt + 1200, y: s.y + 460, width: wt, height: 140 });
    }
}

function isColliding(rect1, rect2) {
    if (!rect1 || !rect2) {
        return false;
    }
    return rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y;
}

function isCollidingCircleCircle(c1, c2) {
    if (!c1 || !c2) return false;
    const dx = c1.cx - c2.cx;
    const dy = c1.cy - c2.cy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < c1.radius + c2.radius;
}

function createNewPlayer(socket) {
    const startX = WORLD_WIDTH / 2 + 500;
    const startY = WORLD_HEIGHT / 2;

    const player = {
        name: `Player${Math.floor(100 + Math.random() * 900)}`,
        id: socket.id,
        x: startX,
        y: startY,
        vx: 0,
        vy: 0,
        knockbackVx: 0,
        knockbackVy: 0,
        width: INITIAL_PLAYER_SIZE,
        height: INITIAL_PLAYER_SIZE * 1.5,
        speed: INITIAL_PLAYER_SPEED,
        originalSpeed: INITIAL_PLAYER_SPEED,
        rotation: 0,
        role: 'human',
        selectedSlot: 0,
        activeFunction: ' ',
        gems: 1000,
        isSprinting: false,
        sprintAvailable: true,
        isSpying: false,
        spyUsesLeft: 2,
        spyCooldown: false,
        isHidden: false,
        engineerCooldownUntil: 0,
        isInDuct: false,
        inventory: [],
        inventorySlots: 1,
        hasInventoryUpgrade: false,
        butterflyUsed: false,
        isFlying: false,
        isFlyingWithWings: false,
        angelWingsFlightEndsAt: 0,
        teleportCooldownUntil: 0,
        isInvisible: false,
        zombieAbility: null,
        trapsLeft: 0,
        minesLeft: 0,
        isTrapped: false,
        trappedUntil: 0,
        carryingObject: null,
        portalCooldownUntil: 0,
        hasAntidoteEffect: false,
        initialZombieProtection: 0,
        draggedBy: null,
        draggedUntil: null,
        isBeingEaten: false,
        isSleeping: false,
        sleepUntil: 0,
        rhinocerosCooldownUntil: 0,
        slowedUntil: null, // NOVO: Para efeito de lentidão
        originalSpeedBeforeSlow: null, // NOVO: Para restaurar a velocidade
        input: {
            movement: {
                up: false,
                down: false,
                left: false,
                right: false
            },
            worldMouse: {
                x: 0,
                y: 0
            }
        }
    };
    gameState.players[socket.id] = player;

    const playerBody = createPlayerBody(player);
    Matter.World.add(world, playerBody);
}

function dropHeldItem(player) {
    if (!player || !player.inventory) return;
    if (!Array.isArray(player.inventory) || player.inventory.length === 0) return;
    while (player.inventory.length > 0) {
        const itemToDrop = player.inventory.pop();
        if (!itemToDrop) continue;
        if (itemToDrop.id === 'gravityGlove') continue;

        const dropDistance = player.width / 2 + DROPPED_ITEM_SIZE;
        const dropX = player.x + player.width / 2 + Math.cos(player.rotation) * dropDistance;
        const dropY = player.y + player.height / 2 + Math.sin(player.rotation) * dropDistance;

        let dropData = {
            id: itemToDrop.id,
            x: dropX - DROPPED_ITEM_SIZE / 2,
            y: dropY - DROPPED_ITEM_SIZE / 2,
            width: DROPPED_ITEM_SIZE,
            height: DROPPED_ITEM_SIZE
        };

        switch (itemToDrop.id) {
            case 'skateboard':
                gameState.skateboard.spawned = true;
                gameState.skateboard.ownerId = null;
                gameState.skateboard.x = dropX - gameState.skateboard.width / 2;
                gameState.skateboard.y = dropY - gameState.skateboard.height / 2;
                continue;
            case 'runningTennis':
                gameState.runningTennis.spawned = true;
                gameState.runningTennis.ownerId = null;
                gameState.runningTennis.x = dropX - gameState.runningTennis.width / 2;
                gameState.runningTennis.y = dropY - gameState.runningTennis.height / 2;
                continue;
            case 'drone':
                delete gameState.drones[player.id];
                dropData.ammo = typeof itemToDrop.ammo === 'number' ? itemToDrop.ammo : DRONE_MAX_AMMO;
                break;
            case 'bow':
            case 'blowdart': // NOVO: Blowdart também pode ter dados específicos
                dropData.width = 70;
                dropData.height = 20;
                break;
            case 'invisibilityCloak':
                player.isInvisible = false;
                dropData.active = false;
                break;
            case 'card':
                dropData.width = 37;
                dropData.height = 25;
                break;
            case 'angelWings':
                player.isFlyingWithWings = false;
                dropData.cooldownUntil = itemToDrop.cooldownUntil;
                break;
        }
        gameState.groundItems.push(dropData);
    }
}

function updateSharks() {
    if (!gameState.sharks || gameState.sharks.length === 0) return;

    const now = Date.now();
    const humansInSea = Object.values(gameState.players).filter(p => p.role === 'human' && !p.isBeingEaten && isColliding(p, SEA_AREA));

    for (const shark of gameState.sharks) {

        if (shark.targetPlayerId) {
            const target = gameState.players[shark.targetPlayerId];
            if (!target || target.role !== 'human' || !isColliding(target, SEA_AREA)) {
                shark.targetPlayerId = null;
                shark.state = 'patrolling';
            }
        }

        if (shark.state !== 'attacking' && humansInSea.length > 0) {
            let closestPlayer = null;
            let minDistance = Infinity;
            for (const player of humansInSea) {
                const distance = Math.hypot(shark.x - player.x, shark.y - player.y);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestPlayer = player;
                }
            }
            if (closestPlayer) {
                shark.state = 'attacking';
                shark.targetPlayerId = closestPlayer.id;
            }
        }

        switch (shark.state) {
            case 'attacking':
                const target = gameState.players[shark.targetPlayerId];
                if (target) {
                    const angle = Math.atan2(target.y - shark.y, target.x - shark.x);
                    shark.rotation = angle;
                    shark.x += Math.cos(angle) * shark.speed * 1.5;
                    shark.y += Math.sin(angle) * shark.speed * 1.5;

                    if (isColliding(shark, target) && !target.isBeingEaten) {
                        target.isBeingEaten = true;
                        io.emit('newMessage', {
                            name: 'Server',
                            text: `${target.name} was eaten by a shark!`,
                            color: '#ff4d4d'
                        });

                        dropHeldItem(target);

                        setTimeout(() => {
                            const revivedPlayer = gameState.players[target.id];
                            if (revivedPlayer) {
                                revivedPlayer.role = 'zombie';
                                const playerBody = world.bodies.find(b => b.playerId === revivedPlayer.id);
                                if (playerBody) {
                                    Matter.Body.setPosition(playerBody, {
                                        x: WORLD_WIDTH / 2 + 500,
                                        y: WORLD_HEIGHT / 2
                                    });
                                    Matter.Body.setVelocity(playerBody, {
                                        x: 0,
                                        y: 0
                                    });
                                }
                                revivedPlayer.isBeingEaten = false;
                            }
                        }, 5000);

                        shark.targetPlayerId = null;
                        shark.state = 'patrolling';
                    }
                }
                break;
            case 'paused':
                if (now > shark.pauseUntil) {
                    shark.state = 'patrolling';
                    shark.patrolTarget = null;
                }
                break;
            case 'patrolling':
                if (!shark.patrolTarget) {
                    const margin = 50;
                    shark.patrolTarget = {
                        x: SEA_AREA.x + margin + Math.random() * (SEA_AREA.width - margin * 2),
                        y: SEA_AREA.y + margin + Math.random() * (SEA_AREA.height - margin * 2)
                    };
                }

                const dist = Math.hypot(shark.patrolTarget.x - shark.x, shark.patrolTarget.y - shark.y);

                if (dist < 20) {
                    shark.state = 'paused';
                    shark.pauseUntil = now + 5000;
                } else {
                    const angle = Math.atan2(shark.patrolTarget.y - shark.y, shark.patrolTarget.x - shark.x);
                    shark.rotation = angle;
                    shark.x += Math.cos(angle) * shark.speed;
                    shark.y += Math.sin(angle) * shark.speed;
                }
                break;
        }
    }
}


function updateGameState() {
    const now = Date.now();
    Matter.Engine.update(engine, TICK_RATE);
    updateSharks();


    for (let i = gameState.floatingTexts.length - 1; i >= 0; i--) {
        const text = gameState.floatingTexts[i];
        if (Date.now() - text.createdAt > 2000) {
            gameState.floatingTexts.splice(i, 1);
        }
    }

    for (const body of world.bodies) {
        if (body.uniqueId !== undefined) {
            let obj = gameState.objects.find(o => o.uniqueId === body.uniqueId) || gameState.largeBalls.find(b => b.uniqueId === body.uniqueId);
            if (obj) {
                obj.x = body.position.x - (obj.width || obj.radius * 2) / 2;
                obj.y = body.position.y - (obj.height || obj.radius * 2) / 2;
                obj.rotation = body.angle;
                obj.vx = body.velocity.x;
                obj.vy = body.velocity.y;
                obj.angularVelocity = body.angularVelocity;
            }
        }
        if (body.playerId) {
            const player = gameState.players[body.playerId];
            if (player) {
                player.x = body.position.x - player.width / 2;
                player.y = body.position.y - player.height / 2;
                player.vx = body.velocity.x;
                player.vy = body.velocity.y;
                if (!isFinite(player.x) || !isFinite(player.y)) {
                    Matter.Body.setPosition(body, {
                        x: WORLD_WIDTH / 2,
                        y: WORLD_HEIGHT / 2
                    });
                    Matter.Body.setVelocity(body, {
                        x: 0,
                        y: 0
                    });
                }
            }
        }
    }

    for (let i = gameState.largeBalls.length - 1; i >= 0; i--) {
        const ball = gameState.largeBalls[i];
        if (now - ball.createdAt > 2000) {
            const ballBody = world.bodies.find(b => b.uniqueId === ball.uniqueId);
            if (ballBody) Matter.World.remove(world, ballBody);
            gameState.largeBalls.splice(i, 1);
            continue;
        }
    }

    for (let i = gameState.groundItems.length - 1; i >= 0; i--) {
        const item = gameState.groundItems[i];

        // Se o item está na área do mar
        if (isColliding(item, SINKING_AREA)) {
            // Se ele ainda não começou a afundar, marque o início
            if (!item.isSinking) {
                item.isSinking = true;
                item.sinkingStartTime = now;
            }
        }

        // Se o item está afundando, atualize seu progresso
        if (item.isSinking) {
            const elapsed = now - item.sinkingStartTime;
            const progress = elapsed / SINKING_DURATION;

            if (progress >= 1) {
                // Se o tempo acabou, remova o item do jogo
                gameState.groundItems.splice(i, 1);
            } else {
                // Caso contrário, envie o progresso para o cliente
                item.sinkingProgress = progress;
            }
        }
    }

    for (let i = gameState.objects.length - 1; i >= 0; i--) {
        const obj = gameState.objects[i];
        const body = bodiesMap[obj.uniqueId]; // Pega o corpo físico do objeto

        // Pula objetos estáticos (como o ATM) ou que não têm corpo físico
        if (!body || body.isStatic) {
            continue;
        }

        // Se o objeto está na área do mar
        if (isColliding(obj, SINKING_AREA)) {
            // Se ele ainda não começou a afundar, marque o início
            if (!obj.isSinking) {
                obj.isSinking = true;
                obj.sinkingStartTime = now;
            }
        }

        // Se o objeto está afundando, atualize seu progresso
        if (obj.isSinking) {
            const elapsed = now - obj.sinkingStartTime;
            const progress = elapsed / SINKING_DURATION;

            if (progress >= 1) {
                // Se o tempo acabou, remova o objeto completamente
                if (body) Matter.World.remove(world, body); // Remove do mundo da física
                delete bodiesMap[obj.uniqueId];             // Remove do nosso mapa de referência
                gameState.objects.splice(i, 1);             // Remove do estado do jogo
            } else {
                // Caso contrário, envie o progresso para o cliente
                obj.sinkingProgress = progress;
            }
        }
    }

    for (const id in gameState.players) {
        const player = gameState.players[id];
        const playerBody = world.bodies.find(b => b.playerId === id);
        if (!player || !playerBody || !player.input || player.isBeingEaten) continue;

        // NOVO: Handle slow effect expiration
        if (player.slowedUntil && now > player.slowedUntil) {
            player.speed = player.originalSpeedBeforeSlow || player.originalSpeed;
            player.slowedUntil = null;
            player.originalSpeedBeforeSlow = null;
        }

        if (player.isHidden) {
            Matter.Body.setVelocity(playerBody, { x: 0, y: 0 });
            continue;
        }

        if (player.isFlyingWithWings && now > (player.angelWingsFlightEndsAt || 0)) {
            player.isFlyingWithWings = false;
            player.angelWingsFlightEndsAt = 0;
            const wingItem = player.inventory.find(i => i && i.id === 'angelWings');
            if (wingItem) {
                wingItem.cooldownUntil = now + 20000;
            }
            if (playerBody) {
                playerBody.collisionFilter.mask = 0xFFFFFFFF;
            }
        }

        // ALTERADO: Lógica de tamanho separada para humanos e zumbis
        const gemBonus = Math.sqrt(Math.max(0, player.gems)) * 0.2;
        if (player.role === 'zombie') {
            const baseSize = 40; // Base de largura maior
            player.width = baseSize + gemBonus;
            player.height = player.width * 1.4; // Proporção altura/largura menor para parecer mais largo
        } else {
            const baseSize = 35;
            player.width = baseSize + gemBonus;
            player.height = player.width * 1.5;
        }


        const infectionRadius = player.width * 0.75;
        player.physicalHitbox = {
            cx: playerBody.position.x,
            cy: playerBody.position.y,
            radius: infectionRadius
        };

        if (player.draggedBy && now < player.draggedUntil) {
            const ballBody = world.bodies.find(b => b.uniqueId === player.draggedBy);
            if (ballBody) {
                const dragForce = Matter.Vector.mult(Matter.Vector.normalise(ballBody.velocity), LARGE_BALL_PLAYER_KNOCKBACK / 10);
                if (isFinite(dragForce.x) && isFinite(dragForce.y)) {
                    Matter.Body.applyForce(playerBody, playerBody.position, dragForce);
                }
            } else {
                player.draggedBy = null;
                player.draggedUntil = null;
            }
        } else if (player.draggedBy && now >= player.draggedUntil) {
            player.draggedBy = null;
            player.draggedUntil = null;
        }

        if (player.isTrapped && now > player.trappedUntil) player.isTrapped = false;

        if (player.knockbackVx !== 0 || player.knockbackVy !== 0) {
            Matter.Body.applyForce(playerBody, playerBody.position, {
                x: player.knockbackVx / 50,
                y: player.knockbackVy / 50
            });
            player.knockbackVx *= 0.9;
            player.knockbackVy *= 0.9;
            if (Math.hypot(player.knockbackVx, player.knockbackVy) < 0.1) {
                player.knockbackVx = 0;
                player.knockbackVy = 0;
            }
        }

        if (player.isTrapped) {
            Matter.Body.setVelocity(playerBody, {
                x: 0,
                y: 0
            });
            continue;
        }

        if (player.isFlying || player.isFlyingWithWings) {
            let moveX = 0,
                moveY = 0;
            const flyingSpeed = player.isFlyingWithWings ? player.speed * 2 : BUTTERFLY_SPEED;
            if (player.input.movement.up) moveY -= 1;
            if (player.input.movement.down) moveY += 1;
            if (player.input.movement.left) moveX -= 1;
            if (player.input.movement.right) moveX += 1;

            if (moveX !== 0 || moveY !== 0) {
                const mag = Math.sqrt(moveX * moveX + moveY * moveY);
                moveX = (moveX / mag) * flyingSpeed;
                moveY = (moveY / mag) * flyingSpeed;
                Matter.Body.setPosition(playerBody, {
                    x: playerBody.position.x + moveX,
                    y: playerBody.position.y + moveY
                });
            } else {
                Matter.Body.setVelocity(playerBody, {
                    x: 0,
                    y: 0
                });
            }
            continue;
        }

        if (player.inventory.some(i => i && i.id === 'skateboard')) {
            const skateSpeed = SKATEBOARD_SPEED_BOOST;
            const angle = player.rotation;
            const velocity = {
                x: Math.cos(angle) * skateSpeed,
                y: Math.sin(angle) * skateSpeed
            };
            Matter.Body.setVelocity(playerBody, velocity);
        } else {
            let targetVx = playerBody.velocity.x;
            let targetVy = playerBody.velocity.y;
            let accelX = 0,
                accelY = 0;

            const hasMovementInput = player.input.movement.left || player.input.movement.right || player.input.movement.up || player.input.movement.down;

            if (hasMovementInput) {
                if (player.input.movement.left) accelX -= 1;
                if (player.input.movement.right) accelX += 1;
                if (player.input.movement.up) accelY -= 1;
                if (player.input.movement.down) accelY += 1;
            }

            if (accelX !== 0 || accelY !== 0) {
                const mag = Math.sqrt(accelX * accelX + accelY * accelY);
                targetVx += (accelX / mag) * PLAYER_ACCELERATION;
                targetVy += (accelY / mag) * PLAYER_ACCELERATION;
            } else {
                targetVx *= PLAYER_FRICTION;
                targetVy *= PLAYER_FRICTION;
            }

            let effectiveSpeed = player.isSprinting ? MAX_PLAYER_SPEED : player.speed;

            // ALTERAÇÃO AQUI: Lógica de velocidade por gemas para humanos
            if (player.role === 'human') {
                const gemsForSpeed = Math.min(player.gems, 50);
                const speedBonus = (gemsForSpeed / 50) * 0.3; // Bônus máximo de 0.3
                effectiveSpeed += speedBonus;
            }

            if (player.inventory.some(i => i && i.id === 'runningTennis')) {
                effectiveSpeed += RUNNING_TENNIS_SPEED_BOOST;
            }

            if (player.role === 'zombie') effectiveSpeed *= ZOMBIE_SPEED_BOOST;

            if (isColliding(player, SAND_AREA)) {
                effectiveSpeed *= 0.90;
            }
            if (isColliding(player, SEA_AREA)) {
                effectiveSpeed *= 0.70;
            }

            const currentSpeedSq = targetVx * targetVx + targetVy * targetVy;
            if (currentSpeedSq > effectiveSpeed * effectiveSpeed) {
                const speedMag = Math.sqrt(currentSpeedSq);
                targetVx = (targetVx / speedMag) * effectiveSpeed;
                targetVy = (targetVy / speedMag) * effectiveSpeed;
            }

            Matter.Body.setVelocity(playerBody, {
                x: targetVx,
                y: targetVy
            });
        }

        const padding = 10;
        let newPosX = playerBody.position.x;
        let newPosY = playerBody.position.y;
        let positionChanged = false;
        if (playerBody.position.x < padding) {
            newPosX = padding;
            positionChanged = true;
        }
        if (playerBody.position.x > WORLD_WIDTH - padding) {
            newPosX = WORLD_WIDTH - padding;
            positionChanged = true;
        }
        if (playerBody.position.y < padding) {
            newPosY = padding;
            positionChanged = true;
        }
        if (playerBody.position.y > WORLD_HEIGHT - padding) {
            newPosY = WORLD_HEIGHT - padding;
            positionChanged = true;
        }
        if (positionChanged) {
            Matter.Body.setPosition(playerBody, {
                x: newPosX,
                y: newPosY
            });
            Matter.Body.setVelocity(playerBody, {
                x: 0,
                y: 0
            });
        }
    }

    for (const obj of gameState.objects) {
        if (obj.draggedBy && now < obj.draggedUntil) {
            const ballBody = world.bodies.find(b => b.uniqueId === obj.draggedBy);
            const objBody = bodiesMap[obj.uniqueId];
            if (ballBody && objBody && ballBody.velocity.x !== 0 && ballBody.velocity.y !== 0) {
                const dragForce = Matter.Vector.mult(Matter.Vector.normalise(ballBody.velocity), LARGE_BALL_OBJECT_KNOCKBACK / 15);
                if (isFinite(dragForce.x) && isFinite(dragForce.y)) {
                    Matter.Body.applyForce(objBody, objBody.position, dragForce);
                }
            } else {
                obj.draggedBy = null;
                obj.draggedUntil = null;
            }
        } else if (obj.draggedBy && now >= obj.draggedUntil) {
            obj.draggedBy = null;
            obj.draggedUntil = null;
        }
    }

    for (const human of Object.values(gameState.players)) {
        if (human.isInvisible) {
            let isVisible = false;
            for (const zombie of Object.values(gameState.players)) {
                if (zombie.role === 'zombie' && zombie.id !== human.id) {
                    const distance = Math.hypot(human.x - zombie.x, human.y - zombie.y);
                    if (distance < INVISIBILITY_CLOAK_BREAK_DISTANCE) {
                        human.isInvisible = false;
                        const cloak = human.inventory.find(i => i.id === 'invisibilityCloak');
                        if (cloak) {
                            cloak.active = false;
                        }
                        isVisible = true;
                        break;
                    }
                }
            }
            if (isVisible) continue;
        }
    }

    for (let i = gameState.arrows.length - 1; i >= 0; i--) {
        const arrow = gameState.arrows[i];

        if (arrow.isStuck) {
            arrow.angle += arrow.angularVelocity;
        }

        if (arrow.hasHit) continue;

        arrow.x += Math.cos(arrow.angle) * ARROW_SPEED;
        arrow.y += Math.sin(arrow.angle) * ARROW_SPEED;

        let hitPlayer = false;
        for (const playerId in gameState.players) {
            const player = gameState.players[playerId];
            if (arrow.ownerId === playerId || !player.physicalHitbox || player.isInDuct) continue;
            const distSq = (player.physicalHitbox.cx - arrow.x) ** 2 + (player.physicalHitbox.cy - arrow.y) ** 2;
            if (distSq < (player.physicalHitbox.radius) ** 2) {
                player.knockbackVx += Math.cos(arrow.angle) * ARROW_KNOCKBACK_IMPULSES;
                player.knockbackVy += Math.sin(arrow.angle) * ARROW_KNOCKBACK_IMPULSES;
                arrow.hasHit = true;
                arrow.isStuck = true;
                arrow.angularVelocity = 0.001;
                hitPlayer = true;
                setTimeout(() => {
                    gameState.arrows = gameState.arrows.filter(a => a.id !== arrow.id);
                }, ARROW_LIFESPAN_AFTER_HIT);
                break;
            }
        }
        if (hitPlayer) continue;

        const collidables = [...gameState.house.walls, ...gameState.garage.walls, ...gameState.objects];
        let hitWall = false;
        for (const rect of collidables) {
            if (arrow.x > rect.x && arrow.x < rect.x + rect.width && arrow.y > rect.y && arrow.y < rect.y + rect.height) {
                arrow.hasHit = true;
                hitWall = true;
                setTimeout(() => {
                    gameState.arrows = gameState.arrows.filter(a => a.id !== arrow.id);
                }, 3000);
                break;
            }
        }

        if (hitWall) continue;

        if (!hitPlayer && (arrow.x < 0 || arrow.x > WORLD_WIDTH || arrow.y < 0 || arrow.y > WORLD_HEIGHT)) {
            gameState.arrows.splice(i, 1);
        }
    }

    // NOVO: Lógica de atualização para as flechas do Blowdart
    for (let i = gameState.blowdartArrows.length - 1; i >= 0; i--) {
        const arrow = gameState.blowdartArrows[i];
        if (arrow.hasHit) continue;

        arrow.x += Math.cos(arrow.angle) * ARROW_SPEED;
        arrow.y += Math.sin(arrow.angle) * ARROW_SPEED;

        let hitSomething = false;

        for (const playerId in gameState.players) {
            const player = gameState.players[playerId];
            if (arrow.ownerId === playerId || player.role !== 'zombie' || !player.physicalHitbox || player.isInDuct) continue;

            const distSq = (player.physicalHitbox.cx - arrow.x) ** 2 + (player.physicalHitbox.cy - arrow.y) ** 2;
            if (distSq < player.physicalHitbox.radius ** 2) {
                if (!player.slowedUntil || now > player.slowedUntil) {
                    player.originalSpeedBeforeSlow = player.speed;
                }
                player.speed = 1;
                player.slowedUntil = now + 3000;

                hitSomething = true;
                gameState.blowdartArrows.splice(i, 1);
                break;
            }
        }

        if (hitSomething) continue;

        const collidables = [...gameState.house.walls, ...gameState.garage.walls, ...gameState.objects];
        for (const rect of collidables) {
            if (arrow.x > rect.x && arrow.x < rect.x + rect.width && arrow.y > rect.y && arrow.y < rect.y + rect.height) {
                hitSomething = true;
                break;
            }
        }
        if (!hitSomething && (arrow.x < 0 || arrow.x > WORLD_WIDTH || arrow.y < 0 || arrow.y > WORLD_HEIGHT)) {
            hitSomething = true;
        }

        if (hitSomething) {
            gameState.blowdartArrows.splice(i, 1);
        }
    }


    for (const ownerId in gameState.drones) {
        const drone = gameState.drones[ownerId];
        const player = gameState.players[ownerId];
        if (player && player.input.worldMouse) {
            drone.x += (player.input.worldMouse.x - drone.x) * DRONE_FOLLOW_FACTOR;
            drone.y += (player.input.worldMouse.y - drone.y) * DRONE_FOLLOW_FACTOR;
        }
    }

    for (let i = gameState.grenades.length - 1; i >= 0; i--) {
        const grenade = gameState.grenades[i];
        if (now > grenade.explodeTime) {
            for (const player of Object.values(gameState.players)) {
                const playerCenterX = player.x + player.width / 2;
                const playerCenterY = player.y + player.height / 2;
                const distance = Math.hypot(playerCenterX - grenade.x, playerCenterY - grenade.y);
                if (distance < GRENADE_RADIUS) {
                    const knockback = (1 - (distance / GRENADE_RADIUS)) * GRENADE_KNOCKBACK_IMPulse;
                    const angle = Math.atan2(playerCenterY - grenade.y, playerCenterX - grenade.x);
                    player.knockbackVx += Math.cos(angle) * knockback;
                    player.knockbackVy += Math.sin(angle) * knockback;
                }
            }
            gameState.grenades.splice(i, 1);
        }
    }

    for (let i = gameState.traps.length - 1; i >= 0; i--) {
        const trap = gameState.traps[i];
        for (const player of Object.values(gameState.players)) {
            if (player.role === 'human' && !player.isTrapped && Math.hypot(player.x - trap.x, player.y - trap.y) < TRAP_SIZE) {
                player.isTrapped = true;
                player.trappedUntil = now + TRAP_DURATION;
                gameState.traps.splice(i, 1);
                break;
            }
        }
    }

    for (let i = gameState.mines.length - 1; i >= 0; i--) {
        const mine = gameState.mines[i];
        if (now < mine.createdAt + 2000) continue;

        let triggered = false;
        let triggeringPlayer = null;

        for (const player of Object.values(gameState.players)) {
            if (player.role === 'zombie') continue;
            if (Math.hypot((player.x + player.width / 2) - (mine.x + mine.width / 2), (player.y + player.height / 2) - (mine.y + mine.height / 2)) < MINE_SIZE) {
                triggered = true;
                triggeringPlayer = player;
                break;
            }
        }

        if (triggered) {
            for (const player of Object.values(gameState.players)) {
                const distance = Math.hypot((player.x + player.width / 2) - (mine.x + mine.width / 2), (player.y + player.height / 2) - (mine.y + mine.height / 2));

                if (distance < MINE_EXPLOSION_RADIUS) {
                    const angle = Math.atan2((player.y + player.height / 2) - (mine.y + mine.height / 2), (player.x + player.width / 2) - (mine.x + mine.width / 2));

                    let knockbackForce;
                    if (player.id === triggeringPlayer.id) {
                        knockbackForce = MINE_PRIMARY_KNOCKBACK;
                    } else {
                        knockbackForce = MINE_SPLASH_KNOCKBACK * (1 - (distance / MINE_EXPLOSION_RADIUS));
                    }

                    player.knockbackVx += Math.cos(angle) * knockbackForce;
                    player.knockbackVy += Math.sin(angle) * knockbackForce;
                }
            }
            gameState.mines.splice(i, 1);
        }
    }

    if (now > gameState.lastPortalUseTimestamp) {
        const portalsByOwner = {};
        for (const portal of gameState.portals) {
            if (!portalsByOwner[portal.ownerId]) portalsByOwner[portal.ownerId] = [];
            portalsByOwner[portal.ownerId].push(portal);
        }

        for (const ownerId in portalsByOwner) {
            if (portalsByOwner[ownerId].length === 2) {
                const [portalA, portalB] = portalsByOwner[ownerId];
                for (const player of Object.values(gameState.players)) {
                    const playerBody = world.bodies.find(b => b.playerId === player.id);
                    if (!playerBody) continue;

                    let teleported = false;
                    if (Math.hypot(playerBody.position.x - portalA.x, playerBody.position.y - portalA.y) < PORTAL_SIZE / 2) {
                        Matter.Body.setPosition(playerBody, {
                            x: portalB.x,
                            y: portalB.y
                        });
                        teleported = true;
                    } else if (Math.hypot(playerBody.position.x - portalB.x, playerBody.position.y - portalB.y) < PORTAL_SIZE / 2) {
                        Matter.Body.setPosition(playerBody, {
                            x: portalA.x,
                            y: portalA.y
                        });
                        teleported = true;
                    }

                    if (teleported) {
                        gameState.lastPortalUseTimestamp = now + PORTAL_COOLDOWN;
                        break;
                    }
                }
                if (now > gameState.lastPortalUseTimestamp) {
                    continue;
                } else {
                    break;
                }
            }
        }
    }
}

function setupCollisionEvents() {
    Matter.Events.on(engine, 'collisionStart', (event) => {
        for (const pair of event.pairs) {
            let ball, other;
            if (pair.bodyA.label === 'largeBall') {
                ball = pair.bodyA;
                other = pair.bodyB;
            }
            if (pair.bodyB.label === 'largeBall') {
                ball = pair.bodyB;
                other = pair.bodyA;
            }

            if (ball && other) {
                if (other.label === 'player') {
                    const player = gameState.players[other.playerId];
                    if (player) {
                        player.draggedBy = ball.uniqueId;
                        player.draggedUntil = Date.now() + 200;
                    }
                } else if (other.label === 'furniture' || other.label === 'box') {
                    const objState = gameState.objects.find(o => o.uniqueId === other.uniqueId);
                    if (objState) {
                        objState.draggedBy = ball.uniqueId;
                        objState.draggedUntil = Date.now() + 500;
                    }
                }
            }
        }
    });

    Matter.Events.on(engine, 'collisionActive', (event) => {
        for (const pair of event.pairs) {
            let playerBody, objectBody;
            if (pair.bodyA.label === 'player' && (pair.bodyB.label === 'furniture' || pair.bodyB.label === 'box')) {
                playerBody = pair.bodyA;
                objectBody = pair.bodyB;
            }
            if (pair.bodyB.label === 'player' && (pair.bodyA.label === 'furniture' || pair.bodyA.label === 'box')) {
                playerBody = pair.bodyB;
                objectBody = pair.bodyA;
            }

            if (playerBody && objectBody && !objectBody.isStatic) {
                const player = gameState.players[playerBody.playerId];
                if (player && Matter.Vector.magnitudeSquared(playerBody.velocity) > 0.1) {
                    let forceMagnitude = BOX_PUSH_FORCE;
                    if (player.inventory.some(i => i.id === 'normalGlove')) forceMagnitude *= FORCE_NORMAL_GLOVE_MULTIPLIER;
                    if (player.role === 'zombie') forceMagnitude *= ZOMBIE_PUSH_MODIFIER;

                    const forceDirection = Matter.Vector.normalise(playerBody.velocity);
                    if (Matter.Vector.magnitudeSquared(forceDirection) > 0) {
                        const force = Matter.Vector.mult(forceDirection, forceMagnitude * 0.005);
                        const contactPoint = pair.collision.supports[0] || objectBody.position;

                        Matter.Body.applyForce(objectBody, contactPoint, force);

                        const leverArm = Matter.Vector.sub(contactPoint, objectBody.position);
                        const torque = Matter.Vector.cross(leverArm, playerBody.velocity);
                        const newAngularVelocity = objectBody.angularVelocity + (torque * ROTATION_ON_COLLISION_FACTOR);
                        Matter.Body.setAngularVelocity(objectBody, newAngularVelocity);
                    }
                }
            }

            let pBody1, pBody2;
            if (pair.bodyA.label === 'player' && pair.bodyB.label === 'player') {
                pBody1 = pair.bodyA;
                pBody2 = pair.bodyB;
            }

            if (pBody1 && pBody2) {
                const player1 = gameState.players[pBody1.playerId];
                const player2 = gameState.players[pBody2.playerId];
                if (!player1 || !player2) continue;

                let zombie, human;
                if (player1.role === 'zombie' && player2.role === 'human') {
                    zombie = player1;
                    human = player2;
                }
                if (player2.role === 'zombie' && player1.role === 'human') {
                    zombie = player2;
                    human = player1;
                }

                if (zombie && human && gameState.gamePhase === 'running' && !human.isFlying && !human.isTrapped && !human.isFlyingWithWings) {
                    if (isCollidingCircleCircle(zombie.physicalHitbox, human.physicalHitbox)) {
                        if (human.activeFunction === 'butterfly' && !human.butterflyUsed) {
                            human.butterflyUsed = true;
                            human.isFlying = true;
                            const pBody = world.bodies.find(b => b.playerId === human.id);
                            if (pBody) pBody.collisionFilter.mask = 0;
                            setTimeout(() => {
                                if (gameState.players[human.id]) {
                                    gameState.players[human.id].isFlying = false;
                                    if (pBody) pBody.collisionFilter.mask = 0xFFFFFFFF;
                                }
                            }, BUTTERFLY_DURATION);
                            continue;
                        }
                        dropHeldItem(human);
                        if (human.isSpying) human.isSpying = false;

                                // ALTERAÇÃO: Lógica de roubo de gemas e velocidade ao infectar
                        const percentageToSteal = 0.7 + Math.random() * 0.1; // Gera um valor aleatório entre 0.7 (70%) e 0.8 (80%)
                        const gemsStolen = Math.floor(human.gems * percentageToSteal);
                        const speedLost = (human.speed - ZOMBIE_MIN_SPEED) * percentageToSteal;

                        human.gems = Math.max(0, human.gems - gemsStolen);
                        human.speed -= speedLost;
                        human.originalSpeed -= speedLost;

                        addGems(zombie, gemsStolen);
                        zombie.speed += speedLost;
                        zombie.originalSpeed += speedLost;
                                // FIM DA ALTERAÇÃO

                        human.role = 'zombie';
                        io.emit('newMessage', {
                            name: 'Server',
                            text: `${human.name} has been infected!`,
                            color: '#ff4d4d'
                        });

                        const oldBody = world.bodies.find(b => b.playerId === human.id);
                        if (oldBody) {
                            const {
                                position,
                                velocity
                            } = oldBody;
                            Matter.World.remove(world, oldBody);
                            const newBody = createPlayerBody(human);
                            Matter.Body.setPosition(newBody, position);
                            Matter.Body.setVelocity(newBody, velocity);
                            Matter.World.add(world, newBody);
                        }
                    }
                }
            }
        }
    });
}

io.on('connection', (socket) => {
    console.log(`[SERVIDOR] Conexão recebida. ID do Socket: ${socket.id}`);

    createNewPlayer(socket);

    socket.on("register", ({
        username,
        password
    }) => {
        if (users[username]) return socket.emit("registerError", "Usuário já existe!");
        const id = generateID();
        users[username] = {
            id,
            username,
            password,
            color: "#3498db",
            photo: null,
            editedName: false,
            friends: [],
            requests: []
        };
        saveUsers();
        socket.emit("registerSuccess", users[username]);
    });

    socket.on("login", ({
        username,
        password
    }) => {
        if (!users[username] || users[username].password !== password)
            return socket.emit("loginError", "Usuário ou senha incorretos!");

        socket.username = username;
        sockets[username] = socket.id;
        if (!messages[username]) messages[username] = {};
        socket.emit("loginSuccess", users[username]);

        const player = gameState.players[socket.id];
        if (player) {
            player.name = username;
        }
    });

    socket.on("newLink", url => {
        links.push(url);
        saveLinks();
        socket.broadcast.emit("broadcastLink", url);
    });
    socket.on("checkUserExists", (username, callback) => callback(!!users[username]));
    socket.on("friendRequest", ({
        from,
        to,
        photo
    }) => {
        const targetSocket = sockets[to];
        if (targetSocket) {
            io.to(targetSocket).emit("friendRequestNotification", {
                from,
                photo
            });
        } else {
            if (users[to]) {
                users[to].requests.push(from);
                saveUsers();
            }
        }
    });
    socket.on("acceptRequest", ({
        from,
        to
    }) => {
        if (users[from] && users[to]) {
            users[from].friends.push(to);
            users[to].friends.push(from);
            users[to].requests = users[to].requests.filter(r => r !== from);
            saveUsers();
        }
        const targetSocket = sockets[from];
        if (targetSocket) {
            io.to(targetSocket).emit("friendAccepted", {
                from: to
            });
        }
    });
    socket.on("rejectRequest", ({
        from,
        to
    }) => {
        if (users[to]) {
            users[to].requests = users[to].requests.filter(r => r !== from);
            saveUsers();
        }
    });
    socket.on("dm", ({
        to,
        msg
    }) => {
        const targetSocket = sockets[to];
        if (targetSocket) io.to(targetSocket).emit("dm", {
            from: socket.username,
            msg
        });
    });
    socket.on("changeName", ({
        oldName,
        newName
    }) => {
        if (users[oldName] && !users[newName]) {
            users[newName] = { ...users[oldName],
                username: newName
            };
            delete users[oldName];
            saveUsers();
        }
    });
    socket.on("changePassword", ({
        username,
        newPass
    }) => {
        if (users[username]) {
            users[username].password = newPass;
            saveUsers();
        }
    });
    socket.on("changeColor", ({
        username,
        color
    }) => {
        if (users[username]) {
            users[username].color = color;
            saveUsers();
        }
    });
    socket.on("changePhoto", ({
        username,
        photo
    }) => {
        if (users[username]) {
            users[username].photo = photo;
            saveUsers();
        }
    });

    socket.on('playerInput', (inputData) => {
        const player = gameState.players[socket.id];
        if (player && player.input) {
            player.input.movement = inputData.movement;
            player.rotation = inputData.rotation;
            if (inputData.worldMouse) player.input.worldMouse = inputData.worldMouse;
        }
    });

    socket.on('rotateCarriedObject', (direction) => {
        const player = gameState.players[socket.id];
        if (player && player.carryingObject) {
            const amount = (Math.PI / 40) * (direction === 'left' ? -1 : 1);
            player.carryingObject.rotation += amount;
        }
    });

    socket.on('chooseFunction', (func) => {
        const player = gameState.players[socket.id];
        const cost = FUNCTION_COSTS[func];
        if (gameState.gamePhase === 'running' && player && player.activeFunction === ' ' && cost !== undefined && player.gems >= cost && !gameState.takenFunctions.includes(func)) {
            player.gems = Math.max(0, player.gems - cost);
            player.activeFunction = func;
            gameState.takenFunctions.push(func);
        }
    });

    socket.on('buyZombieAbility', (abilityId) => {
        const player = gameState.players[socket.id];
        const cost = ZOMBIE_ABILITY_COSTS[abilityId];
        if (player && player.role === 'zombie' && !player.zombieAbility && cost !== undefined && player.gems >= cost) {
            removeGems(player, cost);
            player.zombieAbility = abilityId;
            if (abilityId === 'trap') {
                player.trapsLeft = 1;
            } else if (abilityId === 'mine') {
                player.minesLeft = 1;
            }
        }
    });

    socket.on('buyItem', (itemId) => {
        const player = gameState.players[socket.id];
        if (!player) return;
        const currentItemCount = player.inventory.filter(i => i && i.id !== 'card').length;
        if (currentItemCount >= player.inventorySlots) return;

        let cost, itemData;
        switch (itemId) {
            case "normalGlove":
                cost = 500;
                itemData = {
                    id: 'normalGlove'
                };
                break;
            case 'antidote':
                cost = 200;
                itemData = {
                    id: 'antidote'
                };
                break;
                // NOVO: Caso para o Magic Antidote
            case 'magicAntidote':
                cost = 3000;
                itemData = {
                    id: 'magicAntidote'
                };
                break;
                // NOVO: Caso para o Magic Egg
            case 'magicEgg':
                cost = 2000;
                itemData = {
                    id: 'magicEgg'
                };
                break;
            case 'fishingRod':
                cost = 1000;
                itemData = {
                    id: 'fishingRod',
                    uses: 3
                };
                break;
            case 'bow':
                cost = 2000;
                itemData = {
                    id: 'bow',
                    ammo: 200
                };
                break;
            case 'blowdart': // NOVO: Caso para o Blowdart
                cost = 2000;
                itemData = {
                    id: 'blowdart',
                    cooldownUntil: 0
                };
                break;
        }
        if (cost && player.gems >= cost) {
            player.gems = Math.max(0, player.gems - cost);
            player.inventory.push(itemData);
        }
    });

    socket.on('buyRareItem', (itemId) => {
        const player = gameState.players[socket.id];
        if (!player || !player.inventory.some(i => i.id === 'card')) return;
        if (itemId !== 'inventoryUpgrade' && player.inventory.filter(i => i && i.id !== 'card').length >= player.inventorySlots) return;

        let cost, itemData;
        switch (itemId) {
            case 'inventoryUpgrade':
                cost = 20000;
                break;
            case 'skateboard':
                cost = 10000;
                itemData = { ...gameState.skateboard,
                    ownerId: player.id
                };
                break;
            case 'drone':
                cost = 2000;
                itemData = {
                    id: 'drone',
                    ammo: DRONE_MAX_AMMO
                };
                break;
            case 'invisibilityCloak':
                cost = 10000;
                itemData = {
                    id: 'invisibilityCloak',
                    active: false
                };
                break;
            case "gravityGlove":
                cost = 5000;
                itemData = {
                    id: 'gravityGlove',
                    uses: 2
                };
                break;
            case 'portals':
                cost = 3000;
                itemData = {
                    id: 'portals'
                };
                break;
            case 'cannon':
                cost = 5000;
                itemData = {
                    id: 'cannon',
                    cooldownUntil: 0
                };
                break;
            case 'angelWings':
                cost = 30000;
                itemData = {
                    id: 'angelWings',
                    cooldownUntil: 0
                };
                break;
        }

        if (cost && player.gems >= cost) {
            player.gems = Math.max(0, player.gems - cost);
            if (itemId === 'inventoryUpgrade') {
                player.hasInventoryUpgrade = true;
                player.inventorySlots = 2;
            } else {
                player.inventory.push(itemData);
            }
            if (itemId === 'skateboard') {
                gameState.skateboard.ownerId = player.id;
                gameState.skateboard.spawned = false;
            } else if (itemId === 'drone') {
                gameState.drones[player.id] = {
                    ownerId: player.id,
                    x: player.x,
                    y: player.y,
                    ammo: DRONE_MAX_AMMO
                };
            }
            player.inventory = player.inventory.filter(i => i.id !== 'card');
        }
    });

    socket.on('playerAction', (actionData) => {
        const player = gameState.players[socket.id];
        if (!player) return;

        if (player.isHidden && actionData.type !== 'interact') {
            return;
        }

        const now = Date.now();
        switch (actionData.type) {
            case 'toggle_angel_wings_flight':
                const wingItem = player.inventory.find(i => i && i.id === 'angelWings');
                if (wingItem) {
                    const pBody = world.bodies.find(b => b.playerId === player.id);
                    if (player.isFlyingWithWings) { // Deactivating
                        player.isFlyingWithWings = false;
                        player.angelWingsFlightEndsAt = 0;
                        wingItem.cooldownUntil = now + 20000; // 20s cooldown
                        if (pBody) pBody.collisionFilter.mask = 0xFFFFFFFF;
                    } else if (now > (wingItem.cooldownUntil || 0)) { // Activating
                        player.isFlyingWithWings = true;
                        player.angelWingsFlightEndsAt = now + 10000; // 10s flight
                        if (pBody) pBody.collisionFilter.mask = 0;
                    }
                }
                break;
            case 'use_antidote':
                const antidote = player.inventory.find(i => i.id === 'antidote');
                if (antidote) {
                    player.inventory = player.inventory.filter(i => i.id !== 'antidote');
                    if (gameState.gamePhase === 'waiting') {
                        player.initialZombieProtection = 0.50;
                    }
                }
                break;
            case 'use_magic_antidote':
                const magicAntidote = player.inventory.find(i => i.id === 'magicAntidote');
                if (magicAntidote) {
                    player.inventory = player.inventory.filter(i => i.id !== 'magicAntidote');
                    if (gameState.gamePhase === 'waiting') {
                        player.initialZombieProtection = 0.99;
                    }
                }
                break;
            case 'place_portal':
                if (player.inventory.some(i => i.id === 'portals') && gameState.portals.filter(p => p.ownerId === player.id).length < 2) {
                    gameState.portals.push({
                        ownerId: player.id,
                        x: player.x,
                        y: player.y,
                        width: PORTAL_SIZE,
                        height: 80
                    });
                }
                break;
            case 'select_slot':
                if (player.inventorySlots > 1) {
                    const slotIndex = actionData.slot;
                    if (slotIndex >= 0 && slotIndex < player.inventorySlots) player.selectedSlot = slotIndex;
                }
                break;
            case 'zombie_teleport':
                if (player.role === 'zombie' && now > (player.teleportCooldownUntil || 0)) {
                    const playerBody = world.bodies.find(b => b.playerId === player.id);
                    if (playerBody) Matter.Body.setPosition(playerBody, {
                        x: WORLD_WIDTH / 2 + 500,
                        y: WORLD_HEIGHT / 2
                    });
                    player.teleportCooldownUntil = now + 60000;
                }
                break;
            case 'zombie_item':
                const dropDistance = player.width;
                const dropX = player.x + player.width / 2 + Math.cos(player.rotation) * dropDistance;
                const dropY = player.y + player.height / 2 + Math.sin(player.rotation) * dropDistance;

                if (player.role === 'zombie' && player.zombieAbility === 'trap' && player.trapsLeft > 0) {
                    player.trapsLeft--;
                    gameState.traps.push({
                        id: nextTrapId++,
                        x: dropX - TRAP_SIZE / 2,
                        y: dropY - TRAP_SIZE / 2,
                        width: TRAP_SIZE,
                        height: TRAP_SIZE,
                        target: 'human'
                    });
                } else if (player.role === 'zombie' && player.zombieAbility === 'mine' && player.minesLeft > 0) {
                    player.minesLeft--;
                    gameState.mines.push({
                        id: `mine_${nextMineId++}`,
                        ownerId: player.id,
                        x: dropX - MINE_SIZE / 2,
                        y: dropY - MINE_SIZE / 2,
                        width: MINE_SIZE,
                        height: MINE_SIZE,
                        createdAt: now
                    });
                }
                break;
            case 'drop_grenade':
                if (player.inventory.some(i => i.id === 'drone') && gameState.drones[player.id]?.ammo > 0) {
                    const drone = gameState.drones[player.id];
                    drone.ammo--;
                    player.inventory.find(i => i.id === 'drone').ammo = drone.ammo;
                    gameState.grenades.push({
                        id: nextGrenadeId++,
                        x: drone.x,
                        y: drone.y,
                        explodeTime: now + GRENADE_FUSE_TIME
                    });
                }
                break;
            case 'primary_action':
                const selectedItem = player.inventory[player.selectedSlot];
                if (selectedItem?.id === 'bow' && selectedItem.ammo > 0 && (now > (player.archerLastShotTime || 0) + 1000)) {
                    player.archerLastShotTime = now;
                    selectedItem.ammo--;
                    const spawnX = player.x + player.width / 2 + Math.cos(player.rotation) * ARROW_SPAWN_OFFSET;
                    const spawnY = player.y + player.height / 2 + Math.sin(player.rotation) * ARROW_SPAWN_OFFSET;
                    gameState.arrows.push({
                        id: nextArrowId++,
                        x: spawnX,
                        y: spawnY,
                        width: 100,
                        height: 30,
                        angle: player.rotation,
                        ownerId: player.id,
                        hasHit: false
                    });
                } else if (selectedItem?.id === 'blowdart' && now > (selectedItem.cooldownUntil || 0)) {
                    selectedItem.cooldownUntil = now + 3000;
                    const spawnX = player.x + player.width / 2 + Math.cos(player.rotation) * ARROW_SPAWN_OFFSET;
                    const spawnY = player.y + player.height / 2 + Math.sin(player.rotation) * ARROW_SPAWN_OFFSET;
                    gameState.blowdartArrows.push({
                        id: `bdart_${nextArrowId++}`,
                        x: spawnX,
                        y: spawnY,
                        width: 50,
                        height: 10,
                        angle: player.rotation,
                        ownerId: player.id,
                        hasHit: false
                    });
                } else if (selectedItem?.id === 'cannon' && now > (selectedItem.cooldownUntil || 0)) {
                    if (player.gems >= 25) {
                        player.gems = Math.max(0, player.gems - 25);
                        selectedItem.cooldownUntil = now + CANNON_COOLDOWN;
                        const spawnPos = {
                            x: player.x + player.width / 2 + Math.cos(player.rotation) * CANNON_FRONT_OFFSET,
                            y: player.y + player.height / 2 + Math.sin(player.rotation) * CANNON_FRONT_OFFSET
                        };
                        const uniqueId = `ball_${nextUniqueObjectId++}`;
                        const ballBody = Matter.Bodies.circle(spawnPos.x, spawnPos.y, LARGE_BALL_RADIUS, {
                            restitution: 0.3,
                            friction: 0.05,
                            frictionAir: 0.001,
                            density: 0.8,
                            label: 'largeBall',
                            collisionFilter: {
                                category: cannonballCategory,
                                mask: wallCategory | playerCategory | movableObjectCategory
                            }
                        });
                        ballBody.uniqueId = uniqueId;
                        const velocity = {
                            x: Math.cos(player.rotation) * LARGE_BALL_SPEED,
                            y: Math.sin(player.rotation) * LARGE_BALL_SPEED
                        };
                        Matter.Body.setVelocity(ballBody, velocity);
                        Matter.World.add(world, ballBody);
                        gameState.largeBalls.push({
                            uniqueId: uniqueId,
                            x: spawnPos.x,
                            y: spawnPos.y,
                            radius: LARGE_BALL_RADIUS,
                            rotation: 0,
                            createdAt: now
                        });
                    }
                }
                break;
            case 'function':
                if (player.inventory.find(i => i.id === 'invisibilityCloak') && !player.isInvisible) {
                    player.inventory.find(i => i.id === 'invisibilityCloak').active = true;
                    player.isInvisible = true;
                    return;
                }
                if (player.activeFunction === 'athlete' && player.sprintAvailable) {
                    player.isSprinting = true;
                    player.sprintAvailable = false;
                    setTimeout(() => {
                        if (gameState.players[socket.id]) gameState.players[socket.id].isSprinting = false;
                    }, SPRINT_DURATION);
                    setTimeout(() => {
                        if (gameState.players[socket.id]) gameState.players[socket.id].sprintAvailable = true;
                    }, SPRINT_COOLDOWN);
                }
                if (player.activeFunction === 'spy' && player.spyUsesLeft > 0 && !player.spyCooldown && !player.isSpying) {
                    player.isSpying = true;
                    player.spyUsesLeft--;
                    player.spyCooldown = true;
                    setTimeout(() => {
                        if (gameState.players[socket.id]) gameState.players[socket.id].isSpying = false;
                    }, SPY_DURATION);
                    setTimeout(() => {
                        if (gameState.players[socket.id]) gameState.players[socket.id].spyCooldown = false;
                    }, SPY_COOLDOWN);
                }
                if (player.activeFunction === 'rhinoceros' && now > (player.rhinocerosCooldownUntil || 0)) {
                    player.rhinocerosCooldownUntil = now + RHINOCEROS_COOLDOWN;
                    const playerBody = world.bodies.find(b => b.playerId === player.id);
                    if (playerBody) {
                        for (const body of world.bodies) {
                            if (body.label === 'furniture' || body.label === 'box') {
                                const distance = Math.hypot(body.position.x - playerBody.position.x, body.position.y - playerBody.position.y);
                                if (distance > 0 && distance < RHINOCEROS_RADIUS) {
                                    const angleToObject = Math.atan2(body.position.y - playerBody.position.y, body.position.x - playerBody.position.x);
                                    let angleDifference = angleToObject - player.rotation;

                                    while (angleDifference <= -Math.PI) angleDifference += 2 * Math.PI;
                                    while (angleDifference > Math.PI) angleDifference -= 2 * Math.PI;

                                    if (Math.abs(angleDifference) < Math.PI / 2) {
                                        const force = {
                                            x: Math.cos(angleToObject) * RHINOCEROS_FORCE,
                                            y: Math.sin(angleToObject) * RHINOCEROS_FORCE
                                        };
                                        Matter.Body.applyForce(body, body.position, force);
                                    }
                                }
                            }
                        }
                    }
                }
                break;
            case 'drop_item':
                if (player.carryingObject) {
                    const obj = player.carryingObject;
                    const dropPos = {
                        x: player.x + player.width / 2 + Math.cos(player.rotation) * (player.width / 2 + obj.width / 2 + 10),
                        y: player.y + player.height / 2 + Math.sin(player.rotation) * (player.height / 2 + obj.height / 2 + 10)
                    };
                    const newBody = Matter.Bodies.rectangle(dropPos.x, dropPos.y, obj.width, obj.height, {
                        angle: obj.rotation,
                        frictionAir: 0.05,
                        friction: 0.1,
                        restitution: 0.2,
                        density: getDensityById(obj.id),
                        label: 'furniture',
                        collisionFilter: {
                            category: movableObjectCategory
                        }
                    });
                    newBody.uniqueId = obj.uniqueId;
                    newBody.gameId = obj.id;
                    Matter.World.add(world, newBody);
                    bodiesMap[obj.uniqueId] = newBody;
                    player.carryingObject = null;
                } else if (player.inventory.length > 0 && player.selectedSlot !== undefined) {
                    const selectedItem = player.inventory[player.selectedSlot];
                    if (!selectedItem) break;
                    if (selectedItem.id === 'gravityGlove') {
                        player.inventory.splice(player.selectedSlot, 1);
                    } else {
                        player.inventory.splice(player.selectedSlot, 1);
                        dropHeldItem({ ...player,
                            inventory: [selectedItem]
                        });
                    }
                }
                break;
            case 'interact':
                if (player.role === 'zombie') {
                    const currentlyHiddenIn = gameState.hidingSpots.find(s => s.occupiedBy === player.id);
                    if (currentlyHiddenIn) {
                        currentlyHiddenIn.occupiedBy = null;
                        player.isHidden = false;
                        return;
                    } else {
                        for (const spot of gameState.hidingSpots) {
                            if (!spot.occupiedBy && isColliding(player, spot)) {
                                spot.occupiedBy = player.id;
                                player.isHidden = true;
                                return;
                            }
                        }
                    }
                }

                const fishingRod = player.inventory.find(i => i && i.id === 'fishingRod');
                if (fishingRod && isColliding(player, SEA_AREA)) {
                    if (fishingRod.uses > 0) {
                        fishingRod.uses--;
                        let totalGemsWon = 0;
                        const prizes = [
                            { gems: 10000, chance: 0.007},
                            { gems: 5000, chance: 0.01},
                            { gems: 2000, chance: 0.015 },
                            { gems: 1000, chance: 0.03 },
                            { gems: 500, chance: 0.20 },
                            { gems: 200, chance: 0.20 },
                            { gems: 100, chance: 0.50 },
                            { gems: 0, chance: 0.50}
                        ];
                        for (const prize of prizes) {
                            if (Math.random() < prize.chance) {
                                totalGemsWon += prize.gems;
                            }
                        }
                        addGems(player, totalGemsWon);
                        gameState.floatingTexts.push({
                            text: `+${totalGemsWon} Gems!`,
                            x: player.x + player.width / 2,
                            y: player.y,
                            createdAt: Date.now()
                        });

                        if (fishingRod.uses <= 0) {
                            player.inventory = player.inventory.filter(i => i.id !== 'fishingRod');
                        }
                    }
                    return;
                }

                const glove = player.inventory.find(i => i.id === 'gravityGlove');
                if (glove && !player.carryingObject && glove.uses > 0) {
                    let closestBody = null,
                        minDistance = 200;
                    for (const body of world.bodies) {
                        if (body.isStatic || body.label === 'player' || body.label === 'boundary') continue;
                        const dist = Math.hypot(body.position.x - player.x, body.position.y - player.y);
                        if (dist < minDistance) {
                            minDistance = dist;
                            closestBody = body;
                        }
                    }
                    if (closestBody) {
                        const objData = gameState.objects.find(o => o.uniqueId === closestBody.uniqueId);
                        player.carryingObject = { ...objData
                        };
                        Matter.World.remove(world, closestBody);
                        delete bodiesMap[closestBody.uniqueId];
                        return;
                    }
                }

                const currentItemCount = player.inventory.filter(i => i && i.id !== 'card').length;
                if (currentItemCount < player.inventorySlots && player.role !== 'zombie') {
                    for (let i = gameState.groundItems.length - 1; i >= 0; i--) {
                        const item = gameState.groundItems[i];
                        const playerCenterX = player.x + player.width / 2;
                        const playerCenterY = player.y + player.height / 2;
                        const itemCenterX = item.x + item.width / 2;
                        const itemCenterY = item.y + item.height / 2;

                        if (Math.hypot(playerCenterX - itemCenterX, playerCenterY - itemCenterY) < PICKUP_RADIUS) {
                            player.inventory.push(item);
                            if (item.id === 'drone') gameState.drones[player.id] = {
                                ownerId: player.id,
                                x: player.x,
                                y: player.y,
                                ammo: item.ammo
                            };
                            gameState.groundItems.splice(i, 1);
                            return;
                        }
                    }
                    if (gameState.skateboard && gameState.skateboard.spawned && !gameState.skateboard.ownerId) {
                        const skate = gameState.skateboard;
                        const playerCenterX = player.x + player.width / 2;
                        const playerCenterY = player.y + player.height / 2;
                        const skateCenterX = skate.x + skate.width / 2;
                        const skateCenterY = skate.y + skate.height / 2;
                        if (Math.hypot(playerCenterX - skateCenterX, playerCenterY - skateCenterY) < PICKUP_RADIUS) {
                            player.inventory.push({ ...skate
                            });
                            skate.ownerId = player.id;
                            skate.spawned = false;
                            return;
                        }
                    }
                    if (gameState.runningTennis.spawned && !gameState.runningTennis.ownerId) {
                        const tennis = gameState.runningTennis;
                        const playerCenterX = player.x + player.width / 2;
                        const playerCenterY = player.y + player.height / 2;
                        const tennisCenterX = tennis.x + tennis.width / 2;
                        const tennisCenterY = tennis.y + tennis.height / 2;
                        if (Math.hypot(playerCenterX - tennisCenterX, playerCenterY - tennisCenterY) < PICKUP_RADIUS) {
                            player.inventory.push({ ...tennis
                            });
                            tennis.ownerId = player.id;
                            tennis.spawned = false;
                            return;
                        }
                    }
                }

                if (player.activeFunction === 'engineer' && now > player.engineerCooldownUntil && !player.isInDuct) {
                    for (let i = 0; i < gameState.ducts.length; i++) {
                        if (isColliding(player, gameState.ducts[i])) {
                            player.isInDuct = true;
                            player.engineerCooldownUntil = now + 15000;
                            const exitDuct = gameState.ducts[(i + 1) % gameState.ducts.length];
                            setTimeout(() => {
                                if (player) {
                                    const playerBody = world.bodies.find(b => b.playerId === player.id);
                                    if (playerBody) Matter.Body.setPosition(playerBody, {
                                        x: exitDuct.x,
                                        y: exitDuct.y
                                    });
                                    player.isInDuct = false;
                                }
                            }, DUCT_TRAVEL_TIME);
                            break;
                        }
                    }
                }
                break;
        }
    });

    socket.on('sendMessage', (text) => {
        const player = gameState.players[socket.id];
        if (player && text && text.trim().length > 0) {
            io.emit('newMessage', {
                name: player.name,
                text: text.substring(0, 40),
                isZombie: player.role === 'zombie'
            });
        }
    });


    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        if (socket.username) delete sockets[socket.username];
        const player = gameState.players[socket.id];
        if (player) {
            const playerBody = world.bodies.find(b => b.playerId === socket.id);
            if (playerBody) Matter.World.remove(world, playerBody);

            if (player.carryingObject) {
                const obj = player.carryingObject;
                const newBody = Matter.Bodies.rectangle(player.x, player.y, obj.width, obj.height, {
                    density: getDensityById(obj.id),
                    label: 'furniture'
                });
                newBody.uniqueId = obj.uniqueId;
                newBody.gameId = obj.id;
                Matter.World.add(world, newBody);
                bodiesMap[obj.uniqueId] = newBody;
            }
            dropHeldItem(player);
            if (player.activeFunction !== ' ') gameState.takenFunctions = gameState.takenFunctions.filter(a => a !== player.activeFunction);
            gameState.portals = gameState.portals.filter(p => p.ownerId !== socket.id);
        }
        delete gameState.players[socket.id];
    });
});

setInterval(() => {
    if (!gameState || !gameState.players || Object.keys(gameState.players).length <= 1) {
        if (gameState.gamePhase === 'running' || gameState.gamePhase === 'post-round') {
            io.emit('newMessage', {
                name: 'Server',
                text: 'Not enough players. Waiting for more...'
            });
            startNewRound();
        }
        return;
    }

    if (gameState.gamePhase === 'waiting') {
        gameState.startTime--;
        if (gameState.startTime <= 0) {
            gameState.gamePhase = 'running';
            gameState.timeLeft = ROUND_DURATION;
            const playerList = Object.values(gameState.players);
            if (playerList.length > 0) {
                const candidates = playerList.filter(p => Math.random() > (p.initialZombieProtection || 0));
                let chosenPlayer;
                if (candidates.length > 0) {
                    chosenPlayer = candidates[Math.floor(Math.random() * candidates.length)];
                } else {
                    chosenPlayer = playerList[Math.floor(Math.random() * playerList.length)];
                }

                if (chosenPlayer) {
                    dropHeldItem(chosenPlayer);
                    chosenPlayer.role = 'zombie';

                    const oldBody = world.bodies.find(b => b.playerId === chosenPlayer.id);
                    if (oldBody) {
                        const {
                            position,
                            velocity
                        } = oldBody;
                        Matter.World.remove(world, oldBody);
                        const newBody = createPlayerBody(chosenPlayer);
                        Matter.Body.setPosition(newBody, position);
                        Matter.Body.setVelocity(newBody, velocity);
                        Matter.World.add(world, newBody);
                    }
                }
            }
        }
    } else if (gameState.gamePhase === 'running') {
        let humanCount = Object.values(gameState.players).filter(p => p.role === 'human').length;
        if (humanCount === 0 && Object.keys(gameState.players).length > 1) {
            io.emit('newMessage', {
                name: 'Server',
                text: 'The Zombies have won!'
            });
            gameState.gamePhase = 'post-round';
            gameState.postRoundTimeLeft = 10;
            return;
        }
        if (gameState.timeLeft <= 0) {
            io.emit('newMessage', {
                name: 'Server',
                text: "Time's up! The Humans survived!"
            });
            gameState.gamePhase = 'post-round';
            gameState.postRoundTimeLeft = 10;
            return;
        }
        gameState.timeLeft--;
        for (const player of Object.values(gameState.players)) {
            if (player.role === 'zombie') {
                // MODIFICADO: Lógica de perda de gemas e velocidade agora usa a nova função
                const gemLoss = Math.random() * (50 - 10) + 10;
                removeGems(player, gemLoss);
            } else if (player.role === 'human') {
                let gemGain = Math.random() * (50 - 1) + 0.33;
                if (player.inventory.some(i => i?.id === 'magicEgg')) {
                    gemGain *= 1.20;
                }
                // MODIFICADO: Lógica de ganho de gemas e velocidade agora usa a nova função
                addGems(player, gemGain);
            }
        }
    } else if (gameState.gamePhase === 'post-round') {
        gameState.postRoundTimeLeft--;
        if (gameState.postRoundTimeLeft < 0) {
            startNewRound();
        }
    }
}, 1000);

setInterval(() => {
    updateGameState();
    io.emit('gameStateUpdate', gameState);
}, TICK_RATE);

function startNewRound() {
    const persistentData = {};
    const exclusiveItems = ['skateboard', 'drone', 'invisibilityCloak', 'gravityGlove', 'portals', 'cannon', 'bow', 'blowdart', 'angelWings', 'magicEgg'];

    for (const id in gameState.players) {
        const p = gameState.players[id];
        const persistentInventory = p.inventory.filter(item => item && exclusiveItems.includes(item.id));

        persistentData[id] = {
            name: p.name,
            hasInventoryUpgrade: p.hasInventoryUpgrade,
            gems: p.gems,
            speed: p.speed,
            originalSpeed: p.originalSpeed,
            inventory: persistentInventory
        };
    }
    Matter.World.clear(world, false);
    Matter.Engine.clear(engine);

    initializeGame();

    for (const id in persistentData) {
        if (!gameState.players[id]) {
            createNewPlayer({
                id
            });
        }
        const player = gameState.players[id];
        const pData = persistentData[id];

        Object.assign(player, {
            name: pData.name,
            inventory: pData.inventory || [],
            hasInventoryUpgrade: pData.hasInventoryUpgrade || false,
            inventorySlots: pData.hasInventoryUpgrade ? 2 : 1,
            role: 'human',
            selectedSlot: 0,
            activeFunction: ' ',
            gems: pData.gems,
            speed: pData.speed,
            originalSpeed: pData.originalSpeed,
            isSprinting: false,
            sprintAvailable: true,
            isSpying: false,
            spyUsesLeft: 2,
            spyCooldown: false,
            isHidden: false,
            arrowAmmo: 0,
            engineerCooldownUntil: 0,
            isInDuct: false,
            zombieAbility: null,
            trapsLeft: 0,
            minesLeft: 0,
            hasAntidoteEffect: false,
            initialZombieProtection: 0,
            draggedBy: null,
            draggedUntil: null,
            isBeingEaten: false,
        });

        player.speed = Math.max(3, player.speed);
        player.originalSpeed = Math.max(3, player.originalSpeed);

        const playerBody = world.bodies.find(b => b.playerId === id);
        const startPos = {
            x: WORLD_WIDTH / 2 + 500,
            y: WORLD_HEIGHT / 2
        };
        player.x = startPos.x;
        player.y = startPos.y;

        if (!playerBody) {
            const newBody = createPlayerBody(player);
            Matter.World.add(world, newBody);
        } else {
            Matter.Body.setPosition(playerBody, startPos);
            Matter.Body.setVelocity(playerBody, {
                x: 0,
                y: 0
            });
        }
    }

    if (gameState.sunshades.length > 0) {
        const randomObject = gameState.sunshades[Math.floor(Math.random() * gameState.sunshades.length)];
        gameState.groundItems.push({
            id: 'card',
            x: randomObject.x + (randomObject.width / 2),
            y: randomObject.y + (randomObject.height / 2),
            width: 37,
            height: 25,
        });
    }

    const spawnAreas = [
        ...gameState.objects.filter(o => !o.isStatic),
        ...gameState.sunshades,
        ...gameState.ducts
    ];
    if (spawnAreas.length > 0) {
        const area = spawnAreas[Math.floor(Math.random() * spawnAreas.length)];
        const spawnX = (area.x + area.width / 2) - (DROPPED_ITEM_SIZE / 2);
        const spawnY = (area.y + area.height / 2) - (DROPPED_ITEM_SIZE / 2);
        gameState.groundItems.push({
            id: 'magicAntidote',
            x: spawnX,
            y: spawnY,
            width: DROPPED_ITEM_SIZE,
            height: DROPPED_ITEM_SIZE
        });
    }

    if (Math.random() < 0.10) {
        const movableObjects = gameState.objects.filter(o => !o.isStatic);
        const carObject = gameState.objects.find(o => o.id === 'car');
        const angelSpawnAreas = [...movableObjects, carObject, ...gameState.sunshades].filter(Boolean);

        if (angelSpawnAreas.length > 0) {
            const randomArea = angelSpawnAreas[Math.floor(Math.random() * angelSpawnAreas.length)];
            gameState.groundItems.push({
                id: 'angelWings',
                x: randomArea.x + randomArea.width / 2,
                y: randomArea.y + randomArea.height / 2,
                width: DROPPED_ITEM_SIZE * 1.5,
                height: DROPPED_ITEM_SIZE * 1.5
            });
        }
    }


    const shoesAlreadyInPlay = Object.values(gameState.players).some(p => p.inventory.some(i => i && i.id === 'runningTennis'));
    gameState.runningTennis.spawned = false;
    gameState.runningTennis.ownerId = null;
    if (!shoesAlreadyInPlay && Math.random() < 0.30) {
        gameState.runningTennis.spawned = true;
        let spawnX, spawnY;
        do {
            spawnX = Math.random() * (WORLD_WIDTH - 100);
            spawnY = Math.random() * (WORLD_HEIGHT - 100);
        } while (isColliding({
            x: spawnX,
            y: spawnY,
            width: 40,
            height: 40
        }, gameState.house) || spawnX >= SEA_AREA.x);
        gameState.runningTennis.x = spawnX;
        gameState.runningTennis.y = spawnY;
    }
}

server.listen(PORT, () => {
    initializeGame();
    console.log(`🚀 Game server running at http://localhost:${PORT}`);
});