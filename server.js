const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
const TICK_RATE = 1000 / 60;
const WORLD_WIDTH = 6000;
const WORLD_HEIGHT = 2000;
const INITIAL_PLAYER_SIZE = 40;
const INITIAL_PLAYER_SPEED = 2;
const MAX_PLAYER_SPEED = 5;
const SPEED_PER_PIXEL_OF_GROWTH = 0.07;
const GROWTH_AMOUNT = 0.2;
const ZOMBIE_DECAY_AMOUNT = 0.25;
const DUCT_TRAVEL_TIME = 1000 / 20;
const CAMOUFLAGE_COOLDOWN = 45000;
const SPRINT_COOLDOWN = 45000;
const SPRINT_DURATION = 10000;
const ANT_TRANSFORMATION_DURATION = 20000;
const ANT_COOLDOWN = 45000;
const ANT_SIZE_FACTOR = 0.1;
const ANT_SPEED_FACTOR = 0.7;
const ARROW_SPEED = 10;
const ARROW_KNOCKBACK = 40;
const ARROW_LIFESPAN_AFTER_HIT = 1000;
const BOX_FRICTION = 0.92;
const BOX_PUSH_FORCE = 0.4;
const BOX_COLLISION_DAMPING = 0.05;
const ANGULAR_FRICTION = 0.90;
const TORQUE_FACTOR = 0.0001;
const GLOVES_PUSH_MULTIPLIER = 1.1;
const ZOMBIE_SPEED_BOOST = 1.10;
const SPY_DURATION = 20000;
const SPY_COOLDOWN = 45000;
const ROUND_DURATION = 120;
const SKATEBOARD_SPEED_BOOST = 6;
const SKATEBOARD_WIDTH = 90;
const SKATEBOARD_HEIGHT = 35;
const DRONE_FOLLOW_FACTOR = 0.05;
const DRONE_MAX_AMMO = 10;
const GRENADE_FUSE_TIME = 2000;
const GRENADE_RADIUS = 150;
const GRENADE_KNOCKBACK_FORCE = 500;
const ZOMBIE_SPEED_DECAY_PER_SECOND = 0.01;
const ZOMBIE_MIN_SPEED = 2;
const DROPPED_ITEM_SIZE = 50;
const PICKUP_DISTANCE = 80;
const SMOKE_BOMB_DURATION = 10000;
const SMOKE_BOMB_RADIUS = 400;
const ILLUSIONIST_COOLDOWN = 40000;
const ILLUSION_LIFESPAN = 10000;
const ILLUSION_SPEED = 1.5;
const BUTTERFLY_DURATION = 10000;
const BUTTERFLY_SPEED_MULTIPLIER = 4;
const INVISIBILITY_CLOAK_BREAK_DISTANCE = 400;
const PLAYER_ACCELERATION = 1.2;
const PLAYER_FRICTION = 0.90;
const FIGHTER_PUNCH_RANGE = 150;
const FIGHTER_PUNCH_KNOCKBACK = 400;
const FIGHTER_PUNCH_COOLDOWN = 1000;
const FIGHTER_PUNCH_ANGLE_TOLERANCE = Math.PI / 4;
const TRAP_DURATION = 1000;
const TRAP_SIZE = 50;
const HUMAN_TRAP_QUANTITY = 1;

const ABILITY_COSTS = {
  chameleon: 100,
  athlete: 150,
  archer: 150,
  engineer: 100,
  ant: 200,
  spy: 200,
  chemist: 100,
  illusionist: 200,
  butterfly: 250,
  fighter: 250,
};
const ZOMBIE_ABILITY_COSTS = {
  trapper: 50
};
let gameState = {};
let nextArrowId = 0;
let nextGrenadeId = 0;
let nextIllusionId = 0;
let nextTrapId = 0;

