import { ThumbnailRenderer } from './thumbnailRenderer.js';
import { AlignTool } from './tools/alignTool.js';
import { TopBar } from './ui/topBar.js';
import { Toolbar } from './ui/toolbar.js';
import { Outliner } from './ui/outliner.js';
import { Inspector } from './ui/inspector.js';
import { Palette } from './ui/palette.js';
import { HistoryPanel } from './ui/historyPanel.js';

export class BuildUI {
    constructor(devMode) {
        this.devMode = devMode;
        this.container = null;
        this.thumbnailRenderer = new ThumbnailRenderer();
        this.alignTool = null;

        // Sub-components
        this.topBar = null;
        this.toolbar = null;
        this.outliner = null;
        this.inspector = null;
        this.palette = null;
        this.history = null;

        this.saveInd = null;
    }

    init(devMode) {
        this.devMode = devMode; // Ensure it's set if passed in init
        this.alignTool = new AlignTool(devMode);

        // Root
        this.container = document.createElement('div');
        this.container.id = 'dev-ui';
        this.container.style.display = 'none';
        document.body.appendChild(this.container);

        // Panels
        this.topBar = new TopBar(devMode, this.container);
        this.toolbar = new Toolbar(devMode, this.container);
        this.outliner = new Outliner(devMode, this.container);
        this.history = new HistoryPanel(devMode, this.container);
        this.inspector = new Inspector(devMode, this.container, this.alignTool);
        this.palette = new Palette(devMode, this.container, this.thumbnailRenderer);

        // Save Indicator
        const saveInd = document.createElement('div');
        this.saveInd = saveInd;
        saveInd.className = 'dev-save-indicator';
        saveInd.id = 'dev-save-indicator';
        saveInd.textContent = 'Map Saved';
        this.container.appendChild(saveInd);
    }

    toggle(show) {
        if (!this.container) return;
        this.container.style.display = show ? 'flex' : 'none';
        if (show) {
            this.outliner.refresh();
            this.history.refresh();
            this.inspector.refresh();
            if (this.alignTool && this.alignTool.updateVisibility) {
                this.alignTool.updateVisibility(this.devMode.selectedObjects);
            }
        }
    }

    update(dt) {
        if (!this.container || this.container.style.display === 'none') return;

        // Sync Inspector
        this.inspector.sync();

        // Check History updates
        if (this.history && this.devMode.commandManager &&
            (this.devMode.commandManager.undoStack.length + this.devMode.commandManager.redoStack.length) !== this.history.lastHistoryLen) {
            this.history.refresh();
        }
    }

    onObjectListChanged() {
        if (this.outliner) this.outliner.refresh();
    }

    onSelectionChanged() {
        // Auto-switch to Properties if object selected
        if (this.devMode.selectedObjects.length > 0) {
            if (this.inspector) this.inspector.inspectorTab = 'Properties';
        }
        if (this.inspector) this.inspector.refresh();
        if (this.outliner) this.outliner.refresh(); // To update selection highlight

        if (this.alignTool && this.alignTool.updateVisibility) {
            this.alignTool.updateVisibility(this.devMode.selectedObjects);
        }
    }

    updateProperties(obj) {
        // Compatibility method for high-frequency updates (e.g. dragging)
        if (this.inspector) this.inspector.sync();
    }

    refreshOutliner() {
        if (this.outliner) this.outliner.refresh();
    }

    refreshHistory() {
        if (this.history) this.history.refresh();
    }

    showSaveIndicator() {
        const ind = this.saveInd;
        if (ind) {
            ind.style.display = 'block';
            ind.style.animation = 'none';
            ind.offsetHeight; /* trigger reflow */
            ind.style.animation = 'fadeOut 2s forwards 2s';
        }
    }
}
