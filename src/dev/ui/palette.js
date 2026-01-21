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
        // Don't rebuild tabs completely to preserve focus if possible,
        // but simple rebuild is easier for now.
        // Improvement: Only update class/aria if tabs exist.

        const categories = ['All', 'Residential', 'Infrastructure', 'Vehicles', 'Nature', 'Props'];

        if (this.tabsDiv.children.length !== categories.length) {
            this.tabsDiv.innerHTML = '';
            categories.forEach(cat => {
                const tab = document.createElement('button');
                // Use button for semantics, but ensure styling matches div.dev-palette-tab
                // The CSS .dev-palette-tab handles padding/colors.
                // We need to reset button defaults (border, bg) to avoid clashes
                tab.style.background = 'transparent';
                tab.style.border = 'none';
                tab.style.font = 'inherit';
                tab.style.borderRadius = '0';

                tab.className = 'dev-palette-tab';
                tab.textContent = cat;
                tab.role = 'tab';
                tab.id = `tab-${cat}`;
                tab.setAttribute('aria-controls', 'dev-palette-grid');

                tab.onclick = () => {
                    this.selectedCategory = cat;
                    this.refresh();
                };

                this.tabsDiv.appendChild(tab);
            });
        }

        // Update Tab States
        Array.from(this.tabsDiv.children).forEach(tab => {
            const cat = tab.textContent;
            const isActive = this.selectedCategory === cat;
            tab.className = `dev-palette-tab ${isActive ? 'active' : ''}`;
            tab.setAttribute('aria-selected', isActive);
            // Allow tabbing to all items for simple toolbar navigation
            // (Roving tabindex requires arrow key logic which is out of scope for <50 lines)
            tab.tabIndex = 0;
        });

        // Populate Grid
        this.content.innerHTML = '';
        this.content.setAttribute('aria-labelledby', `tab-${this.selectedCategory}`);

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