function initializeGame() {
  gameState = {
    players: {},
    arrows: [],
    drones: {},
    grenades: [],
    smokeClouds: [],
    groundItems: [],
    illusions: [],
    traps: [],
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
      id: 'box1',
      x: 2720,
      y: 1200,
      width: 90,
      height: 90,
      vx: 0,
      vy: 0,
      rotation: 0,
      angularVelocity: 0
    }, {
      id: 'box2',
      x: 2900,
      y: 1150,
      width: 192,
      height: 192,
      vx: 0,
      vy: 0,
      rotation: 300,
      angularVelocity: 0
    }, {
      id: 'box3',
      x: 800,
      y: 300,
      width: 90,
      height: 90,
      vx: 0,
      vy: 0,
      rotation: 0,
      angularVelocity: 0
    }, {
      id: 'box4',
      x: 1700,
      y: 700,
      width: 128,
      height: 128,
      vx: 0,
      vy: 0,
      rotation: 45,
      angularVelocity: 0
    }, ],
    furniture: [{
      id: 'small_bed',
      x: 300,
      y: 400,
      width: 108,
      height: 200,
      vx: 0,
      vy: 0,
      rotation: 0,
      angularVelocity: 0
    }, {
      id: 'small_bed',
      x: 1850,
      y: 400,
      width: 108,
      height: 200,
      vx: 0,
      vy: 0,
      rotation: 0,
      angularVelocity: 0
    }, {
      id: 'small_table',
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
      x: 1000,
      y: 400,
      width: 108,
      height: 200,
      vx: 0,
      vy: 0,
      rotation: 0,
      angularVelocity: 0
    }, {
      id: 'small_table',
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
      x: 1500,
      y: 810,
      width: 288,
      height: 126,
      vx: 0,
      vy: 0,
      rotation: 0,
      angularVelocity: 0
    }],
    atm: {
      x: 2890,
      y: 870,
      width: 120,
      height: 150
    },
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
      x: 4200,
      y: 1000,
      width: 320,
      height: 340
    }, {
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
  buildWalls(gameState.house);
  buildWalls(gameState.garage);
}

function dropHeldItem(player) {
  if (!player || !player.inventory) return;
  if (player.inventory.id === 'boxing_glove') return;
  const itemToDrop = player.inventory;
  player.inventory = null;
  if (itemToDrop.id === 'skateboard') {
    const skate = gameState.skateboard;
    skate.spawned = true;
    skate.ownerId = null;
    skate.x = player.x;
    skate.y = player.y;
  } else if (itemToDrop.id === 'drone') {
    const droneData = gameState.drones[player.id];
    delete gameState.drones[player.id];
    gameState.groundItems.push({
      id: 'drone',
      ammo: droneData ? droneData.ammo : DRONE_MAX_AMMO,
      x: player.x,
      y: player.y,
      width: DROPPED_ITEM_SIZE,
      height: DROPPED_ITEM_SIZE
    });
  } else if (itemToDrop.id === 'invisibilityCloak') {
    gameState.groundItems.push({
      id: 'invisibilityCloak',
      active: false,
      x: player.x,
      y: player.y,
      width: DROPPED_ITEM_SIZE,
      height: DROPPED_ITEM_SIZE
    });
  } else if (itemToDrop.id === 'card') {
    gameState.groundItems.push({
      id: 'card',
      x: player.x,
      y: player.y,
      width: 40,
      height: 25,
    });
  } else if (itemToDrop.id === 'human_trap') {
    gameState.groundItems.push({
      ...itemToDrop, // This will include id and quantity
      x: player.x,
      y: player.y,
      width: DROPPED_ITEM_SIZE,
      height: DROPPED_ITEM_SIZE
    });
  } else {
    gameState.groundItems.push({
      id: itemToDrop.id,
      x: player.x,
      y: player.y,
      width: DROPPED_ITEM_SIZE,
      height: DROPPED_ITEM_SIZE
    });
  }
}

