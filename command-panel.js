// Painel de Comandos na UI
const CommandPanel = (function() {
    let panelElement = null;
    let isVisible = false;

    function createPanel() {
        if (panelElement) return;

        panelElement = document.createElement('div');
        panelElement.id = 'command-panel';
        panelElement.style.cssText = `
            position: fixed;
            right: 20px;
            top: 120px;
            width: 300px;
            max-height: 500px;
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #FFF;
            border-radius: 10px;
            padding: 15px;
            overflow-y: auto;
            z-index: 1500;
            display: none;
            font-family: Arial, sans-serif;
            font-size: 12px;
            color: #FFF;
        `;

        const title = document.createElement('h3');
        title.textContent = 'Comandos DEV';
        title.style.cssText = 'margin: 0 0 10px 0; color: #FFD700; border-bottom: 1px solid #999; padding-bottom: 8px;';
        panelElement.appendChild(title);

        const content = document.createElement('div');
        content.id = 'command-list-content';
        content.style.cssText = 'font-size: 11px; line-height: 1.6;';
        panelElement.appendChild(content);

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Fechar';
        closeBtn.style.cssText = `
            margin-top: 10px;
            width: 100%;
            padding: 8px;
            background: #333;
            color: #FFF;
            border: 1px solid #666;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
        `;
        closeBtn.addEventListener('click', () => CommandPanel.hide());
        panelElement.appendChild(closeBtn);

        document.body.appendChild(panelElement);
    }

    return {
        show: function(commands) {
            createPanel();
            const content = document.getElementById('command-list-content');
            content.innerHTML = '';

            commands.forEach(cmd => {
                const cmdDiv = document.createElement('div');
                cmdDiv.style.cssText = 'margin-bottom: 12px; border-left: 2px solid #FFF; padding-left: 8px;';
                cmdDiv.innerHTML = `
                    <div style="color: #00FF00; font-weight: bold;">${cmd.name} ${cmd.args}</div>
                    <div style="color: #AAA; font-size: 10px;">${cmd.desc}</div>
                `;
                content.appendChild(cmdDiv);
            });

            panelElement.style.display = 'block';
            isVisible = true;
        },

        hide: function() {
            if (panelElement) {
                panelElement.style.display = 'none';
                isVisible = false;
            }
        },

        toggle: function(commands) {
            if (isVisible) {
                this.hide();
            } else {
                this.show(commands);
            }
        },

        isVisible: function() {
            return isVisible;
        }
    };
})();
