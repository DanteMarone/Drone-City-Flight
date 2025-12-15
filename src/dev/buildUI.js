// src/dev/buildUI.js
import * as THREE from 'three';
import { EntityRegistry } from '../world/entities/index.js';
import { TransformCommand, PropertyChangeCommand, WaypointCommand, cloneWaypointState } from './history.js';

export class BuildUI {
    constructor(devMode) {
        this.devMode = devMode;
        this.dom = null;
        this.propPanel = null;
        this._init();
    }

    _init() {
        const div = document.createElement('div');
        div.id = 'dev-ui';
        div.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            width: 300px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            display: none;
            flex-direction: column;
            gap: 10px;
            overflow-y: auto;
            pointer-events: auto;
            z-index: 1000;
        `;

        div.innerHTML = `
            <h2>Dev Mode</h2>
            <button id="dev-exit">Exit Dev Mode</button>
            <hr style="width:100%">
            <h3>Map</h3>
            <button id="dev-clear">Clear Map</button>
            <button id="dev-save">Save Map</button>
            <label class="file-btn">
                Load Map
                <input type="file" id="dev-load" accept=".json" style="display:none">
            </label>

            <hr style="width:100%">
            <h3>Tools</h3>
            <label style="display:flex; align-items:center; gap:5px; cursor:pointer;">
                <input type="checkbox" id="dev-grid-snap"> Grid Snap
            </label>
            <!-- Removed Grid Size Input -->

            <div style="display:flex; gap:5px; margin-top:5px;">
                <button id="dev-mode-trans" style="flex:1; font-size:0.8em;">Move</button>
                <button id="dev-mode-rot" style="flex:1; font-size:0.8em;">Rotate</button>
            </div>

            <div style="display:flex; gap:5px; margin-top:5px;">
                <button id="dev-undo" style="flex:1; font-size:0.8em;">Undo</button>
                <button id="dev-redo" style="flex:1; font-size:0.8em;">Redo</button>
            </div>

            <div style="display:flex; gap:5px; margin-top:5px;">
                <button id="dev-copy" style="flex:1; font-size:0.8em;">Copy</button>
                <button id="dev-paste" style="flex:1; font-size:0.8em;">Paste</button>
                <button id="dev-duplicate" style="flex:1; font-size:0.8em;">Duplicate</button>
            </div>

            <!-- Properties flyout is created separately via _createPropertyPanel() -->

            <hr style="width:100%">
            <h3>Objects</h3>
            <div class="palette"></div>
        `;

        // CSS for palette items
        const style = document.createElement('style');
        style.textContent = `
            .palette-item {
                background: #333;
                padding: 10px;
                margin-bottom: 5px;
                cursor: grab;
                border: 1px solid #555;
            }
            .palette-item:hover { background: #444; }
            .file-btn {
                background: #444;
                padding: 5px;
                text-align: center;
                cursor: pointer;
                border: 1px solid #666;
                display: block;
            }
            /* Input styling for 7 digits */
            #dev-ui input[type="number"] {
                background: #111;
                color: white;
                border: 1px solid #444;
                padding: 2px;
                min-width: 60px; /* Ensure wide enough */
            }

            /* Properties Flyout */
            .dev-prop-flyout {
                position: fixed;
                top: 0;
                right: 0;
                bottom: 0;
                width: 350px;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                display: flex;
                flex-direction: column;
                gap: 10px;
                padding: 14px 14px 20px 14px;
                border-left: 1px solid #444;
                box-shadow: -4px 0 12px rgba(0,0,0,0.5);
                transform: translateX(100%);
                transition: transform 0.25s ease-in-out, opacity 0.25s ease-in-out;
                opacity: 0;
                pointer-events: none;
                z-index: 1500;
                overflow-y: auto;
                max-height: 100vh;
            }

            .dev-prop-flyout.open {
                transform: translateX(0);
                opacity: 1;
                pointer-events: auto;
            }

            .dev-prop-flyout h4 {
                margin: 0;
            }

            .dev-prop-grid {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
                align-items: center;
            }

            .dev-prop-pair {
                display: flex;
                align-items: center;
                gap: 2px;
                flex: 1 0 auto; /* Allow growing but set base */
            }

            .dev-prop-input {
                width: 70px;
                background: #111;
                color: white;
                border: 1px solid #444;
                padding: 2px;
            }

            .dev-prop-section {
                background: #222;
                border: 1px solid #444;
                padding: 8px;
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .dev-prop-label {
                width: 22px;
                font-size: 0.9em;
                color: #ccc;
            }

            .dev-prop-note {
                font-size: 0.8em;
                color: #aaa;
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(div);
        this.dom = div;
        this.propPanel = this._createPropertyPanel();

        this._buildPalette();
        this._bindEvents();
    }

    _createPropertyPanel() {
        const flyout = document.createElement('div');
        flyout.id = 'prop-panel';
        flyout.className = 'dev-prop-flyout';
        flyout.setAttribute('aria-hidden', 'true');

        flyout.innerHTML = `
            <h4>Properties</h4>
            <div class="dev-prop-note" id="prop-id"></div>

            <div class="dev-prop-section">
                <div class="dev-prop-grid">
                    <div class="dev-prop-pair"><label class="dev-prop-label">X</label> <input id="prop-x" class="dev-prop-input" type="number" step="1"></div>
                    <div class="dev-prop-pair"><label class="dev-prop-label">Y</label> <input id="prop-y" class="dev-prop-input" type="number" step="1"></div>
                    <div class="dev-prop-pair"><label class="dev-prop-label">Z</label> <input id="prop-z" class="dev-prop-input" type="number" step="1"></div>
                </div>
                <div class="dev-prop-grid">
                    <div class="dev-prop-pair"><label class="dev-prop-label">RX</label> <input id="prop-rx" class="dev-prop-input" type="number" step="1"></div>
                    <div class="dev-prop-pair"><label class="dev-prop-label">RY</label> <input id="prop-ry" class="dev-prop-input" type="number" step="1"></div>
                    <div class="dev-prop-pair"><label class="dev-prop-label">RZ</label> <input id="prop-rz" class="dev-prop-input" type="number" step="1"></div>
                </div>

                <div class="dev-prop-grid">
                    <div class="dev-prop-pair"><label class="dev-prop-label">SX</label> <input id="prop-sx" class="dev-prop-input" type="number" step="0.1"></div>
                    <div class="dev-prop-pair"><label class="dev-prop-label">SY</label> <input id="prop-sy" class="dev-prop-input" type="number" step="0.1"></div>
                    <div class="dev-prop-pair"><label class="dev-prop-label">SZ</label> <input id="prop-sz" class="dev-prop-input" type="number" step="0.1"></div>
                </div>
                <div style="display:flex; align-items:center; gap:5px;">
                    <input type="checkbox" id="prop-scale-lock" checked> <span style="font-size:0.85em">Lock Aspect Ratio</span>
                </div>
            </div>

            <div id="car-controls" class="dev-prop-section" style="display:none;">
                 <button id="btn-add-waypoint">Add Waypoint</button>
                 <div id="waypoint-list" style="display:flex; flex-direction:column; gap:2px;"></div>
                 <button id="btn-remove-waypoint">Remove Last Waypoint</button>
                 <div id="pickup-controls" style="display:none; flex-direction:column; gap:5px;">
                    <label style="display:flex; align-items:center; gap:5px; font-size:0.85em;">
                        Wait Time (s)
                        <input id="pickup-wait-time" type="number" min="0" step="1" style="flex:1; background:#111; color:#fff; border:1px solid #444;">
                    </label>
                 </div>
            </div>

            <div id="cow-controls" class="dev-prop-section" style="display:none;">
                <label style="display:flex; align-items:center; gap:5px; font-size:0.85em;">
                    Wander Radius (m)
                    <input id="cow-radius" type="number" min="1" step="1" style="flex:1; background:#111; color:#fff; border:1px solid #444;">
                </label>
                <label style="display:flex; align-items:center; gap:5px; font-size:0.85em;">
                    Move Time (s)
                    <input id="cow-move-time" type="number" min="0.5" step="0.5" style="flex:1; background:#111; color:#fff; border:1px solid #444;">
                </label>
                <label style="display:flex; align-items:center; gap:5px; font-size:0.85em;">
                    Stop Time (s)
                    <input id="cow-stop-time" type="number" min="0.5" step="0.5" style="flex:1; background:#111; color:#fff; border:1px solid #444;">
                </label>
            </div>

            <button id="dev-delete" style="background:#800; color:#fff;">Delete Object</button>
        `;

        document.body.appendChild(flyout);
        return flyout;
    }

    _formatDisplayName(type, classRef) {
        if (classRef?.displayName) return classRef.displayName;

        const spaced = type.replace(/([A-Z])/g, ' $1');
        return spaced.charAt(0).toUpperCase() + spaced.slice(1);
    }

    _buildPalette() {
        const palette = this.dom.querySelector('.palette');
        if (!palette) return;

        palette.innerHTML = '';

        const entries = Array.from(EntityRegistry.registry.entries());
        entries
            .map(([type, classRef]) => ({ type, name: this._formatDisplayName(type, classRef) }))
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach(({ type, name }) => {
                const item = document.createElement('div');
                item.className = 'palette-item';
                item.draggable = true;
                item.dataset.type = type;
                item.textContent = name;

                item.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('type', type);
                    this.devMode.interaction.onDragStart(type);
                });

                palette.appendChild(item);
            });
    }

