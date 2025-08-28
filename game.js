const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
// const socket = io(); // Assuming socket is initialized in HTML

(function setup() {
    const chatInput = document.getElementById('chatInput');
    const body = document.body;
    Object.assign(body.style, {
        backgroundColor: '#000000',
        margin: '0',
        overflow: 'hidden'
    });
    // Estilos do chatInput foram movidos para o style.css para melhor organização
    chatInput.maxLength = 57;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
})();

function loadImage(src) {
    const img = new Image();
    img.src = src;
    return img;
}

const human = loadImage('Sprites/Human.png');
const zombie = loadImage('Sprites/Zombie.png');
const box = loadImage('Sprites/Box.png');
const grass = loadImage('Sprites/Grass.png');
const grass2 = loadImage('Sprites/Grass2.png'); // NOVO: Carrega a imagem da Grass2
const street = loadImage('Sprites/Street.png');
const sand = loadImage('Sprites/Sand.png');
const sea = loadImage('Sprites/Sea.png');
const sunshade = loadImage('Sprites/Sunshade.png');
const sunshadeII = loadImage('Sprites/SunshadeII.png');
const ductSprite = loadImage('Sprites/Duct.png');
const atmSprite = loadImage('Sprites/ATM.png');
const cardSprite = loadImage('Sprites/Card.png');
const floors = loadImage('Sprites/Floor.png');
const floor2 = loadImage('Sprites/Floor2.png'); // NOVO: Carrega a imagem do novo chão
const garageFloor = loadImage('Sprites/garageFloor.png');
const smallBed = loadImage('Sprites/smallBed.png');
const bigTable = loadImage('Sprites/bigTable.png');
const car = loadImage('Sprites/Car.png');
const skateboardSprite = loadImage('Sprites/Skateboard.png');
const droneSprite = loadImage('Sprites/Drone.png');
const grenadeSprite = loadImage('Sprites/Grenade.png');
const invisibilityCloakSprite = loadImage('Sprites/InvisibilityCloak.png');
const antidoteSprite = loadImage('Sprites/Antidote.png');
const magicAntidoteSprite = loadImage('Sprites/MagicAntidote.png');
const magicEggSprite = loadImage('Sprites/MagicEgg.png'); // NOVO: Carrega a imagem do Magic Egg
const trapSprite = loadImage('Sprites/Trap.png');
const mineSprite = loadImage('Sprites/Mine.png');
const gravityGloveSprite = loadImage('Sprites/GravityGlove.png');
const GloveSprite = loadImage('Sprites/Glove.png');
const cannonSprite = loadImage('Sprites/Cannon.png');
const largeBallSprite = loadImage('Sprites/LargeBall.png');
const portalsSprite = loadImage('Sprites/Portals.png');
const inventoryUpgradeSprite = loadImage('Sprites/Slot.png');
const runningTennisSprite = loadImage('Sprites/runningTennis.png');
const bowSprite = loadImage('Sprites/Bow.png');
const arrowSprite = loadImage('Sprites/Arrow.png');
const blowdartSprite = loadImage('Sprites/Blowdart.png'); // NOVO: Sprite do Blowdart
const blowdartArrowSprite = loadImage('Sprites/BlowdartArrow.png'); // NOVO: Sprite da flecha do Blowdart
const sharkSprite = loadImage('Sprites/Shark.png');
const gemSprite = loadImage('Sprites/Gem.png');
const angelWingsSprite = loadImage('Sprites/AngelWings.png');
const wallSprite = loadImage('Sprites/BrickWall.png');
const wallSprite2 = loadImage('Sprites/BrickWall2.png');
const fishingRodSprite = loadImage('Sprites/FishingRod.png');
const bigBed = loadImage('Sprites/BigBed.png');
const bigBed2 = loadImage('Sprites/BigBed2.png');
const miniSofa = loadImage('Sprites/MiniSofa.png');
const miniSofa2 = loadImage('Sprites/MiniSofa2.png');
const sofa = loadImage('Sprites/Sofa.png');
const squareTable = loadImage('Sprites/SquareTable.png');
const parkBenchSprite = loadImage('Sprites/ParkBench.png');
const poolTableSprite = loadImage('Sprites/PoolTable.png');
const hidingSpotSprite = loadImage('Sprites/HidingSpot.png');

const itemSprites = {
    skateboard: skateboardSprite,
    drone: droneSprite,
    invisibilityCloak: invisibilityCloakSprite,
    card: cardSprite,
    antidote: antidoteSprite,
    magicAntidote: magicAntidoteSprite,
    magicEgg: magicEggSprite, // NOVO: Adiciona o sprite do Magic Egg
    normalGlove: GloveSprite,
    gravityGlove: gravityGloveSprite,
    grenade: grenadeSprite,
    cannon: cannonSprite,
    portals: portalsSprite,
    inventoryUpgrade: inventoryUpgradeSprite,
    runningTennis: runningTennisSprite,
    bow: bowSprite,
    blowdart: blowdartSprite, // NOVO: Adiciona o sprite do Blowdart
    angelWings: angelWingsSprite,
    fishingRod: fishingRodSprite
};

const objectSprites = {
    small_bed: smallBed,
    big_table: bigTable,
    car: car,
    atm: atmSprite,
    box: box,
    big_bed: bigBed,
    big_bed2: bigBed2,
    mini_sofa: miniSofa,
    mini_sofa2: miniSofa2,
    sofa: sofa,
    square_table: squareTable,
    park_bench: parkBenchSprite,
    pool_table: poolTableSprite
};

let myId = null;
let gameState = {
    players: {},
    arrows: [],
    blowdartArrows: [], // NOVO: Array para flechas do Blowdart
    sharks: [],
    timeLeft: 120,
    startTime: 60,
    postRoundTimeLeft: 10,
    gamePhase: 'waiting',
    functionCosts: {},
    drones: {},
    grenades: [],
    groundItems: [],
    traps: [],
    mines: [],
    largeBalls: [],
    portals: [],
    floatingTexts: [],
    hidingSpots: []
};
const movement = {
    up: false,
    down: false,
    left: false,
    right: false
};
let mouse = {
    x: 0,
    y: 0
};
let isMenuOpen = false;
let isProfileOpen = false;
let isInstructionsOpen = true;
let activeMenuTab = 'functions';
const chatInput = document.getElementById('chatInput');
let isChatting = false;
let chatMessages = [];
const MAX_MESSAGES = 10;

socket.on('connect', () => {
    myId = socket.id;
    // The login screen from your HTML should handle user identification now.
});

socket.on('gameStateUpdate', (serverState) => {
    if (myId && gameState.players[myId] && serverState.players[myId]) {
        const meBefore = gameState.players[myId];
        const meNow = serverState.players[myId];
        if (meBefore.role !== 'zombie' && meNow.role === 'zombie' && !meNow.butterflyUsed) {
            isMenuOpen = false;
        }
    }
    gameState = serverState;
});

socket.on('newMessage', (message) => {
    chatMessages.push(message);
    if (chatMessages.length > MAX_MESSAGES) {
        chatMessages.shift();
    }
});

window.addEventListener('keydown', function(event) {
    const key = event.key.toLowerCase();
    const me = gameState.players[myId];

    if (key === 'enter') {
        event.preventDefault();
        if (isChatting) {
            const messageText = chatInput.value.trim();
            if (messageText) {
                socket.emit('sendMessage', messageText);
            }
            chatInput.value = '';
            chatInput.blur();
        } else {
            chatInput.style.display = 'block';
            chatInput.focus();
        }
    }

    if (key === 'escape') {
        if (isChatting) {
            chatInput.value = '';
            chatInput.blur();
        }
    }

    if (isChatting) {
        return;
    }

    if (key === 'b') {
        if (me) { // 'me' é a variável do seu jogador
            isMenuOpen = !isMenuOpen;
            if (isMenuOpen) {
                if (me.role === 'zombie') {
                    activeMenuTab = 'zombie_items';
                } else if (me.role === 'human') {
                    const atmObject = gameState.objects.find(item => item.id === 'atm');
                    let isNearATM = false;
                    if (atmObject) {
                        const dx = (me.x + me.width / 2) - (atmObject.x + atmObject.width / 2);
                        const dy = (me.y + me.height / 2) - (atmObject.y + atmObject.height / 2);
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        isNearATM = distance < 250;
                    }

                    if (isNearATM) {
                        activeMenuTab = 'exclusive_items';
                    } else {
                        activeMenuTab = 'functions';
                    }
                }
            }
        }
    }

    if (key === 'x') {
        isInstructionsOpen = !isInstructionsOpen;
    }


    if (me && me.carryingObject && me.inventory.some(i => i?.id === 'gravityGlove')) {
        if (key === 'q') {
            socket.emit('rotateCarriedObject', 'left');
        } else if (key === 'e') {
            // Ação de rotação para 'E' é tratada aqui especificamente para a luva
        }
    }

    if (isMenuOpen || isInstructionsOpen) {
        return;
    }

    switch (key) {
        case '1':
            if (me && (me.role === 'human' && me.inventorySlots > 1)) {
                socket.emit('playerAction', {
                    type: 'select_slot',
                    slot: 0
                });
            }
            break;
        case '2':
            if (me && me.role === 'human' && me.inventorySlots > 1) {
                socket.emit('playerAction', {
                    type: 'select_slot',
                    slot: 1
                });
            }
            break;
        case 'w':
        case 'arrowup':
            movement.up = true;
            break;
        case 's':
        case 'arrowdown':
            movement.down = true;
            break;
        case 'a':
        case 'arrowleft':
            movement.left = true;
            break;
        case 'd':
        case 'arrowright':
            movement.right = true;
            break;
        case 'e':
            const selectedItem = me && me.inventory && me.inventory[me.selectedSlot];
            const hasWings = me && me.inventory.some(i => i?.id === 'angelWings');

            if (hasWings) {
                socket.emit('playerAction', {
                    type: 'toggle_angel_wings_flight'
                });
            } else if (me && me.role === 'zombie') {
                // A ação de se esconder é tratada no 'interact' no servidor,
                // mas a de usar item especial continua aqui.
                if (me.zombieAbility) {
                    socket.emit('playerAction', {
                        type: 'zombie_item'
                    });
                } else {
                    // Se não tiver habilidade, a tecla E interage (esconderijo)
                    socket.emit('playerAction', {
                        type: 'interact'
                    });
                }
            } else if (selectedItem && selectedItem.id === 'portals') {
                socket.emit('playerAction', {
                    type: 'place_portal'
                });
            } else if (selectedItem && selectedItem.id === 'antidote') {
                socket.emit('playerAction', {
                    type: 'use_antidote'
                });
            } else if (selectedItem && selectedItem.id === 'magicAntidote') {
                socket.emit('playerAction', {
                    type: 'use_magic_antidote'
                });
            } else {
                const hasGravityGlove = me && me.inventory.some(i => i?.id === 'gravityGlove');
                if (hasGravityGlove && me.carryingObject) {
                    socket.emit('rotateCarriedObject', 'right');
                } else {
                    socket.emit('playerAction', {
                        type: 'interact'
                    });
                }
            }
            break;
        case 'c':
            if (me) {
                if (me.role === 'human') {
                    socket.emit('playerAction', {
                        type: 'function'
                    });
                }
            }
            break;
        case 'g':
            socket.emit('playerAction', {
                type: 'drop_item'
            });
            break;
        case 'z':
            if (me && me.role === 'zombie') {
                socket.emit('playerAction', {
                    type: 'zombie_teleport'
                });
            }
            break;
    }
});

