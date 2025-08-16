const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
const TICK_RATE = 1000 / 60;

// --- Constantes do Mundo e Regras Gerais ---
const WORLD_WIDTH = 6000; // Largura total do mapa do jogo em pixels. Define os limites horizontais.
const WORLD_HEIGHT = 2000; // Altura total do mapa do jogo em pixels. Define os limites verticais.
const ROUND_DURATION = 120; // Duração de uma rodada em segundos. Quando o tempo acaba, os humanos vencem.
const UNMOVABLE_FURNITURE = ['atm', 'car']; // Uma lista de IDs de objetos que não podem ser movidos pelos jogadores.

// --- Constantes do Jogador (Humano) ---
const INITIAL_PLAYER_SIZE = 40; // Tamanho (largura) inicial de um jogador em pixels ao entrar no jogo.
const INITIAL_PLAYER_SPEED = 2; // Velocidade base com que um humano começa a rodada.
const MAX_PLAYER_SPEED = 4; // A velocidade máxima que um humano pode atingir através do sistema de crescimento.
const GROWTH_AMOUNT = 0.2; // A quantidade de pixels que o tamanho de um humano aumenta a cada segundo.
const SPEED_PER_PIXEL_OF_GROWTH = 0.07; // Fator que converte o crescimento em tamanho para aumento de velocidade.
const PLAYER_ACCELERATION = 1.2; // Quão rápido um jogador atinge sua velocidade máxima (sensação de inércia).
const PLAYER_FRICTION = 0.90; // Quão rápido um jogador para após soltar as teclas de movimento (0.9 = 10% de perda de vel/tick).

// --- Constantes do Zumbi ---
const ZOMBIE_SPEED_BOOST = 1.30; // Multiplicador de velocidade aplicado a um jogador quando ele se torna zumbi (30% mais rápido).
const ZOMBIE_PUSH_MODIFIER = 0.3; // Modificador da força com que um zumbi empurra objetos (40% da força de um humano).
const ZOMBIE_SPEED_DECAY_PER_SECOND = 0.01; // Quanto de velocidade um zumbi perde por segundo para evitar que fiquem rápidos demais.
const ZOMBIE_MIN_SPEED = 2; // A velocidade mínima que um zumbi pode ter, mesmo após o decaimento.

// --- Constantes de Habilidades e Itens ---
// Habilidade: Atleta (Sprint)
const SPRINT_DURATION = 10000; // Duração do efeito de corrida em milissegundos (10 segundos).
const SPRINT_COOLDOWN = 30000; // Tempo de recarga da habilidade de corrida em milissegundos (45 segundos).

// Habilidade: Arqueiro (Archer)
const ARROW_SPEED = 10; // Velocidade com que a flecha viaja em pixels por tick.
const ARROW_KNOCKBACK_IMPULSE = 15; // A força do empurrão que a flecha causa ao atingir um alvo.
const ARROW_LIFESPAN_AFTER_HIT = 1000; // Tempo que a flecha fica visível no alvo após o impacto, em milissegundos (1 segundo).

// Habilidade: Espião (Spy)
const SPY_DURATION = 15000; // Duração do disfarce do espião em milissegundos (15 segundos).
const SPY_COOLDOWN = 30000; // Tempo de recarga da habilidade de disfarce em milissegundos (30 segundos).

// Habilidade: Ilusionista (Illusionist)
const ILLUSIONIST_COOLDOWN = 30000; // Tempo de recarga para criar uma nova ilusão em milissegundos (30 segundos).
const ILLUSION_LIFESPAN = 10000; // Quanto tempo a ilusão permanece no mapa em milissegundos (10 segundos).
const ILLUSION_SPEED = 2.5; // Velocidade de movimento da ilusão em pixels por tick.

// Habilidade: Borboleta (Butterfly)
const BUTTERFLY_DURATION = 10000; // Duração do voo da borboleta em milissegundos (10 segundos).
const BUTTERFLY_SPEED_MULTIPLIER = 4; // Multiplicador aplicado à velocidade do jogador durante o voo.

// Item: Manto da Invisibilidade
const INVISIBILITY_CLOAK_BREAK_DISTANCE = 300; // Distância (em pixels) que um zumbi precisa chegar perto para quebrar a invisibilidade.

// Item: Skate
const SKATEBOARD_SPEED_BOOST = 5; // Velocidade de movimento fixa ao usar o skate.
const SKATEBOARD_WIDTH = 90; // Largura do objeto skate em pixels.
const SKATEBOARD_HEIGHT = 35; // Altura do objeto skate em pixels.

// Item: Drone e Granada
const DRONE_FOLLOW_FACTOR = 0.05; // Suavidade com que o drone segue o mouse (valores menores = mais suave).
const DRONE_MAX_AMMO = 10; // Quantidade máxima de granadas que um drone pode carregar.
const GRENADE_FUSE_TIME = 1500; // Tempo em milissegundos para a granada explodir após ser lançada (2 segundos).
const GRENADE_RADIUS = 300; // O raio da explosão da granada em pixels.
const GRENADE_KNOCKBACK_IMPULSE = 40; // A força máxima do empurrão da explosão da granada.

// Item: Armadilha (Trap)
const TRAP_DURATION = 1000; // Duração que um jogador fica preso na armadilha em milissegundos (1 segundo).
const TRAP_SIZE = 50; // O tamanho (largura e altura) da hitbox da armadilha em pixels.

// Interações Gerais de Itens
const DROPPED_ITEM_SIZE = 30; // Tamanho padrão (largura e altura) de um item quando está no chão.
const PICKUP_DISTANCE = 150; // A distância máxima em pixels que um jogador pode estar para pegar um item do chão.
const DUCT_TRAVEL_TIME = 1000 / 20; // Tempo de viagem dentro de um duto em milissegundos (50 ms).

// --- Constantes do Motor de Física (Objetos Móveis) ---
const BOX_FRICTION = 0.85; // Fricção dos objetos com o "chão", fazendo-os parar de deslizar (perdem 6% da vel/tick).
const BOX_PUSH_FORCE = 0.4; // A força base que um jogador aplica ao empurrar continuamente um objeto.
const BOX_COLLISION_DAMPING = 0; // Coeficiente de restituição (elasticidade) das colisões. 0 = sem pulo, 1 = pulo perfeito.
const BOX_SLIDE_FRICTION = 0.01; // Fricção entre dois objetos que estão deslizando um contra o outro.
const ANGULAR_FRICTION = 0.008; // Fricção que faz um objeto que está girando parar de girar.
const TORQUE_FACTOR = 0.0008; // Fator que determina o quão fácil é fazer um objeto girar ao empurrá-lo fora do centro.
const FORCE_DRUM_MULTIPLIER = 0.1; // Multiplicador de força para o empurrão contínuo do item "Tambor".
const FORCE_DRUM_COLLISION_FORCE = 0.2; // Força de impacto inicial aplicada pelo "Tambor" ao tocar em um objeto.
const WALL_PUSH_OUT_FORCE = 1; // Força com que a parede empurra um objeto para fora (usado em lógicas de colisão "suaves").
const SLEEP_THRESHOLD = 0; // Limiar de velocidade. Abaixo disso, o servidor para de calcular a física do objeto para otimização.

const ABILITY_COSTS = {
    athlete: 150,
    archer: 150,
    engineer: 100,
    spy: 200,
    illusionist: 200,
    butterfly: 250,
};
const ZOMBIE_ABILITY_COSTS = {
    trap: 50
};

let gameState = {};
let nextArrowId = 0;
let nextGrenadeId = 0;
let nextIllusionId = 0;
let nextTrapId = 0;
let nextUniqueObjectId = 0;