    _bindEvents() {
        this.dom.querySelector('#dev-exit').onclick = () => this.devMode.disable();
        this.dom.querySelector('#dev-clear').onclick = () => this.devMode.clearMap();
        this.dom.querySelector('#dev-save').onclick = () => this.devMode.saveMap();
        this.dom.querySelector('#dev-load').onchange = (e) => {
            if (e.target.files.length > 0) {
                this.devMode.loadMap(e.target.files[0]);
                e.target.value = ''; // Reset
            }
        };

        // Tools
        const gridCheck = this.dom.querySelector('#dev-grid-snap');
        gridCheck.onchange = (e) => {
            if (this.devMode.grid) {
                this.devMode.grid.setEnabled(e.target.checked);
                this.devMode.gizmo.updateSnapping(this.devMode.grid);
            }
        };

        // Grid Size Removed

        this.dom.querySelector('#dev-mode-trans').onclick = () => {
            this.devMode.gizmo.control.setMode('translate');
        };
        this.dom.querySelector('#dev-mode-rot').onclick = () => {
            this.devMode.gizmo.control.setMode('rotate');
        };

        this.dom.querySelector('#dev-undo').onclick = () => {
            this.devMode.history.undo();
        };

        this.dom.querySelector('#dev-redo').onclick = () => {
            this.devMode.history.redo();
        };

        this.dom.querySelector('#dev-copy').onclick = () => {
            if (this.devMode.copySelected) this.devMode.copySelected();
        };

        this.dom.querySelector('#dev-paste').onclick = () => {
            if (this.devMode.pasteClipboard) this.devMode.pasteClipboard();
        };

        this.dom.querySelector('#dev-duplicate').onclick = () => {
            if (this.devMode.duplicateSelected) this.devMode.duplicateSelected();
        };

        // Properties Input Bindings
        const toRad = (deg) => deg * (Math.PI / 180);
        let transformStart = null;

        ['x', 'y', 'z', 'rx', 'ry', 'rz', 'sx', 'sy', 'sz'].forEach(axis => {
            const input = this.propPanel.querySelector(`#prop-${axis}`);
            if (input) {
                input.onfocus = () => {
                    transformStart = this.devMode.captureTransforms(this.devMode.selectedObjects);
                };

                input.onchange = (e) => {
                    const val = parseFloat(e.target.value);
                    if (isNaN(val)) return;

                    const beforeStates = transformStart || this.devMode.captureTransforms(this.devMode.selectedObjects);

                    // We need to act on the Gizmo PROXY, regardless of single or multi-select
                    // GizmoManager logic handles propagating proxy changes to objects.
                    const proxy = this.devMode.gizmo.proxy;

                    if (proxy && this.devMode.selectedObjects.length > 0) {
                        // Position
                        if (axis === 'x') proxy.position.x = val;
                        if (axis === 'y') proxy.position.y = val;
                        if (axis === 'z') proxy.position.z = val;

                        // Rotation: Inputs are Degrees, convert to Radians for Three.js
                        if (axis === 'rx') proxy.rotation.x = toRad(val);
                        if (axis === 'ry') proxy.rotation.y = toRad(val);
                        if (axis === 'rz') proxy.rotation.z = toRad(val);

                        // Scale
                        if (['sx', 'sy', 'sz'].includes(axis)) {
                            const lock = this.propPanel.querySelector('#prop-scale-lock').checked;
                            const ratio = val / (axis === 'sx' ? proxy.scale.x : axis === 'sy' ? proxy.scale.y : proxy.scale.z);

                            if (lock) {
                                proxy.scale.multiplyScalar(ratio);
                            } else {
                                if (axis === 'sx') proxy.scale.x = val;
                                if (axis === 'sy') proxy.scale.y = val;
                                if (axis === 'sz') proxy.scale.z = val;
                            }

                            // Update UI to reflect locked changes
                            if (lock) this.updateProperties(proxy);
                        }

                        // Sync proxy change to objects
                        if (this.devMode.gizmo) {
                            this.devMode.gizmo.syncProxyToObjects();
                        }

                        // Update Physics Bodies
                        if (this.devMode.app.colliderSystem) {
                            this.devMode.selectedObjects.forEach(obj => {
                                this.devMode.app.colliderSystem.updateBody(obj);
                            });
                        }

                        const afterStates = this.devMode.captureTransforms(this.devMode.selectedObjects);
                        if (this.devMode.history && this.devMode._transformsChanged(beforeStates, afterStates)) {
                            this.devMode.history.push(new TransformCommand(this.devMode, beforeStates, afterStates, 'Property transform'));
                        }
                        transformStart = null;
                    }
                };
            }
        });

        this.propPanel.querySelector('#dev-delete').onclick = () => {
            this.devMode.deleteSelected();
        };

        this.propPanel.querySelector('#btn-add-waypoint').onclick = () => {
            if (this.devMode.addWaypointToSelected) this.devMode.addWaypointToSelected();
        };

        this.propPanel.querySelector('#btn-remove-waypoint').onclick = () => {
            if (this.devMode.removeWaypointFromSelected) this.devMode.removeWaypointFromSelected();
        };

        const pickupWaitInput = this.propPanel.querySelector('#pickup-wait-time');
        if (pickupWaitInput) {
            let waitStart = null;
            pickupWaitInput.onfocus = () => {
                if (this.devMode.selectedObjects.length === 1 && this.devMode.selectedObjects[0].userData.type === 'pickupTruck') {
                    const sel = this.devMode.selectedObjects[0];
                    waitStart = sel.userData.waitTime ?? sel.userData.params?.waitTime ?? 0;
                }
            };
            pickupWaitInput.onchange = (e) => {
                const val = parseFloat(e.target.value);
                if (isNaN(val) || this.devMode.selectedObjects.length !== 1) return;

                const sel = this.devMode.selectedObjects[0];
                if (sel.userData.type !== 'pickupTruck') return;

                const before = waitStart ?? sel.userData.waitTime ?? sel.userData.params?.waitTime ?? 0;
                const next = Math.max(0, val);
                const applyWait = (value) => {
                    sel.userData.waitTime = Math.max(0, value);
                    if (sel.userData.params) sel.userData.params.waitTime = sel.userData.waitTime;
                    this.updateProperties(sel);
                };

                applyWait(next);
                // Use PropertyChangeCommand for persistence
                this.devMode.history.push(new PropertyChangeCommand(
                    this.devMode,
                    sel.userData.uuid,
                    'waitTime',
                    before,
                    next,
                    'Update pickup wait time'
                ));
                waitStart = null;
            };
        }

        // Cow Controls Logic
        const bindCowInput = (id, prop, name) => {
            const input = this.propPanel.querySelector(id);
            let startVal = null;
            if (input) {
                input.onfocus = () => {
                    if (this.devMode.selectedObjects.length === 1 && this.devMode.selectedObjects[0].userData.type === 'cow') {
                        const sel = this.devMode.selectedObjects[0];
                        const p = sel.userData.params || {};
                        startVal = p[prop] ?? sel.userData[prop] ?? 0;
                    }
                };
                input.onchange = (e) => {
                    const val = parseFloat(e.target.value);
                    if (isNaN(val) || this.devMode.selectedObjects.length !== 1) return;

                    const sel = this.devMode.selectedObjects[0];
                    if (sel.userData.type !== 'cow') return;

                    const p = sel.userData.params || {};
                    const before = startVal ?? p[prop] ?? sel.userData[prop] ?? 0;
                    const next = Math.max(0.1, val);

                    // Apply
                    const applyVal = (v) => {
                        if (!sel.userData.params) sel.userData.params = {};
                        sel.userData.params[prop] = v;
                        // Also set on root for safety as per CowEntity logic
                        sel.userData[prop] = v;
                        this.updateProperties(sel);
                    };

                    applyVal(next);

                    // History
                    this.devMode.history.push(new PropertyChangeCommand(
                        this.devMode,
                        sel.userData.uuid,
                        prop,
                        before,
                        next,
                        `Update Cow ${name}`
                    ));
                    startVal = null;
                };
            }
        };

        bindCowInput('#cow-radius', 'wanderRadius', 'Radius');
        bindCowInput('#cow-move-time', 'moveDuration', 'Move Time');
        bindCowInput('#cow-stop-time', 'stopDuration', 'Stop Time');

    }