window.addEventListener('keyup', function(event) {
    const key = event.key.toLowerCase();
    switch (key) {
        case 'w':
        case 'arrowup':
            movement.up = false;
            break;
        case 's':
        case 'arrowdown':
            movement.down = false;
            break;
        case 'a':
        case 'arrowleft':
            movement.left = false;
            break;
        case 'd':
        case 'arrowright':
            movement.right = false;
            break;
    }
});

chatInput.onfocus = () => {
    isChatting = true;
};
chatInput.onblur = () => {
    isChatting = false;
    chatInput.style.display = 'none';
};

canvas.addEventListener('mousemove', function(event) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
});

canvas.addEventListener('mousedown', function(event) {
    const profileIconRadius = 25;
    const coinHudWidth = 180;
    const profileIconX = canvas.width - coinHudWidth - 15 - profileIconRadius - 10;
    const profileIconY = 15 + 50 / 2;
    const dist = Math.hypot(mouse.x - profileIconX, mouse.y - profileIconY);

    if (dist < profileIconRadius) {
        isProfileOpen = !isProfileOpen;
        isMenuOpen = false;
        return;
    }

    if (isInstructionsOpen) {
        const menuWidth = 1500;
        const menuHeight = 900;
        const menuX = (canvas.width - menuWidth) / 2;
        const menuY = (canvas.height - menuHeight) / 2;
        const closeButtonSize = 40;
        const closeButtonPadding = 20;

        const closeButtonRect = {
            x: menuX + menuWidth - closeButtonSize - closeButtonPadding,
            y: menuY + closeButtonPadding,
            width: closeButtonSize,
            height: closeButtonSize
        };

        if (isClickInside(mouse, closeButtonRect)) {
            isInstructionsOpen = false;
        }
        return;
    }

    if (isMenuOpen) {
        const me = gameState.players[myId];
        if (!me) return;

        // NOVO: Lógica para fechar a loja no 'X'
        const menuWidth = 1500,
            menuHeight = 900;
        const menuX = (canvas.width - menuWidth) / 2,
            menuY = (canvas.height - menuHeight) / 2;
        const closeButtonSize = 40;
        const closeButtonPadding = 20;
        const closeButtonRect = {
            x: menuX + menuWidth - closeButtonSize - closeButtonPadding,
            y: menuY + closeButtonPadding,
            width: closeButtonSize,
            height: closeButtonSize
        };
        if (isClickInside(mouse, closeButtonRect)) {
            isMenuOpen = false;
            return;
        }

        if (me.role === 'zombie') {
            const abilitiesTabBtn = getZombieAbilitiesTabRect();
            if (isClickInside(mouse, abilitiesTabBtn)) {
                activeMenuTab = 'zombie_items';
                return;
            }
            if (activeMenuTab === 'zombie_items' && !me.zombieAbility) {
                const {
                    buttons
                } = getZombieItemsLayout();
                for (const btn of buttons) {
                    const canAfford = me.gems >= btn.price;
                    if (isClickInside(mouse, btn.rect) && canAfford) {
                        socket.emit('buyZombieAbility', btn.id);
                        isMenuOpen = false;
                        return;
                    }
                }
            }
        } else if (me.role === 'human') {
            const atmObject = gameState.objects.find(item => item.id === 'atm');
            let isNearATM = false;
            if (atmObject) {
                const dx = (me.x + me.width / 2) - (atmObject.x + atmObject.width / 2);
                const dy = (me.y + me.height / 2) - (atmObject.y + atmObject.height / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                isNearATM = distance < 250;
            }

            if (!isNearATM) { // Só permite clicar nas abas normais se estiver longe
                const functionsTabBtn = getFunctionsTabRect();
                const itemsTabBtn = getItemsTabRect();

                if (isClickInside(mouse, functionsTabBtn)) {
                    activeMenuTab = 'functions';
                    return;
                }
                if (isClickInside(mouse, itemsTabBtn)) {
                    activeMenuTab = 'items';
                    return;
                }
            } else { // Permite clicar na aba exclusiva se estiver perto
                const rareItemsTabBtn = getRareItemsTabRect(true);
                if (isClickInside(mouse, rareItemsTabBtn)) {
                    activeMenuTab = 'exclusive_items';
                    return;
                }
            }


            if (activeMenuTab === 'functions' && me.activeFunction === ' ') {
                if (gameState.gamePhase !== 'running') return;
                const functions = getFunctionsLayout().buttons;
                for (const btn of functions) {
                    const cost = gameState.functionCosts[btn.func] || 0;
                    const canAfford = me.gems >= cost;
                    const isTaken = gameState.takenFunctions.includes(btn.func);
                    if (isClickInside(mouse, btn.rect) && !isTaken && canAfford) {
                        socket.emit('chooseFunction', btn.func);
                        isMenuOpen = false;
                        return;
                    }
                }
            }
            if (activeMenuTab === 'items') {
                const {
                    buttons
                } = getItemsLayout();
                for (const btn of buttons) {
                    const canAfford = me.gems >= btn.price;
                    const alreadyOwned = me.inventory && me.inventory.some(i => i && i.id === btn.id);
                    const inventoryWithoutCard = me.inventory.filter(i => i && i.id !== 'card');
                    const inventoryFull = inventoryWithoutCard.length >= me.inventorySlots;

                    if (isClickInside(mouse, btn.rect) && canAfford && !alreadyOwned && !inventoryFull) {
                        socket.emit('buyItem', btn.id);
                        isMenuOpen = false;
                        return;
                    }
                }
            }
            if (activeMenuTab === 'exclusive_items') {
                const {
                    buttons
                } = getRareItemsLayout();
                for (const btn of buttons) {
                    const hasCard = me.inventory && me.inventory.some(i => i && i.id === 'card');
                    const canAfford = me.gems >= btn.price;
                    const alreadyOwned = me.inventory && me.inventory.some(i => i && i.id === btn.id);
                    const alreadyUpgraded = me.inventorySlots > 1;

                    if (btn.id === 'inventoryUpgrade') {
                        if (isClickInside(mouse, btn.rect) && canAfford && hasCard && !alreadyUpgraded) {
                            socket.emit('buyRareItem', btn.id);
                            isMenuOpen = false;
                            return;
                        }
                    } else {
                        const inventoryWithoutCard = me.inventory.filter(i => i && i.id !== 'card');
                        const inventoryFull = inventoryWithoutCard.length >= me.inventorySlots;
                        if (isClickInside(mouse, btn.rect) && canAfford && hasCard && !inventoryFull && !alreadyOwned) {
                            socket.emit('buyRareItem', btn.id);
                            isMenuOpen = false;
                            return;
                        }
                    }
                }
            }
        }
    } else {
        const me = gameState.players[myId];
        const selectedItem = me && me.inventory && me.inventory[me.selectedSlot];
        if (selectedItem && selectedItem.id === 'drone') {
            socket.emit('playerAction', {
                type: 'drop_grenade'
            });
        } else {
            socket.emit('playerAction', {
                type: 'primary_action'
            });
        }
    }
});

canvas.addEventListener('wheel', function(event) {
    const me = gameState.players[myId];
    if (me && me.inventory.some(i => i && i.id === 'gravityGlove') && me.carryingObject) {
        event.preventDefault();
        const direction = event.deltaY > 0 ? 'right' : 'left';
        socket.emit('rotateCarriedObject', direction);
    }
}, {
    passive: false
});

function draw() {
    if (!myId || !gameState.players || !gameState.players[myId]) {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.font = '30px Arial';
        ctx.fillText('Waiting for game state...', canvas.width / 2, canvas.height / 2);
        return;
    }

    const me = gameState.players[myId];
    const hasGravityGloves = me && me.inventory && me.inventory.find(i => i && i.id === 'gravityGlove');
    const unmovableObjectIds = ['atm'];

    const zoomLevel = 0.67;

    const cameraX = (me.x + me.width / 2) - canvas.width / (2 * zoomLevel);
    const cameraY = (me.y + me.height / 2) - canvas.height / (2 * zoomLevel);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(zoomLevel, zoomLevel);
    ctx.translate(-cameraX, -cameraY);

    // ALTERADO: Lógica para desenhar o mapa e sua versão espelhada com o novo chão
    const drawMapBackground = (floorImg, grassImg) => {
        ctx.drawImage(grassImg, 0, 0, 3100, 2000);
        ctx.drawImage(floorImg, 200, 200, 2697, 1670);
        ctx.drawImage(sea, 4965, 0, 2600, 2000);
    };

    // Desenha o mapa original
    drawMapBackground(floors, grass);

    ctx.drawImage(garageFloor, 2000, 1400, 700, 600);

    // Desenha o mapa espelhado (agora sem o chão da garagem e com o chão 2)
    ctx.save();
    ctx.translate(0, 4000);
    ctx.scale(1, -1);
    drawMapBackground(floor2, grass2);
    ctx.restore();

    if (gameState.sharks) {
        for (const shark of gameState.sharks) {
            if (sharkSprite.complete) {
                ctx.save();
                ctx.translate(shark.x + shark.width / 2, shark.y + shark.height / 2);
                ctx.rotate(shark.rotation);
                ctx.drawImage(sharkSprite, -shark.width / 2, -shark.height / 2, shark.width, shark.height);
                ctx.restore();
            }
        }
    }

    // ALTERADO: Lógica para desenhar a areia/rua e sua versão espelhada
    const drawTopLayers = () => {
        ctx.drawImage(sand, 4080, 0, 1850, 2000);
        ctx.drawImage(street, 3090, 0, 1000, 2000);
    };
    drawTopLayers();
    ctx.save();
    ctx.translate(0, 4000);
    ctx.scale(1, -1);
    drawTopLayers();
    ctx.restore();

    // ALTERADO: Desenha os esconderijos DEPOIS da rua para ficarem por cima
    if (gameState.hidingSpots) {
        for (const spot of gameState.hidingSpots) {
            if (hidingSpotSprite.complete) {
                ctx.drawImage(hidingSpotSprite, spot.x, spot.y, spot.width, spot.height);
            }
        }
    }

    if (gameState.skateboard && gameState.skateboard.spawned) {
        const skate = gameState.skateboard;
        ctx.drawImage(skateboardSprite, skate.x, skate.y, skate.width, skate.height);
    }

    if (gameState.runningTennis && gameState.runningTennis.spawned) {
        const tennis = gameState.runningTennis;
        ctx.drawImage(runningTennisSprite, tennis.x, tennis.y, tennis.width, tennis.height);
    }

    if (gameState.groundItems) {
        for (const item of gameState.groundItems) {
            const sprite = itemSprites[item.id];
            if (sprite) {

                if (item.isSinking) {
                    // Item está afundando
                    ctx.save();

                    const progress = item.sinkingProgress || 0;
                    const scale = 1 - progress; // Escala diminui de 1 para 0

                    // 1. Efeito de escurecer e desaparecer
                    ctx.globalAlpha = 1 - progress; // Opacidade diminui de 1 para 0
                    ctx.filter = `brightness(${100 * (1 - progress)}%)`; // Brilho diminui de 100% para 0%

                    // 2. Efeito de encolher (mantendo o centro)
                    const drawWidth = item.width * scale;
                    const drawHeight = item.height * scale;
                    const drawX = item.x + (item.width - drawWidth) / 2;
                    const drawY = item.y + (item.height - drawHeight) / 2;

                    ctx.drawImage(sprite, drawX, drawY, drawWidth, drawHeight);

                    ctx.restore();
                } else {
                    // Item normal, fora da água
                    ctx.drawImage(sprite, item.x, item.y, item.width, item.height);
                }
            }
        }
    }

    if (gameState.traps) {
        for (const trap of gameState.traps) {
            if (trapSprite.complete) ctx.drawImage(trapSprite, trap.x, trap.y, trap.width, trap.height);
        }
    }

    if (gameState.mines) {
        for (const mine of gameState.mines) {
            if (mineSprite.complete) {
                ctx.drawImage(mineSprite, mine.x, mine.y, mine.width, mine.height);
            }
        }
    }

    if (gameState.portals) {
        for (const portal of gameState.portals) {
            if (portalsSprite.complete) {
                ctx.save();
                ctx.translate(portal.x + portal.width / 2, portal.y + portal.height / 2);
                ctx.globalAlpha = 0.8 + Math.sin(Date.now() / 300) * 0.2;
                ctx.drawImage(portalsSprite, -portal.width / 2, -portal.height / 2, portal.width, portal.height);
                ctx.restore();
            }
        }
    }

    for (const duct of gameState.ducts) {
        ctx.drawImage(ductSprite, duct.x, duct.y, duct.width, duct.height);
    }

    if (gameState.largeBalls) {
        for (const ball of gameState.largeBalls) {
            if (largeBallSprite.complete) {
                ctx.save();
                ctx.translate(ball.x + ball.radius, ball.y + ball.radius);
                ctx.rotate(ball.rotation);
                ctx.drawImage(largeBallSprite, -ball.radius, -ball.radius, ball.radius * 2, ball.radius * 2);
                ctx.restore();
            }
        }
    }

    const carriedObjectIds = Object.values(gameState.players).filter(p => p.carryingObject).map(p => p.carryingObject.uniqueId);

    if (gameState.objects) {
        for (const item of gameState.objects) {
            if (carriedObjectIds.includes(item.uniqueId)) continue;
            const sprite = objectSprites[item.id];
            if (sprite) {

                if (item.isSinking) {
                    // Objeto está afundando
                    ctx.save();

                    const progress = item.sinkingProgress || 0;
                    const scale = 1 - progress;

                    ctx.globalAlpha = 1 - progress;
                    ctx.filter = `brightness(${100 * (1 - progress)}%)`;

                    const drawWidth = item.width * scale;
                    const drawHeight = item.height * scale;
                    const drawX = item.x + (item.width - drawWidth) / 2;
                    const drawY = item.y + (item.height - drawHeight) / 2;

                    // A rotação também deve ser aplicada
                    ctx.translate(drawX + drawWidth / 2, drawY + drawHeight / 2);
                    ctx.rotate(item.rotation);
                    ctx.drawImage(sprite, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

                    ctx.restore();
                } else {
                    // Objeto normal, fora da água
                    ctx.save();
                    if (item.id === 'atm') {
                        ctx.shadowColor = 'rgba(255, 255, 255, 1)';
                        ctx.shadowBlur = 10;
                    }
                    ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
                    ctx.rotate(item.rotation);
                    ctx.drawImage(sprite, -item.width / 2, -item.height / 2, item.width, item.height);
                    if (hasGravityGloves && !unmovableObjectIds.includes(item.id)) {
                        ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
                        ctx.fillRect(-item.width / 2, -item.height / 2, item.width, item.height);
                    }
                    ctx.restore();
                }
            }
        }
    }

    const atmObject = gameState.objects.find(obj => obj.id === 'atm');
    if (me && me.role === 'human' && atmObject) {
        const playerCenterX = me.x + me.width / 2;
        const playerCenterY = me.y + me.height / 2;
        const atmCenterX = atmObject.x + atmObject.width / 2;
        const atmCenterY = atmObject.y + atmObject.height / 2;
        const distance = Math.hypot(playerCenterX - atmCenterX, playerCenterY - atmCenterY);

        if (distance < 150) {
            const text = "Press B (Exclusive Items)";
            const textX = atmCenterX;
            const textY = atmObject.y - 30;
            const padding = 10;

            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            const textMetrics = ctx.measureText(text);
            const textWidth = textMetrics.width;
            const bubbleWidth = textWidth + padding * 2;
            const bubbleHeight = 30;
            const bubbleX = textX - bubbleWidth / 2;
            const bubbleY = textY - bubbleHeight;

            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, [8]);
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(textX - 8, bubbleY + bubbleHeight);
            ctx.lineTo(textX + 8, bubbleY + bubbleHeight);
            ctx.lineTo(textX, bubbleY + bubbleHeight + 8);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = 'white';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, textX, bubbleY + bubbleHeight / 2);
            ctx.restore();
        }
    }

    ctx.fillStyle = '#000000ff';
    ctx.strokeStyle = '#23454fff';
    ctx.lineWidth = 25;
    for (const wall of gameState.house.walls) {
        ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
    }

    if (wallSprite.complete && wallSprite.naturalWidth > 0) {
        const spriteSize = 74;
        for (const wall of gameState.house.walls) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(wall.x, wall.y, wall.width, wall.height);
            ctx.clip();

            const startX = wall.x - (wall.x % spriteSize);
            const startY = wall.y - (wall.y % spriteSize);

            for (let y = startY; y < wall.y + wall.height; y += spriteSize) {
                for (let x = startX; x < wall.x + wall.width; x += spriteSize) {
                    ctx.drawImage(wallSprite, x, y, spriteSize, spriteSize);
                }
            }
            ctx.restore();
        }
    }

    ctx.fillStyle = '#000000ff';
    ctx.strokeStyle = '#222222ff';
    ctx.lineWidth = 25;
    for (const wall of gameState.garage.walls) {
        ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
    }

    if (wallSprite2.complete && wallSprite2.naturalWidth > 0) {
        const spriteSize = 74;
        for (const wall of gameState.garage.walls) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(wall.x, wall.y, wall.width, wall.height);
            ctx.clip();

            const startX = wall.x - (wall.x % spriteSize);
            const startY = wall.y - (wall.y % spriteSize);

            for (let y = startY; y < wall.y + wall.height; y += spriteSize) {
                for (let x = startX; x < wall.x + wall.width; x += spriteSize) {
                    ctx.drawImage(wallSprite2, x, y, spriteSize, spriteSize);
                }
            }
            ctx.restore();
        }
    }

    if (gameState.obstacles) {
        ctx.fillStyle = '#404040';
        ctx.strokeStyle = '#404040';
        ctx.lineWidth = 30;
        for (const wall of gameState.obstacles) {
            ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
            ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
        }
    }

    if (gameState.obstacles) {
        ctx.strokeStyle = '#c38a51ff';
        ctx.lineWidth = 3;
        for (const wall of gameState.obstacles) {
            ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
        }
    }

    for (const playerId in gameState.players) {
        const player = gameState.players[playerId];
        if (player.isInDuct || player.isBeingEaten) continue;
        if (player.isHidden || (player.isInvisible && me.role === 'zombie' && playerId !== myId)) {
            continue;
        }

        const hasAngelWings = player.inventory && player.inventory.some(i => i && i.id === 'angelWings');

        ctx.save();
        if (player.isFlyingWithWings) {
            ctx.shadowColor = 'rgba(255, 255, 200, 0.9)';
            ctx.shadowBlur = 50;
        } else if (player.isFlying) {
            ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
            ctx.shadowBlur = 30;
        }

        if (player.isTrapped) {
            ctx.fillStyle = 'red';
            ctx.font = 'bold 30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('TRAPPED!', player.x + player.width / 2, player.y - 50);
        }
        ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
        if (playerId === myId) {
            ctx.rotate(getPlayerAngle(player));
        } else {
            ctx.rotate(player.rotation);
        }

        if (player.inventory && player.inventory.some(i => i && i.id === 'skateboard')) {
            const skate = gameState.skateboard;
            ctx.drawImage(skateboardSprite, -skate.width / 2, -skate.height / 2, skate.width, skate.height);
        }

        if (player.role === 'zombie' || player.isSpying) {
            ctx.drawImage(zombie, -player.width / 2, -player.height / 2, player.width, player.height);
        } else {
            ctx.drawImage(human, -player.width / 2, -player.height / 2, player.width, player.height);
        }

        if (hasAngelWings && angelWingsSprite.complete) {
            const wingWidth = player.width * 0.7;
            const wingHeight = player.height * 0.7;
            ctx.drawImage(angelWingsSprite, -wingWidth * 0.8, -wingHeight / 2, wingWidth, wingHeight);
        }

        const selectedItem = player.inventory[player.selectedSlot];
        if (player.role === 'human' && selectedItem?.id === 'cannon') {
            if (cannonSprite.complete) {
                const itemWidth = 150;
                const itemHeight = 25;
                const itemDistance = player.width / 2;
                ctx.drawImage(cannonSprite, itemDistance, -itemHeight / 2, itemWidth, itemHeight);
            }
        }

        if (player.carryingObject) {
            const carried = player.carryingObject;
            const sprite = objectSprites[carried.id];
            if (sprite) {
                const distance = player.width / 2 + carried.width / 2;
                ctx.save();
                ctx.translate(distance, 0);
                ctx.rotate(carried.rotation - player.rotation);
                ctx.drawImage(sprite, -carried.width / 2, -carried.height / 2, carried.width, carried.height);
                ctx.restore();
            }
        }

        ctx.restore();

        if (!player.isHidden && !player.isInvisible) {
            const isDev = player.name === 'Eddie' || player.name === 'Mingau';
            const nameX = player.x + player.width / 2;
            const nameY = player.y - 20;

            if (isDev) {
                ctx.font = 'bold 20px College';
                const devTag = '';
                const playerName = player.name;
                const devTagWidth = ctx.measureText(devTag).width;
                const nameWidth = ctx.measureText(playerName).width;
                const totalWidth = devTagWidth + nameWidth;
                const devTagX = nameX - totalWidth / 2;
                const playerNameX = devTagX + devTagWidth;

                ctx.textAlign = 'left';

                ctx.strokeStyle = 'black';
                ctx.lineWidth = 5;

                // Draw DEV tag in red
                ctx.fillStyle = 'red';
                ctx.strokeText(devTag, devTagX, nameY);
                ctx.fillText(devTag, devTagX, nameY);

                // Draw player name
                ctx.fillStyle = (player.role === 'zombie' || player.isSpying) ? '#2ecc71' : 'white';
                ctx.strokeText(playerName, playerNameX, nameY);
                ctx.fillText(playerName, playerNameX, nameY);
                ctx.fillText(playerName, playerNameX, nameY);

            } else {
                ctx.textAlign = 'center';
                ctx.font = '18px Arial';
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 5;
                ctx.strokeText(player.name, nameX, nameY);
                ctx.fillStyle = (player.role === 'zombie' || player.isSpying) ? '#2ecc71' : 'white';
                ctx.fillText(player.name, nameX, nameY);
            }
        }
    }

    if (gameState.floatingTexts) {
        for (const textInfo of gameState.floatingTexts) {
            const life = (Date.now() - textInfo.createdAt) / 2000; // 0 a 1 em 2 segundos
            if (life > 1) continue;
            const alpha = 1 - life;
            const yOffset = -life * 50; // O texto sobe
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = 'gold';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 4;
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.strokeText(textInfo.text, textInfo.x, textInfo.y + yOffset);
            ctx.fillText(textInfo.text, textInfo.x, textInfo.y + yOffset);
            ctx.restore();
        }
    }

    // ALTERADO: Lógica para desenhar os guarda-sóis e suas versões espelhadas
    const sunshadeRect1 = {
        x: 4350,
        y: 600,
        width: 320,
        height: 340
    };
    const sunshadeRect2 = {
        x: 4440,
        y: 1400,
        width: 320,
        height: 340
    };
    const meRect = {
        x: me.x,
        y: me.y,
        width: me.width,
        height: me.height
    };

    ctx.save();
    const isUnderSunshade1 = meRect.x < sunshadeRect1.x + sunshadeRect1.width && meRect.x + meRect.width > sunshadeRect1.x && meRect.y < sunshadeRect1.y + sunshadeRect1.height && meRect.y + meRect.height > sunshadeRect1.y;
    if (isUnderSunshade1) {
        ctx.globalAlpha = 0.4;
    }
    ctx.drawImage(sunshadeII, sunshadeRect1.x, sunshadeRect1.y, sunshadeRect1.width, sunshadeRect1.height);
    ctx.restore();

    ctx.save();
    const isUnderSunshade2 = meRect.x < sunshadeRect2.x + sunshadeRect2.width && meRect.x + meRect.width > sunshadeRect2.x && meRect.y < sunshadeRect2.y + sunshadeRect2.height && meRect.y + meRect.height > sunshadeRect2.y;
    if (isUnderSunshade2) {
        ctx.globalAlpha = 0.4;
    }
    ctx.drawImage(sunshade, sunshadeRect2.x, sunshadeRect2.y, sunshadeRect2.width, sunshadeRect2.height);
    ctx.restore();

    // Guarda-sóis espelhados
    const mirroredSunshadeRect1 = { ...sunshadeRect1,
        y: 4000 - sunshadeRect1.y - sunshadeRect1.height
    };
    const mirroredSunshadeRect2 = { ...sunshadeRect2,
        y: 4000 - sunshadeRect2.y - sunshadeRect2.height
    };

    ctx.save();
    const isUnderMirroredSunshade1 = meRect.x < mirroredSunshadeRect1.x + mirroredSunshadeRect1.width && meRect.x + meRect.width > mirroredSunshadeRect1.x && meRect.y < mirroredSunshadeRect1.y + mirroredSunshadeRect1.height && meRect.y + meRect.height > mirroredSunshadeRect1.y;
    if (isUnderMirroredSunshade1) {
        ctx.globalAlpha = 0.4;
    }
    ctx.translate(mirroredSunshadeRect1.x + mirroredSunshadeRect1.width / 2, mirroredSunshadeRect1.y + mirroredSunshadeRect1.height / 2);
    ctx.scale(1, -1);
    ctx.drawImage(sunshadeII, -mirroredSunshadeRect1.width / 2, -mirroredSunshadeRect1.height / 2, mirroredSunshadeRect1.width, mirroredSunshadeRect1.height);
    ctx.restore();

    ctx.save();
    const isUnderMirroredSunshade2 = meRect.x < mirroredSunshadeRect2.x + mirroredSunshadeRect2.width && meRect.x + meRect.width > mirroredSunshadeRect2.x && meRect.y < mirroredSunshadeRect2.y + mirroredSunshadeRect2.height && meRect.y + meRect.height > mirroredSunshadeRect2.y;
    if (isUnderMirroredSunshade2) {
        ctx.globalAlpha = 0.4;
    }
    ctx.translate(mirroredSunshadeRect2.x + mirroredSunshadeRect2.width / 2, mirroredSunshadeRect2.y + mirroredSunshadeRect2.height / 2);
    ctx.scale(1, -1);
    ctx.drawImage(sunshade, -mirroredSunshadeRect2.width / 2, -mirroredSunshadeRect2.height / 2, mirroredSunshadeRect2.width, mirroredSunshadeRect2.height);
    ctx.restore();


    for (const arrow of gameState.arrows) {
        if (arrowSprite.complete) {
            ctx.save();
            ctx.translate(arrow.x, arrow.y);
            ctx.rotate(arrow.angle);
            ctx.drawImage(arrowSprite, -arrow.width / 2, -arrow.height / 2, arrow.width, arrow.height);
            ctx.restore();
        }
    }

    // NOVO: Desenha as flechas do Blowdart
    for (const arrow of gameState.blowdartArrows) {
        if (blowdartArrowSprite.complete) {
            ctx.save();
            ctx.translate(arrow.x, arrow.y);
            ctx.rotate(arrow.angle);
            ctx.drawImage(blowdartArrowSprite, -arrow.width / 2, -arrow.height / 2, arrow.width, arrow.height);
            ctx.restore();
        }
    }

    if (gameState.drones) {
        for (const ownerId in gameState.drones) {
            const drone = gameState.drones[ownerId];
            ctx.drawImage(droneSprite, drone.x - 25, drone.y - 25, 50, 50);
        }
    }

    if (gameState.grenades) {
        for (const grenade of gameState.grenades) {
            ctx.drawImage(grenadeSprite, grenade.x - 10, grenade.y - 10, 20, 20);
        }
    }

    ctx.restore();

    drawHudBackgrounds();
    drawHudText(me);
    drawChat();
    drawInventory();
    if (isMenuOpen) {
        drawMenu();
    }
    if (isProfileOpen) {
        drawProfile();
    }
    if (isInstructionsOpen) {
        drawInstructionsMenu();
    }
}

