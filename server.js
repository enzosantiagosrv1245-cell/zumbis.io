const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const Matter = require('matter-js');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
const TICK_RATE = 1000 / 60;

const WORLD_WIDTH = 6000;
const WORLD_HEIGHT = 2000;
const ROUND_DURATION = 120;
const SAND_AREA = {
    x: 4080,
    y: 0,
    width: 1850,
    height: 2000
};
const SEA_AREA = {
    x: 4965,
    y: 0,
    width: 1300,
    height: 2000
};
const SHARK_BASE_SPEED = 1.5;

const INITIAL_PLAYER_SIZE = 35;
const INITIAL_PLAYER_SPEED = 5;
const MAX_PLAYER_SPEED = 7;
const PLAYER_ACCELERATION = 1.2;
const PLAYER_FRICTION = 0.90;

const ZOMBIE_SPEED_BOOST = 1.20;
const ZOMBIE_PUSH_MODIFIER = 2.5;
const ZOMBIE_MIN_SPEED = 2;

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
const GRENADE_KNOCKBACK_IMPULSE = 30;
const LARGE_BALL_SPEED = 12;
const LARGE_BALL_RADIUS = 25;
const LARGE_BALL_MAX_BOUNCES = 20;
const CANNON_COOLDOWN = 2000;
const CANNON_FRONT_OFFSET = 100;
const TRAP_DURATION = 1000;
const TRAP_SIZE = 40;
const PORTAL_SIZE = 60;
const PORTAL_COOLDOWN = 2000;
const DROPPED_ITEM_SIZE = 40;
// Ponto 5: Redefinindo a distância de pickup para ser mais responsiva
const PICKUP_RADIUS = 60;
const DUCT_TRAVEL_TIME = 1000 / 20;
const ARROW_SPEED = 30;
const ARROW_KNOCKBACK_IMPULSE = 1;
const ARROW_LIFESPAN_AFTER_HIT = 3000;
const ARROW_SPAWN_OFFSET = 120;

const MINE_SIZE = 40;
const MINE_EXPLOSION_RADIUS = 100;
const MINE_PRIMARY_KNOCKBACK = 20;
const MINE_SPLASH_KNOCKBACK = 15;

const BOX_PUSH_FORCE = 100000;
const ROTATION_ON_COLLISION_FACTOR = 0.000002;
const FORCE_NORMAL_GLOVE_MULTIPLIER = 3;
const LARGE_BALL_OBJECT_KNOCKBACK = 0.7;
const LARGE_BALL_PLAYER_KNOCKBACK = 0.7;

const FUNCTION_COSTS = {
    athlete: 2000,
    engineer: 2000,
    spy: 3000,
    butterfly: 5000
};
const ZOMBIE_ABILITY_COSTS = {
    trap: 50,
    mine: 50
};

const playerCategory = 0x0002;
const wallCategory = 0x0004;
const movableObjectCategory = 0x0008;
const cannonballCategory = 0x0010;

let engine, world;
let bodiesMap = {};
let gameState = {};
let nextArrowId = 0,
    nextGrenadeId = 0,
    nextTrapId = 0,
    nextMineId = 0,
    nextUniqueObjectId = 0;

