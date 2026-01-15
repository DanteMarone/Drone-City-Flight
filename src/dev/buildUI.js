import { ThumbnailRenderer } from './thumbnailRenderer.js';
import { AlignTool } from './tools/alignTool.js';
import { CommandPalette } from './tools/commandPalette.js';
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
        this.commandPalette = null;

        // Sub-components
        this.topBar = null;
        this.toolbar = null;
        this.outliner = null;
        this.inspector = null;
        this.palette = null;
        this.history = null;

        this.saveInd = null;
        this.selectedCategory = 'All';
        this.expandedGroups = new Set(['Infrastructure', 'Residential', 'Vehicles', 'Nature', 'Props', 'Misc']);
        this.thumbnails = new Map();

        // Inspector State
        this.inspectorTab = 'Properties'; // 'Properties' | 'World'
        this.lockScale = false;

        // For polling/updates
        this.lastHistoryLen = 0;
        this.needsOutlinerUpdate = true;
        this.idCounter = 0;
    }

    init(devMode) {
        this.devMode = devMode; // Ensure it's set if passed in init
        this.alignTool = new AlignTool(devMode);
        this.commandPalette = new CommandPalette(devMode);

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

        // Resizers
        this._initResizers();

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
        if (this.history && this.devMode.history &&
            (this.devMode.history.undoStack.length + this.devMode.history.redoStack.length) !== this.history.lastHistoryLen) {
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

    // --- Resizing ---

    _initResizers() {
        // Left Resizer
        this._createResizer('v', 'dev-resizer-left', (dx, dy) => {
            const root = document.documentElement;
            const current = parseInt(getComputedStyle(root).getPropertyValue('--dev-left-width')) || 250;
            const newVal = Math.max(150, Math.min(600, current + dx));
            root.style.setProperty('--dev-left-width', `${newVal}px`);
        });

        // Right Resizer
        this._createResizer('v', 'dev-resizer-right', (dx, dy) => {
            const root = document.documentElement;
            const current = parseInt(getComputedStyle(root).getPropertyValue('--dev-right-width')) || 300;
            const newVal = Math.max(200, Math.min(600, current - dx)); // Inverted dx because dragging left increases width
            root.style.setProperty('--dev-right-width', `${newVal}px`);
        });

        // Bottom Resizer
        this._createResizer('h', 'dev-resizer-h', (dx, dy) => {
            const root = document.documentElement;
            const current = parseInt(getComputedStyle(root).getPropertyValue('--dev-bottom-height')) || 200;
            const newVal = Math.max(100, Math.min(800, current - dy)); // Inverted dy because dragging up increases height
            root.style.setProperty('--dev-bottom-height', `${newVal}px`);
        });
    }

    _createResizer(type, className, callback) {
        const resizer = document.createElement('div');
        resizer.className = `dev-resizer-${type} ${className || ''}`;
        this.container.appendChild(resizer);

        let startX = 0;
        let startY = 0;
        let active = false;

        const onMouseMove = (e) => {
            if (!active) return;
            e.preventDefault();
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            callback(dx, dy);
            startX = e.clientX;
            startY = e.clientY;
        };

        const onMouseUp = () => {
            if (active) {
                active = false;
                resizer.classList.remove('active');
                document.body.style.cursor = '';
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                // Re-enable pointer events on iframes/canvases if needed
            }
        };

        resizer.addEventListener('mousedown', (e) => {
            e.preventDefault();
            active = true;
            startX = e.clientX;
            startY = e.clientY;
            resizer.classList.add('active');
            document.body.style.cursor = type === 'v' ? 'col-resize' : 'row-resize';
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

}