function drawProfile() {
    // Este é um placeholder para a interface do perfil.
    // Você pode adicionar o código para desenhar a tela de perfil aqui.
}

function drawInstructionsMenu() {
    const menuWidth = 1500;
    const menuHeight = 900;
    const menuX = (canvas.width - menuWidth) / 2;
    const menuY = (canvas.height - menuHeight) / 2;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(menuX, menuY, menuWidth, menuHeight, [15]);
    ctx.fill();
    ctx.stroke();

    // Close Button (X)
    const closeButtonSize = 40;
    const closeButtonPadding = 20;
    const closeX = menuX + menuWidth - closeButtonSize - closeButtonPadding;
    const closeY = menuY + closeButtonPadding;
    ctx.font = 'bold 40px Arial';
    ctx.fillStyle = '#FFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('X', closeX + closeButtonSize / 2, closeY + closeButtonSize / 2);

    // Title
    ctx.textAlign = 'center';
    ctx.font = 'bold 52px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('Instructions / Instruções', canvas.width / 2, menuY + 80);

    // --- Content ---
    ctx.textAlign = 'left';
    const contentX = menuX + 60;
    let currentY = menuY + 180;

    // Objective Section
    ctx.font = 'bold 28px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('Objective / Objetivo', contentX, currentY);
    currentY += 15;
    ctx.fillStyle = '#888';
    ctx.fillRect(contentX, currentY, 320, 3);
    currentY += 40;

    ctx.fillStyle = '#DDDDDD';
    ctx.font = '18px Arial';

    ctx.fillText('•Humans: Survive until the timer runs out. Earn gems over time and use them in the shop (Press B) to buy items.', contentX, currentY);
    currentY += 25;
    ctx.fillText('•Humanos: Sobreviva até o tempo acabar. Ganhe gemas com o tempo e use-as na loja (Pressione B) para comprar itens.', contentX, currentY);
    currentY += 45;
    ctx.fillText('•Zombies: Infect all humans before the timer runs out.', contentX, currentY);
    currentY += 25;
    ctx.fillText('•Zumbis: Infecte todos os humanos antes que o tempo acabe.', contentX, currentY);
    currentY += 80;

    // Controls Section
    ctx.font = 'bold 28px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('Controls / Controles', contentX, currentY);
    currentY += 15;
    ctx.fillStyle = '#888';
    ctx.fillRect(contentX, currentY, 300, 3);
    currentY += 40;

    const controls = [
        ['W, A, S, D / Arrow Keys', 'Move your character. (Mova seu personagem)'],
        ['Left Click', 'Use primary action (shoot, etc). (Use a ação primária (atirar, etc))'],
        ['B', 'Open the Shop menu. (Abra a loja)'],
        ['E', 'Interact with objects or pick up/use items. (Interaja com objetos ou pegue/use itens)'],
        ['G', 'Drop items. (Solte itens)'],
        ['C', 'Use your chosen function. (Use sua função escolhida)'],
        ['Enter', 'Open or send a chat message. (Abra ou envie uma mensagem de bate-papo)'],
    ];

    const keyColWidth = 320;
    for (const [key, desc] of controls) {
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(key + ':', contentX, currentY);
        ctx.font = '18px Arial';
        ctx.fillStyle = '#DDDDDD';
        ctx.fillText(desc, contentX + keyColWidth, currentY);
        currentY += 35;
    }
}

