export class TopBar {
    constructor(container, devMode) {
        this.devMode = devMode;
        this.dom = document.createElement('div');
        this.dom.className = 'dev-top-bar';
        container.appendChild(this.dom);
        this._render();
        this._bindEvents();
    }

    _render() {
        this.dom.innerHTML = `
            <div class="dev-menu-bar">
                <div class="dev-menu-item" id="menu-file">File</div>
                <div class="dev-menu-item" id="menu-edit">Edit</div>
                <div class="dev-menu-item" id="menu-view">View</div>
            </div>
            <div style="flex:1"></div>
            <div class="dev-toolbar">
                <button class="dev-tool-btn" id="tool-select" title="Select (Esc)">Select</button>
                <button class="dev-tool-btn" id="tool-move" title="Move (T)">Move</button>
                <button class="dev-tool-btn" id="tool-rotate" title="Rotate (R)">Rotate</button>
                <div style="width:1px; background:#444; margin:0 5px;"></div>
                <button class="dev-tool-btn" id="tool-snap" title="Toggle Grid Snap">Snap</button>
                <button class="dev-tool-btn" id="tool-undo" title="Undo (Ctrl+Z)">↶</button>
                <button class="dev-tool-btn" id="tool-redo" title="Redo (Ctrl+Y)">↷</button>
                <div style="width:1px; background:#444; margin:0 5px;"></div>
                <button class="dev-tool-btn dev-btn-danger" id="tool-exit">Exit</button>
            </div>
        `;
    }

    _bindEvents() {
        this.dom.querySelector('#tool-select').onclick = () => {
             this.devMode.setPlacementMode(null);
        };
        this.dom.querySelector('#tool-move').onclick = () => this.devMode.gizmo.control.setMode('translate');
        this.dom.querySelector('#tool-rotate').onclick = () => this.devMode.gizmo.control.setMode('rotate');

        const snapBtn = this.dom.querySelector('#tool-snap');
        snapBtn.onclick = () => {
            if (this.devMode.grid) {
                const newVal = !this.devMode.grid.enabled;
                this.devMode.grid.setEnabled(newVal);
                this.devMode.gizmo.updateSnapping(this.devMode.grid);
                snapBtn.classList.toggle('active', newVal);
            }
        };

        this.dom.querySelector('#tool-undo').onclick = () => this.devMode.history.undo();
        this.dom.querySelector('#tool-redo').onclick = () => this.devMode.history.redo();
        this.dom.querySelector('#tool-exit').onclick = () => this.devMode.disable();

        this.dom.querySelector('#menu-file').onclick = (e) => this._showContextMenu(e, [
            { label: 'Save Map (JSON)', action: () => this.devMode.saveMap() },
            { label: 'Load Map...', action: () => this._triggerLoad() },
            { label: 'Clear Map', action: () => { if(confirm('Clear map?')) this.devMode.clearMap(); } },
            { type: 'separator' },
            { label: 'Exit Dev Mode', action: () => this.devMode.disable() }
        ]);

        this.dom.querySelector('#menu-edit').onclick = (e) => this._showContextMenu(e, [
            { label: 'Undo', action: () => this.devMode.history.undo() },
            { label: 'Redo', action: () => this.devMode.history.redo() },
            { type: 'separator' },
            { label: 'Duplicate', action: () => this.devMode.duplicateSelected && this.devMode.duplicateSelected() },
            { label: 'Delete', action: () => this.devMode.deleteSelected() },
            { label: 'Copy', action: () => this.devMode.copySelected && this.devMode.copySelected() },
            { label: 'Paste', action: () => this.devMode.pasteClipboard && this.devMode.pasteClipboard() },
        ]);

        this.dom.querySelector('#menu-view').onclick = (e) => this._showContextMenu(e, [
            { label: 'Toggle Grid', action: () => {
                if(this.devMode.grid) {
                   this.devMode.grid.setEnabled(!this.devMode.grid.enabled);
                   const snap = this.dom.querySelector('#tool-snap');
                   snap.classList.toggle('active', this.devMode.grid.enabled);
                }
            }},
            { label: 'Toggle HUD', action: () => {
                document.querySelector('.hud-container').classList.toggle('hidden');
            }}
        ]);
    }

    _triggerLoad() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            if (e.target.files.length > 0) {
                this.devMode.loadMap(e.target.files[0]);
            }
        };
        input.click();
    }

    _showContextMenu(e, items) {
        const old = document.querySelector('.dev-context-menu');
        if (old) old.remove();

        const menu = document.createElement('div');
        menu.className = 'dev-context-menu dev-panel';
        menu.style.cssText = `
            position: fixed;
            top: ${e.clientY + 10}px;
            left: ${e.clientX}px;
            z-index: 2000;
            min-width: 150px;
            border: 1px solid #444;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            padding: 5px 0;
        `;

        items.forEach(item => {
            if (item.type === 'separator') {
                const hr = document.createElement('div');
                hr.style.cssText = 'height:1px; background:#444; margin:4px 0;';
                menu.appendChild(hr);
            } else {
                const el = document.createElement('div');
                el.textContent = item.label;
                el.style.cssText = 'padding:6px 15px; cursor:pointer; font-size:13px; color:#eee;';
                el.onmouseover = () => el.style.background = '#3366ff';
                el.onmouseout = () => el.style.background = 'transparent';
                el.onclick = () => {
                    item.action();
                    menu.remove();
                };
                menu.appendChild(el);
            }
        });

        const closer = (ev) => {
            if (!menu.contains(ev.target) && ev.target !== e.target) {
                menu.remove();
                document.removeEventListener('mousedown', closer);
            }
        };
        setTimeout(() => document.addEventListener('mousedown', closer), 0);

        document.body.appendChild(menu);
    }
}
