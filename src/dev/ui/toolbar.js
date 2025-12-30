// src/dev/ui/toolbar.js

export class Toolbar {
    constructor(devMode, container) {
        this.devMode = devMode;
        this.parentContainer = container;
        this.element = null;
        this.init();
    }

    init() {
        const bar = document.createElement('div');
        bar.className = 'dev-toolbar';
        this.element = bar;

        const addBtn = (label, action, title='') => {
            const btn = document.createElement('div');
            btn.className = 'dev-tool-btn';
            btn.textContent = label;
            btn.title = title;
            btn.onclick = action;
            bar.appendChild(btn);
        };

        addBtn('Exit', () => this.devMode.disable(), 'Exit Dev Mode');

        const sep = document.createElement('div');
        sep.style.width = '1px';
        sep.style.height = '20px';
        sep.style.background = '#555';
        sep.style.margin = '0 5px';
        bar.appendChild(sep);

        addBtn('Undo', () => this.devMode.history.undo(), 'Ctrl+Z');
        addBtn('Redo', () => this.devMode.history.redo(), 'Ctrl+Y');

        const sep2 = sep.cloneNode();
        bar.appendChild(sep2);

        addBtn('Road', () => this.devMode.setPlacementMode('road'), 'Place Road');
        addBtn('River', () => this.devMode.setPlacementMode('river'), 'Place River');

        const sep3 = sep.cloneNode();
        bar.appendChild(sep3);

        addBtn('Grid', () => {
             this.devMode.grid.enabled = !this.devMode.grid.enabled;
             this.devMode.grid.helper.visible = this.devMode.grid.enabled;
        }, 'Toggle Grid');

        this.parentContainer.appendChild(bar);
    }
}