function drawHudBackgrounds() {
    ctx.save(); // Isola o estado de desenho da HUD

    // Estilo aprimorado para os fundos da HUD
    const mainGradient = ctx.createLinearGradient(0, 10, 0, 100);
    mainGradient.addColorStop(0, 'rgba(30, 30, 30, 0.85)');
    mainGradient.addColorStop(1, 'rgba(10, 10, 10, 0.75)');

    ctx.fillStyle = mainGradient;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;

    // HUD do topo (timer e status)
    const topHudWidth = 400;
    ctx.beginPath();
    ctx.roundRect(canvas.width / 2 - topHudWidth / 2, 10, topHudWidth, 90, [12]);
    ctx.fill();
    ctx.stroke();

    // HUD de gemas
    const coinHudWidth = 180;
    ctx.beginPath();
    ctx.roundRect(canvas.width - coinHudWidth - 15, 15, coinHudWidth, 50, [12]);
    ctx.fill();
    ctx.stroke();

    // HUD de velocidade
    const rightHudWidth = 200;
    ctx.beginPath();
    ctx.roundRect(canvas.width - rightHudWidth - 15, canvas.height - 75, rightHudWidth, 60, [12]);
    ctx.fill();
    ctx.stroke();

    ctx.restore(); // Restaura o estado do canvas
}


