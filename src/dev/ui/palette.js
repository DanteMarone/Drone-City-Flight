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
        tabsDiv.setAttribute('role', 'tablist');
        tabsDiv.setAttribute('aria-label', 'Asset Categories');
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
        container.appendChild(this.content);

        this.parentContainer.appendChild(container); // Append panel to root
        this.refresh();
    }

    refresh(shouldFocus = false) {
        if (!this.content) return;
        this.tabsDiv.innerHTML = '';
        this.content.innerHTML = '';

        const categories = ['All', 'Residential', 'Infrastructure', 'Vehicles', 'Nature', 'Props'];
        categories.forEach(cat => {
            const tab = document.createElement('div');
            const isActive = this.selectedCategory === cat;
            tab.className = `dev-palette-tab ${isActive ? 'active' : ''}`;
            tab.textContent = cat;
            tab.setAttribute('role', 'tab');
            tab.setAttribute('tabindex', '0');
            tab.setAttribute('aria-selected', isActive);

            tab.onclick = () => {
                this.selectedCategory = cat;
                this.refresh(true);
            };

            tab.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    tab.click();
                }
            };
            this.tabsDiv.appendChild(tab);

            if (shouldFocus && isActive) {
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
