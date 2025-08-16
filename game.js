const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

(function setup() {
    const chatInput = document.getElementById('chatInput');
    const body = document.body;
    Object.assign(body.style, {
        backgroundColor: '#000000',
        margin: '0',
        overflow: 'hidden'
    });
    // Estilo do Chat melhorado
    Object.assign(chatInput.style, {
        display: 'none',
        position: 'absolute',
        bottom: '15px',
        left: '15px',
        transform: 'none',
        width: '550px', // Largura responsiva
        padding: '12px',
        fontSize: '16px',
        border: '2px solid #666',
        backgroundColor: 'rgba(20, 20, 20, 0.85)',
        color: 'white',
        borderRadius: '10px',
        outline: 'none',
        zIndex: '10'
    });
    chatInput.maxLength = 57;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
})();

// =================================================================
// region: ASSET LOADING
// =================================================================
function loadImage(src) {
    const img = new Image();
    img.src = src;
    return img;
}

// Carregamento de Imagens
const human = loadImage('Sprites/Human.png');
const zombie = loadImage('Sprites/Zombie.png');
const box = loadImage('Sprites/Box.png');
const grass = loadImage('Sprites/Grass.png');
const street = loadImage('Sprites/Street.png');
const sand = loadImage('Sprites/Sand.png');
const sea = loadImage('Sprites/Sea.png');
const sunshade = loadImage('Sprites/Sunshade.png');
const sunshadeII = loadImage('Sprites/SunshadeII.png');
const ductSprite = loadImage('Sprites/Duct.png');
const atmSprite = loadImage('Sprites/ATM.png');
const cardSprite = loadImage('Sprites/Card.png');
const floors = loadImage('Sprites/Floor.png');
const garageFloor = loadImage('Sprites/garageFloor.png');
const smallBed = loadImage('Sprites/smallBed.png');
const smallTable = loadImage('Sprites/smallTable.png');
const bigTable = loadImage('Sprites/bigTable.png');
const car = loadImage('Sprites/Car.png');
const skateboardSprite = loadImage('Sprites/Skateboard.png');
const droneSprite = loadImage('Sprites/Drone.png');
const grenadeSprite = loadImage('Sprites/Grenade.png');
const invisibilityCloakSprite = loadImage('Sprites/InvisibilityCloak.png');
const antidoteSprite = loadImage('Sprites/Antidote.png');
const trapSprite = loadImage('Sprites/Trap.png');
const drumSprite = loadImage('Sprites/Drum.png');
const zoomSprite = loadImage('Sprites/Zoom.png');
const gravityGloveSprite = loadImage('Sprites/GravityGlove.png');

const itemSprites = {
    skateboard: skateboardSprite,
    drone: droneSprite,
    invisibilityCloak: invisibilityCloakSprite,
    card: cardSprite,
    antidote: antidoteSprite,
    forceDrum: drumSprite,
    zoom: zoomSprite,
    gravityGlove: gravityGloveSprite,
};

