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

    refresh() {
        if (!this.content) return;

        // Preserve focus
        const currentFocus = document.activeElement;
        let focusIndex = -1;
        if (this.tabsDiv.contains(currentFocus)) {
             focusIndex = Array.from(this.tabsDiv.children).indexOf(currentFocus);
        }

        this.tabsDiv.innerHTML = '';
        this.content.innerHTML = '';

        const categories = ['All', 'Residential', 'Infrastructure', 'Vehicles', 'Nature', 'Props'];
        categories.forEach((cat, index) => {
            const isActive = this.selectedCategory === cat;
            const tab = document.createElement('button');
            tab.className = `dev-palette-tab ${isActive ? 'active' : ''}`;
            tab.textContent = cat;
            tab.setAttribute('role', 'tab');
            tab.setAttribute('aria-selected', isActive);
            tab.setAttribute('tabindex', isActive ? '0' : '-1');

            tab.onclick = () => {
                this.selectedCategory = cat;
                this.refresh();
            };

            tab.onkeydown = (e) => {
                let nextIdx = -1;
                if (e.key === 'ArrowRight') nextIdx = (index + 1) % categories.length;
                if (e.key === 'ArrowLeft') nextIdx = (index - 1 + categories.length) % categories.length;

                if (nextIdx !== -1) {
                    e.preventDefault();
                    this.selectedCategory = categories[nextIdx];
                    this.refresh();
                    setTimeout(() => {
                        const tabs = this.tabsDiv.querySelectorAll('[role="tab"]');
                        if (tabs[nextIdx]) tabs[nextIdx].focus();
                    }, 0);
                }
            };

            this.tabsDiv.appendChild(tab);
        });

        if (focusIndex !== -1 && !this.tabsDiv.contains(document.activeElement)) {
             const tabs = this.tabsDiv.children;
             if (tabs[focusIndex]) tabs[focusIndex].focus();
        }

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