function buildWalls(structure) {
  const s = structure;
  const wt = s.wallThickness;
  s.walls = [];
  if (s === gameState.house) {
    // A clean, grid-based layout inspired by the floor plan image.

    // -- PERIMETER (Matches the 2697x1670 floor sprite) --
    s.walls.push({
      x: s.x,
      y: s.y,
      width: s.width,
      height: wt
    }); // Top
    s.walls.push({
      x: s.x,
      y: s.y + s.height - wt,
      width: s.width - 1300,
      height: wt
    }); // Bottom

    // Left Wall (Split with a gap)
    s.walls.push({
      x: s.x,
      y: s.y,
      width: wt,
      height: 820
    }); // Left (Top Part)
    s.walls.push({
      x: s.x,
      y: s.y + 1020,
      width: wt,
      height: s.height - 1020
    }); // Left (Bottom Part)

    // Right Wall (Split with a gap)
    s.walls.push({
      x: s.x + s.width - wt,
      y: s.y,
      width: wt,
      height: 350
    }); // Right (Top Part)
    s.walls.push({
      x: s.x + s.width - wt,
      y: s.y + 600,
      width: wt,
      height: (s.height - 770) - 600
    }); // Right (Bottom Part)


    // -- INTERNAL VERTICAL WALLS --
    s.walls.push({
      x: s.x + 900,
      y: s.y,
      width: wt,
      height: 470
    }); // Parede do quarto 1 / quarto 2 (horizontal)
    s.walls.push({
      x: s.x + 500,
      y: s.y + 1020,
      width: wt,
      height: 650
    }); // Adjusted height

    // Door from y=500 to y=650
    s.walls.push({
      x: s.x + 1500,
      y: s.y,
      width: wt,
      height: 300
    }); // Parede horizontal do quarto 2 / Closet
    s.walls.push({
      x: s.x + 1328,
      y: s.y + 830,
      width: wt,
      height: 840
    }); // Parte direita de baixo (fora)

    // *** NEW VERTICAL WALLS ***
    s.walls.push({
      x: s.x + 2200,
      y: s.y,
      width: wt,
      height: 470
    }); // New vertical wall 1 (Kitchen/Living divider)
    s.walls.push({
      x: s.x + 1795,
      y: s.y + 750,
      width: wt,
      height: 150
    }); // New vertical wall 2 (Top-left room divider)

    // -- INTERNAL HORIZONTAL WALLS --
    // Wall separating Quarto 1 from Banheiro
    // Door from x=200 to x=350 (entrance to Quarto 1)
    s.walls.push({
      x: s.x,
      y: s.y + 400,
      width: 700,
      height: wt
    }); // Parede de baixo do quarto 1 (horizontal)

    // *** NEW HORIZONTAL WALL ***
    s.walls.push({
      x: s.x + 1800,
      y: s.y + 400,
      width: 270,
      height: wt
    }); // New horizontal wall (Living room divider)


    // Wall separating Banheiro from Lavanderia
    // Door from x=700 to x=900 (entrance to Banheiro)
    s.walls.push({
      x: s.x + 250,
      y: s.y + 1020,
      width: 850,
      height: wt
    }); // Não alterar

    // Wall separating Quarto 2 from Sala de Estar below it
    // Door from x=900 to x=1050 (entrance to Quarto 2)
    s.walls.push({
      x: s.x + 1150,
      y: s.y + 400,
      width: 720,
      height: wt
    }); // Parede (tenho que modificar!)

    // Closet walls (a C-shape)
    s.walls.push({
      x: s.x + 1800,
      y: s.y,
      width: wt,
      height: 400 + wt
    }); // Parede direita do closet

    s.walls.push({
      x: s.x,
      y: s.y + 750,
      width: 550,
      height: wt
    }); // Parede de baixo do banheiro

    // Wall separating Cozinha from Sala de Estar
    // Door from x=1200 to x=1350 (entrance to Cozinha)
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
    }); // Parede de baixo (em baixo tem a garagem)

    s.walls.push({
      x: s.x + 480,
      y: s.y + 620,
      width: wt,
      height: 200
    }); // T-junção

  } else if (s === gameState.garage) {
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
    s.walls.push({
      x: s.x + 1200,
      y: s.y,
      width: wt,
      height: s.height
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

function isCollidingCircleRect(circle, rect) {
  if (!circle || !rect) return false;
  const testX = Math.max(rect.x, Math.min(circle.cx, rect.x + rect.width));
  const testY = Math.max(rect.y, Math.min(circle.cy, rect.y + rect.height));
  const dx = circle.cx - testX;
  const dy = circle.cy - testY;
  const distanceSquared = (dx * dx) + (dy * dy);
  return distanceSquared < (circle.radius * circle.radius);
}

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
    coins: 100,
    isCamouflaged: false,
    camouflageAvailable: true,
    isSprinting: false,
    sprintAvailable: true,
    isAnt: false,
    antAvailable: true,
    isSpying: false,
    spyUsesLeft: 2,
    spyCooldown: false,
    isHidden: false,
    arrowAmmo: 0,
    engineerAbilityUsed: false,
    isInDuct: false,
    chemistBombs: 0,
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
    isPunching: false,
    lastPunchTime: 0,
    zombieAbility: null,
    trapsLeft: 0,
    isTrapped: false,
    trappedUntil: 0,
    input: {
      movement: {
        up: false,
        down: false,
        left: false,
        right: false
      },
      mouse: {
        x: 0,
        y: 0
      },
      rotation: 0,
      worldMouse: {
        x: 0,
        y: 0
      }
    }
  };
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
  const points = [{
    x: -halfWidth,
    y: -halfHeight
  }, {
    x: halfWidth,
    y: -halfHeight
  }, {
    x: halfWidth,
    y: halfHeight
  }, {
    x: -halfWidth,
    y: halfHeight
  }];
  for (const p of points) {
    vertices.push({
      x: cx + p.x * cos - p.y * sin,
      y: cy + p.x * sin + p.y * cos
    });
  }
  return vertices;
}

function getAxes(vertices) {
  const axes = [];
  for (let i = 0; i < vertices.length; i++) {
    const p1 = vertices[i];
    const p2 = vertices[i + 1 == vertices.length ? 0 : i + 1];
    const edge = {
      x: p1.x - p2.x,
      y: p1.y - p2.y
    };
    const normal = {
      x: -edge.y,
      y: edge.x
    };
    const length = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
    axes.push({
      x: normal.x / length,
      y: normal.y / length
    });
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
  return {
    min,
    max
  };
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
    if (overlap < 0.1) {
      return null;
    }
    if (overlap < minOverlap) {
      minOverlap = overlap;
      smallestAxis = axis;
    }
  }
  if (!smallestAxis) {
    return null;
  }
  const mtv = {
    x: smallestAxis.x * minOverlap,
    y: smallestAxis.y * minOverlap
  };
  const centerVector = {
    x: (poly2.x + poly2.width / 2) - (poly1.x + poly1.width / 2),
    y: (poly2.y + poly2.height / 2) - (poly1.y + poly1.height / 2)
  };
  if ((centerVector.x * mtv.x + centerVector.y * mtv.y) < 0) {
    mtv.x *= -1;
    mtv.y *= -1;
  }
  return mtv;
}

function updateGameState() {
  const now = Date.now();
  gameState.smokeClouds = gameState.smokeClouds.filter(cloud => cloud.expirationTime > now);
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
    const obstacles = [...gameState.house.walls, ...gameState.garage.walls];
    for (const wall of obstacles) {
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
          const knockback = (1 - (distance / GRENADE_RADIUS)) * GRENADE_KNOCKBACK_FORCE;
          player.x += Math.cos(angle) * knockback;
          player.y += Math.sin(angle) * knockback;
        }
      }
      gameState.grenades.splice(i, 1);
    }
  }
  const allCollidables = [...gameState.box, ...gameState.furniture];
  for (let i = 0; i < allCollidables.length; i++) {
    const item1 = allCollidables[i];
    for (let j = i + 1; j < allCollidables.length; j++) {
      const item2 = allCollidables[j];
      const mtv = checkCollisionSAT(item1, item2);
      if (mtv) {
        item1.x -= mtv.x / 2;
        item1.y -= mtv.y / 2;
        item2.x += mtv.x / 2;
        item2.y += mtv.y / 2;
        const tempVx = item1.vx;
        const tempVy = item1.vy;
        item1.vx = item2.vx * BOX_COLLISION_DAMPING;
        item1.vy = item2.vy * BOX_COLLISION_DAMPING;
        item2.vx = tempVx * BOX_COLLISION_DAMPING;
        item2.vy = tempVy * BOX_COLLISION_DAMPING;
        const impactForce = Math.sqrt(mtv.x * mtv.x + mtv.y * mtv.y);
        const torque1 = (mtv.y * impactForce - mtv.x * impactForce) * TORQUE_FACTOR * 0.1;
        const torque2 = -(mtv.y * impactForce - mtv.x * impactForce) * TORQUE_FACTOR * 0.1;
        item1.angularVelocity += torque1;
        item2.angularVelocity += torque2;
      }
    }
    item1.x += item1.vx;
    item1.y += item1.vy;
    item1.rotation += item1.angularVelocity;
    item1.vx *= BOX_FRICTION;
    item1.vy *= BOX_FRICTION;
    item1.angularVelocity *= ANGULAR_FRICTION;
    const obstacles = [...gameState.house.walls, ...gameState.garage.walls];
    if (!item1.ignoreWallCollision) {
      for (const obstacle of obstacles) {
        const mtv = checkCollisionSAT(item1, obstacle);
        if (mtv) {
          item1.x -= mtv.x;
          item1.y -= mtv.y;
          const dot = item1.vx * mtv.x + item1.vy * mtv.y;
          const lenSq = mtv.x * mtv.x + mtv.y * mtv.y;
          if (lenSq > 0) {
            const reflectionX = item1.vx - 2 * dot * mtv.x / lenSq;
            const reflectionY = item1.vy - 2 * dot * mtv.y / lenSq;
            item1.vx = reflectionX * BOX_COLLISION_DAMPING * 0.5;
            item1.vy = reflectionY * BOX_COLLISION_DAMPING * 0.5;
          }
          item1.angularVelocity *= -0.5;
        }
      }
    }
    item1.ignoreWallCollision = false;
    item1.x = Math.max(0, Math.min(item1.x, WORLD_WIDTH - item1.width));
    item1.y = Math.max(0, Math.min(item1.y, WORLD_HEIGHT - item1.height));
  }
  for (const id in gameState.players) {
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
      radius: player.width / 2,
    };
    player.infectionHitbox = {
      cx: player.x + player.width / 2,
      cy: player.y + player.height / 2,
      radius: player.width * 0.2,
    };
    player.physicalHitbox = {
      cx: player.x + player.width / 2,
      cy: player.y + player.height / 2,
      radius: player.width / 4,
    };
    if (player.inventory && player.inventory.id === 'skateboard') {
      if (player.activeAbility === 'chameleon' && player.isCamouflaged) {
        player.isCamouflaged = false;
      }
      const originalX = player.x;
      const originalY = player.y;
      const skateSpeed = SKATEBOARD_SPEED_BOOST;
      const angle = player.rotation;
      player.x += Math.cos(angle) * skateSpeed;
      player.physicalHitbox.cx = player.x + (player.width / 2);
      let collidedX = false;
      for (const wall of [...gameState.house.walls, ...gameState.garage.walls]) {
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
      for (const wall of [...gameState.house.walls, ...gameState.garage.walls]) {
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
      if (player.activeAbility === 'chameleon' && player.isCamouflaged && (player.input.movement.up || player.input.movement.down || player.input.movement.left || player.input.movement.right)) {
        player.isCamouflaged = false;
      }
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
      const maxSpeedSq = effectiveSpeed * effectiveSpeed;
      const currentSpeedSq = player.vx * player.vx + player.vy * player.vy;
      if (currentSpeedSq > maxSpeedSq) {
        const currentSpeed = Math.sqrt(currentSpeedSq);
        player.vx = (player.vx / currentSpeed) * effectiveSpeed;
        player.vy = (player.vy / currentSpeed) * effectiveSpeed;
      }
      const originalX = player.x;
      player.x += player.vx;
      player.physicalHitbox.cx = player.x + (player.width / 2);
      let collidedX = false;
      for (const wall of [...gameState.house.walls, ...gameState.garage.walls]) {
        if (isCollidingCircleRect(player.physicalHitbox, wall)) {
          collidedX = true;
        }
      }
      if (player.x < 0 || player.x + player.width > WORLD_WIDTH) {
        collidedX = true;
      }
      if (collidedX) {
        player.x = originalX;
        player.vx = 0;
      }
      const originalY = player.y;
      player.y += player.vy;
      player.physicalHitbox.cy = player.y + (player.height / 2);
      let collidedY = false;
      for (const wall of [...gameState.house.walls, ...gameState.garage.walls]) {
        if (isCollidingCircleRect(player.physicalHitbox, wall)) {
          collidedY = true;
        }
      }
      if (player.y < 0 || player.y + player.height > WORLD_HEIGHT) {
        collidedY = true;
      }
      if (collidedY) {
        player.y = originalY;
        player.vy = 0;
      }
    }
    player.isHidden = false;
    for (const sunshade of gameState.sunshades) {
      if (isCollidingCircleRect(player.hitbox, sunshade)) {
        player.isHidden = true;
        break;
      }
    }
    const playerCircle = player.physicalHitbox;
    const playerPoly = {
      x: playerCircle.cx - playerCircle.radius,
      y: playerCircle.cy - playerCircle.radius,
      width: playerCircle.radius * 2,
      height: playerCircle.radius * 2,
      rotation: 0
    };
    for (const item of allCollidables) {
      const mtv = checkCollisionSAT(playerPoly, item);
      if (mtv) {
        if (player.inventory && player.inventory.id === 'skateboard') {
          player.x -= mtv.x;
          player.y -= mtv.y;
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
          let pushMultiplier = (player.inventory && player.inventory.id === 'lightGloves') ? GLOVES_PUSH_MULTIPLIER : 1;
          if (player.inventory && player.inventory.id === 'heavyGloves' && item.id !== 'car') {
            const staticObstacles = [...gameState.house.walls, ...gameState.garage.walls];
            for (const obstacle of staticObstacles) {
              if (checkCollisionSAT(item, obstacle)) {
                item.ignoreWallCollision = true;
                break;
              }
            }
          }
          let wallMtv = null;
          const staticObstacles = [...gameState.house.walls, ...gameState.garage.walls];
          for (const obstacle of staticObstacles) {
            const collisionCheck = checkCollisionSAT(item, obstacle);
            if (collisionCheck) {
              wallMtv = collisionCheck;
              break;
            }
          }
          let mass = 1;
          if (item.id === 'car') {
            mass = 15;
          }
          let pushForceX = pushDirectionX * BOX_PUSH_FORCE * pushMultiplier / mass;
          let pushForceY = pushDirectionY * BOX_PUSH_FORCE * pushMultiplier / mass;
          if (wallMtv) {
            const pushVector = {
              x: pushForceX,
              y: pushForceY
            };
            const len = Math.sqrt(wallMtv.x * wallMtv.x + wallMtv.y * wallMtv.y);
            let normal = {
              x: wallMtv.x / len,
              y: wallMtv.y / len
            };
            const dot = pushVector.x * normal.x + pushVector.y * normal.y;
            const slideForce = {
              x: pushVector.x - dot * normal.x,
              y: pushVector.y - dot * normal.y
            };
            pushForceX = slideForce.x;
            pushForceY = slideForce.y;
          }
          item.vx += pushForceX;
          item.vy += pushForceY;
          const contactVectorX = (player.x + player.width / 2) - (item.x + item.width / 2);
          const contactVectorY = (player.y + player.height / 2) - (item.y + item.height / 2);
          const torque = (contactVectorX * pushForceY - contactVectorY * pushForceX) * TORQUE_FACTOR;
          item.angularVelocity += torque;
        }
        player.x -= mtv.x;
        player.y -= mtv.y;
      }
    }
  }
  const playerIds = Object.keys(gameState.players);
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
  for (const id of playerIds) {
    const player = gameState.players[id];
    const allWalls = [...gameState.house.walls, ...gameState.garage.walls];
    for (const wall of allWalls) {
      const finalPlayerPoly = {
        x: player.physicalHitbox.cx - player.physicalHitbox.radius,
        y: player.physicalHitbox.cy - player.physicalHitbox.radius,
        width: player.physicalHitbox.radius * 2,
        height: player.physicalHitbox.radius * 2,
        rotation: 0
      };
      const mtv = checkCollisionSAT(finalPlayerPoly, wall);
      if (mtv) {
        player.x -= mtv.x;
        player.y -= mtv.y;
      }
    }
    player.x = Math.max(0, Math.min(player.x, WORLD_WIDTH - player.width));
    player.y = Math.max(0, Math.min(player.y, WORLD_HEIGHT - player.height));
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
            if (player2.inventory && player2.inventory.id === 'antidote') {
              player2.inventory = null;
              const immunityProbability = 0.7 + Math.random() * 0.3;
              if (Math.random() < immunityProbability) {
                io.emit('newMessage', {
                  name: 'Server',
                  text: `${player2.name} resisted the infection with a pill!`
                });
                continue;
              } else {
                io.emit('newMessage', {
                  name: 'Server',
                  text: `${player2.name}'s pill failed to grant immunity!`
                });
              }
            }
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
            const coinReward = Math.floor(Math.random() * 31) + 20;
            player1.coins += coinReward;
            console.log(`${player2.name} has been infected!`);
            io.emit('newMessage', {
              name: 'Server',
              text: `${player2.name} has been infected!`
            });
          }
        }
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
        player.x += Math.cos(arrow.angle) * ARROW_KNOCKBACK;
        player.y += Math.sin(arrow.angle) * ARROW_KNOCKBACK;
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
        player.arrowAmmo = 100;
      }
      if (ability === 'chemist') {
        player.chemistBombs = 5;
      }
      if (ability === 'fighter') {
        player.inventory = {
          id: 'boxing_glove'
        };
      }
    }
  });

  socket.on('buyZombieAbility', (abilityId) => {
    const player = gameState.players[socket.id];
    const cost = ZOMBIE_ABILITY_COSTS[abilityId];
    if (player && player.role === 'zombie' && !player.zombieAbility && cost !== undefined && player.coins >= cost) {
      player.coins -= cost;
      player.zombieAbility = abilityId;
      if (abilityId === 'trapper') {
        player.trapsLeft = 1;
      }
    }
  });

  socket.on('buyItem', (itemId) => {
    const player = gameState.players[socket.id];
    if (!player || player.inventory) return;
    let cost;
    let itemData;
    if (itemId === 'human_trap') {
      cost = 100;
      itemData = {
        id: 'human_trap',
        quantity: HUMAN_TRAP_QUANTITY
      };
    } else if (itemId === 'lightGloves') {
      cost = 50;
      itemData = {
        id: 'lightGloves'
      };
    } else if (itemId === 'heavyGloves') {
      cost = 100;
      itemData = {
        id: 'heavyGloves'
      };
    } else if (itemId === 'antidote') {
      cost = 20;
      itemData = {
        id: 'antidote'
      };
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
    if (itemId === 'skateboard') {
      cost = 100;
      itemData = { ...gameState.skateboard,
        ownerId: player.id
      };
    } else if (itemId === 'drone') {
      cost = 200;
      itemData = {
        id: 'drone',
        ammo: DRONE_MAX_AMMO
      };
    } else if (itemId === 'invisibilityCloak') {
      cost = 200;
      itemData = {
        id: 'invisibilityCloak',
        active: false
      };
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

    if (actionData.type === 'zombie_teleport') {
      if (player.role === 'zombie' && Date.now() > (player.teleportCooldownUntil || 0)) {
        player.x = WORLD_WIDTH / 2 + 500;
        player.y = WORLD_HEIGHT / 2;
        player.teleportCooldownUntil = Date.now() + 60000;
      }
    }

    if (actionData.type === 'zombie_ability' && player.role === 'zombie') {
      if (player.zombieAbility === 'trapper' && player.trapsLeft > 0) {
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
    }

    if (actionData.type === 'drop_grenade') {
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
    }

    if (actionData.type === 'primary_action') {
      if (player.activeAbility === 'fighter' && Date.now() > player.lastPunchTime) {
        player.lastPunchTime = Date.now() + FIGHTER_PUNCH_COOLDOWN;
        player.isPunching = true;
        setTimeout(() => {
          if (gameState.players[socket.id]) {
            gameState.players[socket.id].isPunching = false;
          }
        }, 150);
        let closestZombie = null;
        let minDistance = FIGHTER_PUNCH_RANGE;
        for (const otherId in gameState.players) {
          const otherPlayer = gameState.players[otherId];
          if (otherPlayer.role !== 'zombie' || otherPlayer.id === player.id) continue;
          const dx = otherPlayer.x - player.x;
          const dy = otherPlayer.y - player.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < minDistance) {
            const angleToZombie = Math.atan2(dy, dx);
            let angleDifference = Math.abs(angleToZombie - player.rotation);
            if (angleDifference > Math.PI) {
              angleDifference = 2 * Math.PI - angleDifference;
            }
            if (angleDifference <= FIGHTER_PUNCH_ANGLE_TOLERANCE) {
              closestZombie = otherPlayer;
              minDistance = distance;
            }
          }
        }
        if (closestZombie) {
          const angle = player.rotation;
          const originalX = closestZombie.x;
          const originalY = closestZombie.y;
          let isAlreadyStuck = false;
          const obstacles = [...gameState.house.walls, ...gameState.garage.walls, ...gameState.box, ...gameState.furniture];
          const zombiePoly = {
            x: closestZombie.x,
            y: closestZombie.y,
            width: closestZombie.width,
            height: closestZombie.height,
            rotation: 0
          };
          for (const obstacle of obstacles) {
            if (checkCollisionSAT(zombiePoly, obstacle)) {
              isAlreadyStuck = true;
              break;
            }
          }
          closestZombie.x += Math.cos(angle) * FIGHTER_PUNCH_KNOCKBACK;
          closestZombie.y += Math.sin(angle) * FIGHTER_PUNCH_KNOCKBACK;
          if (!isAlreadyStuck) {
            const newZombiePoly = {
              x: closestZombie.x,
              y: closestZombie.y,
              width: closestZombie.width,
              height: closestZombie.height,
              rotation: 0
            };
            for (const obstacle of obstacles) {
              const mtv = checkCollisionSAT(newZombiePoly, obstacle);
              if (mtv) {
                closestZombie.x = originalX;
                closestZombie.y = originalY;
                break;
              }
            }
          }
        }
        return;
      }
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
    }
    if (actionData.type === 'ability') {
      if (player.inventory && player.inventory.id === 'human_trap' && player.inventory.quantity > 0) {
        player.inventory.quantity--;
        gameState.traps.push({
          id: nextTrapId++,
          x: player.x,
          y: player.y,
          width: TRAP_SIZE,
          height: TRAP_SIZE,
          target: 'zombie'
        });
        if (player.inventory.quantity <= 0) {
          player.inventory = null;
        }
        return;
      }
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
      if (player.activeAbility === 'chemist' && player.chemistBombs > 0) {
        player.chemistBombs--;
        gameState.smokeClouds.push({
          x: player.x + player.width / 2,
          y: player.y + player.height / 2,
          radius: SMOKE_BOMB_RADIUS,
          expirationTime: Date.now() + SMOKE_BOMB_DURATION
        });
      }
      if (player.activeAbility === 'chameleon' && player.camouflageAvailable) {
        player.isCamouflaged = true;
        player.camouflageAvailable = false;
        setTimeout(() => {
          if (gameState.players[socket.id]) player.camouflageAvailable = true;
        }, CAMOUFLAGE_COOLDOWN);
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
      if (player.activeAbility === 'ant' && player.antAvailable) {
        player.antAvailable = false;
        player.isAnt = true;
        const originalWidth = player.width,
          originalHeight = player.height,
          originalSpeed = player.speed;
        player.width *= ANT_SIZE_FACTOR;
        player.height *= ANT_SIZE_FACTOR;
        player.speed *= ANT_SPEED_FACTOR;
        setTimeout(() => {
          if (gameState.players[socket.id]) {
            player.isAnt = false;
            player.width = originalWidth;
            player.height = originalHeight;
            player.speed = originalSpeed;
          }
        }, ANT_TRANSFORMATION_DURATION);
        setTimeout(() => {
          if (gameState.players[socket.id]) player.antAvailable = true;
        }, ANT_COOLDOWN);
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
    }
    if (actionData.type === 'drop_item') {
      if (player.inventory && player.inventory.id === 'invisibilityCloak' && player.inventory.active) {
        return;
      }
      dropHeldItem(player);
    }
    if (actionData.type === 'interact') {
      if (player.role === 'zombie') {
        return;
      }
      if (player.inventory) return;
      if (gameState.skateboard && gameState.skateboard.spawned && !gameState.skateboard.ownerId) {
        const skate = gameState.skateboard;
        const dx = (player.x + player.width / 2) - (skate.x + skate.width / 2);
        const dy = (player.y + player.height / 2) - (skate.y + skate.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < PICKUP_DISTANCE) {
          player.inventory = { ...skate
          };
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
      if (player.activeAbility === 'engineer' && !player.engineerAbilityUsed && !player.isInDuct) {
        for (let i = 0; i < gameState.ducts.length; i++) {
          if (isCollidingCircleRect(player.hitbox, gameState.ducts[i])) {
            player.isInDuct = true;
            player.engineerAbilityUsed = true;
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
      dropHeldItem(player);
      if (player.activeAbility !== ' ') {
        gameState.takenAbilities = gameState.takenAbilities.filter(ability => ability !== player.activeAbility);
      }
    }
    delete gameState.players[socket.id];
  });
});

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
    x: 1000,
    y: 1000
  }, {
    x: 2500,
    y: 500
  }, {
    x: 3500,
    y: 1500
  }];
  for (let i = 0; i < 3; i++) {
    const spawnPoint = cardSpawnLocations[i];
    gameState.groundItems.push({
      id: 'card',
      x: spawnPoint.x,
      y: spawnPoint.y,
      width: DROPPED_ITEM_SIZE,
      height: DROPPED_ITEM_SIZE,
    });
  }

  gameState.players = currentPlayers;
  for (const id in gameState.players) {
    const player = gameState.players[id];
    const savedData = persistentData[id];
    if (savedData) {
      player.inventory = savedData.inventory;
      if (player.inventory && (player.inventory.id === 'boxing_glove' || player.inventory.id === 'human_trap')) {
        player.inventory = null;
      }
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
    player.isCamouflaged = false;
    player.camouflageAvailable = true;
    player.isSprinting = false;
    player.sprintAvailable = true;
    player.isAnt = false;
    player.antAvailable = true;
    player.isSpying = false;
    player.spyUsesLeft = 2;
    player.spyCooldown = false;
    isHidden: false;
    arrowAmmo: 0;
    engineerAbilityUsed: false;
    isInDuct: false;
    illusionistPassiveAvailable: true;
    zombieAbility: null;
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
        if (!player.isAnt) {
          player.width += GROWTH_AMOUNT;
          player.height = player.width * 1.5;
        }
      }
      if (!player.isSprinting && !player.isAnt) {
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