// =================================================================
// region: GAME STATE & VARIABLES
// =================================================================
let myId = null;
let gameState = {
    players: {},
    arrows: [],
    timeLeft: 120,
    startTime: 60,
    postRoundTimeLeft: 10,
    gamePhase: 'waiting',
    abilityCosts: {},
    drones: {},
    grenades: [],
    groundItems: [],
    illusions: [],
    traps: []
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
let activeMenuTab = 'abilities';
const chatInput = document.getElementById('chatInput');
let isChatting = false;
let chatMessages = [];
const MAX_MESSAGES = 10;

// =================================================================
// region: NETWORK (SOCKET.IO)
// =================================================================
const socket = io();

socket.on('connect', () => {
    myId = socket.id;
    showNicknameMenu();
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

// =================================================================
// region: INPUT HANDLING
// =================================================================
window.addEventListener('keydown', function(event) {
    if (document.getElementById('nickname-container') || document.getElementById('how-to-play-container')) {
        return;
    }
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

    if (key === 'escape' && isChatting) {
        chatInput.value = '';
        chatInput.blur();
    }

    if (isChatting) {
        return;
    }

    if (key === 'b') {
        if (me) {
            isMenuOpen = !isMenuOpen;
            if (isMenuOpen) {
                activeMenuTab = (me.role === 'zombie') ? 'zombie_items' : 'abilities';
            }
        }
    }

    if (isMenuOpen) {
        return;
    }

    switch (key) {
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
            socket.emit('playerAction', {
                type: 'interact'
            });
            break;
        case 'c':
            if (me) {
                if (me.inventory && me.inventory.id === 'antidote') {
                    socket.emit('playerAction', {
                        type: 'use_antidote'
                    });
                } else if (me.role === 'zombie') {
                    socket.emit('playerAction', {
                        type: 'zombie_item'
                    });
                } else {
                    socket.emit('playerAction', {
                        type: 'ability'
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
    if (document.getElementById('nickname-container') || document.getElementById('how-to-play-container')) {
        return;
    }
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
    if (document.getElementById('nickname-container') || document.getElementById('how-to-play-container')) {
        return;
    }
    const rect = canvas.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
});

canvas.addEventListener('mousedown', function(event) {
    if (document.getElementById('nickname-container') || document.getElementById('how-to-play-container')) {
        return;
    }
    if (isMenuOpen) {
        const me = gameState.players[myId];
        if (!me) return;

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
                    const canAfford = me.coins >= btn.price;
                    if (isClickInside(mouse, btn.rect) && canAfford) {
                        socket.emit('buyZombieAbility', btn.id);
                        isMenuOpen = false;
                        return;
                    }
                }
            }
        } else {
            const atmObject = gameState.furniture.find(item => item.id === 'atm');
            let isNearATM = false;
            if (atmObject) {
                const dx = (me.x + me.width / 2) - (atmObject.x + atmObject.width / 2);
                const dy = (me.y + me.height / 2) - (atmObject.y + atmObject.height / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                isNearATM = distance < 250;
            }

            const abilitiesTabBtn = getAbilitiesTabRect();
            const itemsTabBtn = getItemsTabRect();
            const rareItemsTabBtn = getRareItemsTabRect();

            if (isClickInside(mouse, abilitiesTabBtn)) {
                activeMenuTab = 'abilities';
                return;
            }
            if (isClickInside(mouse, itemsTabBtn)) {
                activeMenuTab = 'items';
                return;
            }
            if (isNearATM && isClickInside(mouse, rareItemsTabBtn)) {
                activeMenuTab = 'rare_items';
                return;
            }

            if (activeMenuTab === 'abilities' && me.activeAbility === ' ') {
                if (gameState.gamePhase !== 'running') return;
                const abilities = getAbilitiesLayout().buttons;
                for (const btn of abilities) {
                    const cost = gameState.abilityCosts[btn.ability] || 0;
                    const canAfford = me.coins >= cost;
                    const isTaken = gameState.takenAbilities.includes(btn.ability);
                    if (isClickInside(mouse, btn.rect) && !isTaken && canAfford) {
                        socket.emit('chooseAbility', btn.ability);
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
                    const canAfford = me.coins >= btn.price;
                    let alreadyOwned = me.inventory && me.inventory.id === btn.id;
                    let inventoryFull = me.inventory !== null;

                    if (isClickInside(mouse, btn.rect) && canAfford && !alreadyOwned && !inventoryFull) {
                        socket.emit('buyItem', btn.id);
                        isMenuOpen = false;
                        return;
                    }
                }
            }
            if (activeMenuTab === 'rare_items') {
                const {
                    buttons
                } = getRareItemsLayout();
                for (const btn of buttons) {
                    const hasCard = me.inventory && me.inventory.id === 'card';
                    const canAfford = me.coins >= btn.price;
                    if (isClickInside(mouse, btn.rect) && canAfford && hasCard) {
                        socket.emit('buyRareItem', btn.id);
                        isMenuOpen = false;
                        return;
                    }
                }
            }
        }
    } else {
        const me = gameState.players[myId];
        if (me && me.inventory && me.inventory.id === 'drone') {
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

// =================================================================
// region: UI & MENU
// =================================================================
function showNicknameMenu() {
    const existingMenu = document.getElementById('nickname-container');
    if (existingMenu) return;

    const menuContainer = document.createElement('div');
    menuContainer.id = 'nickname-container';
    Object.assign(menuContainer.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: '100',
        fontFamily: 'Arial, sans-serif'
    });

    const form = document.createElement('form');
    form.style.textAlign = 'center';

    const title = document.createElement('h2');
    title.textContent = 'Choose your Nickname';
    Object.assign(title.style, {
        color: 'white',
        marginBottom: '20px',
        fontSize: '28px'
    });

    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 10;
    input.placeholder = 'Max 10 characters';
    Object.assign(input.style, {
        padding: '12px',
        fontSize: '18px',
        width: '300px',
        border: '2px solid #555',
        borderRadius: '5px',
        backgroundColor: '#333',
        color: 'white',
        textAlign: 'center',
        display: 'block',
        margin: '0 auto 20px auto'
    });
    input.required = true;

    const button = document.createElement('button');
    button.type = 'submit';
    button.textContent = 'Join Game';
    Object.assign(button.style, {
        padding: '12px 25px',
        fontSize: '18px',
        border: 'none',
        borderRadius: '5px',
        backgroundColor: '#2ecc71',
        color: 'white',
        cursor: 'pointer'
    });

    form.appendChild(title);
    form.appendChild(input);
    form.appendChild(button);
    menuContainer.appendChild(form);
    document.body.appendChild(menuContainer);
    input.focus();

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const nickname = input.value.trim();
        if (nickname) {
            socket.emit('setNickname', nickname);
            document.body.removeChild(menuContainer);
            showHowToPlayScreen();
        }
    });
}

function showHowToPlayScreen() {
    const existingMenu = document.getElementById('how-to-play-container');
    if (existingMenu) return;

    const menuContainer = document.createElement('div');
    menuContainer.id = 'how-to-play-container';
    Object.assign(menuContainer.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: '101',
        fontFamily: 'Arial, sans-serif',
        color: 'white',
        overflowY: 'auto',
        padding: '20px'
    });

    const contentWrapper = document.createElement('div');
    Object.assign(contentWrapper.style, {
        maxWidth: '800px',
        textAlign: 'left',
        lineHeight: '1.6'
    });

    const title = document.createElement('h1');
    title.textContent = 'How to Play';
    Object.assign(title.style, {
        textAlign: 'center',
        color: '#2ecc71',
        marginBottom: '25px',
        fontSize: '3em'
    });

    const objectiveHeader = document.createElement('h2');
    objectiveHeader.textContent = 'Objective';
    Object.assign(objectiveHeader.style, {
        borderBottom: '2px solid #2ecc71',
        paddingBottom: '5px',
        marginBottom: '15px',
        fontSize: '1.8em'
    });

    const objectiveText = document.createElement('p');
    objectiveText.innerHTML = `Some players starts as a <strong>Zombie</strong>, and the rest are <strong>Humans</strong>.<br> 
- <strong>Humans</strong>: Survive until the timer runs out. Collect coins to buy abilities and items.<br> 
- <strong>Zombies</strong>: Infect all humans before the time runs out.`;
    Object.assign(objectiveText.style, {
        fontSize: '1.2em',
        marginBottom: '20px'
    });

    const controlsHeader = document.createElement('h2');
    controlsHeader.textContent = 'Controls';
    Object.assign(controlsHeader.style, {
        borderBottom: '2px solid #2ecc71',
        paddingBottom: '5px',
        marginBottom: '15px',
        fontSize: '1.8em'
    });

    const controlsList = document.createElement('ul');
    controlsList.innerHTML = ` 
<li><strong>W, A, S, D / Arrow Keys</strong>: Move your character.</li> 
<li><strong>Mouse</strong>: Aim your character or abilities.</li> 
<li><strong>Left Click</strong>: Use primary action (e.g., shoot arrow, punch) or place barrier.</li> 
<li><strong>B</strong>: Open the Shop menu.</li> 
<li><strong>C</strong>: Use ability / Consume item.</li> 
<li><strong>E</strong>: Interact with objects or pick up items.</li> 
<li><strong>G</strong>: Drop your current held item.</li> 
<li><strong>Z</strong>: (Zombie only) Teleport back to spawn (cooldown).</li> 
<li><strong>Enter</strong>: Open or send a chat message.</li> 
`;
    Object.assign(controlsList.style, {
        listStyle: 'none',
        padding: '0',
        fontSize: '1.2em'
    });

    const continueButton = document.createElement('button');
    continueButton.textContent = 'Continue to Game';
    Object.assign(continueButton.style, {
        padding: '15px 30px',
        fontSize: '1.2em',
        border: 'none',
        borderRadius: '5px',
        backgroundColor: '#2ecc71',
        color: 'white',
        cursor: 'pointer',
        display: 'block',
        margin: '30px auto 0 auto'
    });
    continueButton.addEventListener('click', () => {
        document.body.removeChild(menuContainer);
    });

    contentWrapper.appendChild(title);
    contentWrapper.appendChild(objectiveHeader);
    contentWrapper.appendChild(objectiveText);
    contentWrapper.appendChild(controlsHeader);
    contentWrapper.appendChild(controlsList);
    contentWrapper.appendChild(continueButton);
    menuContainer.appendChild(contentWrapper);
    document.body.appendChild(menuContainer);
}

// =================================================================
// region: DRAWING & RENDERING
// =================================================================
function draw() {
    if (document.getElementById('nickname-container') || document.getElementById('how-to-play-container')) {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
    }
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
    const zoomLevel = (me.inventory && me.inventory.id === 'zoom') ? 1.2 : 1.0;
    const cameraX = (me.x + me.width / 2) - canvas.width / (2 * zoomLevel);
    const cameraY = (me.y + me.height / 2) - canvas.height / (2 * zoomLevel);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(zoomLevel, zoomLevel);
    ctx.translate(-cameraX, -cameraY);

    // Desenhar o mundo do jogo
    ctx.drawImage(grass, 0, 0, 3100, 2000);
    ctx.drawImage(floors, 200, 200, 2697, 1670);
    ctx.drawImage(garageFloor, 2000, 1200, 700, 600);
    ctx.drawImage(sea, 4965, 0, 1300, 2000);
    ctx.drawImage(sand, 4080, 0, 1850, 2000);
    ctx.drawImage(street, 3090, 0, 1000, 2000);

    if (gameState.skateboard && gameState.skateboard.spawned) {
        const skate = gameState.skateboard;
        ctx.drawImage(skateboardSprite, skate.x, skate.y, skate.width, skate.height);
    }

    if (gameState.groundItems) {
        for (const item of gameState.groundItems) {
            const sprite = itemSprites[item.id];
            if (sprite) {
                ctx.drawImage(sprite, item.x, item.y, item.width, item.height);
            }
        }
    }

    if (gameState.traps) {
        for (const trap of gameState.traps) {
            if (trapSprite.complete) ctx.drawImage(trapSprite, trap.x, trap.y, trap.width, trap.height);
        }
    }

    const furnitureSprites = {
        small_bed: smallBed,
        small_table: smallTable,
        big_table: bigTable,
        car: car,
        atm: atmSprite
    };
    for (const duct of gameState.ducts) {
        ctx.drawImage(ductSprite, duct.x, duct.y, duct.width, duct.height);
    }

    if (gameState.box) {
        for (const b of gameState.box) {
            ctx.save();
            ctx.translate(b.x + b.width / 2, b.y + b.height / 2);
            ctx.rotate(b.rotation);
            ctx.drawImage(box, -b.width / 2, -b.height / 2, b.width, b.height);
            ctx.restore();
        }
    }

    if (gameState.furniture) {
        for (const item of gameState.furniture) {
            const sprite = furnitureSprites[item.id];
            if (sprite) {
                ctx.save();
                ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
                ctx.rotate(item.rotation);
                ctx.drawImage(sprite, -item.width / 2, -item.height / 2, item.width, item.height);
                ctx.restore();
            }
        }
    }

    ctx.fillStyle = '#342819ff';
    ctx.strokeStyle = '#332416ff';
    ctx.lineWidth = 15;
    for (const wall of gameState.house.walls) {
        ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
    }

    ctx.fillStyle = '#606060';
    ctx.strokeStyle = '#404040';
    ctx.lineWidth = 15;
    for (const wall of gameState.garage.walls) {
        ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
    }

    ctx.strokeStyle = '#c38a51ff';
    ctx.lineWidth = 3;
    for (const wall of gameState.house.walls) {
        ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
    }
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 3;
    for (const wall of gameState.garage.walls) {
        ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
    }

    if (gameState.illusions) {
        for (const illusion of gameState.illusions) {
            ctx.save();
            ctx.translate(illusion.x + illusion.width / 2, illusion.y + illusion.height / 2);
            const angle = Math.atan2(illusion.vy, illusion.vx);
            ctx.rotate(angle);
            ctx.drawImage(human, -illusion.width / 2, -illusion.height / 2, illusion.width, illusion.height);
            ctx.restore();
        }
    }

    for (const playerId in gameState.players) {
        const player = gameState.players[playerId];
        if (player.isInDuct) continue;
        if ((player.isHidden || (player.isInvisible && me.role === 'zombie')) && playerId !== myId) {
            continue;
        }

        ctx.save();
        if (player.isFlying) {
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

        if (player.inventory && player.inventory.id === 'skateboard') {
            const skate = gameState.skateboard;
            ctx.drawImage(skateboardSprite, -skate.width / 2, -skate.height / 2, skate.width, skate.height);
        }

        if (player.role === 'zombie' || player.isSpying) {
            ctx.drawImage(zombie, -player.width / 2, -player.height / 2, player.width, player.height);
        } else {
            ctx.drawImage(human, -player.width / 2, -player.height / 2, player.width, player.height);
        }

        if (player.carryingObject) {
            const carried = player.carryingObject;
            const sprite = furnitureSprites[carried.id] || (carried.id.startsWith('box') ? box : null);
            if (sprite) {
                const distance = player.width / 2 + carried.width / 2;
                ctx.save();
                ctx.translate(distance, 0);
                ctx.drawImage(sprite, -carried.width / 2, -carried.height / 2, carried.width, carried.height);
                ctx.restore();
            }
        }

        if (player.inventory && player.inventory.id === 'forceDrum' && drumSprite.complete) {
            const itemWidth = 60;
            const itemHeight = 30;
            const itemDistance = player.width / 2;
            ctx.drawImage(drumSprite, itemDistance + 10, -itemHeight / 2, itemWidth, itemHeight);
        }

        ctx.restore();

        // NOVA CORREÇÃO: Desenha a hitbox física para debugging
        if (player.physicalHitbox) {
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(player.physicalHitbox.cx, player.physicalHitbox.cy, player.physicalHitbox.radius, 0, 2 * Math.PI);
            ctx.stroke();
        }

        if (!player.isHidden && !player.isInvisible) {
            ctx.fillStyle = (player.role === 'zombie' || player.isSpying) ? '#2ecc71' : 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 5;
            ctx.textAlign = 'center';
            ctx.font = '18px Arial';
            ctx.strokeText(player.name, player.x + player.width / 2, player.y - 20);
            ctx.fillText(player.name, player.x + player.width / 2, player.y - 20);
        }
    }

    ctx.drawImage(sunshadeII, 4350, 600, 320, 340);
    ctx.drawImage(sunshade, 4440, 1400, 320, 340);

    for (const arrow of gameState.arrows) {
        ctx.fillStyle = arrow.color || 'red';
        ctx.fillRect(arrow.x, arrow.y, arrow.width, arrow.height);
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

    ctx.restore(); // Fim do desenho do mundo do jogo

    // Desenhar HUDs
    drawHudBackgrounds();
    drawHudText(me);
    drawChat();
    drawInventory();
    if (isMenuOpen) {
        drawMenu();
    }
}

function drawHudBackgrounds() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;

    // Fundo do timer/mensagem (centralizado)
    const topHudWidth = 400;
    ctx.beginPath();
    ctx.roundRect(canvas.width / 2 - topHudWidth / 2, 10, topHudWidth, 90, [10]);
    ctx.fill();
    ctx.stroke();

    // Fundo das moedas (canto superior direito)
    const coinHudWidth = 180;
    ctx.beginPath();
    ctx.roundRect(canvas.width - coinHudWidth - 15, 15, coinHudWidth, 50, [10]);
    ctx.fill();
    ctx.stroke();

    // Fundo da info inferior direita (agora maior)
    const rightHudWidth = 280;
    ctx.beginPath();
    ctx.roundRect(canvas.width - rightHudWidth - 15, canvas.height - 155, rightHudWidth, 140, [10]);
    ctx.fill();
    ctx.stroke();
}

function drawHudText(me) {
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';

    // Timer/Mensagem
    ctx.font = '40px Arial';
    if (gameState.gamePhase === 'waiting') {
        const seconds = gameState.startTime % 60;
        ctx.fillText(`0:${String(seconds).padStart(2, '0')}`, canvas.width / 2, 80);
        ctx.font = '30px Arial';
        ctx.fillText('The round starts in...', canvas.width / 2, 45);
    } else if (gameState.gamePhase === 'post-round') {
        const seconds = gameState.postRoundTimeLeft;
        ctx.fillText(`Restarting in: ${seconds}`, canvas.width / 2, 55);
        ctx.font = '30px Arial';
        ctx.fillStyle = 'orange';
        ctx.fillText('Round Over!', canvas.width / 2, 90);
    } else {
        const minutes = Math.floor(gameState.timeLeft / 60);
        const seconds = gameState.timeLeft % 60;
        ctx.fillText(`${minutes}:${String(seconds).padStart(2, '0')}`, canvas.width / 2, 55);
        ctx.font = '30px Arial';
        ctx.fillStyle = me.role === 'zombie' ? '#2ecc71' : 'blue';
        ctx.fillText(me.role === 'zombie' ? 'INFECT THE HUMANS!' : 'SURVIVE!', canvas.width / 2, 90);
    }

    // Moedas
    ctx.font = '30px Arial';
    ctx.fillStyle = 'gold';
    ctx.textAlign = 'right';
    ctx.fillText(`🪙 ${me.coins}`, canvas.width - 35, 52);

    // Info da Habilidade e Status (canto inferior direito)
    ctx.textAlign = 'right';
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';

    // Velocidade e Nome da Habilidade
    const abilityText = me.role === 'zombie' ? (me.zombieAbility || 'NONE').toUpperCase() : me.activeAbility.toUpperCase();
    ctx.fillText(`SPEED: ${Math.max(0, me.speed - 1).toFixed(2)}`, canvas.width - 30, canvas.height - 25);
    ctx.fillText(`ABILITY: ${abilityText}`, canvas.width - 30, canvas.height - 60);

    // Info específica da habilidade/item
    const yPos = canvas.height - 95;

    if (me.role !== 'zombie') {
        if (me.activeAbility === 'archer') {
            ctx.fillText(`AMMO: ${me.arrowAmmo}`, canvas.width - 30, yPos);
        } else if (me.inventory && me.inventory.id === 'drone' && gameState.drones[me.id]) {
            ctx.fillText(`GRENADES: ${gameState.drones[me.id].ammo}`, canvas.width - 30, yPos);
        } else if (me.inventory && me.inventory.id === 'gravityGlove') {
            ctx.fillStyle = 'white';
            const uses = (typeof me.inventory.uses === 'number') ? me.inventory.uses : 'N/A';
            ctx.fillText(`GLOVE USES: ${uses}`, canvas.width - 30, yPos);
        } else if (me.activeAbility === 'engineer') {
            if (Date.now() < (me.engineerCooldownUntil || 0)) {
                const remaining = Math.ceil((me.engineerCooldownUntil - Date.now()) / 1000);
                ctx.fillStyle = 'red';
                ctx.fillText(`DUCTS: ${remaining}s`, canvas.width - 30, yPos);
            } else {
                ctx.fillStyle = 'lightgreen';
                ctx.fillText(`DUCTS: READY`, canvas.width - 30, yPos);
            }
        } else if (me.activeAbility === 'athlete') {
            ctx.fillStyle = me.sprintAvailable ? 'lightgreen' : 'red';
            ctx.fillText(`SPRINT: ${me.sprintAvailable ? 'READY' : 'RECHARGING'}`, canvas.width - 30, yPos);
        } else if (me.activeAbility === 'illusionist') {
            ctx.fillStyle = me.illusionistAvailable ? 'lightgreen' : 'red';
            ctx.fillText(`ILLUSION: ${me.illusionistAvailable ? 'READY' : 'RECHARGING'}`, canvas.width - 30, yPos);
        } else if (me.activeAbility === 'butterfly') {
            let statusText;
            if (me.isFlying) {
                statusText = 'FLYING!';
                ctx.fillStyle = 'cyan';
            } else if (me.butterflyUsed) {
                statusText = 'USED';
                ctx.fillStyle = 'darkred';
            } else {
                statusText = 'READY';
                ctx.fillStyle = 'lightgreen';
            }
            ctx.fillText(`BUTTERFLY: ${statusText}`, canvas.width - 30, yPos);
        } else if (me.activeAbility === 'spy') {
            let statusText;
            if (me.isSpying) {
                statusText = 'ACTIVE';
                ctx.fillStyle = 'yellow';
            } else if (me.spyUsesLeft > 0 && !me.spyCooldown) {
                statusText = 'READY';
                ctx.fillStyle = 'lightgreen';
            } else {
                statusText = 'RECHARGING';
                ctx.fillStyle = 'red';
            }
            if (me.spyUsesLeft === 0 && !me.isSpying) {
                statusText = 'NO USES';
                ctx.fillStyle = 'darkred';
            }
            ctx.fillText(`SPYING: ${statusText}`, canvas.width - 30, yPos);
            ctx.font = '20px Arial';
            ctx.fillStyle = 'white';
            ctx.fillText(`USES LEFT: ${me.spyUsesLeft}`, canvas.width - 30, yPos + 30);
        }
    } else { // HUD do Zombie
        ctx.fillStyle = 'white';
        if (me.zombieAbility === 'trap') {
            ctx.fillText(`TRAPS: ${me.trapsLeft}`, canvas.width - 30, yPos);
        }
    }
}


function drawInventory() {
    const me = gameState.players[myId];
    if (!me || me.role === 'zombie') return;
    const slotSize = 80;
    const slotX = canvas.width / 2 - slotSize / 2;
    const slotY = canvas.height - slotSize - 20;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(slotX, slotY, slotSize, slotSize, [10]);
    ctx.fill();
    ctx.stroke();

    if (me.inventory) {
        const sprite = itemSprites[me.inventory.id];
        if (sprite && sprite.complete) {
            if (me.inventory.id === 'invisibilityCloak' && me.inventory.active) {
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

            if (me.inventory.id === 'invisibilityCloak' && me.inventory.active) {
                ctx.restore();
            }
        }
    }
}

function drawChat() {
    if (chatMessages.length === 0) return;
    ctx.save();
    const chatInputAndMargin = 60;
    const chatBoxPadding = 10;
    const lineHeight = 25;
    const chatBoxHeight = (chatMessages.length * lineHeight) + (chatBoxPadding * 2);
    const chatBoxWidth = 550;
    const chatBoxX = 15;
    const chatBoxY = canvas.height - chatInputAndMargin - chatBoxHeight;

    ctx.fillStyle = 'rgba(20, 20, 20, 0.7)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(chatBoxX, chatBoxY, chatBoxWidth, chatBoxHeight, [8]);
    ctx.fill();
    ctx.stroke();

    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    chatMessages.forEach((msg, index) => {
        const messageY = chatBoxY + chatBoxPadding + (index * lineHeight);
        const messageX = chatBoxX + chatBoxPadding;

        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = msg.name === 'Server' ? '#FFD700' : '#2ecc71';
        ctx.fillText(msg.name + ':', messageX, messageY);

        ctx.font = '18px Arial';
        ctx.fillStyle = 'white';
        const nameWidth = ctx.measureText(msg.name + ': ').width;
        ctx.fillText(msg.text, messageX + nameWidth, messageY);
    });
    ctx.restore();
}

function drawMenu() {
    const me = gameState.players[myId];
    if (!me) return;
    (me.role === 'zombie') ? drawZombieMenu(me): drawHumanMenu(me);
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

    const abilitiesTabBtn = getZombieAbilitiesTabRect();
    ctx.fillStyle = activeMenuTab === 'zombie_items' ? '#2e0000' : '#602020';
    ctx.fillRect(abilitiesTabBtn.x, abilitiesTabBtn.y, abilitiesTabBtn.width, abilitiesTabBtn.height);
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ITEMS', abilitiesTabBtn.x + abilitiesTabBtn.width / 2, abilitiesTabBtn.y + 40);

    if (activeMenuTab === 'zombie_items') {
        ctx.font = '50px Arial';
        ctx.fillText('ZOMBIE ITEMS', canvas.width / 2, menuY + 140);
        if (!me.zombieAbility) {
            const {
                buttons
            } = getZombieItemsLayout();
            buttons.forEach(btn => {
                const canAfford = me.coins >= btn.price;
                ctx.fillStyle = canAfford ? '#4B0000' : '#1a0000';
                ctx.fillRect(btn.rect.x, btn.rect.y, btn.rect.width, btn.rect.height);
                ctx.strokeStyle = canAfford ? '#FF4500' : '#666';
                ctx.lineWidth = 2;
                ctx.strokeRect(btn.rect.x, btn.rect.y, btn.rect.width, btn.rect.height);
                ctx.textAlign = 'center';
                ctx.font = '20px Arial';
                ctx.fillStyle = canAfford ? 'white' : '#999';
                ctx.fillText(btn.text, btn.rect.x + btn.rect.width / 2, btn.rect.y + 35);
                ctx.font = '14px Arial';
                ctx.fillStyle = canAfford ? '#ccc' : '#888';
                ctx.fillText(btn.description, btn.rect.x + btn.rect.width / 2, btn.rect.y + 65);
                ctx.font = '24px Arial';
                ctx.fillStyle = canAfford ? 'gold' : 'red';
                const costText = `🪙 ${btn.price}`;
                ctx.textAlign = 'right';
                ctx.fillText(costText, btn.rect.x + btn.rect.width - 15, btn.rect.y + btn.rect.height - 15);
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
    const atmObject = gameState.furniture.find(item => item.id === 'atm');
    let isNearATM = false;
    if (atmObject) {
        const dx = (me.x + me.width / 2) - (atmObject.x + atmObject.width / 2);
        const dy = (me.y + me.height / 2) - (atmObject.y + atmObject.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        isNearATM = distance < 250;
    }
    if (!isNearATM && activeMenuTab === 'rare_items') activeMenuTab = 'items';

    const menuWidth = 1500,
        menuHeight = 900;
    const menuX = (canvas.width - menuWidth) / 2,
        menuY = (canvas.height - menuHeight) / 2;

    ctx.fillStyle = 'rgba(17, 14, 14, 0.90)';
    ctx.fillRect(menuX, menuY, menuWidth, menuHeight);
    ctx.strokeStyle = '#616161ff';
    ctx.lineWidth = 5;
    ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);

    const abilitiesTabBtn = getAbilitiesTabRect();
    const itemsTabBtn = getItemsTabRect();
    ctx.fillStyle = activeMenuTab === 'abilities' ? '#000000ff' : '#444';
    ctx.fillRect(abilitiesTabBtn.x, abilitiesTabBtn.y, abilitiesTabBtn.width, abilitiesTabBtn.height);
    ctx.fillStyle = activeMenuTab === 'items' ? '#000000ff' : '#444';
    ctx.fillRect(itemsTabBtn.x, itemsTabBtn.y, itemsTabBtn.width, itemsTabBtn.height);
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ABILITIES', abilitiesTabBtn.x + abilitiesTabBtn.width / 2, abilitiesTabBtn.y + 40);
    ctx.fillText('ITEMS', itemsTabBtn.x + itemsTabBtn.width / 2, itemsTabBtn.y + 40);

    if (isNearATM) {
        const rareItemsTabBtn = getRareItemsTabRect();
        ctx.fillStyle = activeMenuTab === 'rare_items' ? '#000000ff' : '#444';
        ctx.fillRect(rareItemsTabBtn.x, rareItemsTabBtn.y, rareItemsTabBtn.width, rareItemsTabBtn.height);
        ctx.fillStyle = 'white';
        ctx.fillText('RARE ITEMS', rareItemsTabBtn.x + rareItemsTabBtn.width / 2, rareItemsTabBtn.y + 40);
    }

    if (activeMenuTab === 'abilities') {
        ctx.font = '50px Arial';
        ctx.fillText('CHOOSE AN ABILITY', canvas.width / 2, menuY + 140);
        if (gameState.gamePhase === 'waiting') {
            ctx.font = '30px Arial';
            ctx.fillStyle = 'orange';
            ctx.fillText('Wait for the round to start to choose an ability!', canvas.width / 2, menuY + 180);
        }

        if (me.activeAbility === ' ') {
            const {
                buttons
            } = getAbilitiesLayout();
            buttons.forEach(btn => {
                const isLocked = gameState.gamePhase === 'waiting';
                const isTaken = gameState.takenAbilities.includes(btn.ability);
                const cost = gameState.abilityCosts[btn.ability] || 0;
                const canAfford = me.coins >= cost;
                ctx.fillStyle = isTaken || isLocked ? '#333' : (canAfford ? '#282828' : '#1a1a1a');
                ctx.fillRect(btn.rect.x, btn.rect.y, btn.rect.width, btn.rect.height);
                ctx.strokeStyle = isTaken || isLocked ? '#555' : (canAfford ? 'white' : '#666');
                ctx.lineWidth = 2;
                ctx.strokeRect(btn.rect.x, btn.rect.y, btn.rect.width, btn.rect.height);
                ctx.textAlign = 'center';
                ctx.font = '20px Arial';
                ctx.fillStyle = isTaken || isLocked ? '#888' : (canAfford ? 'white' : '#999');
                ctx.fillText(btn.text, btn.rect.x + btn.rect.width / 2, btn.rect.y + 35);
                ctx.font = '14px Arial';
                ctx.fillStyle = isTaken || isLocked ? '#777' : (canAfford ? '#ccc' : '#888');
                ctx.fillText(btn.description, btn.rect.x + btn.rect.width / 2, btn.rect.y + 65);
                ctx.font = '24px Arial';
                ctx.fillStyle = canAfford && !isLocked ? 'gold' : 'red';
                const costText = `🪙 ${cost}`;
                ctx.textAlign = 'right';
                ctx.fillText(costText, btn.rect.x + btn.rect.width - 15, btn.rect.y + btn.rect.height - 15);
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
            ctx.fillText('ABILITY ALREADY CHOSEN!', canvas.width / 2, canvas.height / 2);
        }
    } else if (activeMenuTab === 'items' || activeMenuTab === 'rare_items') {
        const isRare = activeMenuTab === 'rare_items';
        ctx.font = '50px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(isRare ? 'RARE ITEMS - ATM' : 'ITEMS SHOP', canvas.width / 2, menuY + 140);
        const hasCard = me.inventory && me.inventory.id === 'card';
        if (isRare && !hasCard) {
            ctx.font = '30px Arial';
            ctx.fillStyle = 'orange';
            ctx.fillText('You need an ATM Card to buy these items!', canvas.width / 2, menuY + 180);
        }
        const {
            buttons
        } = isRare ? getRareItemsLayout() : getItemsLayout();
        buttons.forEach(btn => {
            const canAfford = me.coins >= btn.price;
            const alreadyOwned = me.inventory && me.inventory.id === btn.id;
            const inventoryFull = me.inventory !== null && !alreadyOwned;
            const canBuy = isRare ? (canAfford && hasCard && !alreadyOwned) : (canAfford && !alreadyOwned && !inventoryFull);
            ctx.fillStyle = canBuy ? '#282828' : '#1a1a1a';
            ctx.fillRect(btn.rect.x, btn.rect.y, btn.rect.width, btn.rect.height);
            ctx.strokeStyle = canBuy ? 'white' : '#666';
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
                ctx.drawImage(sprite, btn.rect.x + 15 + (100 - drawWidth) / 2, btn.rect.y + (btn.rect.height - 120) / 2 + (120 - drawHeight) / 2, drawWidth, drawHeight);
            }
            ctx.textAlign = 'left';
            ctx.font = '20px Arial';
            ctx.fillStyle = canBuy ? 'white' : '#999';
            ctx.fillText(btn.text, btn.rect.x + 130, btn.rect.y + 50);
            ctx.font = '12px Arial';
            ctx.fillStyle = canBuy ? '#ccc' : '#888';
            ctx.fillText(btn.description, btn.rect.x + 130, btn.rect.y + 85);
            ctx.font = '24px Arial';
            ctx.fillStyle = canAfford ? 'gold' : 'red';
            const costText = `🪙 ${btn.price}`;
            ctx.textAlign = 'right';
            ctx.fillText(costText, btn.rect.x + btn.rect.width - 20, btn.rect.y + btn.rect.height - 20);
            if (alreadyOwned) {
                ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
                ctx.textAlign = 'center';
                ctx.font = 'bold 20px Arial';
                ctx.fillText('OWNED', btn.rect.x + btn.rect.width / 2 + 50, btn.rect.y + 120);
            }
        });
    }
    ctx.font = '20px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('PRESS "B" TO CLOSE', canvas.width / 2 + 580, menuY + menuHeight - 20);
}

// =================================================================
// region: HELPERS
// =================================================================
function getAbilitiesLayout() {
    const abilities = [{
        text: 'ATHLETE',
        ability: 'athlete',
        description: 'Sprint for a short duration.'
    }, {
        text: 'ARCHER',
        ability: 'archer',
        description: 'Shoot arrows to slow enemies.'
    }, {
        text: 'ENGINEER',
        ability: 'engineer',
        description: 'Travel instantly between ducts.'
    }, {
        text: 'SPY',
        ability: 'spy',
        description: 'Disguise as a zombie.'
    }, {
        text: 'ILLUSIONIST',
        ability: 'illusionist',
        description: 'Creates an illusion to mislead.'
    }, {
        text: 'BUTTERFLY',
        ability: 'butterfly',
        description: 'When caught, get a 10s flight.'
    }, ];
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
        buttons: abilities.map((ability, index) => ({
            ...ability,
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
        description: 'Place a trap to immobilize humans.',
        price: 50
    }, ];
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
        buttons: abilities.map((ability, index) => ({
            ...ability,
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
        id: 'forceDrum',
        text: 'DRUM',
        description: "Pushes objects with more force",
        price: 100,
        sprite: drumSprite
    }, {
        id: 'gravityGlove',
        text: 'GRAVITY GLOVE',
        description: 'Pick up (E) and drop (G) objects.',
        price: 100,
        sprite: gravityGloveSprite
    }, {
        id: 'antidote',
        text: 'ANTIDOTE',
        description: 'Press C to consume.',
        price: 20,
        sprite: antidoteSprite
    }, ];
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
        buttons: items.map((item, index) => ({
            ...item,
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
        id: 'skateboard',
        text: 'SKATEBOARD',
        description: 'Move faster',
        price: 100,
        sprite: skateboardSprite
    }, {
        id: 'drone',
        text: 'DRONE',
        description: 'Throws grenades',
        price: 200,
        sprite: droneSprite
    }, {
        id: 'invisibilityCloak',
        text: 'CLOAK',
        description: 'Become invisible',
        price: 200,
        sprite: invisibilityCloakSprite
    }, {
        id: 'zoom',
        text: 'ZOOM',
        description: 'Gives 20% camera zoom.',
        price: 150,
        sprite: zoomSprite
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
        buttons: rareItems.map((item, index) => ({
            ...item,
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
    const zoomLevel = (player.inventory && player.inventory.id === 'zoom') ? 1.2 : 1.0;
    const cx = canvas.width / (2 * zoomLevel);
    const cy = canvas.height / (2 * zoomLevel);
    const dx = mouse.x / zoomLevel - cx;
    const dy = mouse.y / zoomLevel - cy;
    return Math.atan2(dy, dx);
}

function getAbilitiesTabRect() {
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

function getRareItemsTabRect() {
    const mX = (canvas.width - 1500) / 2,
        mY = (canvas.height - 900) / 2;
    return {
        x: mX + 430,
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

// =================================================================
// region: GAME LOOP
// =================================================================
function gameLoop() {
    if (myId && gameState.players[myId] && !document.getElementById('nickname-container') && !document.getElementById('how-to-play-container')) {
        const me = gameState.players[myId];
        const rot = getPlayerAngle(me);
        const zoomLevel = (me.inventory && me.inventory.id === 'zoom') ? 1.2 : 1.0;
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

gameLoop();