    show() {
        this.dom.style.display = 'flex';
        // Reset state
        const gridCheck = this.dom.querySelector('#dev-grid-snap');
        if (this.devMode.grid) {
             gridCheck.checked = this.devMode.grid.enabled;
        }
    }

    hide() {
        this.dom.style.display = 'none';
    }

    showProperties(object) {
        const info = this.propPanel.querySelector('#prop-id');

        // Use selected objects array to determine title
        const count = this.devMode.selectedObjects.length;
        if (count > 1) {
            info.textContent = `Multiple Selection (${count} items)`;
        } else if (count === 1) {
            info.textContent = `Type: ${this.devMode.selectedObjects[0].userData.type || 'Unknown'}`;
        } else {
            info.textContent = '';
        }

        this.updateProperties(object);

        this.propPanel.classList.add('open');
        this.propPanel.setAttribute('aria-hidden', 'false');
    }

    updateProperties(object) {
        if (!object) return;
        const setVal = (id, val) => {
            const el = this.propPanel.querySelector(`#prop-${id}`);
            if (el && document.activeElement !== el) {
                el.value = val.toFixed(2);
            }
        };

        const toDeg = (rad) => rad * (180 / Math.PI);

        setVal('x', object.position.x);
        setVal('y', object.position.y);
        setVal('z', object.position.z);

        // Rotation: Convert Radians to Degrees for Display
        setVal('rx', toDeg(object.rotation.x));
        setVal('ry', toDeg(object.rotation.y));
        setVal('rz', toDeg(object.rotation.z));

        // Scale
        setVal('sx', object.scale.x);
        setVal('sy', object.scale.y);
        setVal('sz', object.scale.z);

        // Car Controls
        const carControls = this.propPanel.querySelector('#car-controls');
        const pickupControls = this.propPanel.querySelector('#pickup-controls');
        const cowControls = this.propPanel.querySelector('#cow-controls');

        // Show specific controls only if SINGLE selection and correct type
        if (this.devMode.selectedObjects.length === 1) {
            const sel = this.devMode.selectedObjects[0];
            const type = sel.userData.type;

            // -- Vehicles --
            if (['car', 'bicycle', 'pickupTruck'].includes(type)) {
                carControls.style.display = 'flex';
                cowControls.style.display = 'none';
                this._updateWaypointList(sel);

                if (type === 'pickupTruck') {
                    pickupControls.style.display = 'flex';
                    const waitInput = this.propPanel.querySelector('#pickup-wait-time');
                    if (waitInput && document.activeElement !== waitInput) {
                        const wait = sel.userData.waitTime ?? sel.userData.params?.waitTime ?? 10;
                        waitInput.value = wait;
                    }
                } else {
                    pickupControls.style.display = 'none';
                }
            }
            // -- Cow --
            else if (type === 'cow') {
                carControls.style.display = 'none';
                pickupControls.style.display = 'none';
                cowControls.style.display = 'flex';

                const p = sel.userData.params || {};
                const setInput = (id, val) => {
                    const el = this.propPanel.querySelector(id);
                    if (el && document.activeElement !== el) el.value = val;
                };

                setInput('#cow-radius', p.wanderRadius ?? sel.userData.wanderRadius ?? 15);
                setInput('#cow-move-time', p.moveDuration ?? sel.userData.moveDuration ?? 3);
                setInput('#cow-stop-time', p.stopDuration ?? sel.userData.stopDuration ?? 4);
            }
            else {
                carControls.style.display = 'none';
                pickupControls.style.display = 'none';
                cowControls.style.display = 'none';
            }
        } else {
            // Hide for multi-select
            carControls.style.display = 'none';
            pickupControls.style.display = 'none';
            if (cowControls) cowControls.style.display = 'none';
        }
    }

