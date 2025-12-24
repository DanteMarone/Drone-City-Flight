import { TopBar } from './ui/TopBar.js';
import { Outliner } from './ui/Outliner.js';
import { Inspector } from './ui/Inspector.js';
import { AssetBrowser } from './ui/AssetBrowser.js';
import { EnvironmentPanel } from './ui/EnvironmentPanel.js';

export class BuildUI {
    constructor(devMode) {
        this.devMode = devMode;
        this.dom = null;

        // Components
        this.topBar = null;
        this.outliner = null;
        this.inspector = null;
        this.assets = null;
        this.envPanel = null;

        this._init();
    }

    _init() {
        // Create Main Container (Grid)
        const div = document.createElement('div');
        div.id = 'dev-ui';
        div.style.display = 'none'; // Hidden by default
        document.body.appendChild(div);
        this.dom = div;

        // Instantiate Components
        this.topBar = new TopBar(div, this.devMode);

        // Left Column (Outliner)
        // We need a container for the left grid area if we want multiple panels,
        // but grid-area handles it.
        this.outliner = new Outliner(div, this.devMode);

        // Right Column (Inspector + Env)
        // Create a wrapper for the right column to stack them?
        // Or assign grid areas.
        // My CSS defines 'right' area.
        const rightCol = document.createElement('div');
        rightCol.style.gridArea = 'right';
        rightCol.style.display = 'flex';
        rightCol.style.flexDirection = 'column';
        rightCol.style.height = '100%';
        rightCol.style.overflow = 'hidden';
        div.appendChild(rightCol);

        this.inspector = new Inspector(rightCol, this.devMode);
        this.envPanel = new EnvironmentPanel(rightCol, this.devMode);

        // Inspector should flex-grow, Env fixed at bottom or scroll?
        // Let's set style on the elements after creation
        this.inspector.dom.style.flex = '1';
        this.envPanel.dom.style.height = 'auto'; // or fixed

        // Bottom (Assets)
        this.assets = new AssetBrowser(div, this.devMode);
    }

    show() {
        this.dom.style.display = 'grid';
        this.envPanel.update();
        if (this.outliner) this.outliner.refresh();
    }

    hide() {
        this.dom.style.display = 'none';
    }

    // Parity: Methods called by DevMode

    showProperties(object) {
        // This was logic to open flyout.
        // Now we just update the Inspector.
        // DevMode usually calls selectObjects -> ui.onSelectionChanged?
        // Wait, DevMode.selectObject calls this.showProperties(obj)
        // But selectObjects calls this.ui.hideProperties() (bug in legacy code?)

        // Let's rely on onSelectionChanged
    }

    hideProperties() {
        // No-op or clear inspector
        // this.inspector.update([]);
    }

    onSelectionChanged(selection) {
        if (this.inspector) this.inspector.update(selection);
        if (this.outliner) this.outliner.updateSelection(selection);
    }

    update() {
        // Called every frame by DevMode?
        // BuildUI.update() was empty or unused in legacy, but let's check.
        // DevMode.update() calls this.ui.update() if it exists.
        // Legacy BuildUI didn't have update() but I added Env updating logic.

        // We can update EnvPanel if needed (e.g. time moving)
        // But EnvPanel only needs update on show or interact usually.
    }

    // Parity: Waypoint List
    // Legacy had `_updateWaypointList`. Now Inspector handles it.
    // If DevMode calls it externally, we need to map it.
    updateWaypointList(vehicle) {
        // Inspector handles this via update(selection).
        // If external logic triggers this without selection change (e.g. dragging point),
        // we might need to force inspector refresh.
        if (this.devMode.selectedObjects.includes(vehicle)) {
            this.inspector.update(this.devMode.selectedObjects);
        }
    }

    // Parity: Palette Filtering
    _filterPalette(query) {
        if (this.assets) this.assets._populate(query);
    }
}
