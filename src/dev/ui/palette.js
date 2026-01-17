// src/dev/ui/palette.js
import { EntityRegistry } from '../../world/entities/registry.js';
import { createPanel, getCategory } from './domUtils.js';

export class Palette {
    constructor(devMode, container, thumbnailRenderer) {
        this.devMode = devMode;
        this.parentContainer = container;
        this.thumbnailRenderer = thumbnailRenderer;
        this.content = null;
        this.tabsDiv = null;
        this.selectedCategory = 'All';
        this.searchQuery = '';
        this.thumbnails = new Map();
        this.init();
    }

    init() {
        const container = document.createElement('div');
        container.className = 'dev-palette-container dev-panel';

        // Tabs
        const header = document.createElement('div');
        header.className = 'dev-panel-header';
        header.style.padding = '0';
        header.style.justifyContent = 'flex-start';
        header.style.alignItems = 'center';

        const tabsDiv = document.createElement('div');
        tabsDiv.className = 'dev-palette-tabs';
        tabsDiv.role = 'tablist';
        tabsDiv.ariaLabel = 'Asset Categories';
        this.tabsDiv = tabsDiv;
        header.appendChild(tabsDiv);

        // Search Input
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.id = 'dev-palette-search';
        searchInput.placeholder = 'Search...';
        searchInput.ariaLabel = 'Filter objects';
        searchInput.className = 'dev-prop-input';
        searchInput.style.width = '120px';
        searchInput.style.margin = '4px';

        searchInput.oninput = (e) => {
            this.searchQuery = e.target.value;
            this.refresh();
        };
        header.appendChild(searchInput);

        container.appendChild(header);

        this.content = document.createElement('div');
        this.content.className = 'dev-palette-grid';
        this.content.id = 'dev-palette-grid';
        this.content.role = 'tabpanel';
        container.appendChild(this.content);

        this.parentContainer.appendChild(container); // Append panel to root
        this.refresh();
    }

    refresh() {
        if (!this.content) return;

        // Save focus state before rebuilding
        const activeElement = document.activeElement;
        const focusedCategory = (activeElement && activeElement.classList.contains('dev-palette-tab'))
            ? activeElement.textContent
            : null;

        this.tabsDiv.innerHTML = '';
        this.content.innerHTML = '';

        const categories = ['All', 'Residential', 'Infrastructure', 'Vehicles', 'Nature', 'Props'];
        categories.forEach(cat => {
            const tab = document.createElement('button');
            tab.className = `dev-palette-tab ${this.selectedCategory === cat ? 'active' : ''}`;
            tab.textContent = cat;

            // Accessibility
            tab.role = 'tab';
            tab.ariaSelected = this.selectedCategory === cat;
            tab.ariaControls = 'dev-palette-grid';

            // Reset button styles to match div look
            tab.style.background = 'transparent';
            tab.style.border = 'none';
            tab.style.borderRight = '1px solid #444'; // Re-apply existing style
            tab.style.color = 'inherit';
            tab.style.font = 'inherit';
            tab.style.textAlign = 'inherit';
            tab.style.padding = '6px 12px'; // Re-apply padding if needed, though class has it. Button might override.

            tab.onclick = () => {
                this.selectedCategory = cat;
                this.refresh();
            };
            this.tabsDiv.appendChild(tab);

            // Restore focus
            if (focusedCategory === cat) {
                // Defer focus to ensure DOM is ready
                setTimeout(() => tab.focus(), 0);
            }
        });

        // Populate Grid
        EntityRegistry.registry.forEach((Cls, type) => {
            // Category Filter
            const cat = getCategory(type);
            if (this.selectedCategory !== 'All' && cat !== this.selectedCategory) return;

            // Search Filter
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                const name = (Cls.displayName || type).toLowerCase();
                if (!name.includes(query)) return;
            }

            const item = document.createElement('button');
            item.className = 'dev-palette-item';
            item.draggable = true;
            item.ariaLabel = `Place ${Cls.displayName || type}`;

            // Thumbnail
            const img = document.createElement('img');
            img.className = 'dev-palette-thumb';
            if (this.thumbnails.has(type)) {
                img.src = this.thumbnails.get(type);
            } else {
                // Generate async
                setTimeout(() => {
                   const url = this.thumbnailRenderer.generate(Cls);
                   if (url) {
                       this.thumbnails.set(type, url);
                       img.src = url;
                   }
                }, 0);
            }
            item.appendChild(img);

            // Label
            const label = document.createElement('div');
            label.className = 'dev-palette-name';
            label.textContent = Cls.displayName || type;
            item.appendChild(label);

            // Drag Events
            item.ondragstart = (e) => {
                e.dataTransfer.setData('text/plain', type);
                e.dataTransfer.setData('type', type);
                if (this.devMode.interaction) {
                    this.devMode.interaction.onDragStart(type);
                }
            };
            item.ondragend = () => {
                // this.devMode.interaction.onDragEnd(); // if needed
            };

            // Click to create (fallback)
            item.onclick = () => {
                this.devMode.setPlacementMode(type);
            };

            this.content.appendChild(item);
        });
    }
}
