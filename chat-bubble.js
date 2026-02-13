// Sistema de Chat Bubble (tipo mope.io)
const ChatBubbleSystem = (function() {
    const bubbles = new Map();
    const BUBBLE_LIFETIME = 5000;
    const BUBBLE_HEIGHT = 80;

    return {
        add: function(playerId, playerName, message, x, y) {
            const bubbleId = `bubble_${playerId}_${Date.now()}`;
            bubbles.set(bubbleId, {
                id: bubbleId,
                playerId: playerId,
                playerName: playerName,
                message: message,
                startX: x,
                startY: y,
                currentX: x,
                currentY: y - BUBBLE_HEIGHT,
                startTime: Date.now(),
                lifespan: BUBBLE_LIFETIME,
                opacity: 1
            });

            setTimeout(() => {
                bubbles.delete(bubbleId);
            }, BUBBLE_LIFETIME);
        },

        update: function() {
            const now = Date.now();
            const toDelete = [];

            bubbles.forEach((bubble, id) => {
                const elapsed = now - bubble.startTime;
                const progress = elapsed / bubble.lifespan;

                if (progress >= 1) {
                    toDelete.push(id);
                    return;
                }

                bubble.currentY = bubble.startY - BUBBLE_HEIGHT - (progress * 20);
                bubble.opacity = 1 - (progress * 0.3);
            });

            toDelete.forEach(id => bubbles.delete(id));
        },

        draw: function(ctx, canvas) {
            bubbles.forEach(bubble => {
                ctx.save();
                ctx.globalAlpha = bubble.opacity;

                const bubbleWidth = Math.min(200, bubble.message.length * 8);
                const bubbleHeight = 40;
                const radius = 10;
                const x = bubble.currentX - bubbleWidth / 2;
                const y = bubble.currentY;

                ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
                ctx.strokeStyle = "#FFF";
                ctx.lineWidth = 2;

                ctx.beginPath();
                ctx.moveTo(x + radius, y);
                ctx.lineTo(x + bubbleWidth - radius, y);
                ctx.quadraticCurveTo(x + bubbleWidth, y, x + bubbleWidth, y + radius);
                ctx.lineTo(x + bubbleWidth, y + bubbleHeight - radius);
                ctx.quadraticCurveTo(x + bubbleWidth, y + bubbleHeight, x + bubbleWidth - radius, y + bubbleHeight);
                ctx.lineTo(x + radius, y + bubbleHeight);
                ctx.quadraticCurveTo(x, y + bubbleHeight, x, y + bubbleHeight - radius);
                ctx.lineTo(x, y + radius);
                ctx.quadraticCurveTo(x, y, x + radius, y);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = "#FFF";
                ctx.font = "12px Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(bubble.message.substring(0, 25), x + bubbleWidth / 2, y + bubbleHeight / 2);

                ctx.restore();
            });
        },

        getAll: function() {
            return Array.from(bubbles.values());
        },

        clear: function() {
            bubbles.clear();
        }
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatBubbleSystem;
}