    _updateWaypointList(car) {
        const container = this.propPanel.querySelector('#waypoint-list');
        container.innerHTML = ''; // Clear

        if (!car.userData.waypoints) return;

        car.userData.waypoints.forEach((wp, index) => {
            const row = document.createElement('div');
            row.style.cssText = 'display:flex; gap:2px; align-items:center; font-size:0.8em;';
            row.innerHTML = `<label style="width:15px">${index+1}</label>`;

            ['x', 'y', 'z'].forEach(axis => {
                const input = document.createElement('input');
                input.type = 'number';
                input.step = '0.5';
                input.style.cssText = 'flex:1; width: 30px; background:#111; color:#fff; border:1px solid #444;';
                input.value = wp[axis].toFixed(2);

                input.onchange = (e) => {
                    const val = parseFloat(e.target.value);
                    if (isNaN(val)) return;
                    const before = cloneWaypointState(car);
                    wp[axis] = val;

                    if (this.devMode._syncWaypointVisuals) {
                        this.devMode._syncWaypointVisuals(car);
                    }
                    if (this.devMode.app.colliderSystem) {
                        this.devMode.app.colliderSystem.updateBody(car);
                    }

                    const after = cloneWaypointState(car);
                    this.devMode.history.push(new WaypointCommand(this.devMode, [before], [after], 'Move waypoint'));
                };
                row.appendChild(input);
            });
            container.appendChild(row);
        });
    }

    hideProperties() {
        this.propPanel.classList.remove('open');
        this.propPanel.setAttribute('aria-hidden', 'true');
    }
}
