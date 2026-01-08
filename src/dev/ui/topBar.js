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
             }}
        ]);

        this.parentContainer.appendChild(bar);

        // Close menus when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dev-menu-btn') && !e.target.closest('.dev-dropdown')) {
                this._closeAllMenus();
            }
        });
    }

    _closeAllMenus() {
        document.querySelectorAll('.dev-dropdown').forEach(d => {
            d.classList.remove('visible');
            d.setAttribute('aria-hidden', 'true');
        });
        document.querySelectorAll('.dev-menu-btn').forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-expanded', 'false');
        });
    }

    _createMenu(parent, label, items) {
        const container = document.createElement('div');
        container.style.position = 'relative';

        const btn = document.createElement('button');
        btn.className = 'dev-menu-btn';
        btn.textContent = label;
        btn.setAttribute('aria-haspopup', 'true');
        btn.setAttribute('aria-expanded', 'false');

        const dropdown = document.createElement('div');
        dropdown.className = 'dev-dropdown';
        dropdown.setAttribute('role', 'menu');
        dropdown.setAttribute('aria-label', label);
        dropdown.setAttribute('aria-hidden', 'true');

        // Toggle Menu
        btn.onclick = (e) => {
            e.stopPropagation();
            const wasVisible = dropdown.classList.contains('visible');

            this._closeAllMenus();

            if (!wasVisible) {
                dropdown.classList.add('visible');
                dropdown.setAttribute('aria-hidden', 'false');
                btn.classList.add('active');
                btn.setAttribute('aria-expanded', 'true');

                // Focus first item
                const firstItem = dropdown.querySelector('.dev-dropdown-item');
                if (firstItem) firstItem.focus();
            }
        };

        // Keyboard support for the trigger button
        btn.onkeydown = (e) => {
            if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                btn.click();
            }
        };

        items.forEach((item, index) => {
            if (item.separator) {
                const sep = document.createElement('div');
                sep.className = 'dev-dropdown-separator';
                sep.setAttribute('role', 'separator');
                dropdown.appendChild(sep);
            } else {
                const button = document.createElement('button');
                button.className = 'dev-dropdown-item';
                button.setAttribute('role', 'menuitem');
                button.tabIndex = -1; // Manage focus manually via arrow keys

                const span = document.createElement('span');
                span.textContent = item.label;
                button.appendChild(span);

                if (item.shortcut) {
                    const sc = document.createElement('span');
                    sc.className = 'dev-dropdown-shortcut';
                    sc.textContent = item.shortcut;
                    button.appendChild(sc);
                }

                button.onclick = (e) => {
                    e.stopPropagation();
                    item.action();
                    this._closeAllMenus();
                    btn.focus();
                };

                // Keyboard Navigation
                button.onkeydown = (e) => {
                    const allItems = Array.from(dropdown.querySelectorAll('.dev-dropdown-item'));
                    const currentIndex = allItems.indexOf(button);

                    if (e.key === 'Escape') {
                        this._closeAllMenus();
                        btn.focus();
                    } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        const next = allItems[currentIndex + 1] || allItems[0];
                        next.focus();
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        const prev = allItems[currentIndex - 1] || allItems[allItems.length - 1];
                        prev.focus();
                    } else if (e.key === 'Tab') {
                        // Close menu on Tab out
                        this._closeAllMenus();
                    }
                };

                dropdown.appendChild(button);
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
        fileInput.className = 'visually-hidden';
        fileInput.setAttribute('aria-hidden', 'true');
        fileInput.tabIndex = -1; // Ensure it's not tabbable
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