function drawHudText(me) {
    ctx.save(); // Isola o estado de desenho do texto da HUD

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle'; // Alinha verticalmente no meio
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // --- HUD Superior ---
    const topHudCenterY = 10 + 90 / 2;
    ctx.font = 'bold 40px Arial';
    if (gameState.gamePhase === 'waiting') {
        const seconds = gameState.startTime % 60;
        ctx.fillText(`0:${String(seconds).padStart(2, '0')}`, canvas.width / 2, topHudCenterY + 15);
        ctx.font = '24px Arial';
        ctx.fillText('The round starts in...', canvas.width / 2, topHudCenterY - 18);
    } else if (gameState.gamePhase === 'post-round') {
        const seconds = gameState.postRoundTimeLeft;
        ctx.fillText(`Restarting in: ${seconds}`, canvas.width / 2, topHudCenterY - 10);
        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = 'orange';
        ctx.fillText('End of Round!', canvas.width / 2, topHudCenterY + 20);
    } else {
        const minutes = Math.floor(gameState.timeLeft / 60);
        const seconds = gameState.timeLeft % 60;
        ctx.fillText(`${minutes}:${String(seconds).padStart(2, '0')}`, canvas.width / 2, topHudCenterY - 5);

        ctx.font = 'bold 28px Arial';
        let roleText, roleColor;
        if (me.role === 'zombie') {
            roleText = 'INFECT HUMANS!';
            roleColor = '#2ecc71';
        } else if (me.role === 'human') {
            roleText = 'SURVIVE!';
            roleColor = '#3498db';
        }
        ctx.fillStyle = roleColor;
        ctx.fillText(roleText, canvas.width / 2, topHudCenterY + 25);
    }

    // --- HUD de Gemas (ALTERADO para centralizar) ---
    ctx.font = 'bold 30px Arial';
    ctx.fillStyle = '#FFD700';

    const gemCountText = `${Math.floor(me.gems)}`;
    const textMetrics = ctx.measureText(gemCountText);
    const textWidth = textMetrics.width;
    const iconSize = 35;
    const padding = 10;
    const totalContentWidth = iconSize + padding + textWidth;

    const coinHudWidth = 180;
    const hudX = canvas.width - coinHudWidth - 15;
    const hudCenterY = 15 + 50 / 2;

    const contentStartX = hudX + (coinHudWidth - totalContentWidth) / 2;
    const iconX = contentStartX;
    const textX = iconX + iconSize + padding;

    if (gemSprite.complete) {
        ctx.drawImage(gemSprite, iconX, hudCenterY - iconSize / 2, iconSize, iconSize);
    }
    ctx.textAlign = 'left';
    ctx.fillText(gemCountText, textX, hudCenterY);


    // --- HUD de Velocidade ---
    ctx.textAlign = 'right';
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    const displayedSpeed = Math.max(1, me.speed - 2);
    ctx.fillText(`SPEED: ${displayedSpeed.toFixed(2)}`, canvas.width - 30, canvas.height - 45);

    ctx.restore();
}