function initializeGame() {
    nextUniqueObjectId = 0;
    gameState = {
        players: {},
        arrows: [],
        drones: {},
        grenades: [],
        groundItems: [],
        illusions: [],
        traps: [],
        obstacles: [],
        takenAbilities: [],
        abilityCosts: ABILITY_COSTS,
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
        box: [{
            id: 'box',
            uniqueId: nextUniqueObjectId++,
            x: 2900,
            y: 1150,
            width: 192,
            height: 192,
            vx: 0,
            vy: 0,
            rotation: 300,
            angularVelocity: 0
        }],
        furniture: [{
            id: 'atm',
            uniqueId: nextUniqueObjectId++,
            x: 2895,
            y: 870,
            width: 150,
            height: 130,
            vx: 0,
            vy: 0,
            rotation: 0,
            angularVelocity: 0,
        }, {
            id: 'small_bed',
            uniqueId: nextUniqueObjectId++,
            x: 300,
            y: 400,
            width: 108,
            height: 200,
            vx: 0,
            vy: 0,
            rotation: 0,
            angularVelocity: 0
        }, {
            id: 'small_table',
            uniqueId: nextUniqueObjectId++,
            x: 2500,
            y: 300,
            width: 250,
            height: 132,
            vx: 0,
            vy: 0,
            rotation: 0,
            angularVelocity: 0
        }, {
            id: 'big_table',
            uniqueId: nextUniqueObjectId++,
            x: 500,
            y: 1400,
            width: 480,
            height: 240,
            vx: 0,
            vy: 0,
            rotation: 0,
            angularVelocity: 0
        }, {
            id: 'car',
            uniqueId: nextUniqueObjectId++,
            x: 3650,
            y: 300,
            width: 280,
            height: 450,
            vx: 0,
            vy: 0,
            rotation: 0,
            angularVelocity: 0
        }, {
            id: 'small_bed',
            uniqueId: nextUniqueObjectId++,
            x: 1100,
            y: 350,
            width: 108,
            height: 200,
            vx: 0,
            vy: 0,
            rotation: 0,
            angularVelocity: 0
        }, {
            id: 'small_table',
            uniqueId: nextUniqueObjectId++,
            x: 2300,
            y: 1300,
            width: 250,
            height: 122,
            vx: 0,
            vy: 0,
            rotation: 0,
            angularVelocity: 0
        }, {
            id: 'small_table',
            uniqueId: nextUniqueObjectId++,
            x: 1500,
            y: 810,
            width: 288,
            height: 126,
            vx: 0,
            vy: 0,
            rotation: 0,
            angularVelocity: 0
        }],
        ducts: [{
            x: 3150,
            y: 480,
            width: 80,
            height: 80
        }, {
            x: 270,
            y: 1670,
            width: 80,
            height: 80
        }, {
            x: 2450,
            y: 300,
            width: 80,
            height: 80
        }, {
            x: 3940,
            y: 1440,
            width: 80,
            height: 80
        }, {
            x: 2070,
            y: 1650,
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
        hardWalls: [],
    };
    buildWalls(gameState.house);
    buildWalls(gameState.garage);
    buildHardWalls();
}

function buildWalls(structure) {
    const s = structure;
    const wt = s.wallThickness;
    s.walls = [];
    if (s === gameState.house) {
        s.walls.push({ x: s.x, y: s.y, width: s.width, height: wt });
        s.walls.push({ x: s.x, y: s.y + s.height - wt, width: s.width - 1300, height: wt });
        s.walls.push({ x: s.x, y: s.y, width: wt, height: 820 });
        s.walls.push({ x: s.x, y: s.y + 1020, width: wt, height: s.height - 1020 });
        s.walls.push({ x: s.x + s.width - wt, y: s.y, width: wt, height: 350 });
        s.walls.push({ x: s.x + s.width - wt, y: s.y + 600, width: wt, height: (s.height - 770) - 600 });
        s.walls.push({ x: s.x + 900, y: s.y, width: wt, height: 470 });
        s.walls.push({ x: s.x + 500, y: s.y + 1020, width: wt, height: 650 });
        s.walls.push({ x: s.x + 1500, y: s.y, width: wt, height: 300 });
        s.walls.push({ x: s.x + 1328, y: s.y + 830, width: wt, height: 840 });
        s.walls.push({ x: s.x + 2200, y: s.y, width: wt, height: 470 });
        s.walls.push({ x: s.x + 2195, y: s.y + 750, width: wt, height: 150 });
        s.walls.push({ x: s.x, y: s.y + 400, width: 700, height: wt });
        s.walls.push({ x: s.x + 1800, y: s.y + 400, width: 270, height: wt });
        s.walls.push({ x: s.x + 250, y: s.y + 1020, width: 850, height: wt });
        s.walls.push({ x: s.x + 1150, y: s.y + 400, width: 720, height: wt });
        s.walls.push({ x: s.x + 1800, y: s.y, width: wt, height: 400 + wt });
        s.walls.push({ x: s.x, y: s.y + 750, width: 550, height: wt });
        s.walls.push({ x: s.x + 1330, y: s.y + 830, width: 533, height: wt });
        s.walls.push({ x: s.x + 2000, y: s.y + 830, width: 697, height: wt });
        s.walls.push({ x: s.x + 480, y: s.y + 620, width: wt, height: 200 });
    } else if (s === gameState.garage) {
        s.walls.push({ x: s.x + 1400, y: s.y, width: s.width - 200, height: wt });
        s.walls.push({ x: s.x + 1200, y: s.y + s.height - wt, width: s.width, height: wt });
        s.walls.push({ x: s.x + 1200, y: s.y, width: wt, height: s.height });
        s.walls.push({ x: s.x + s.width - wt + 1200, y: s.y, width: wt, height: s.height - 460 });
        s.walls.push({ x: s.x + s.width - wt + 1200, y: s.y + 460, width: wt, height: 140 });
    }
}

function buildHardWalls() {
    gameState.hardWalls.push({ x: 2600, y: 200, width: 140, height: 70 });
}

// =================================================================
// COLLISION & PHYSICS HELPERS
// =================================================================

function getMass(obj) {
    if (!obj || !obj.id) return 1;
    switch (obj.id) {
        case 'car':
            return 20;
        case 'big_table':
            return 8;
        case 'box':
            return 5;
        case 'small_bed':
            return 4;
        case 'small_table':
            return 2;
        default:
            return 1;
    }
}

function isColliding(rect1, rect2) {
    if (!rect1 || !rect2) { return false; }
    return rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y;
}

function isCollidingCircleCircle(c1, c2) {
    if (!c1 || !c2) return false;
    const dx = c1.cx - c2.cx;
    const dy = c1.cy - c2.cy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < c1.radius + c2.radius;
}

function isCollidingCircleRect(circle, rect) {
    if (!circle || !rect) return false;
    const testX = Math.max(rect.x, Math.min(circle.cx, rect.x + rect.width));
    const testY = Math.max(rect.y, Math.min(circle.cy, rect.y + rect.height));
    const dx = circle.cx - testX;
    const dy = circle.cy - testY;
    const distanceSquared = (dx * dx) + (dy * dy);
    return distanceSquared < (circle.radius * circle.radius);
}

function getVertices(rect) {
    const vertices = [];
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;
    const angle = rect.rotation || 0;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    const halfWidth = rect.width / 2;
    const halfHeight = rect.height / 2;
    const points = [
        { x: -halfWidth, y: -halfHeight }, { x: halfWidth, y: -halfHeight },
        { x: halfWidth, y: halfHeight }, { x: -halfWidth, y: halfHeight }
    ];
    for (const p of points) {
        vertices.push({ x: cx + p.x * cos - p.y * sin, y: cy + p.x * sin + p.y * cos });
    }
    return vertices;
}

function getAxes(vertices) {
    const axes = [];
    for (let i = 0; i < vertices.length; i++) {
        const p1 = vertices[i];
        const p2 = vertices[i + 1 == vertices.length ? 0 : i + 1];
        const edge = { x: p1.x - p2.x, y: p1.y - p2.y };
        const normal = { x: -edge.y, y: edge.x };
        const length = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
        axes.push({ x: normal.x / length, y: normal.y / length });
    }
    return [axes[0], axes[1]];
}

function project(vertices, axis) {
    let min = Infinity;
    let max = -Infinity;
    for (const v of vertices) {
        const dotProduct = v.x * axis.x + v.y * axis.y;
        min = Math.min(min, dotProduct);
        max = Math.max(max, dotProduct);
    }
    return { min, max };
}

function checkCollisionSAT(poly1, poly2) {
    const vertices1 = getVertices(poly1);
    const vertices2 = getVertices(poly2);
    const axes = [...getAxes(vertices1), ...getAxes(vertices2)];
    let minOverlap = Infinity;
    let smallestAxis = null;
    for (const axis of axes) {
        const proj1 = project(vertices1, axis);
        const proj2 = project(vertices2, axis);
        const overlap = Math.min(proj1.max, proj2.max) - Math.max(proj1.min, proj2.min);
        if (overlap < 0.1) { return null; }
        if (overlap < minOverlap) {
            minOverlap = overlap;
            smallestAxis = axis;
        }
    }
    if (!smallestAxis) { return null; }
    const mtv = { x: smallestAxis.x * minOverlap, y: smallestAxis.y * minOverlap };
    const centerVector = { x: (poly2.x + poly2.width / 2) - (poly1.x + poly1.width / 2), y: (poly2.y + poly2.height / 2) - (poly1.y + poly1.height / 2) };
    if ((centerVector.x * mtv.x + centerVector.y * mtv.y) < 0) {
        mtv.x *= -1;
        mtv.y *= -1;
    }
    return mtv;
}

function checkCollisionSAT_Circle_OBB(circle, obb) {
    const vertices = getVertices(obb);
    const axes = getAxes(vertices);

    let closestVertex = null;
    let minDistanceSq = Infinity;
    for (const v of vertices) {
        const dx = v.x - circle.cx;
        const dy = v.y - circle.cy;
        const distSq = dx * dx + dy * dy;
        if (distSq < minDistanceSq) {
            minDistanceSq = distSq;
            closestVertex = v;
        }
    }

    const axisToClosest = { x: closestVertex.x - circle.cx, y: closestVertex.y - circle.cy };
    const len = Math.sqrt(axisToClosest.x * axisToClosest.x + axisToClosest.y * axisToClosest.y);
    if (len > 0) {
        axes.push({ x: axisToClosest.x / len, y: axisToClosest.y / len });
    }

    let minOverlap = Infinity;
    let smallestAxis = null;

    for (const axis of axes) {
        const projOBB = project(vertices, axis);
        const circleCenterProj = circle.cx * axis.x + circle.cy * axis.y;
        const projCircle = { min: circleCenterProj - circle.radius, max: circleCenterProj + circle.radius };
        const overlap = Math.min(projOBB.max, projCircle.max) - Math.max(projOBB.min, projCircle.min);

        if (overlap < 0.1) { return null; }
        if (overlap < minOverlap) {
            minOverlap = overlap;
            smallestAxis = axis;
        }
    }

    if (!smallestAxis) { return null; }

    const mtv = { x: smallestAxis.x * minOverlap, y: smallestAxis.y * minOverlap };
    const centerVector = { x: circle.cx - (obb.x + obb.width / 2), y: circle.cy - (obb.y + obb.height / 2) };
    if ((centerVector.x * mtv.x + centerVector.y * mtv.y) < 0) {
        mtv.x *= -1;
        mtv.y *= -1;
    }
    return mtv;
}

// =================================================================
// CORE GAME LOGIC
// =================================================================
function createNewPlayer(socket) {
    gameState.players[socket.id] = {
        name: `Player${Math.floor(100 + Math.random() * 900)}`,
        id: socket.id,
        x: WORLD_WIDTH / 2 + 500,
        y: WORLD_HEIGHT / 2,
        vx: 0,
        vy: 0,
        width: INITIAL_PLAYER_SIZE,
        height: INITIAL_PLAYER_SIZE * 1.5,
        speed: INITIAL_PLAYER_SPEED,
        originalSpeed: INITIAL_PLAYER_SPEED,
        rotation: 0,
        role: 'human',
        activeAbility: ' ',
        coins: 10000,
        isSprinting: false,
        sprintAvailable: true,
        isSpying: false,
        spyUsesLeft: 2,
        spyCooldown: false,
        isHidden: false,
        arrowAmmo: 0,
        engineerCooldownUntil: 0,
        isInDuct: false,
        zombieSpeed: null,
        zombieWidth: null,
        zombieHeight: null,
        inventory: null,
        illusionistAvailable: true,
        illusionistPassiveAvailable: true,
        butterflyUsed: false,
        isFlying: false,
        teleportCooldownUntil: 0,
        isInvisible: false,
        zombieAbility: null,
        trapsLeft: 0,
        isTrapped: false,
        trappedUntil: 0,
        carryingObject: null,
        knockbackVx: 0,
        knockbackVy: 0,
        input: {
            movement: { up: false, down: false, left: false, right: false },
            mouse: { x: 0, y: 0 },
            rotation: 0,
            worldMouse: { x: 0, y: 0 }
        }
    };
}

function dropHeldItem(player) {
    if (!player || !player.inventory) return;

    const itemToDrop = { ...player.inventory };
    player.inventory = null;

    if (itemToDrop.id === 'gravityGlove') {
        return;
    }

    let dropData = {
        id: itemToDrop.id,
        x: player.x,
        y: player.y,
        width: DROPPED_ITEM_SIZE,
        height: DROPPED_ITEM_SIZE
    };
    switch (itemToDrop.id) {
        case 'skateboard':
            const skate = gameState.skateboard;
            skate.spawned = true;
            skate.ownerId = null;
            skate.x = player.x;
            skate.y = player.y;
            return;
        case 'drone':
            delete gameState.drones[player.id];
            dropData.ammo = itemToDrop.ammo || DRONE_MAX_AMMO;
            break;
        case 'invisibilityCloak':
            dropData.active = false;
            break;
        case 'card':
            dropData.width = 37;
            dropData.height = 25;
            break;
        case 'Drum':
            dropData.width = 60;
            dropData.height = 30;
            break;
    }
    gameState.groundItems.push(dropData);
}

function updateGameState() {
    const now = Date.now();
    const allCollidables = [...gameState.box, ...gameState.furniture];
    const allWalls = [...gameState.house.walls, ...gameState.garage.walls, ...gameState.obstacles, ...(gameState.hardWalls || [])];

    gameState.illusions = gameState.illusions.filter(illusion => {
        if (now - illusion.creationTime > ILLUSION_LIFESPAN) {
            return false;
        }
        const originalX = illusion.x;
        const originalY = illusion.y;
        illusion.x += illusion.vx;
        illusion.y += illusion.vy;
        const illusionRect = { ...illusion
        };
        for (const wall of allWalls) {
            if (isColliding(illusionRect, wall)) {
                illusion.x = originalX;
                illusion.y = originalY;
                illusion.vx = 0;
                illusion.vy = 0;
                break;
            }
        }
        return true;
    });
    for (const ownerId in gameState.drones) {
        const drone = gameState.drones[ownerId];
        const player = gameState.players[ownerId];
        if (player && player.input.worldMouse) {
            const targetX = player.input.worldMouse.x;
            const targetY = player.input.worldMouse.y;
            drone.x += (targetX - drone.x) * DRONE_FOLLOW_FACTOR;
            drone.y += (targetY - drone.y) * DRONE_FOLLOW_FACTOR;
        }
    }
    for (let i = gameState.grenades.length - 1; i >= 0; i--) {
        const grenade = gameState.grenades[i];
        if (Date.now() > grenade.explodeTime) {
            for (const playerId in gameState.players) {
                const player = gameState.players[playerId];
                const dx = player.x + player.width / 2 - grenade.x;
                const dy = player.y + player.height / 2 - grenade.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < GRENADE_RADIUS) {
                    const angle = Math.atan2(dy, dx);
                    const knockback = (1 - (distance / GRENADE_RADIUS)) * GRENADE_KNOCKBACK_IMPULSE;
                    player.knockbackVx += Math.cos(angle) * knockback;
                    player.knockbackVy += Math.sin(angle) * knockback;
                }
            }
            gameState.grenades.splice(i, 1);
        }
    }

    for (const id in gameState.players) {
        const player = gameState.players[id];

        if (player.inventory && player.inventory.id === 'Drum') {
            const drumRadius = 10;

            const localX = player.width / 2 + 40;
            const localY = 0;

            const playerCenterX = player.x + player.width / 2;
            const playerCenterY = player.y + player.height / 2;
            const rot = player.rotation;

            const hitbox_cx = playerCenterX + localX * Math.cos(rot) - localY * Math.sin(rot);
            const hitbox_cy = playerCenterY + localX * Math.sin(rot) + localY * Math.cos(rot);

            const drumCircleHitbox = { cx: hitbox_cx, cy: hitbox_cy, radius: drumRadius };
            player.drumHitbox = drumCircleHitbox;

            for (const obj of allCollidables) {
                const mtv_drum_object = checkCollisionSAT_Circle_OBB(drumCircleHitbox, obj);
                if (mtv_drum_object) {
                    let isObjectTouchingWall = false;

                    for (const wall of allWalls) {
                        if (checkCollisionSAT(obj, wall)) {
                            isObjectTouchingWall = true;
                            break;
                        }
                    }
                    if (isObjectTouchingWall) {
                        obj.ignoreWallCollision = true;
                    }
                    const pushAngle = player.rotation;
                    let mass = (obj.id === 'car') ? 15 : 1;
                    const forceMagnitude = FORCE_DRUM_COLLISION_FORCE / mass;
                    obj.vx += Math.cos(pushAngle) * forceMagnitude;
                    obj.vy += Math.sin(pushAngle) * forceMagnitude;
                    const contactVectorX = hitbox_cx - (obj.x + obj.width / 2);
                    const contactVectorY = hitbox_cy - (obj.y + obj.height / 2);
                    const torque = (contactVectorX * (Math.sin(pushAngle) * forceMagnitude) - contactVectorY * (Math.cos(pushAngle) * forceMagnitude)) * TORQUE_FACTOR;
                    obj.angularVelocity += torque;
                }
            }
        } else {
            player.drumHitbox = null;
        }
    }

    for (let i = 0; i < allCollidables.length; i++) {
        const item1 = allCollidables[i];
        for (let j = i + 1; j < allCollidables.length; j++) {
            const item2 = allCollidables[j];
            const mtv = checkCollisionSAT(item1, item2);
            if (mtv) {
                const m1 = getMass(item1);
                const m2 = getMass(item2);
                const totalMass = m1 + m2;
                item1.x -= mtv.x * (m2 / totalMass);
                item1.y -= mtv.y * (m2 / totalMass);
                item2.x += mtv.x * (m1 / totalMass);
                item2.y += mtv.y * (m1 / totalMass);
                const relVelX = item2.vx - item1.vx;
                const relVelY = item2.vy - item1.vy;
                const mtvLength = Math.sqrt(mtv.x * mtv.x + mtv.y * mtv.y);

                if (mtvLength > 0) {
                    const normalX = mtv.x / mtvLength;
                    const normalY = mtv.y / mtvLength;
                    const velAlongNormal = relVelX * normalX + relVelY * normalY;

                    if (velAlongNormal < 0) {
                        const restitution = BOX_COLLISION_DAMPING;
                        const invMass1 = 1 / m1;
                        const invMass2 = 1 / m2;
                        let jn = -(1 + restitution) * velAlongNormal / (invMass1 + invMass2);
                        const impulseNormalX = jn * normalX;
                        const impulseNormalY = jn * normalY;

                        item1.vx -= impulseNormalX * invMass1;
                        item1.vy -= impulseNormalY * invMass1;
                        item2.vx += impulseNormalX * invMass2;
                        item2.vy += impulseNormalY * invMass2;
                        const tangentX = -normalY;
                        const tangentY = normalX;
                        const velAlongTangent = relVelX * tangentX + relVelY * tangentY;
                        let jt = -velAlongTangent / (invMass1 + invMass2);
                        const friction = BOX_SLIDE_FRICTION;

                        if (Math.abs(jt) > Math.abs(jn * friction)) {
                            jt = (jn * friction) * Math.sign(jt);
                        }

                        const impulseTangentX = jt * tangentX;
                        const impulseTangentY = jt * tangentY;

                        item1.vx -= impulseTangentX * invMass1;
                        item1.vy -= impulseTangentY * invMass1;
                        item2.vx += impulseTangentX * invMass2;
                        item2.vy += impulseTangentY * invMass2;
                    }
                }
            }
        }
        item1.x += item1.vx;
        item1.y += item1.vy;
        item1.rotation += item1.angularVelocity;
        item1.vx *= BOX_FRICTION;
        item1.vy *= BOX_FRICTION;
        item1.angularVelocity *= ANGULAR_FRICTION;

        const linearSpeedSq = item1.vx * item1.vx + item1.vy * item1.vy;
        if (linearSpeedSq < SLEEP_THRESHOLD * SLEEP_THRESHOLD && Math.abs(item1.angularVelocity) < SLEEP_THRESHOLD) {
            item1.vx = 0;
            item1.vy = 0;
            item1.angularVelocity = 0;
        }

        if (!item1.ignoreWallCollision) {
            const regularWalls = [...gameState.house.walls, ...gameState.garage.walls, ...gameState.obstacles];
            const hardWalls = gameState.hardWalls || [];

            for (const obstacle of regularWalls) {
                const mtv = checkCollisionSAT(item1, obstacle);
                if (mtv) {
                    item1.vx -= mtv.x * WALL_PUSH_OUT_FORCE;
                    item1.vy -= mtv.y * WALL_PUSH_OUT_FORCE;

                    const dot = item1.vx * mtv.x + item1.vy * mtv.y;
                    if (dot < 0) {
                        item1.vx *= 0.08;
                        item1.vy *= 0.08;
                    }
                }
            }

            for (const wall of hardWalls) {
                const mtv = checkCollisionSAT(item1, wall);
                if (mtv) {
                    item1.x -= mtv.x;
                    item1.y -= mtv.y;

                    const mtvLength = Math.sqrt(mtv.x * mtv.x + mtv.y * mtv.y);
                    if (mtvLength > 0) {
                        const normalX = mtv.x / mtvLength;
                        const normalY = mtv.y / mtvLength;
                        const velDotNormal = item1.vx * normalX + item1.vy * normalY;

                        if (velDotNormal > 0) {
                            const restitution = BOX_COLLISION_DAMPING;
                            const impulse = -(1 + restitution) * velDotNormal;
                            item1.vx += impulse * normalX;
                            item1.vy += impulse * normalY;
                            item1.angularVelocity *= 0.5;
                        }
                    }
                }
            }
        }

        item1.ignoreWallCollision = false;
        item1.x = Math.max(0, Math.min(item1.x, WORLD_WIDTH - item1.width));
        item1.y = Math.max(0, Math.min(item1.y, WORLD_HEIGHT - item1.height));
    }

    const playerIds = Object.keys(gameState.players);

    for (const id of playerIds) {
        const player = gameState.players[id];
        if (player.isTrapped) {
            if (Date.now() > player.trappedUntil) {
                player.isTrapped = false;
            } else {
                continue;
            }
        }
        if (player.isInvisible) {
            let cloakBroken = false;
            for (const otherId in gameState.players) {
                if (id === otherId) continue;
                const otherPlayer = gameState.players[otherId];
                if (otherPlayer.role === 'zombie') {
                    const dx = player.x - otherPlayer.x;
                    const dy = player.y - otherPlayer.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < INVISIBILITY_CLOAK_BREAK_DISTANCE) {
                        player.isInvisible = false;
                        player.inventory = null;
                        io.emit('newMessage', {
                            name: 'Server',
                            text: `${player.name}'s cloak was broken!`
                        });
                        cloakBroken = true;
                        break;
                    }
                }
            }
            if (cloakBroken) continue;
        }
        if (player.isFlying) {
            if (player.input.movement.up) {
                player.y -= player.speed;
            }
            if (player.input.movement.down) {
                player.y += player.speed;
            }
            if (player.input.movement.left) {
                player.x -= player.speed;
            }
            if (player.input.movement.right) {
                player.x += player.speed;
            }
            player.x = Math.max(0, Math.min(player.x, WORLD_WIDTH - player.width));
            player.y = Math.max(0, Math.min(player.y, WORLD_HEIGHT - player.height));
            continue;
        }

        player.hitbox = {
            cx: player.x + player.width / 2,
            cy: player.y + player.height / 2,
            radius: player.width / 2
        };

        let hitboxRadius = player.width / 2;
        if (player.role === 'human') {
            hitboxRadius *= 0.3;
        } else if (player.role === 'zombie') {
            hitboxRadius *= 0.6;
        }

        player.physicalHitbox = {
            cx: player.x + player.width / 2,
            cy: player.y + player.height / 2,
            radius: hitboxRadius
        };

        player.infectionHitbox = {
            cx: player.x + player.width / 2,
            cy: player.y + player.height / 2,
            radius: player.width * 0.2
        };

        if (player.inventory && player.inventory.id === 'skateboard') {
            const originalX = player.x;
            const originalY = player.y;
            const skateSpeed = SKATEBOARD_SPEED_BOOST;
            const angle = player.rotation;
            player.x += Math.cos(angle) * skateSpeed;
            player.physicalHitbox.cx = player.x + (player.width / 2);
            let collidedX = false;
            for (const wall of allWalls) {
                if (isCollidingCircleRect(player.physicalHitbox, wall)) {
                    collidedX = true;
                }
            }
            if (player.x < 0 || player.x + player.width > WORLD_WIDTH) {
                collidedX = true;
            }
            if (collidedX) {
                player.x = originalX;
                player.physicalHitbox.cx = player.x + (player.width / 2);
            }
            player.y += Math.sin(angle) * skateSpeed;
            player.physicalHitbox.cy = player.y + (player.height / 2);
            let collidedY = false;
            for (const wall of allWalls) {
                if (isCollidingCircleRect(player.physicalHitbox, wall)) {
                    collidedY = true;
                }
            }
            if (player.y < 0 || player.y + player.height > WORLD_HEIGHT) {
                collidedY = true;
            }
            if (collidedY) {
                player.y = originalY;
                player.physicalHitbox.cy = player.y + (player.height / 2);
            }
        } else {
            let accelX = 0;
            let accelY = 0;
            if (player.input.movement.left) accelX -= 1;
            if (player.input.movement.right) accelX += 1;
            if (player.input.movement.up) accelY -= 1;
            if (player.input.movement.down) accelY += 1;
            if (accelX !== 0 || accelY !== 0) {
                const mag = Math.sqrt(accelX * accelX + accelY * accelY);
                player.vx += (accelX / mag) * PLAYER_ACCELERATION;
                player.vy += (accelY / mag) * PLAYER_ACCELERATION;
            }
            player.vx *= PLAYER_FRICTION;
            player.vy *= PLAYER_FRICTION;
            let effectiveSpeed = player.speed;
            if (player.role === 'zombie') {
                effectiveSpeed *= ZOMBIE_SPEED_BOOST;
            }
            if (player.carryingObject) {
                effectiveSpeed *= 0.7;
            }
            const maxSpeedSq = effectiveSpeed * effectiveSpeed;
            const currentSpeedSq = player.vx * player.vx + player.vy * player.vy;
            if (currentSpeedSq > maxSpeedSq) {
                const currentSpeed = Math.sqrt(currentSpeedSq);
                player.vx = (player.vx / currentSpeed) * effectiveSpeed;
                player.vy = (player.vy / currentSpeed) * effectiveSpeed;
            }
            player.x += player.vx;
            player.y += player.vy;
        }

        player.x += player.knockbackVx;
        player.y += player.knockbackVy;
        player.knockbackVx *= PLAYER_FRICTION;
        player.knockbackVy *= PLAYER_FRICTION;

        if (Math.abs(player.knockbackVx) < 0.01) player.knockbackVx = 0;
        if (Math.abs(player.knockbackVy) < 0.01) player.knockbackVy = 0;

        player.isHidden = false;
        for (const sunshade of gameState.sunshades) {
            if (isCollidingCircleRect(player.hitbox, sunshade)) {
                player.isHidden = true;
                break;
            }
        }

        let totalMtvX = 0;
        let totalMtvY = 0;

        const playerPoly = {
            x: player.physicalHitbox.cx - player.physicalHitbox.radius,
            y: player.physicalHitbox.cy - player.physicalHitbox.radius,
            width: player.physicalHitbox.radius * 2,
            height: player.physicalHitbox.radius * 2,
            rotation: 0
        };

        for (const item of allCollidables) {
            const mtv = checkCollisionSAT(playerPoly, item);
            if (mtv) {
                totalMtvX -= mtv.x;
                totalMtvY -= mtv.y;

                if (player.inventory && player.inventory.id === 'skateboard') {
                    continue;
                }

                const isPushing = player.input.movement.up || player.input.movement.down || player.input.movement.left || player.input.movement.right;
                if (isPushing) {
                    let pushDirectionX = 0,
                        pushDirectionY = 0;
                    if (player.input.movement.up) {
                        pushDirectionY -= 1;
                    }
                    if (player.input.movement.down) {
                        pushDirectionY += 1;
                    }
                    if (player.input.movement.left) {
                        pushDirectionX -= 1;
                    }
                    if (player.input.movement.right) {
                        pushDirectionX += 1;
                    }
                    const magnitude = Math.sqrt(pushDirectionX * pushDirectionX + pushDirectionY * pushDirectionY);
                    if (magnitude > 0) {
                        pushDirectionX /= magnitude;
                        pushDirectionY /= magnitude;
                    }

                    let pushMultiplier = 1;
                    if (player.inventory && player.inventory.id === 'Drum') {
                        pushMultiplier = FORCE_DRUM_MULTIPLIER;
                    }
                    if (player.role === 'zombie') {
                        pushMultiplier *= ZOMBIE_PUSH_MODIFIER;
                    }

                    let mass = (item.id === 'car') ? 15 : 1;
                    let pushForceX = pushDirectionX * BOX_PUSH_FORCE * pushMultiplier / mass;
                    let pushForceY = pushDirectionY * BOX_PUSH_FORCE * pushMultiplier / mass;
                    item.vx += pushForceX;
                    item.vy += pushForceY;

                    let canApplyTorque = true;
                    for (const wall of allWalls) {
                        if (checkCollisionSAT(item, wall)) {
                            canApplyTorque = false;
                            break;
                        }
                    }
                    if (canApplyTorque) {
                        for (const otherItem of allCollidables) {
                            if (item.uniqueId === otherItem.uniqueId) continue;
                            if (checkCollisionSAT(item, otherItem)) {
                                canApplyTorque = false;
                                break;
                            }
                        }
                    }
                    if (canApplyTorque) {
                        const contactVectorX = (player.x + player.width / 2) - (item.x + item.width / 2);
                        const contactVectorY = (player.y + player.height / 2) - (item.y + item.height / 2);
                        const torque = (contactVectorX * pushForceY - contactVectorY * pushForceX) * TORQUE_FACTOR;
                        item.angularVelocity += torque;
                    }
                }
            }
        }

        for (const wall of allWalls) {
            const mtv = checkCollisionSAT(playerPoly, wall);
            if (mtv) {
                totalMtvX -= mtv.x;
                totalMtvY -= mtv.y;
            }
        }

        player.x += totalMtvX;
        player.y += totalMtvY;

        player.x = Math.max(0, Math.min(player.x, WORLD_WIDTH - player.width));
        player.y = Math.max(0, Math.min(player.y, WORLD_HEIGHT - player.height));
    }

    for (let i = 0; i < playerIds.length; i++) {
        for (let j = i + 1; j < playerIds.length; j++) {
            const player1 = gameState.players[playerIds[i]];
            const player2 = gameState.players[playerIds[j]];
            if (player1 && player2 && isCollidingCircleCircle(player1.hitbox, player2.hitbox)) {
                const dx = player2.hitbox.cx - player1.hitbox.cx;
                const dy = player2.hitbox.cy - player1.hitbox.cy;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const overlap = (player1.hitbox.radius + player2.hitbox.radius) - distance;
                if (overlap > 0) {
                    if (distance > 0) {
                        const pushX = (dx / distance) * (overlap / 2);
                        const pushY = (dy / distance) * (overlap / 2);
                        player1.x -= pushX;
                        player1.y -= pushY;
                        player2.x += pushX;
                        player2.y += pushY;
                    } else {
                        player1.x -= 0.5;
                        player2.x += 0.5;
                    }
                }
            }
        }
    }

    for (let i = gameState.traps.length - 1; i >= 0; i--) {
        const trap = gameState.traps[i];
        let trapped = false;
        for (const playerId in gameState.players) {
            const player = gameState.players[playerId];
            if (player.role === trap.target && !player.isTrapped && isColliding(player, trap)) {
                player.isTrapped = true;
                player.trappedUntil = Date.now() + TRAP_DURATION;
                io.emit('newMessage', {
                    name: 'Server',
                    text: `${player.name} stepped on a trap!`
                });
                trapped = true;
                break;
            }
        }
        if (trapped) {
            gameState.traps.splice(i, 1);
        }
    }

    if (gameState.gamePhase === 'running') {
        const players = gameState.players;
        for (const id1 of playerIds) {
            const player1 = players[id1];
            if (player1.role === 'zombie') {
                for (const id2 of playerIds) {
                    if (id1 === id2) continue;
                    const player2 = players[id2];
                    if ((player2.role === 'human' || player2.isSpying) && isCollidingCircleCircle(player1.hitbox, player2.hitbox) && !player2.isFlying && !player2.isTrapped) {
                        if (player2.activeAbility === 'illusionist' && player2.illusionistPassiveAvailable) {
                            player2.illusionistPassiveAvailable = false;
                            io.emit('newMessage', {
                                name: 'Server',
                                text: `${player2.name} used their extra life and was not infected!`
                            });
                            continue;
                        }
                        if (player2.activeAbility === 'butterfly' && !player2.butterflyUsed) {
                            player2.butterflyUsed = true;
                            player2.isFlying = true;
                            player2.originalSpeed = player2.speed;
                            player2.speed *= BUTTERFLY_SPEED_MULTIPLIER;
                            setTimeout(() => {
                                if (gameState.players[id2]) {
                                    const p = gameState.players[id2];
                                    p.isFlying = false;
                                    p.speed = p.originalSpeed;
                                }
                            }, BUTTERFLY_DURATION);
                            io.emit('newMessage', {
                                name: 'Server',
                                text: `${player2.name} used the Butterfly to escape!`
                            });
                            continue;
                        }
                        if (player2.inventory && player2.inventory.id === 'invisibilityCloak') {
                            player2.inventory = null;
                            if (player2.isInvisible) {
                                player2.isInvisible = false;
                            }
                        } else {
                            dropHeldItem(player2);
                        }
                        const humanSpeed = player2.speed;
                        const humanWidth = player2.width;
                        const humanHeight = player2.height;
                        if (player2.isSpying) {
                            player2.isSpying = false;
                        }
                        player2.role = 'zombie';
                        player2.speed = humanSpeed;
                        player2.width = humanWidth;
                        player2.height = humanHeight;
                        const speedStolen = player2.speed * 0.25;
                        player2.speed -= speedStolen;
                        player1.speed = Math.min(MAX_PLAYER_SPEED, player1.speed + speedStolen);
                        const coinReward = 10;
                        player1.coins += coinReward;
                        console.log(`${player2.name} has been infected!`);
                        io.emit('newMessage', {
                            name: 'Server',
                            text: `${player2.name} has been infected!`
                        });
                    }
                }
            }
            for (let i = gameState.arrows.length - 1; i >= 0; i--) {
                const arrow = gameState.arrows[i];
                if (arrow.hasHit) continue;
                arrow.x += Math.cos(arrow.angle) * ARROW_SPEED;
                arrow.y += Math.sin(arrow.angle) * ARROW_SPEED;
                let hitDetected = false;
                for (const playerId in gameState.players) {
                    const player = gameState.players[playerId];
                    if (arrow.ownerId === playerId || !player.hitbox || player.isInDuct) continue;
                    const arrowHitbox = {
                        x: arrow.x,
                        y: arrow.y,
                        width: arrow.width,
                        height: arrow.height
                    };
                    if (isCollidingCircleRect(player.hitbox, arrowHitbox)) {
                        player.knockbackVx += Math.cos(arrow.angle) * ARROW_KNOCKBACK_IMPULSE;
                        player.knockbackVy += Math.sin(arrow.angle) * ARROW_KNOCKBACK_IMPULSE;
                        arrow.hasHit = true;
                        hitDetected = true;
                        const arrowIdToRemove = arrow.id;
                        setTimeout(() => {
                            const index = gameState.arrows.findIndex(a => a.id === arrowIdToRemove);
                            if (index !== -1) {
                                gameState.arrows.splice(index, 1);
                            }
                        }, ARROW_LIFESPAN_AFTER_HIT);
                        break;
                    }
                }
                if (!hitDetected) {
                    if (arrow.x < 0 || arrow.x > WORLD_WIDTH || arrow.y < 0 || arrow.y > WORLD_HEIGHT) {
                        gameState.arrows.splice(i, 1);
                    }
                }
            }
        }
    }
}

