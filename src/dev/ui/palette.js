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

        const tabsDiv = document.createElement('div');
        tabsDiv.className = 'dev-palette-tabs';
        this.tabsDiv = tabsDiv;
        header.appendChild(tabsDiv);

        container.appendChild(header);

        this.content = document.createElement('div');
        this.content.className = 'dev-palette-grid';
        container.appendChild(this.content);

        this.parentContainer.appendChild(container); // Append panel to root
        this.refresh();
    }

    refresh() {
        if (!this.content) return;
        this.tabsDiv.innerHTML = '';
        this.content.innerHTML = '';

        const categories = ['All', 'Residential', 'Infrastructure', 'Vehicles', 'Nature', 'Props'];
        categories.forEach(cat => {
            const tab = document.createElement('div');
            tab.className = `dev-palette-tab ${this.selectedCategory === cat ? 'active' : ''}`;
            tab.textContent = cat;
            tab.onclick = () => {
                this.selectedCategory = cat;
                this.refresh();
            };
            this.tabsDiv.appendChild(tab);
        });

        // Populate Grid
        EntityRegistry.registry.forEach((Cls, type) => {
            const cat = getCategory(type);
            if (this.selectedCategory !== 'All' && cat !== this.selectedCategory) return;

            const item = document.createElement('div');
            item.className = 'dev-palette-item';
            item.draggable = true;

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