function drawInventory() {
    const me = gameState.players[myId];
    if (!me || me.role === 'zombie' || !me.inventory) return;

    if (me.role === 'human') {
        const numSlots = me.inventorySlots || 1;
        const slotSize = 80;
        const gap = 15;
        const totalWidth = (numSlots * slotSize) + ((numSlots - 1) * gap);
        const startX = canvas.width / 2 - totalWidth / 2;
        const slotY = canvas.height - slotSize - 20;

        for (let i = 0; i < numSlots; i++) {
            const slotX = startX + i * (slotSize + gap);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.strokeStyle = (me.selectedSlot === i) ? '#f1c40f' : 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.roundRect(slotX, slotY, slotSize, slotSize, [10]);
            ctx.fill();
            ctx.stroke();

            const item = me.inventory[i];
            if (item) {
                const sprite = itemSprites[item.id];
                if (sprite && sprite.complete) {
                    let isActiveCloak = item.id === 'invisibilityCloak' && item.active;
                    if (isActiveCloak) {
                        ctx.save();
                        ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 200) * 0.2;
                    }

                    const itemAspectRatio = sprite.width / sprite.height;
                    let drawWidth = slotSize * 0.8;
                    let drawHeight = drawWidth / itemAspectRatio;
                    if (drawHeight > slotSize * 0.8) {
                        drawHeight = slotSize * 0.8;
                        drawWidth = drawHeight * itemAspectRatio;
                    }
                    const drawX = slotX + (slotSize - drawWidth) / 2;
                    const drawY = slotY + (slotSize - drawHeight) / 2;
                    ctx.drawImage(sprite, drawX, drawY, drawWidth, drawHeight);

                    if (isActiveCloak) {
                        ctx.restore();
                    }
                }

                let ammoText = null;
                if (item.id === 'bow' && typeof item.ammo === 'number') {
                    ammoText = item.ammo;
                } else if (item.id === 'drone' && gameState.drones[me.id]) {
                    ammoText = gameState.drones[me.id].ammo;
                } else if (item.id === 'fishingRod' && typeof item.uses === 'number') {
                    ammoText = item.uses;
                }

                if (ammoText !== null) {
                    ctx.fillStyle = 'white';
                    ctx.font = 'bold 20px Arial';
                    ctx.textAlign = 'right';
                    ctx.textBaseline = 'bottom';
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 4;
                    const textX = slotX + slotSize - 8;
                    const textY = slotY + slotSize - 8;
                    ctx.strokeText(ammoText, textX, textY);
                    ctx.fillText(ammoText, textX, textY);
                }
            }

            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = '16px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(i + 1, slotX + 8, slotY + 20);
        }
    }
}

function drawChat() {
    if (chatMessages.length === 0) return;

    ctx.save();
    const chatInputAndMargin = 60;
    const chatBoxPadding = 10;
    const lineHeight = 25;
    const maxChatBoxHeight = (MAX_MESSAGES * lineHeight) + (chatBoxPadding * 2);
    const chatBoxHeight = (chatMessages.length * lineHeight) + (chatBoxPadding * 2);
    const chatBoxWidth = 550;
    const chatBoxX = 15;
    const chatBoxY = canvas.height - chatInputAndMargin - chatBoxHeight;

    // Fundo com gradiente e sombra
    const gradient = ctx.createLinearGradient(0, chatBoxY, 0, chatBoxY + chatBoxHeight);
    gradient.addColorStop(0, 'rgba(20, 20, 20, 0.8)');
    gradient.addColorStop(1, 'rgba(5, 5, 5, 0.8)');
    ctx.fillStyle = gradient;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(chatBoxX, chatBoxY, chatBoxWidth, chatBoxHeight, [8]);
    ctx.fill();
    ctx.stroke();

    ctx.restore(); // Resetar sombra para o texto
    ctx.save();

    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.beginPath();
    ctx.rect(chatBoxX, chatBoxY, chatBoxWidth, chatBoxHeight);
    ctx.clip(); // Impede que o texto saia da caixa

    chatMessages.forEach((msg, index) => {
        const messageY = chatBoxY + chatBoxPadding + (index * lineHeight);
        const messageX = chatBoxX + chatBoxPadding;

        // Desenha o nome
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = msg.name === 'Server' ? '#FFD700' : (msg.isZombie ? '#2ecc71' : '#3498db');
        ctx.fillText(msg.name + ':', messageX, messageY);

        // Desenha a mensagem
        ctx.font = '18px Arial';
        ctx.fillStyle = '#f0f0f0';
        const nameWidth = ctx.measureText(msg.name + ': ').width;
        ctx.fillText(msg.text, messageX + nameWidth, messageY);
    });
    ctx.restore();
}


function drawMenu() {
    ctx.save(); // CORREÇÃO DE BUG: Isola o estado de desenho do menu

    const me = gameState.players[myId];
    if (!me) {
        ctx.restore();
        return;
    }
    if (me.role === 'zombie') {
        drawZombieMenu(me);
    } else if (me.role === 'human') {
        drawHumanMenu(me);
    }

    ctx.restore(); // CORREÇÃO DE BUG: Restaura o estado após desenhar o menu
}

function drawZombieMenu(me) {
    const menuWidth = 1500,
        menuHeight = 900;
    const menuX = (canvas.width - menuWidth) / 2,
        menuY = (canvas.height - menuHeight) / 2;

    ctx.fillStyle = 'rgba(40, 0, 0, 0.90)';
    ctx.fillRect(menuX, menuY, menuWidth, menuHeight);
    ctx.strokeStyle = '#8B0000';
    ctx.lineWidth = 5;
    ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);

    // NOVO: Botão 'X' para fechar
    const closeButtonSize = 40;
    const closeButtonPadding = 20;
    const closeX = menuX + menuWidth - closeButtonSize - closeButtonPadding;
    const closeY = menuY + closeButtonPadding;
    ctx.font = 'bold 40px Arial';
    ctx.fillStyle = '#FFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('X', closeX + closeButtonSize / 2, closeY + closeButtonSize / 2);

    const abilitiesTabBtn = getZombieAbilitiesTabRect();
    ctx.fillStyle = activeMenuTab === 'zombie_items' ? '#2e0000' : '#602020';
    ctx.fillRect(abilitiesTabBtn.x, abilitiesTabBtn.y, abilitiesTabBtn.width, abilitiesTabBtn.height);
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ITEMS', abilitiesTabBtn.x + abilitiesTabBtn.width / 2, abilitiesTabBtn.y + abilitiesTabBtn.height / 2);

    if (activeMenuTab === 'zombie_items') {
        ctx.font = '50px Arial';
        ctx.fillText('ITEMS', canvas.width / 2, menuY + 140);
        if (!me.zombieAbility) {
            const {
                buttons
            } = getZombieItemsLayout();
            buttons.forEach(btn => {
                const canAfford = me.gems >= btn.price;
                ctx.fillStyle = canAfford ? '#4B0000' : '#1a0000';
                ctx.fillRect(btn.rect.x, btn.rect.y, btn.rect.width, btn.rect.height);
                ctx.strokeStyle = canAfford ? '#FF4500' : '#666';
                ctx.lineWidth = 2;
                ctx.strokeRect(btn.rect.x, btn.rect.y, btn.rect.width, btn.rect.height);
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                ctx.font = '20px Arial';
                ctx.fillStyle = canAfford ? 'white' : '#999';
                ctx.fillText(btn.text, btn.rect.x + btn.rect.width / 2, btn.rect.y + 35);
                ctx.font = '14px Arial';
                ctx.fillStyle = canAfford ? '#ccc' : '#888';
                ctx.fillText(btn.description, btn.rect.x + btn.rect.width / 2, btn.rect.y + 65);

                // Preço (ALTERADO para centralizar)
                ctx.font = '24px Arial';
                ctx.fillStyle = canAfford ? 'gold' : 'red';
                const costNumber = `${btn.price}`;
                const textX = btn.rect.x + btn.rect.width - 15;
                const textY = btn.rect.y + btn.rect.height - 20;

                ctx.textAlign = 'right';
                ctx.fillText(costNumber, textX, textY);

                if (gemSprite.complete) {
                    const textWidth = ctx.measureText(costNumber).width;
                    const iconSize = 25;
                    const padding = 5;
                    const iconX = textX - textWidth - padding;
                    const iconY = textY - iconSize / 2;
                    ctx.drawImage(gemSprite, iconX - iconSize, iconY, iconSize, iconSize);
                }
            });
        } else {
            ctx.font = '40px Arial';
            ctx.fillStyle = '#ccc';
            ctx.textAlign = 'center';
            ctx.fillText('ITEM ALREADY CHOSEN!', canvas.width / 2, canvas.height / 2);
        }
    }
}

