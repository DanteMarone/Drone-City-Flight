// src/dev/ui/inspector.js
import { createPanel } from './domUtils.js';
import { PropertiesInspector } from './propertiesInspector.js';
import { WorldInspector } from './worldInspector.js';

export class Inspector {
    constructor(devMode, container, alignTool) {
        this.devMode = devMode;
        this.parentContainer = container;
        this.alignTool = alignTool;
        this.inspectorTab = 'Properties'; // 'Properties' | 'World'
        this.content = null;

        // Sub-inspectors
        this.propertiesInspector = new PropertiesInspector(devMode, alignTool);
        this.worldInspector = new WorldInspector(devMode);

        this.init();
    }

    init() {
        const panel = createPanel('dev-inspector', 'Properties'); // Title will be overwritten by tabs
        // Clear header to insert tabs
        panel.innerHTML = '';

        // Tabs Container
        const tabs = document.createElement('div');
        tabs.className = 'dev-inspector-tabs';

        ['Properties', 'World'].forEach(t => {
            const tab = document.createElement('div');
            tab.className = `dev-inspector-tab`;
            tab.textContent = t;
            tab.dataset.tab = t;
            tab.onclick = () => {
                this.inspectorTab = t;
                this.refresh();
            };
            tabs.appendChild(tab);
        });
        panel.appendChild(tabs);

        const content = document.createElement('div');
        content.className = 'dev-inspector-content';
        panel.appendChild(content);

        this.content = content; // Content area
        this.parentContainer.appendChild(panel);
    }

    refresh() {
        if (!this.content) return;
        this.content.innerHTML = '';

        // Update Tabs Active State
        const tabs = this.parentContainer.querySelectorAll('.dev-inspector-tab');
        tabs.forEach(t => {
            if (t.dataset.tab === this.inspectorTab) t.classList.add('active');
            else t.classList.remove('active');
        });

        if (this.inspectorTab === 'Properties') {
            this.propertiesInspector.render(this.content);
        } else {
            this.worldInspector.render(this.content);
        }
    }

    sync() {
        if (this.inspectorTab === 'Properties') {
            this.propertiesInspector.sync();
        }
    }

    updateProperties(obj) {
        // Called by GizmoManager when dragging
        this.sync();
    }
}
