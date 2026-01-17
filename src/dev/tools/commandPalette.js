export class CommandPalette {
    constructor(devMode) {
        this.devMode = devMode;
        this.visible = false;
        this.commands = [];
        this.filteredCommands = [];
        this.selectedIndex = 0;

        this._createDOM();
        this._bindEvents();
    }

    _createDOM() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'command-palette-overlay';

        this.box = document.createElement('div');
        this.box.className = 'command-palette-box';

        this.inputContainer = document.createElement('div');
        this.inputContainer.className = 'command-input-container';

        this.input = document.createElement('input');
        this.input.className = 'command-input';
        this.input.type = 'text';
        this.input.placeholder = 'Type a command...';
        this.input.setAttribute('aria-label', 'Command Palette Input');

        this.list = document.createElement('div');
        this.list.className = 'command-list';

        this.inputContainer.appendChild(this.input);
        this.box.appendChild(this.inputContainer);
        this.box.appendChild(this.list);
        this.overlay.appendChild(this.box);
        document.body.appendChild(this.overlay);
    }

    _bindEvents() {
        // Close on click outside
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });

        // Input handling
        this.input.addEventListener('input', () => {
            this._filterCommands(this.input.value);
            this.selectedIndex = 0;
            this._renderList();
        });

        // Keyboard navigation
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredCommands.length - 1);
                this._renderList();
                this._scrollToSelected();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
                this._renderList();
                this._scrollToSelected();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                this._executeSelected();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.hide();
            }
        });
    }

    toggle() {
        if (this.visible) this.hide();
        else this.show();
    }

    show() {
        this.visible = true;
        this.overlay.classList.add('visible');
        this.input.value = '';
        this.input.focus();
        this._filterCommands('');
        this.selectedIndex = 0;
        this._renderList();
    }

    hide() {
        this.visible = false;
        this.overlay.classList.remove('visible');
        // Return focus to game or previous element if possible
    }

    registerCommand(id, name, callback, shortcut = null) {
        this.commands.push({ id, name, callback, shortcut });
        // Sort alphabetically
        this.commands.sort((a, b) => a.name.localeCompare(b.name));
    }

    _filterCommands(query) {
        if (!query) {
            this.filteredCommands = this.commands;
            return;
        }
        const lowerQuery = query.toLowerCase();
        this.filteredCommands = this.commands.filter(cmd =>
            cmd.name.toLowerCase().includes(lowerQuery)
        );
    }

    _renderList() {
        this.list.innerHTML = '';
        this.filteredCommands.forEach((cmd, index) => {
            const item = document.createElement('div');
            item.className = 'command-item';
            if (index === this.selectedIndex) {
                item.classList.add('active');
            }

            const nameSpan = document.createElement('span');
            nameSpan.textContent = cmd.name;
            item.appendChild(nameSpan);

            if (cmd.shortcut) {
                const shortcutSpan = document.createElement('span');
                shortcutSpan.className = 'command-shortcut';
                shortcutSpan.textContent = cmd.shortcut;
                item.appendChild(shortcutSpan);
            }

            item.addEventListener('click', () => {
                this.selectedIndex = index;
                this._executeSelected();
            });

            item.addEventListener('mouseenter', () => {
                this.selectedIndex = index;
                this._renderList(); // Re-render to update active class
            });

            this.list.appendChild(item);
        });
    }

    _scrollToSelected() {
        const activeItem = this.list.children[this.selectedIndex];
        if (activeItem) {
            activeItem.scrollIntoView({ block: 'nearest' });
        }
    }

    _executeSelected() {
        const cmd = this.filteredCommands[this.selectedIndex];
        if (cmd) {
            this.hide();
            try {
                cmd.callback();
                // Optional: Show success notification?
            } catch (e) {
                console.error(`Command execution failed: ${e}`);
            }
        }
    }
}