function drawHumanMenu(me) {
    const atmObject = gameState.objects.find(item => item.id === 'atm');
    let isNearATM = false;
    if (atmObject) {
        const dx = (me.x + me.width / 2) - (atmObject.x + atmObject.width / 2);
        const dy = (me.y + me.height / 2) - (atmObject.y + atmObject.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        isNearATM = distance < 250;
    }
    if (!isNearATM && activeMenuTab === 'exclusive_items') activeMenuTab = 'items';

    const menuWidth = 1500,
        menuHeight = 900;
    const menuX = (canvas.width - menuWidth) / 2,
        menuY = (canvas.height - menuHeight) / 2;

    // ALTERADO: Cor de fundo e borda agora são sempre as mesmas
    ctx.fillStyle = 'rgba(17, 14, 14, 0.90)';
    ctx.strokeStyle = '#616161ff';
    ctx.fillRect(menuX, menuY, menuWidth, menuHeight);
    ctx.lineWidth = 5;
    ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);

    // NOVO: Botão 'X' para fechar
    const closeButtonSize = 40;
    const closeButtonPadding = 20;
    const closeX = menuX + menuWidth - closeButtonSize - closeButtonPadding;
    const closeY = menuY + closeButtonPadding;
    ctx.font = 'bold 40px Arial';
    ctx.fillStyle = '#FFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('X', closeX + closeButtonSize / 2, closeY + closeButtonSize / 2);

    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // ALTERADO: Desenha as abas condicionalmente com a cor correta
    if (isNearATM) {
        const rareItemsTabBtn = getRareItemsTabRect(true); // true indica que é a única aba
        ctx.fillStyle = activeMenuTab === 'exclusive_items' ? '#000000ff' : '#232323ff';
        ctx.fillRect(rareItemsTabBtn.x, rareItemsTabBtn.y, rareItemsTabBtn.width, rareItemsTabBtn.height);
        ctx.fillStyle = 'white';
        ctx.fillText('EXCLUSIVE', rareItemsTabBtn.x + rareItemsTabBtn.width / 2, rareItemsTabBtn.y + rareItemsTabBtn.height / 2);
    } else {
        const functionsTabBtn = getFunctionsTabRect();
        const itemsTabBtn = getItemsTabRect();
        ctx.fillStyle = activeMenuTab === 'functions' ? '#000000ff' : '#232323ff';
        ctx.fillRect(functionsTabBtn.x, functionsTabBtn.y, functionsTabBtn.width, functionsTabBtn.height);
        ctx.fillStyle = activeMenuTab === 'items' ? '#000000ff' : '#232323ff';
        ctx.fillRect(itemsTabBtn.x, itemsTabBtn.y, itemsTabBtn.width, itemsTabBtn.height);
        ctx.fillStyle = 'white';
        ctx.fillText('FUNCTIONS', functionsTabBtn.x + functionsTabBtn.width / 2, functionsTabBtn.y + functionsTabBtn.height / 2);
        ctx.fillText('ITEMS', itemsTabBtn.x + itemsTabBtn.width / 2, itemsTabBtn.y + itemsTabBtn.height / 2);
    }

    if (activeMenuTab === 'functions') {
        ctx.font = '50px Arial';
        ctx.fillText('CHOOSE A FUNCTION', canvas.width / 2, menuY + 140);
        if (gameState.gamePhase === 'waiting') {
            ctx.font = '30px Arial';
            ctx.fillStyle = 'orange';
            ctx.fillText('Wait for the round to start to choose a function!', canvas.width / 2, menuY + 180);
        }

        if (me.activeFunction === ' ') {
            const {
                buttons
            } = getFunctionsLayout();
            buttons.forEach(btn => {
                const isLocked = gameState.gamePhase === 'waiting';
                const isTaken = gameState.takenFunctions.includes(btn.func);
                const cost = gameState.functionCosts[btn.func] || 0;
                const canAfford = me.gems >= cost;
                ctx.fillStyle = isTaken || isLocked ? '#333' : (canAfford ? '#282828' : '#1a1a1a');
                ctx.fillRect(btn.rect.x, btn.rect.y, btn.rect.width, btn.rect.height);
                ctx.strokeStyle = isTaken || isLocked ? '#555' : (canAfford ? 'white' : '#666');
                ctx.lineWidth = 2;
                ctx.strokeRect(btn.rect.x, btn.rect.y, btn.rect.width, btn.rect.height);
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = '20px Arial';
                ctx.fillStyle = isTaken || isLocked ? '#888' : (canAfford ? 'white' : '#999');
                ctx.fillText(btn.text, btn.rect.x + btn.rect.width / 2, btn.rect.y + 35);
                ctx.font = '14px Arial';
                ctx.fillStyle = isTaken || isLocked ? '#777' : (canAfford ? '#ccc' : '#888');
                ctx.fillText(btn.description, btn.rect.x + btn.rect.width / 2, btn.rect.y + 65);

                // Preço (ALTERADO para centralizar)
                ctx.font = '24px Arial';
                ctx.fillStyle = canAfford && !isLocked ? 'gold' : 'red';
                const costNumber = `${cost}`;
                const textX = btn.rect.x + btn.rect.width - 15;
                const textY = btn.rect.y + btn.rect.height - 20;
                ctx.textAlign = 'right';
                ctx.fillText(costNumber, textX, textY);

                if (gemSprite.complete) {
                    const textWidth = ctx.measureText(costNumber).width;
                    const iconSize = 25;
                    const padding = 5;
                    const iconX = textX - textWidth - padding;
                    const iconY = textY - iconSize / 2;
                    ctx.drawImage(gemSprite, iconX - iconSize, iconY, iconSize, iconSize);
                }

                if (isTaken) {
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                    ctx.textAlign = 'center';
                    ctx.font = 'bold 24px Arial';
                    ctx.fillText('TAKEN', btn.rect.x + btn.rect.width / 2, btn.rect.y + 95);
                }
            });
        } else {
            ctx.font = '40px Arial';
            ctx.fillStyle = 'grey';
            ctx.textAlign = 'center';
            ctx.fillText('FUNCTION ALREADY CHOSEN!', canvas.width / 2, canvas.height / 2);
        }
    } else if (activeMenuTab === 'items' || activeMenuTab === 'exclusive_items') {
        const isRare = activeMenuTab === 'exclusive_items';
        ctx.font = '50px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(isRare ? 'EXCLUSIVE ITEMS' : 'ITEMS SHOP', canvas.width / 2, menuY + 140);
        const hasCard = me.inventory && me.inventory.some(i => i && i.id === 'card');
        if (isRare && !hasCard) {
            ctx.font = '30px Arial';
            ctx.fillStyle = 'orange';
            ctx.fillText('You need an ATM Card to buy these items!', canvas.width / 2, menuY + 180);
        }
        const {
            buttons
        } = isRare ? getRareItemsLayout() : getItemsLayout();
        buttons.forEach(btn => {
            const canAfford = me.gems >= btn.price;
            const alreadyOwned = me.inventory && me.inventory.some(i => i && i.id === btn.id);
            const inventoryWithoutCard = me.inventory.filter(i => i && i.id !== 'card');
            const inventoryFull = inventoryWithoutCard.length >= me.inventorySlots;
            const alreadyUpgraded = me.inventorySlots > 1;

            let canBuy = false;
            if (isRare) {
                if (btn.id === 'inventoryUpgrade') {
                    canBuy = canAfford && hasCard && !alreadyUpgraded;
                } else {
                    canBuy = canAfford && hasCard && !alreadyOwned && !inventoryFull;
                }
            } else {
                canBuy = canAfford && !alreadyOwned && !inventoryFull;
            }

            if (isRare) {
                ctx.fillStyle = canBuy ? '#282828' : '#1a1a1a';
                ctx.strokeStyle = canBuy ? 'white' : '#666';
            } else {
                ctx.fillStyle = canBuy ? '#282828' : '#1a1a1a';
                ctx.strokeStyle = canBuy ? 'white' : '#666';
            }
            ctx.fillRect(btn.rect.x, btn.rect.y, btn.rect.width, btn.rect.height);
            ctx.lineWidth = 2;
            ctx.strokeRect(btn.rect.x, btn.rect.y, btn.rect.width, btn.rect.height);
            if (btn.sprite && btn.sprite.complete) {
                const sprite = btn.sprite;
                const itemAspectRatio = sprite.width / sprite.height;
                let drawWidth = 100,
                    drawHeight = drawWidth / itemAspectRatio;
                if (drawHeight > 120) {
                    drawHeight = 120;
                    drawWidth = drawHeight * itemAspectRatio;
                }
                const imgX = btn.rect.x + 15 + (100 - drawWidth) / 2;
                const imgY = btn.rect.y + (btn.rect.height - 120) / 2 + (120 - drawHeight) / 2;

                if (btn.id === 'angelWings') {
                    ctx.save();
                    const centerX = imgX + drawWidth / 2;
                    const centerY = imgY + drawHeight / 2;
                    ctx.translate(centerX, centerY);
                    ctx.rotate(-Math.PI / 2);
                    ctx.drawImage(sprite, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
                    ctx.restore();
                } else {
                    ctx.drawImage(sprite, imgX, imgY, drawWidth, drawHeight);
                }
            }
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            const textCenterX = btn.rect.x + 120 + (btn.rect.width - 120) / 2;

            ctx.font = '20px Arial';
            ctx.fillStyle = canBuy ? 'white' : '#999';
            ctx.fillText(btn.text, textCenterX, btn.rect.y + 50);

            ctx.font = '12px Arial';
            ctx.fillStyle = canBuy ? '#ccc' : '#888';
            ctx.fillText(btn.description, textCenterX, btn.rect.y + 85);

            // Preço (ALTERADO para centralizar)
            ctx.font = '24px Arial';
            ctx.fillStyle = canAfford ? 'gold' : 'red';
            const costNumber = `${btn.price}`;
            const textX = btn.rect.x + btn.rect.width - 15;
            const textY = btn.rect.y + btn.rect.height - 20;
            ctx.textAlign = 'right';
            ctx.fillText(costNumber, textX, textY);

            if (gemSprite.complete) {
                const textWidth = ctx.measureText(costNumber).width;
                const iconSize = 25;
                const padding = 5;
                const iconX = textX - textWidth - padding;
                const iconY = textY - iconSize / 2;
                ctx.drawImage(gemSprite, iconX - iconSize, iconY, iconSize, iconSize);
            }

            if (alreadyOwned || (btn.id === 'inventoryUpgrade' && alreadyUpgraded)) {
                ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
                ctx.textAlign = 'center';
                ctx.font = 'bold 20px Arial';
                ctx.fillText('OWNED', textCenterX, btn.rect.y + 120);
            }
        });
    }
    ctx.font = '20px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('PRESS "B" TO CLOSE', canvas.width / 2 + 580, menuY + menuHeight - 20);
}

function getFunctionsLayout() {
    const functions = [{
        text: 'ATHLETE',
        func: 'athlete',
        description: 'Sprint for a short duration'
    }, {
        text: 'ENGINEER',
        func: 'engineer',
        description: 'Travel instantly between ducts'
    }, {
        text: 'SPY',
        func: 'spy',
        description: 'Disguise as a zombie'
    }, {
        text: 'BUTTERFLY',
        func: 'butterfly',
        description: 'When caught, get a 10s flight'
    }, {
        text: 'RHINOCEROS',
        func: 'rhinoceros',
        description: 'Throw nearby objects away'
    }];

    const menuWidth = 1500;
    const menuHeight = 900;
    const menuX = (canvas.width - menuWidth) / 2;
    const menuY = (canvas.height - menuHeight) / 2;
    const cols = 4;
    const btnWidth = 320;
    const btnHeight = 120;
    const gap = 40;
    const totalGridWidth = cols * btnWidth + (cols - 1) * gap;
    const startX = menuX + (menuWidth - totalGridWidth) / 2;
    const startY = menuY + 200;

    return {
        buttons: functions.map((func, index) => ({ ...func,
            rect: {
                x: startX + (index % cols) * (btnWidth + gap),
                y: startY + Math.floor(index / cols) * (btnHeight + gap),
                width: btnWidth,
                height: btnHeight
            }
        }))
    };
}


function getZombieItemsLayout() {
    const abilities = [{
        id: 'trap',
        text: 'Trap',
        description: 'Place a trap to immobilize humans',
        price: 200
    }, {
        id: 'mine',
        text: 'Explosive Mine',
        description: 'Place a mine that explodes on contact',
        price: 200
    }];
    const menuWidth = 1500,
        menuHeight = 900;
    const menuX = (canvas.width - menuWidth) / 2,
        menuY = (canvas.height - menuHeight) / 2;
    const cols = 4,
        btnWidth = 320,
        btnHeight = 120,
        gap = 40;
    const totalGridWidth = cols * btnWidth + (cols - 1) * gap;
    const startX = menuX + (menuWidth - totalGridWidth) / 2;
    const startY = menuY + 200;
    return {
        buttons: abilities.map((ability, index) => ({ ...ability,
            rect: {
                x: startX + (index % cols) * (btnWidth + gap),
                y: startY + Math.floor(index / cols) * (btnHeight + gap),
                width: btnWidth,
                height: btnHeight
            }
        }))
    };
}

function getItemsLayout() {
    const items = [{
        id: 'normalGlove',
        text: 'GLOVE',
        description: "Pushes objects with more force",
        price: 500,
        sprite: GloveSprite
    }, {
        id: 'antidote',
        text: 'ANTIDOTE',
        description: 'Reduces chance of being zombie',
        price: 200,
        sprite: antidoteSprite
    }, {
        id: 'magicAntidote',
        text: 'MAGIC ANTIDOTE',
        description: 'Reduces chance of being zombie',
        price: 3000,
        sprite: magicAntidoteSprite
    }, {
        id: 'magicEgg',
        text: 'EGG',
        description: 'Gain 20% more gems',
        price: 2000,
        sprite: magicEggSprite
    }, {
        id: 'fishingRod',
        text: 'FISHING ROD',
        description: 'Try your luck fishing in the sea',
        price: 1000,
        sprite: fishingRodSprite
    }, {
        id: 'bow',
        text: 'BOW',
        description: 'Shoot arrows to slow enemies',
        price: 2000,
        sprite: bowSprite
    }, {
        id: 'blowdart',
        text: 'BLOWDART',
        description: 'Shoot darts to slow zombies',
        price: 2000,
        sprite: blowdartSprite
    }];
    const menuWidth = 1500,
        menuHeight = 900;
    const menuX = (canvas.width - menuWidth) / 2,
        menuY = (canvas.height - menuHeight) / 2;
    const cols = 4,
        btnWidth = 320,
        btnHeight = 180,
        gap = 40;
    const totalGridWidth = cols * btnWidth + (cols - 1) * gap;
    const startX = menuX + (menuWidth - totalGridWidth) / 2;
    const startY = menuY + 200;
    return {
        buttons: items.map((item, index) => ({ ...item,
            rect: {
                x: startX + (index % cols) * (btnWidth + gap),
                y: startY + Math.floor(index / cols) * (btnHeight + gap),
                width: btnWidth,
                height: btnHeight
            }
        }))
    };
}

function getRareItemsLayout() {
    const rareItems = [{
        id: 'inventoryUpgrade',
        text: 'SLOT',
        description: 'Unlocks a second slot',
        price: 20000,
        sprite: inventoryUpgradeSprite
    }, {
        id: 'skateboard',
        text: 'SKATEBOARD',
        description: 'Move faster',
        price: 10000,
        sprite: skateboardSprite
    }, {
        id: 'drone',
        text: 'DRONE',
        description: 'Throws grenades',
        price: 2000,
        sprite: droneSprite
    }, {
        id: 'invisibilityCloak',
        text: 'CLOAK',
        description: 'Become invisible',
        price: 10000,
        sprite: invisibilityCloakSprite
    }, {
        id: 'gravityGlove',
        text: 'GRAVITY GLOVE',
        description: 'Pick up (E) and drop (G) objects',
        price: 5000,
        sprite: gravityGloveSprite
    }, {
        id: 'portals',
        text: 'PORTALS',
        description: 'Place 2 portals for instant travel',
        price: 3000,
        sprite: portalsSprite
    }, {
        id: 'cannon',
        text: 'CANNON',
        description: 'Fires a powerful cannonball',
        price: 5000,
        sprite: cannonSprite
    }, {
        id: 'angelWings',
        text: 'ANGEL WINGS',
        description: 'Become an angel',
        price: 30000,
        sprite: angelWingsSprite
    }];
    const menuWidth = 1500,
        menuHeight = 900;
    const menuX = (canvas.width - menuWidth) / 2,
        menuY = (canvas.height - menuHeight) / 2;
    const cols = 4,
        btnWidth = 320,
        btnHeight = 180,
        gap = 40;
    const totalGridWidth = cols * btnWidth + (cols - 1) * gap;
    const startX = menuX + (menuWidth - totalGridWidth) / 2;
    const startY = menuY + 200;
    return {
        buttons: rareItems.map((item, index) => ({ ...item,
            rect: {
                x: startX + (index % cols) * (btnWidth + gap),
                y: startY + Math.floor(index / cols) * (btnHeight + gap),
                width: btnWidth,
                height: btnHeight
            }
        }))
    };
}

function isClickInside(pos, rect) {
    return pos.x > rect.x && pos.x < rect.x + rect.width && pos.y > rect.y && pos.y < rect.y + rect.height;
}

function getPlayerAngle(player) {
    if (!player) return 0;
    const zoomLevel = 0.67;
    const cx = canvas.width / (2 * zoomLevel);
    const cy = canvas.height / (2 * zoomLevel);
    const dx = mouse.x / zoomLevel - cx;
    const dy = mouse.y / zoomLevel - cy;
    return Math.atan2(dy, dx);
}

function getFunctionsTabRect() {
    const mX = (canvas.width - 1500) / 2,
        mY = (canvas.height - 900) / 2;
    return {
        x: mX + 10,
        y: mY + 10,
        width: 200,
        height: 60
    };
}

function getItemsTabRect() {
    const mX = (canvas.width - 1500) / 2,
        mY = (canvas.height - 900) / 2;
    return {
        x: mX + 220,
        y: mY + 10,
        width: 200,
        height: 60
    };
}

// ALTERADO: A função agora pode ajustar a posição se for a única aba
function getRareItemsTabRect(isOnlyTab = false) {
    const mX = (canvas.width - 1500) / 2,
        mY = (canvas.height - 900) / 2;
    return {
        x: isOnlyTab ? mX + 10 : mX + 430, // Se for a única, começa na esquerda
        y: mY + 10,
        width: 200,
        height: 60
    };
}


function getZombieAbilitiesTabRect() {
    const mX = (canvas.width - 1500) / 2,
        mY = (canvas.height - 900) / 2;
    return {
        x: mX + 10,
        y: mY + 10,
        width: 200,
        height: 60
    };
}

function gameLoop() {
    if (myId && gameState.players[myId]) {
        const me = gameState.players[myId];
        const rot = getPlayerAngle(me);
        const zoomLevel = 0.67;
        const cameraX = (me.x + me.width / 2) - canvas.width / (2 * zoomLevel);
        const cameraY = (me.y + me.height / 2) - canvas.height / (2 * zoomLevel);
        const worldMouse = {
            x: mouse.x / zoomLevel + cameraX,
            y: mouse.y / zoomLevel + cameraY
        };
        socket.emit('playerInput', {
            movement: movement,
            mouse: mouse,
            rotation: rot,
            worldMouse: worldMouse
        });
    }
    draw();
    requestAnimationFrame(gameLoop);
}

// gameLoop();

function startGame() {
    gameLoop();
}