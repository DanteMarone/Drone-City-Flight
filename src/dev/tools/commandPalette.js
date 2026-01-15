// src/dev/tools/commandPalette.js

export class CommandPalette {
    constructor(devMode) {
        this.devMode = devMode;
        this.isOpen = false;
        this.commands = [];
        this.filteredCommands = [];
        this.selectedIndex = 0;

        // UI Elements
        this.overlay = null;
        this.input = null;
        this.list = null;

        this._createUI();
        this._bindEvents();
    }

    _createUI() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'command-palette-overlay';

        const box = document.createElement('div');
        box.className = 'command-palette-box';

        // Header / Input
        const header = document.createElement('div');
        header.className = 'command-palette-header';

        this.input = document.createElement('input');
        this.input.className = 'command-palette-input';
        this.input.placeholder = 'Type a command...';
        this.input.setAttribute('aria-label', 'Command Palette Input');
        header.appendChild(this.input);

        // List
        this.list = document.createElement('div');
        this.list.className = 'command-palette-list';

        box.appendChild(header);
        box.appendChild(this.list);
        this.overlay.appendChild(box);

        document.body.appendChild(this.overlay);
    }

    _bindEvents() {
        // Close on overlay click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });

        // Input Handling
        this.input.addEventListener('input', () => {
            this._filterCommands(this.input.value);
            this.selectedIndex = 0;
            this._renderList();
        });

        // Keyboard Navigation
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredCommands.length - 1);
                this._renderListSelectionOnly();
                this._scrollToSelected();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
                this._renderListSelectionOnly();
                this._scrollToSelected();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                this._executeSelected();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.close();
            }
        });
    }

    toggle() {
        if (this.isOpen) this.close();
        else this.open();
    }

    open() {
        this.isOpen = true;
        this.overlay.style.display = 'flex';
        this.input.value = '';
        this.input.focus();

        // Refresh commands every open to catch new state (e.g. selection)
        this._collectCommands();
        this._filterCommands('');
        this.selectedIndex = 0;
        this._renderList();
    }

    close() {
        this.isOpen = false;
        this.overlay.style.display = 'none';

        // Return focus to game or previous element if possible?
        // Usually clicking on canvas refocuses game.
    }

    _collectCommands() {
        this.commands = [];
        const dm = this.devMode;

        // 1. General Dev Actions
        this._addCommand('Dev: Toggle Grid', () => {
             dm.grid.enabled = !dm.grid.enabled;
             dm.grid.helper.visible = dm.grid.enabled;
        }, 'Grid');

        this._addCommand('Dev: Toggle HUD', () => {
             const hud = document.querySelector('.hud-container');
             if(hud) hud.style.display = hud.style.display === 'none' ? 'block' : 'none';
        }, 'UI');

        this._addCommand('Dev: Save Map', () => dm.saveMap(), 'File', 'Ctrl+S');
        this._addCommand('Dev: Load Map', () => document.querySelector('.dev-menu-btn')?.click(), 'File'); // A bit hacky, but triggers UI flow
        this._addCommand('Dev: Clear Map', () => { if(confirm('Clear map?')) dm.clearMap(); }, 'File');
        this._addCommand('Dev: Exit Dev Mode', () => dm.disable(), 'System');

        // 2. Edit Actions
        this._addCommand('Edit: Undo', () => dm.history.undo(), 'Edit', 'Ctrl+Z');
        this._addCommand('Edit: Redo', () => dm.history.redo(), 'Edit', 'Ctrl+Y');
        this._addCommand('Edit: Delete Selected', () => dm.deleteSelected(), 'Edit', 'Del');
        this._addCommand('Edit: Duplicate Selected', () => dm.duplicateSelected(), 'Edit', 'Ctrl+D');
        this._addCommand('Edit: Copy', () => dm.copySelected(), 'Edit', 'Ctrl+C');
        this._addCommand('Edit: Paste', () => dm.pasteClipboard(), 'Edit', 'Ctrl+V');

        // 3. Environment
        if (dm.app.world.timeCycle) {
            this._addCommand('Env: Set Time Sunrise (6:00)', () => dm.app.world.timeCycle.time = 6, 'Time');
            this._addCommand('Env: Set Time Noon (12:00)', () => dm.app.world.timeCycle.time = 12, 'Time');
            this._addCommand('Env: Set Time Sunset (18:00)', () => dm.app.world.timeCycle.time = 18, 'Time');
            this._addCommand('Env: Set Time Night (24:00)', () => dm.app.world.timeCycle.time = 24, 'Time');
            this._addCommand('Env: Toggle Time Lock', () => dm.app.world.timeCycle.isLocked = !dm.app.world.timeCycle.isLocked, 'Time');
        }

        // 4. Spawning (From Palette)
        // Access palette items via BuildUI if possible, or scan registry if available.
        // We can check `dm.ui.palette.items` if exposed, but it's likely private or generated on fly.
        // Let's rely on `src/world/entities/index.js` or `ObjectRegistry`.
        // Better: Scan `dm.ui.palette.thumbnails` keys if available?
        // Or hardcode categories based on `getCategory`.

        // Let's try to access the palette registry if possible.
        // In `Palette.js`, it imports `ENTITIES`. We don't have direct access here unless passed.
        // But `DevMode` doesn't expose `ENTITIES`.
        // However, `dm.ui.palette` creates tabs based on `ENTITIES`.
        // Let's add a method to `Palette` to get available items, or just accept that we might not list all spawns yet.
        // For now, let's add generic "Placement Mode" commands if `dm.setPlacementMode` works with strings.

        ['Road', 'Sidewalk', 'River'].forEach(type => {
            this._addCommand(`Spawn: Place ${type}`, () => dm.setPlacementMode(type.toLowerCase()), 'Create');
        });

        // We can add more specific spawns if we knew the registry keys.
        // Example: 'house_01', 'tree_01'.
        // Ideally `CommandPalette` would have access to the Entity Registry.
    }

    _addCommand(label, action, category = 'General', shortcut = '') {
        this.commands.push({ label, action, category, shortcut });
    }

    _filterCommands(query) {
        if (!query) {
            this.filteredCommands = this.commands;
            return;
        }
        const lower = query.toLowerCase();
        this.filteredCommands = this.commands.filter(cmd =>
            cmd.label.toLowerCase().includes(lower) ||
            cmd.category.toLowerCase().includes(lower)
        );
    }

    _renderList() {
        this.list.innerHTML = '';

        if (this.filteredCommands.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'command-palette-empty';
            empty.textContent = 'No commands found.';
            this.list.appendChild(empty);
            return;
        }

        this.filteredCommands.forEach((cmd, index) => {
            const item = document.createElement('div');
            item.className = `command-item ${index === this.selectedIndex ? 'selected' : ''}`;

            // Content
            const labelDiv = document.createElement('div');
            labelDiv.className = 'command-item-label';

            // Icon/Category
            const icon = document.createElement('span');
            icon.className = 'command-item-icon';
            icon.textContent = this._getIconForCategory(cmd.category);
            labelDiv.appendChild(icon);

            const text = document.createElement('span');
            text.textContent = cmd.label;
            labelDiv.appendChild(text);

            item.appendChild(labelDiv);

            // Shortcut
            if (cmd.shortcut) {
                const sc = document.createElement('span');
                sc.className = 'command-item-shortcut';
                sc.textContent = cmd.shortcut;
                item.appendChild(sc);
            }

            // Click
            item.onclick = () => {
                this._execute(cmd);
            };

            // Hover
            item.onmouseenter = () => {
                this.selectedIndex = index;
                this._renderListSelectionOnly(); // Optimization: don't re-render whole list
            };

            this.list.appendChild(item);
        });
    }

    _renderListSelectionOnly() {
        // Just update classes to avoid full DOM rebuild on hover
        const items = this.list.querySelectorAll('.command-item');
        items.forEach((item, idx) => {
            if (idx === this.selectedIndex) item.classList.add('selected');
            else item.classList.remove('selected');
        });
    }

    _scrollToSelected() {
        const selected = this.list.children[this.selectedIndex];
        if (selected) {
            selected.scrollIntoView({ block: 'nearest' });
        }
    }

    _executeSelected() {
        const cmd = this.filteredCommands[this.selectedIndex];
        if (cmd) this._execute(cmd);
    }

    _execute(cmd) {
        this.close();
        cmd.action();
    }

    _getIconForCategory(cat) {
        switch(cat) {
            case 'Grid': return '▤';
            case 'UI': return '👁';
            case 'File': return '💾';
            case 'Edit': return '✎';
            case 'Time': return '🕒';
            case 'Create': return '➕';
            case 'System': return '⚙';
            default: return '•';
        }
    }
}