// =================================================================
// SOCKET.IO HANDLERS
// =================================================================
io.on('connection', (socket) => {
    console.log('New player connected:', socket.id);
    createNewPlayer(socket);

    socket.on('setNickname', (nickname) => {
        const player = gameState.players[socket.id];
        if (player && nickname) {
            const sanitizedName = String(nickname).trim().substring(0, 10);
            if (sanitizedName) {
                player.name = sanitizedName;
                io.emit('newMessage', {
                    name: 'Server',
                    text: `${player.name} has joined the game.`
                });
            }
        }
    });

    socket.on('playerInput', (inputData) => {
        const player = gameState.players[socket.id];
        if (player) {
            player.input.movement = inputData.movement;
            player.rotation = inputData.rotation;
            if (inputData.worldMouse) {
                player.input.worldMouse = inputData.worldMouse;
            }
        }
    });

    socket.on('chooseAbility', (ability) => {
        const player = gameState.players[socket.id];
        if (gameState.gamePhase !== 'running') return;
        const cost = ABILITY_COSTS[ability];
        if (player && player.activeAbility === ' ' && cost !== undefined && player.coins >= cost) {
            if (gameState.takenAbilities.includes(ability)) return;
            player.coins -= cost;
            player.activeAbility = ability;
            gameState.takenAbilities.push(ability);
            if (ability === 'archer') {
                player.arrowAmmo = 200;
            }
        }
    });

    socket.on('buyZombieAbility', (abilityId) => {
        const player = gameState.players[socket.id];
        const cost = ZOMBIE_ABILITY_COSTS[abilityId];
        if (player && player.role === 'zombie' && !player.zombieAbility && cost !== undefined && player.coins >= cost) {
            player.coins -= cost;
            player.zombieAbility = abilityId;
            if (abilityId === 'trap') {
                player.trapsLeft = 1;
            }
        }
    });

    socket.on('buyItem', (itemId) => {
        const player = gameState.players[socket.id];
        if (!player || player.inventory) return;
        let cost;
        let itemData;
        switch (itemId) {
            case "Drum":
                cost = 100;
                itemData = {
                    id: 'Drum'
                };
                break;
            case "gravityGlove":
                cost = 100;
                itemData = {
                    id: 'gravityGlove',
                    uses: 2
                };
                break;
            case 'antidote':
                cost = 20;
                itemData = {
                    id: 'antidote'
                };
                break;
        }
        if (cost && player.coins >= cost) {
            player.coins -= cost;
            player.inventory = itemData;
            io.emit('newMessage', {
                name: 'Server',
                text: `${player.name} bought ${itemId}!`
            });
        }
    });

    socket.on('buyRareItem', (itemId) => {
        const player = gameState.players[socket.id];
        if (!player || !player.inventory || player.inventory.id !== 'card') {
            return;
        }
        let cost;
        let itemData;
        switch (itemId) {
            case 'skateboard':
                cost = 100;
                itemData = { ...gameState.skateboard,
                    ownerId: player.id
                };
                break;
            case 'drone':
                cost = 200;
                itemData = {
                    id: 'drone',
                    ammo: DRONE_MAX_AMMO
                };
                break;
            case 'invisibilityCloak':
                cost = 200;
                itemData = {
                    id: 'invisibilityCloak',
                    active: false
                };
                break;
            case 'zoom':
                cost = 150;
                itemData = {
                    id: 'zoom'
                };
                break;
        }

        if (cost && player.coins >= cost) {
            player.coins -= cost;
            player.inventory = itemData;
            if (itemId === 'skateboard') {
                gameState.skateboard.ownerId = player.id;
                gameState.skateboard.spawned = false;
            } else if (itemId === 'drone') {
                gameState.drones[player.id] = {
                    ownerId: player.id,
                    x: player.x,
                    y: player.y,
                    ammo: DRONE_MAX_AMMO,
                };
            }
            io.emit('newMessage', {
                name: 'Server',
                text: `${player.name} used the ATM to buy ${itemId}!`
            });
        }
    });

    socket.on('playerAction', (actionData) => {
        const player = gameState.players[socket.id];
        if (!player) return;
        switch (actionData.type) {
            case 'use_antidote':
                if (player.inventory && player.inventory.id === 'antidote') {
                    player.inventory = null;
                    io.emit('newMessage', {
                        name: 'Server',
                        text: `${player.name} consumed an antidote.`
                    });
                }
                break;
            case 'zombie_teleport':
                if (player.role === 'zombie' && Date.now() > (player.teleportCooldownUntil || 0)) {
                    player.x = WORLD_WIDTH / 2 + 500;
                    player.y = WORLD_HEIGHT / 2;
                    player.teleportCooldownUntil = Date.now() + 60000;
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
                }
                break;
            case 'drop_grenade':
                if (player.inventory && player.inventory.id === 'drone' && gameState.drones[player.id] && gameState.drones[player.id].ammo > 0) {
                    const drone = gameState.drones[player.id];
                    drone.ammo--;
                    player.inventory.ammo = drone.ammo;
                    gameState.grenades.push({
                        id: nextGrenadeId++,
                        x: drone.x,
                        y: drone.y,
                        explodeTime: Date.now() + GRENADE_FUSE_TIME
                    });
                }
                break;
            case 'primary_action':
                if (player.activeAbility === 'archer' && player.arrowAmmo > 0) {
                    player.arrowAmmo--;
                    gameState.arrows.push({
                        id: nextArrowId++,
                        x: player.x + player.width / 2,
                        y: player.y + player.height / 2,
                        width: 30,
                        height: 30,
                        color: 'red',
                        angle: player.rotation,
                        ownerId: player.id,
                        hasHit: false
                    });
                }
                break;
            case 'ability':
                if (player.inventory && player.inventory.id === 'invisibilityCloak' && !player.inventory.active) {
                    player.inventory.active = true;
                    player.isInvisible = true;
                    io.emit('newMessage', {
                        name: 'Server',
                        text: `${player.name} has vanished!`
                    });
                    return;
                }
                if (player.activeAbility === 'illusionist' && player.illusionistAvailable) {
                    player.illusionistAvailable = false;
                    gameState.illusions.push({
                        id: nextIllusionId++,
                        x: player.x,
                        y: player.y,
                        width: player.width,
                        height: player.height,
                        vx: Math.cos(player.rotation) * ILLUSION_SPEED,
                        vy: Math.sin(player.rotation) * ILLUSION_SPEED,
                        creationTime: Date.now()
                    });
                    setTimeout(() => {
                        if (gameState.players[socket.id]) player.illusionistAvailable = true;
                    }, ILLUSIONIST_COOLDOWN);
                }
                if (player.activeAbility === 'athlete' && player.sprintAvailable) {
                    player.isSprinting = true;
                    player.sprintAvailable = false;
                    const originalSpeed = player.speed;
                    player.speed = Math.min(MAX_PLAYER_SPEED, player.speed * 2);
                    setTimeout(() => {
                        if (gameState.players[socket.id]) {
                            player.isSprinting = false;
                            player.speed = originalSpeed;
                        }
                    }, SPRINT_DURATION);
                    setTimeout(() => {
                        if (gameState.players[socket.id]) player.sprintAvailable = true;
                    }, SPRINT_COOLDOWN);
                }
                if (player.activeAbility === 'spy' && player.spyUsesLeft > 0 && !player.spyCooldown && !player.isSpying) {
                    player.isSpying = true;
                    player.spyUsesLeft--;
                    player.spyCooldown = true;
                    setTimeout(() => {
                        if (gameState.players[socket.id]) player.isSpying = false;
                    }, SPY_DURATION);
                    setTimeout(() => {
                        if (gameState.players[socket.id]) player.spyCooldown = false;
                    }, SPY_COOLDOWN);
                }
                break;
            case 'drop_item':
                if (player.carryingObject) {
                    if (player.inventory && player.inventory.id === 'gravityGlove') {
                        player.inventory.uses--;
                        if (player.inventory.uses <= 0) {
                            player.inventory = null;
                            io.emit('newMessage', {
                                name: 'Server',
                                text: `${player.name}'s Gravity Glove broke!`
                            });
                        }
                    }
                    const objectToDrop = player.carryingObject;
                    player.carryingObject = null;
                    objectToDrop.rotation = player.rotation;
                    const distance = player.width / 2 + objectToDrop.width / 2 + 10;
                    objectToDrop.x = (player.x + player.width / 2) + Math.cos(player.rotation) * distance - objectToDrop.width / 2;
                    objectToDrop.y = (player.y + player.height / 2) + Math.sin(player.rotation) * distance - objectToDrop.height / 2;
                    objectToDrop.vx = 0;
                    objectToDrop.vy = 0;
                    objectToDrop.angularVelocity = 0;
                    if (objectToDrop.id.startsWith('box')) {
                        gameState.box.push(objectToDrop);
                    } else {
                        gameState.furniture.push(objectToDrop);
                    }
                } else if (player.inventory) {
                    if (player.inventory.id === 'invisibilityCloak' && player.inventory.active) {
                        return;
                    }
                    dropHeldItem(player);
                }
                break;
            case 'interact':
                if (player.inventory && player.inventory.id === 'gravityGlove' && !player.carryingObject && player.inventory.uses > 0) {
                    let closestObject = null;
                    let minDistance = PICKUP_DISTANCE;
                    let closestIndex = -1;
                    let closestSource = '';

                    gameState.box.forEach((obj, index) => {
                        const dx = (player.x + player.width / 2) - (obj.x + obj.width / 2);
                        const dy = (player.y + player.height / 2) - (obj.y + obj.height / 2);
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        if (distance < minDistance) {
                            minDistance = distance;
                            closestObject = obj;
                            closestIndex = index;
                            closestSource = 'box';
                        }
                    });

                    gameState.furniture.forEach((obj, index) => {
                        if (UNMOVABLE_FURNITURE.includes(obj.id)) return;
                        const dx = (player.x + player.width / 2) - (obj.x + obj.width / 2);
                        const dy = (player.y + player.height / 2) - (obj.y + obj.height / 2);
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        if (distance < minDistance) {
                            minDistance = distance;
                            closestObject = obj;
                            closestIndex = index;
                            closestSource = 'furniture';
                        }
                    });

                    if (closestObject) {
                        let removedObject;
                        if (closestSource === 'box') {
                            [removedObject] = gameState.box.splice(closestIndex, 1);
                        } else if (closestSource === 'furniture') {
                            [removedObject] = gameState.furniture.splice(closestIndex, 1);
                        }
                        player.carryingObject = removedObject;
                        return;
                    }
                }
                if (!player.inventory && player.role !== 'zombie') {
                    if (gameState.skateboard && gameState.skateboard.spawned && !gameState.skateboard.ownerId) {
                        const skate = gameState.skateboard;
                        const dx = (player.x + player.width / 2) - (skate.x + skate.width / 2);
                        const dy = (player.y + player.height / 2) - (skate.y + skate.height / 2);
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        if (distance < PICKUP_DISTANCE) {
                            player.inventory = { ...skate };
                            skate.ownerId = player.id;
                            skate.spawned = false;
                            return;
                        }
                    }
                    for (let i = gameState.groundItems.length - 1; i >= 0; i--) {
                        const item = gameState.groundItems[i];
                        const dx = (player.x + player.width / 2) - (item.x + item.width / 2);
                        const dy = (player.y + player.height / 2) - (item.y + item.height / 2);
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        if (distance < PICKUP_DISTANCE) {
                            player.inventory = item;
                            if (item.id === 'drone') {
                                gameState.drones[player.id] = {
                                    ownerId: player.id,
                                    x: player.x,
                                    y: player.y,
                                    ammo: item.ammo
                                };
                            }
                            gameState.groundItems.splice(i, 1);
                            return;
                        }
                    }
                }
                if (player.activeAbility === 'engineer' && Date.now() > (player.engineerCooldownUntil || 0) && !player.isInDuct) {
                    for (let i = 0; i < gameState.ducts.length; i++) {
                        if (isCollidingCircleRect(player.hitbox, gameState.ducts[i])) {
                            player.isInDuct = true;
                            player.engineerCooldownUntil = Date.now() + 15000;
                            const exitDuct = gameState.ducts[(i + 1) % gameState.ducts.length];
                            setTimeout(() => {
                                if (gameState.players[socket.id]) {
                                    player.x = exitDuct.x + exitDuct.width / 2 - player.width / 2;
                                    player.y = exitDuct.y + exitDuct.height / 2 - player.height / 2;
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
            const message = {
                name: player.name,
                text: text.substring(0, 40)
            };
            io.emit('newMessage', message);
        }
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        const player = gameState.players[socket.id];
        if (player) {
            if (player.carryingObject) {
                const objectToDrop = player.carryingObject;
                objectToDrop.x = player.x;
                objectToDrop.y = player.y;
                objectToDrop.vx = 0;
                objectToDrop.vy = 0;
                objectToDrop.angularVelocity = 0;
                if (objectToDrop.id && objectToDrop.id.startsWith('box')) {
                    gameState.box.push(objectToDrop);
                } else {
                    gameState.furniture.push(objectToDrop);
                }
            }
            dropHeldItem(player);
            if (player.activeAbility !== ' ') {
                gameState.takenAbilities = gameState.takenAbilities.filter(ability => ability !== player.activeAbility);
            }
        }
        delete gameState.players[socket.id];
    });
});

// =================================================================
// GAME LOOP & SERVER START
// =================================================================
setInterval(() => {
    if (!gameState || !gameState.players) return;
    updateGameState();
    io.emit('gameStateUpdate', gameState);
}, TICK_RATE);

function startNewRound() {
    const persistentData = {};
    for (const id in gameState.players) {
        const p = gameState.players[id];
        persistentData[id] = {
            inventory: p.inventory,
            zombieSpeed: p.role === 'zombie' ? p.speed : p.zombieSpeed,
            zombieWidth: p.role === 'zombie' ? p.width : p.zombieWidth,
            zombieHeight: p.role === 'zombie' ? p.height : p.zombieHeight,
        };
    }
    const currentPlayers = gameState.players;
    initializeGame();

    const cardSpawnLocations = [{
        x: 3500,
        y: 1500
    }];
    for (let i = 0; i < 1; i++) {
        const spawnPoint = cardSpawnLocations[i];
        gameState.groundItems.push({
            id: 'card',
            x: spawnPoint.x,
            y: spawnPoint.y,
            width: 37,
            height: 25,
        });
    }

    gameState.players = currentPlayers;
    for (const id in gameState.players) {
        const player = gameState.players[id];
        const savedData = persistentData[id];
        if (savedData) {
            player.inventory = savedData.inventory;
            player.zombieSpeed = savedData.zombieSpeed;
            player.zombieWidth = savedData.zombieWidth;
            player.zombieHeight = savedData.zombieHeight;

            if (player.inventory && player.inventory.id === 'skateboard') {
                gameState.skateboard.ownerId = id;
                gameState.skateboard.spawned = false;
            }
            if (player.inventory && player.inventory.id === 'drone') {
                gameState.drones[id] = {
                    ownerId: player.id,
                    x: player.x,
                    y: player.y,
                    ammo: player.inventory.ammo
                };
            }
        } else {
            player.inventory = null;
        }

        player.x = WORLD_WIDTH / 2 + 500;
        player.y = WORLD_HEIGHT / 2;
        player.role = 'human';
        player.activeAbility = ' ';
        player.isSprinting = false;
        player.sprintAvailable = true;
        player.isSpying = false;
        player.spyUsesLeft = 2;
        player.spyCooldown = false;
        player.isHidden = false;
        player.arrowAmmo = 0;
        player.engineerCooldownUntil = 0;
        player.isInDuct = false;
        player.illusionistPassiveAvailable = true;
        player.zombieAbility = null;
        player.trapsLeft = 0;
        player.knockbackVx = 0;
        player.knockbackVy = 0;
    }
}

setInterval(() => {
    if (!gameState || !gameState.players || Object.keys(gameState.players).length === 0) return;

    if (gameState.gamePhase === 'waiting') {
        gameState.startTime--;
        if (gameState.startTime <= 0) {
            gameState.gamePhase = 'running';
            gameState.timeLeft = ROUND_DURATION;
            const playerIds = Object.keys(gameState.players);
            if (playerIds.length > 0) {
                const randomIndex = Math.floor(Math.random() * playerIds.length);
                const zombieId = playerIds[randomIndex];
                const zombiePlayer = gameState.players[zombieId];
                if (zombiePlayer) {
                    dropHeldItem(zombiePlayer);
                    zombiePlayer.role = 'zombie';
                    console.log(`The round has started! ${zombiePlayer.name} is the initial Zombie!`);
                    io.emit('newMessage', {
                        name: 'Server',
                        text: `The infection has begun! ${zombiePlayer.name} is the zombie!`
                    });
                }
            }
        }
    } else if (gameState.gamePhase === 'running') {
        let humanCount = 0;
        let hasZombies = false;
        const playerIds = Object.keys(gameState.players);
        for (const id of playerIds) {
            if (gameState.players[id].role === 'zombie') hasZombies = true;
            if (gameState.players[id].role === 'human' && !gameState.players[id].isSpying) {
                humanCount++;
            }
        }

        if (humanCount === 0 && hasZombies) {
            console.log("All humans have been infected! Zombies won.");
            io.emit('newMessage', {
                name: 'Server',
                text: 'The Zombies have won!'
            });
            gameState.gamePhase = 'post-round';
            gameState.postRoundTimeLeft = 10;
            return;
        }

        if (gameState.timeLeft <= 0) {
            console.log("Time's up! Humans won the round.");
            io.emit('newMessage', {
                name: 'Server',
                text: "Time's up! The Humans survived!"
            });
            gameState.gamePhase = 'post-round';
            gameState.postRoundTimeLeft = 10;
            return;
        }
        gameState.timeLeft--;

        for (const id in gameState.players) {
            const player = gameState.players[id];
            if (player.role === 'zombie') {
                const coinLoss = Math.floor(Math.random() * 2) + 1;
                player.coins = Math.max(0, player.coins - coinLoss);
            } else {
                player.coins += 1;
                player.width += GROWTH_AMOUNT;
                player.height = player.width * 1.5;
            }
            if (!player.isSprinting) {
                if (player.role === 'zombie') {
                    player.speed = Math.max(ZOMBIE_MIN_SPEED, player.speed - ZOMBIE_SPEED_DECAY_PER_SECOND);
                    const speedRatio = player.speed / INITIAL_PLAYER_SPEED;
                    player.width = INITIAL_PLAYER_SIZE * speedRatio;
                    player.height = (INITIAL_PLAYER_SIZE * 1.5) * speedRatio;
                } else {
                    const sizeDifference = player.width - INITIAL_PLAYER_SIZE;
                    let newSpeed = INITIAL_PLAYER_SPEED + (sizeDifference * SPEED_PER_PIXEL_OF_GROWTH);
                    player.speed = Math.min(MAX_PLAYER_SPEED, newSpeed);
                    player.originalSpeed = player.speed;
                }
            }
        }
    } else if (gameState.gamePhase === 'post-round') {
        gameState.postRoundTimeLeft--;
        if (gameState.postRoundTimeLeft < 0) {
            startNewRound();
        }
    }
}, 1000);

server.listen(PORT, () => {
    initializeGame();
    console.log(`🚀 Game server running at http://localhost:${PORT}`);
});