function getDensityById(id) {
    switch (id) {
        case 'car':
            return 0.0015;
        case 'big_table':
            return 0.0015;
        case 'box':
            return 0.0012;
        default:
            return 0.001;
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
            mask: 0xFFFFFFFF
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
    gameState = {
        players: currentPlayers,
        arrows: [],
        drones: {},
        grenades: [],
        groundItems: [],
        traps: [],
        mines: [],
        largeBalls: [],
        portals: [],
        sharks: [],
        objects: [], // Array de objetos unificada
        obstacles: [],
        takenFunctions: [],
        functionCosts: FUNCTION_COSTS,
        zombieAbilityCosts: ZOMBIE_ABILITY_COSTS,
        gamePhase: 'waiting',
        startTime: 60,
        timeLeft: ROUND_DURATION,
        postRoundTimeLeft: 10,
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
        ducts: [{
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
            y: 1645,
            width: 80,
            height: 80
        }],
        sunshades: [{
            x: 4350,
            y: 600,
            width: 320,
            height: 340
        }, {
            x: 4440,
            y: 1400,
            width: 320,
            height: 340
        }],
        house: {
            x: 200,
            y: 200,
            width: 2697,
            height: 1670,
            wallThickness: 70,
            walls: []
        },
        garage: {
            x: 800,
            y: 1200,
            width: 700,
            height: 600,
            wallThickness: 70,
            walls: []
        },
    };
    createWorldBodies();
    createSharks();
}

function createSharks() {
    gameState.sharks = [];
    for (let i = 0; i < 3; i++) {
        const sizeMultiplier = 0.8 + Math.random() * 0.7;
        const shark = {
            id: i,
            width: 150 * sizeMultiplier,
            height: 60 * sizeMultiplier,
            x: SEA_AREA.x + Math.random() * (SEA_AREA.width - 150),
            y: SEA_AREA.y + Math.random() * (SEA_AREA.height - 60),
            speed: (SHARK_BASE_SPEED + Math.random()) * (1 / sizeMultiplier),
            rotation: 0,
            state: 'patrolling', // patrolling, paused, attacking
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

    const objectData = [{
        id: 'atm',
        x: 2895,
        y: 870,
        width: 150,
        height: 130,
        isStatic: true
    }, {
        id: 'small_bed',
        x: 300,
        y: 400,
        width: 108,
        height: 200
    }, {
        id: 'small_table',
        x: 2500,
        y: 300,
        width: 240,
        height: 132
    }, {
        id: 'big_table',
        x: 1000,
        y: 1320,
        width: 400,
        height: 220
    }, {
        id: 'car',
        x: 3650,
        y: 300,
        width: 280,
        height: 450
    }, {
        id: 'small_bed',
        x: 1100,
        y: 350,
        width: 108,
        height: 200
    }, {
        id: 'small_table',
        x: 2300,
        y: 1300,
        width: 250,
        height: 122
    }, {
        id: 'small_table',
        x: 1500,
        y: 810,
        width: 288,
        height: 126
    }, {
        id: 'box',
        x: 2900,
        y: 1150,
        width: 192,
        height: 192,
        rotation: 300
    }];

    objectData.forEach(data => {
        const uniqueId = nextUniqueObjectId++;
        const body = Matter.Bodies.rectangle(data.x + data.width / 2, data.y + data.height / 2, data.width, data.height, {
            isStatic: data.isStatic || false,
            angle: (data.rotation || 0) * (Math.PI / 180),
            friction: 0.4,
            frictionAir: 0.03,
            restitution: 0.2,
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
        s.walls.push({
            x: s.x,
            y: s.y,
            width: s.width,
            height: wt
        });
        // 1. PORTA DA CASA REMOVIDA (PAREDE RESTAURADA)
        s.walls.push({
            x: s.x,
            y: s.y + s.height - wt - 200,
            width: s.width - 1300,
            height: wt
        });

        s.walls.push({
            x: s.x,
            y: s.y,
            width: wt,
            height: 820
        });
        s.walls.push({
            x: s.x,
            y: s.y + 1020,
            width: wt,
            height: s.height - 1220
        });
        s.walls.push({
            x: s.x + s.width - wt,
            y: s.y,
            width: wt,
            height: 250
        });
        s.walls.push({
            x: s.x + s.width - wt,
            y: s.y + 650,
            width: wt,
            height: (s.height - 770) - 650
        });
        s.walls.push({
            x: s.x + 900,
            y: s.y,
            width: wt,
            height: 470
        });
        s.walls.push({
            x: s.x + 600,
            y: s.y + 1020,
            width: wt,
            height: 450
        });
        s.walls.push({
            x: s.x + 1500,
            y: s.y,
            width: wt,
            height: 300
        });
        s.walls.push({
            x: s.x + 1338,
            y: s.y + 1030,
            width: wt,
            height: 440
        }); // Este
        s.walls.push({
            x: s.x + 2200,
            y: s.y,
            width: wt,
            height: 470
        });
        s.walls.push({
            x: s.x + 2195,
            y: s.y + 750,
            width: wt,
            height: 150
        });
        s.walls.push({
            x: s.x,
            y: s.y + 400,
            width: 700,
            height: wt
        });
        s.walls.push({
            x: s.x + 1800,
            y: s.y + 400,
            width: 270,
            height: wt
        });
        s.walls.push({
            x: s.x + 250,
            y: s.y + 1020,
            width: 850,
            height: wt
        });
        s.walls.push({
            x: s.x + 1150,
            y: s.y + 400,
            width: 720,
            height: wt
        });
        s.walls.push({
            x: s.x + 1800,
            y: s.y,
            width: wt,
            height: 400 + wt
        });
        s.walls.push({
            x: s.x,
            y: s.y + 750,
            width: 550,
            height: wt
        });
        s.walls.push({
            x: s.x + 1330,
            y: s.y + 830,
            width: 533,
            height: wt
        });
        s.walls.push({
            x: s.x + 2000,
            y: s.y + 830,
            width: 697,
            height: wt
        });
        s.walls.push({
            x: s.x + 480,
            y: s.y + 620,
            width: wt,
            height: 200
        });
    } else if (s === gameState.garage) {
        const doorHeight = 150;
        const wallChunk = (s.height - doorHeight) / 2;

        s.walls.push({
            x: s.x + 1400,
            y: s.y,
            width: s.width - 200,
            height: wt
        });
        s.walls.push({
            x: s.x + 1200,
            y: s.y + s.height - wt,
            width: s.width,
            height: wt
        });
        // Parede esquerda da garagem com porta (mantida)
        s.walls.push({
            x: s.x + 1200,
            y: s.y,
            width: wt,
            height: wallChunk
        });
        s.walls.push({
            x: s.x + 1200,
            y: s.y + wallChunk + doorHeight,
            width: wt,
            height: wallChunk
        });

        s.walls.push({
            x: s.x + s.width - wt + 1200,
            y: s.y,
            width: wt,
            height: s.height - 460
        });
        s.walls.push({
            x: s.x + s.width - wt + 1200,
            y: s.y + 460,
            width: wt,
            height: 140
        });
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
        gems: 10000,
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
        draggedBy: null,
        draggedUntil: null,
        isBeingEaten: false,
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

        // Ponto 5: Corrigir a posição de drop do item para a frente do jogador
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
                dropData.ammo = itemToDrop.ammo;
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

                        if (target.inventory.some(i => i.id === 'runningTennis')) {
                            // Ponto 3: Ajustar a velocidade do tênis de 1.5 para 2
                            target.speed /= 2;
                            target.originalSpeed /= 2;
                        }
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

    for (const id in gameState.players) {
        const player = gameState.players[id];
        const playerBody = world.bodies.find(b => b.playerId === id);
        if (!player || !playerBody || !player.input || player.isBeingEaten) continue;

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

        const baseSize = 35;
        player.width = baseSize + Math.sqrt(Math.max(0, player.gems)) * 0.8;
        player.height = player.width * 1.5;
        player.speed = Math.min(MAX_PLAYER_SPEED, player.originalSpeed + (Math.sqrt(Math.max(0, player.gems)) / 300));

        // Ponto 4: Jogador com a função de atleta (athlete) deve ficar com o dobro de sua velocidade.
        if (player.activeFunction === 'athlete') {
            player.speed *= 2;
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
                player.knockbackVx += Math.cos(arrow.angle) * ARROW_KNOCKBACK_IMPULSE;
                player.knockbackVy += Math.sin(arrow.angle) * ARROW_KNOCKBACK_IMPULSE;
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
                }, 3000); // Remove a flecha após 3 segundos
                break;
            }
        }

        if (hitWall) continue;

        if (!hitPlayer && (arrow.x < 0 || arrow.x > WORLD_WIDTH || arrow.y < 0 || arrow.y > WORLD_HEIGHT)) {
            gameState.arrows.splice(i, 1);
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
                const distance = Math.hypot(player.x - grenade.x, player.y - grenade.y);
                if (distance < GRENADE_RADIUS) {
                    const knockback = (1 - (distance / GRENADE_RADIUS)) * GRENADE_KNOCKBACK_IMPULSE;
                    const angle = Math.atan2(player.y - grenade.y, player.x - grenade.x);
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

    const portalsByOwner = {};
    for (const portal of gameState.portals) {
        if (!portalsByOwner[portal.ownerId]) portalsByOwner[portal.ownerId] = [];
        portalsByOwner[portal.ownerId].push(portal);
    }
    for (const ownerId in portalsByOwner) {
        if (portalsByOwner[ownerId].length === 2) {
            const [portalA, portalB] = portalsByOwner[ownerId];
            for (const player of Object.values(gameState.players)) {
                if (now > (player.portalCooldownUntil || 0)) {
                    const playerBody = world.bodies.find(b => b.playerId === player.id);
                    if (!playerBody) continue;
                    if (Math.hypot(playerBody.position.x - portalA.x, playerBody.position.y - portalA.y) < PORTAL_SIZE / 2) {
                        Matter.Body.setPosition(playerBody, {
                            x: portalB.x,
                            y: portalB.y
                        });
                        player.portalCooldownUntil = now + PORTAL_COOLDOWN;
                    } else if (Math.hypot(playerBody.position.x - portalB.x, playerBody.position.y - portalB.y) < PORTAL_SIZE / 2) {
                        Matter.Body.setPosition(playerBody, {
                            x: portalA.x,
                            y: portalA.y
                        });
                        player.portalCooldownUntil = now + PORTAL_COOLDOWN;
                    }
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
                        const force = Matter.Vector.mult(forceDirection, forceMagnitude / 100);
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
                        if (human.hasAntidoteEffect) {
                            human.hasAntidoteEffect = false;
                            if (Math.random() < 0.75) continue;
                        }
                        if (human.inventory.some(i => i.id === 'runningTennis')) {
                            // Ponto 3: Ajustar a velocidade do tênis de 1.5 para 2
                            human.speed /= 2;
                            human.originalSpeed /= 2;
                        }

                        dropHeldItem(human);
                        if (human.isSpying) human.isSpying = false;

                        const percent = (Math.random() * (0.7 - 0.6) + 0.6);
                        const gemsLost = human.gems * percent;
                        const speedLost = (human.speed - ZOMBIE_MIN_SPEED) * percent;

                        human.gems = Math.max(0, human.gems - gemsLost);
                        human.speed -= speedLost;
                        human.originalSpeed -= speedLost;

                        zombie.gems += gemsLost;
                        zombie.speed += speedLost;
                        zombie.originalSpeed += speedLost;

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
    console.log('New player connected:', socket.id);
    createNewPlayer(socket);

    socket.on('setNickname', (nickname) => {
        const player = gameState.players[socket.id];
        if (player && nickname) player.name = String(nickname).trim().substring(0, 10) || player.name;
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
            const amount = (Math.PI / 10) * (direction === 'left' ? -1 : 1);
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
            player.gems = Math.max(0, player.gems - cost);
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
                cost = 2000;
                break;
            case 'skateboard':
                cost = 5000;
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
                cost = 5000;
                itemData = {
                    id: 'invisibilityCloak',
                    active: false
                };
                break;
            case "gravityGlove":
                cost = 2000;
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
                cost = 3000;
                itemData = {
                    id: 'cannon',
                    cooldownUntil: 0
                };
                break;
            case 'bow':
                cost = 1000;
                itemData = {
                    id: 'bow',
                    ammo: 200
                };
                break;
            case 'angelWings':
                cost = 20000;
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
                    player.hasAntidoteEffect = true;
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
                if (player.role === 'zombie' && player.zombieAbility === 'trap' && player.trapsLeft > 0) {
                    player.trapsLeft--;
                    gameState.traps.push({
                        id: nextTrapId++,
                        x: player.x,
                        y: player.y,
                        width: TRAP_SIZE,
                        height: TRAP_SIZE,
                        target: 'human'
                    });
                } else if (player.role === 'zombie' && player.zombieAbility === 'mine' && player.minesLeft > 0) {
                    player.minesLeft--;
                    gameState.mines.push({
                        id: `mine_${nextMineId++}`,
                        ownerId: player.id,
                        x: player.x,
                        y: player.y,
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
                        if (selectedItem.id === 'runningTennis') {
                            // Ponto 3: Ajustar a velocidade do tênis de 1.5 para 2
                            player.speed /= 2;
                            player.originalSpeed /= 2;
                        }
                        dropHeldItem({ ...player,
                            inventory: [selectedItem]
                        });
                    }
                }
                break;
            case 'interact':
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
                        // Ponto 5: Corrigir a lógica de pickup para ser de centro a centro e mais intuitiva
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
                            // Ponto 3: Tênis de corrida agora dá 100% a mais de velocidade (dobro)
                            player.speed *= 2;
                            player.originalSpeed *= 2;
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
                text: text.substring(0, 40)
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        const player = gameState.players[socket.id];
        if (player) {
            const playerBody = world.bodies.find(b => b.playerId === socket.id);
            if (playerBody) Matter.World.remove(world, playerBody);
            if (player.inventory.some(i => i.id === 'runningTennis')) {
                // Ponto 3: Ajustar a velocidade do tênis de 1.5 para 2
                player.speed /= 2;
                player.originalSpeed /= 2;
            }
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
    if (!gameState || !gameState.players || Object.keys(gameState.players).length <= 1) return;
    if (gameState.gamePhase === 'waiting') {
        gameState.startTime--;
        if (gameState.startTime <= 0) {
            gameState.gamePhase = 'running';
            gameState.timeLeft = ROUND_DURATION;
            const playerIds = Object.keys(gameState.players);
            if (playerIds.length > 0) {
                const zombieId = playerIds[Math.floor(Math.random() * playerIds.length)];
                const zombiePlayer = gameState.players[zombieId];
                if (zombiePlayer.inventory.some(i => i.id === 'runningTennis')) {
                    // Ponto 3: Ajustar a velocidade do tênis de 1.5 para 2
                    zombiePlayer.speed /= 2;
                    zombiePlayer.originalSpeed /= 2;
                }
                dropHeldItem(zombiePlayer);
                zombiePlayer.role = 'zombie';

                const oldBody = world.bodies.find(b => b.playerId === zombiePlayer.id);
                if (oldBody) {
                    const {
                        position,
                        velocity
                    } = oldBody;
                    Matter.World.remove(world, oldBody);
                    const newBody = createPlayerBody(zombiePlayer);
                    Matter.Body.setPosition(newBody, position);
                    Matter.Body.setVelocity(newBody, velocity);
                    Matter.World.add(world, newBody);
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
                const gemLoss = Math.random() * (30 - 2) + 0.33;
                player.gems = Math.max(0, player.gems - gemLoss);
                const speedLoss = Math.random() * (0.015 - 0.005) + 0.005;
                player.speed = Math.max(ZOMBIE_MIN_SPEED, player.speed - speedLoss);
            } else if (player.role === 'human') {
                const gemGain = Math.random() * (50 - 1) + 0.33;
                player.gems += gemGain;
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
    const exclusiveItems = ['skateboard', 'drone', 'invisibilityCloak', 'gravityGlove', 'portals', 'cannon', 'bow', 'angelWings'];

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
            draggedBy: null,
            draggedUntil: null,
            isBeingEaten: false,
        });

        player.speed = Math.max(2, player.speed);
        player.originalSpeed = Math.max(2, player.originalSpeed);

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

    if (Math.random() < 0.10) { // 10% de chance de dropar as asas de anjo
        const movableObjects = gameState.objects.filter(o => !o.isStatic);
        const carObject = gameState.objects.find(o => o.id === 'car');
        const spawnAreas = [...movableObjects, carObject, ...gameState.sunshades].filter(Boolean);

        if (spawnAreas.length > 0) {
            const randomArea = spawnAreas[Math.floor(Math.random() * spawnAreas.length)];
            gameState.groundItems.push({
                id: 'angelWings',
                x: randomArea.x + randomArea.width / 2,
                y: randomArea.y + randomArea.height / 2,
                width: DROPPED_ITEM_SIZE * 1.5,
                height: DROPPED_ITEM_SIZE * 1.5
            });
        }
    }


    if (!Object.values(gameState.players).some(p => p.inventory.some(i => i && i.id === 'runningTennis'))) {
        gameState.runningTennis.spawned = true;
        gameState.runningTennis.ownerId = null;
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