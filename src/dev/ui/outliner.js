// src/dev/ui/outliner.js
import { createPanel, getCategory, makeAccessible } from './domUtils.js';

export class Outliner {
    constructor(devMode, container) {
        this.devMode = devMode;
        this.parentContainer = container;
        this.content = null;
        this.filter = '';
        this.expandedGroups = new Set(['Infrastructure', 'Residential', 'Vehicles', 'Nature', 'Props', 'Misc']);
        this.init();
    }

    init() {
        const panel = createPanel('dev-outliner', 'World Outliner');

        // Search Input
        const searchContainer = document.createElement('div');
        searchContainer.className = 'dev-outliner-search-container';
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'dev-outliner-search';
        searchInput.placeholder = 'Search objects...';
        searchInput.ariaLabel = 'Search objects';
        searchInput.addEventListener('input', (e) => {
            this.filter = e.target.value.toLowerCase();
            this.refresh();
        });
        searchContainer.appendChild(searchInput);
        panel.appendChild(searchContainer);

        this.content = document.createElement('div');
        this.content.className = 'dev-outliner-content';
        panel.appendChild(this.content);
        this.parentContainer.appendChild(panel);
    }

    refresh() {
        if (!this.content) return;
        this.content.innerHTML = '';

        const groups = {};
        const all = this.devMode.app.world.colliders;

        all.forEach(entity => {
            if (!entity.mesh) return;

            // Filtering
            const displayName = entity.constructor.displayName || entity.type || 'Object';
            const nameMatch = displayName.toLowerCase().includes(this.filter || '');
            const typeMatch = (entity.type || '').toLowerCase().includes(this.filter || '');
            if (this.filter && !nameMatch && !typeMatch) return;

            const cat = getCategory(entity.type || entity.constructor.name);
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(entity);
        });

        Object.keys(groups).sort().forEach(cat => {
            const groupDiv = document.createElement('div');
            // If filtering, expand all groups that have matches
            const isExpanded = this.filter ? true : this.expandedGroups.has(cat);
            groupDiv.className = `dev-outliner-group ${isExpanded ? '' : 'collapsed'}`;

            const header = document.createElement('div');
            header.className = 'dev-outliner-group-header';
            header.textContent = `${cat} (${groups[cat].length})`;
            header.setAttribute('aria-expanded', isExpanded);

            makeAccessible(header, () => {
                if (this.filter) return; // Disable collapsing during search
                if (this.expandedGroups.has(cat)) this.expandedGroups.delete(cat);
                else this.expandedGroups.add(cat);
                this.refresh();
            });
            groupDiv.appendChild(header);

            if (isExpanded) {
                groups[cat].forEach(entity => {
                    const item = document.createElement('div');
                    const isSelected = this.devMode.selectedObjects.includes(entity.mesh);
                    item.className = `dev-outliner-item ${isSelected ? 'selected' : ''}`;

                    // Allow clicking anywhere on row to select
                    makeAccessible(item, (e) => {
                        // Don't trigger if clicked on visibility toggle
                        if (e.target && e.target.closest('.dev-outliner-visibility')) return;
                        // Multi-select with shift
                        this.devMode.selectObject(entity.mesh, e.shiftKey);
                    });

                    const name = document.createElement('span');
                    const displayName = entity.constructor.displayName || entity.type || 'Object';
                    name.textContent = displayName;
                    item.appendChild(name);

                    // Visibility Toggle
                    const vis = document.createElement('button');
                    vis.className = `dev-btn-icon dev-outliner-visibility ${entity.mesh.visible ? '' : 'is-hidden'}`;
                    vis.innerHTML = '👁';
                    vis.title = entity.mesh.visible ? 'Hide Object' : 'Show Object';
                    vis.setAttribute('aria-label', entity.mesh.visible ? `Hide ${displayName}` : `Show ${displayName}`);
                    vis.onclick = (e) => {
                        e.stopPropagation();
                        entity.mesh.visible = !entity.mesh.visible;
                        vis.className = `dev-btn-icon dev-outliner-visibility ${entity.mesh.visible ? '' : 'is-hidden'}`;
                        vis.title = entity.mesh.visible ? 'Hide Object' : 'Show Object';
                        vis.setAttribute('aria-label', entity.mesh.visible ? `Hide ${displayName}` : `Show ${displayName}`);
                    };
                    item.appendChild(vis);

                    groupDiv.appendChild(item);
                });
            }
            this.content.appendChild(groupDiv);
        });
    }
}
