// src/dev/ui/topBar.js
import { createPanel } from './domUtils.js';

export class TopBar {
    constructor(devMode, container) {
        this.devMode = devMode;
        this.parentContainer = container;
        this.element = null;
        this.init();
    }

    init() {
        const bar = document.createElement('div');
        bar.className = 'dev-top-bar';
        this.element = bar;

        // Dev Mode Menu
        this._createMenu(bar, 'Dev Mode', [
            { label: 'Resume Game', action: () => this.devMode.disable() },
            { separator: true },
            { label: 'Save Map', shortcut: 'Ctrl+S', action: () => this.devMode.saveMap() },
            { label: 'Load Map...', action: () => this._triggerLoad() },
            { separator: true },
            { label: 'Clear Map', action: () => { if(confirm('Clear map?')) this.devMode.clearMap(); } },
            { label: 'Exit Dev Mode', action: () => this.devMode.disable() }
        ]);

        // Edit Menu
        this._createMenu(bar, 'Edit', [
            { label: 'Undo', shortcut: 'Ctrl+Z', action: () => this.devMode.history.undo() },
            { label: 'Redo', shortcut: 'Ctrl+Y', action: () => this.devMode.history.redo() },
            { separator: true },
            { label: 'Copy', shortcut: 'Ctrl+C', action: () => this.devMode.copySelected() },
            { label: 'Paste', shortcut: 'Ctrl+V', action: () => this.devMode.pasteClipboard() },
            { label: 'Duplicate', shortcut: 'Ctrl+D', action: () => this.devMode.duplicateSelected() },
            { label: 'Delete', shortcut: 'Del', action: () => this.devMode.deleteSelected() }
        ]);

        // View Menu (Tools)
        this._createMenu(bar, 'View', [
             { label: 'Toggle Grid', action: () => {
                 this.devMode.grid.enabled = !this.devMode.grid.enabled;
                 this.devMode.grid.helper.visible = this.devMode.grid.enabled;
             }},
             { label: 'Toggle HUD', action: () => {
                 const hud = document.querySelector('.hud-container');
                 if(hud) hud.style.display = hud.style.display === 'none' ? 'block' : 'none';
             }},
             { label: 'Toggle Performance Stats', action: () => this.devMode.performanceMonitor.toggle() }
        ]);

        this.parentContainer.appendChild(bar);

        // Close menus when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dev-menu-btn')) {
                document.querySelectorAll('.dev-dropdown').forEach(d => d.classList.remove('visible'));
                document.querySelectorAll('.dev-menu-btn').forEach(b => b.classList.remove('active'));
            }
        });
    }

    _createMenu(parent, label, items) {
        const container = document.createElement('div');
        container.style.position = 'relative';

        const btn = document.createElement('button');
        btn.className = 'dev-menu-btn';
        btn.textContent = label;

        const dropdown = document.createElement('div');
        dropdown.className = 'dev-dropdown';

        btn.onclick = (e) => {
            e.stopPropagation();
            const wasVisible = dropdown.classList.contains('visible');
            // Close all others
            document.querySelectorAll('.dev-dropdown').forEach(d => d.classList.remove('visible'));
            document.querySelectorAll('.dev-menu-btn').forEach(b => b.classList.remove('active'));

            if (!wasVisible) {
                dropdown.classList.add('visible');
                btn.classList.add('active');
            }
        };

        items.forEach(item => {
            if (item.separator) {
                const sep = document.createElement('div');
                sep.className = 'dev-dropdown-separator';
                dropdown.appendChild(sep);
            } else {
                const div = document.createElement('div');
                div.className = 'dev-dropdown-item';

                const span = document.createElement('span');
                span.textContent = item.label;
                div.appendChild(span);

                if (item.shortcut) {
                    const sc = document.createElement('span');
                    sc.className = 'dev-dropdown-shortcut';
                    sc.textContent = item.shortcut;
                    div.appendChild(sc);
                }

                div.onclick = () => {
                    item.action();
                    dropdown.classList.remove('visible');
                    btn.classList.remove('active');
                };
                dropdown.appendChild(div);
            }
        });

        container.appendChild(btn);
        container.appendChild(dropdown);
        parent.appendChild(container);
    }

    _triggerLoad() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        fileInput.onchange = (e) => {
            if (e.target.files.length > 0) {
                this.devMode.loadMap(e.target.files[0]);
            }
        };
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    }
}
