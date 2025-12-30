// src/dev/ui/outliner.js
import { createPanel, getCategory } from './domUtils.js';

export class Outliner {
    constructor(devMode, container) {
        this.devMode = devMode;
        this.parentContainer = container;
        this.content = null;
        this.expandedGroups = new Set(['Infrastructure', 'Residential', 'Vehicles', 'Nature', 'Props', 'Misc']);
        this.init();
    }

    init() {
        const panel = createPanel('dev-outliner', 'World Outliner');
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
            const cat = getCategory(entity.type || entity.constructor.name);
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(entity);
        });

        Object.keys(groups).sort().forEach(cat => {
            const groupDiv = document.createElement('div');
            groupDiv.className = `dev-outliner-group ${this.expandedGroups.has(cat) ? '' : 'collapsed'}`;

            const header = document.createElement('div');
            header.className = 'dev-outliner-group-header';
            header.textContent = `${cat} (${groups[cat].length})`;
            header.onclick = () => {
                if (this.expandedGroups.has(cat)) this.expandedGroups.delete(cat);
                else this.expandedGroups.add(cat);
                this.refresh();
            };
            groupDiv.appendChild(header);

            if (this.expandedGroups.has(cat)) {
                groups[cat].forEach(entity => {
                    const item = document.createElement('div');
                    const isSelected = this.devMode.selectedObjects.includes(entity.mesh);
                    item.className = `dev-outliner-item ${isSelected ? 'selected' : ''}`;

                    // Allow clicking anywhere on row to select
                    item.onclick = (e) => {
                        // Don't trigger if clicked on visibility toggle
                        if (e.target.classList.contains('dev-outliner-visibility')) return;
                        // Multi-select with shift
                        this.devMode.selectObject(entity.mesh, e.shiftKey);
                    };

                    const name = document.createElement('span');
                    const displayName = entity.constructor.displayName || entity.type || 'Object';
                    name.textContent = displayName;
                    item.appendChild(name);

                    // Visibility Toggle
                    const vis = document.createElement('div');
                    vis.className = `dev-outliner-visibility ${entity.mesh.visible ? '' : 'is-hidden'}`;
                    vis.title = 'Toggle Visibility';
                    vis.onclick = (e) => {
                        e.stopPropagation();
                        entity.mesh.visible = !entity.mesh.visible;
                        vis.className = `dev-outliner-visibility ${entity.mesh.visible ? '' : 'is-hidden'}`;
                    };
                    item.appendChild(vis);

                    groupDiv.appendChild(item);
                });
            }
            this.content.appendChild(groupDiv);
        });
    }
}
