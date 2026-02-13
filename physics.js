// Física do Jogo
const PhysicsEngine = (function() {
    return {
        updatePlayerPosition: function(player, movement, gameWorld) {
            if (!player || !movement) return;

            const accel = 1.2;
            const friction = 0.90;

            if (movement.up) player.y -= player.speed * accel;
            if (movement.down) player.y += player.speed * accel;
            if (movement.left) player.x -= player.speed * accel;
            if (movement.right) player.x += player.speed * accel;

            player.y *= friction;
            player.x *= friction;

            this.constrainToWorld(player, gameWorld);
        },

        constrainToWorld: function(player, world) {
            if (!world) return;
            player.x = Math.max(0, Math.min(player.x, world.width || 6000));
            player.y = Math.max(0, Math.min(player.y, world.height || 4000));
        },

        checkCollision: function(obj1, obj2) {
            return !(
                obj1.x + obj1.width < obj2.x ||
                obj2.x + obj2.width < obj1.x ||
                obj1.y + obj1.height < obj2.y ||
                obj2.y + obj2.height < obj1.y
            );
        },

        checkCircleCollision: function(circle1, circle2) {
            const dx = circle2.x - circle1.x;
            const dy = circle2.y - circle1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance < (circle1.radius + circle2.radius);
        },

        calculateDistance: function(x1, y1, x2, y2) {
            const dx = x2 - x1;
            const dy = y2 - y1;
            return Math.sqrt(dx * dx + dy * dy);
        },

        applyKnockback: function(player, forceX, forceY, friction = 0.95) {
            player.x += forceX;
            player.y += forceY;
            return { x: forceX * friction, y: forceY * friction };
        },

        getDirection: function(fromX, fromY, toX, toY) {
            const dx = toX - fromX;
            const dy = toY - fromY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            return { x: dx / dist, y: dy / dist };
        },

        normalizeVector: function(x, y) {
            const length = Math.sqrt(x * x + y * y);
            if (length === 0) return { x: 0, y: 0 };
            return { x: x / length, y: y / length };
        }
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhysicsEngine;
}
