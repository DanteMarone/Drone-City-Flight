// src/dev/ui/inspector.js
import { createPanel } from './domUtils.js';
import { InspectorWorldTab } from './inspector/worldTab.js';
import { InspectorPropertiesTab } from './inspector/propertiesTab.js';

export class Inspector {
    constructor(devMode, container, alignTool) {
        this.devMode = devMode;
        this.parentContainer = container;
        this.alignTool = alignTool;
        this.inspectorTab = 'Properties'; // 'Properties' | 'World'
        this.content = null;

        // Sub-components
        this.propertiesTab = new InspectorPropertiesTab(devMode, alignTool);
        this.worldTab = new InspectorWorldTab(devMode);

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
            this.propertiesTab.render(this.content);
        } else {
            this.worldTab.render(this.content);
        }
    }

    sync() {
        if (this.inspectorTab === 'Properties') {
            this.propertiesTab.sync();
        }
    }

    updateProperties(obj) {
        // Called by GizmoManager when dragging
        this.sync();
    }
}
