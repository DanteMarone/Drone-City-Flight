// src/dev/devUI.js
import * as THREE from 'three';

export class DevUI {
    constructor(devMode) {
        this.devMode = devMode;
        this.dom = null;
        this._init();
    }

    _init() {
        const div = document.createElement('div');
        div.id = 'dev-ui';
        // Increased width to 300px
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

            <div id="prop-panel" style="display:none; flex-direction:column; gap:5px; background:#222; padding:5px; border:1px solid #444; margin-top:5px;">
                <h4 style="margin:0">Properties</h4>
                <div style="font-size:0.8em; color:#aaa;" id="prop-id"></div>

                <div style="display:flex; gap:2px; align-items: center;">
                    <label style="width:20px">X</label> <input id="prop-x" type="number" step="1" style="flex:1">
                    <label style="width:20px">Y</label> <input id="prop-y" type="number" step="1" style="flex:1">
                    <label style="width:20px">Z</label> <input id="prop-z" type="number" step="1" style="flex:1">
                </div>
                <div style="display:flex; gap:2px; align-items: center;">
                    <label style="width:20px">RX</label> <input id="prop-rx" type="number" step="1" style="flex:1">
                    <label style="width:20px">RY</label> <input id="prop-ry" type="number" step="1" style="flex:1">
                    <label style="width:20px">RZ</label> <input id="prop-rz" type="number" step="1" style="flex:1">
                </div>

                <div id="car-controls" style="display:none; flex-direction:column; gap:5px; margin-top:5px;">
                     <button id="btn-add-waypoint">Add Waypoint</button>
                     <div id="waypoint-list" style="display:flex; flex-direction:column; gap:2px;"></div>
                     <button id="btn-remove-waypoint">Remove Last Waypoint</button>
                </div>

                <button id="dev-delete" style="background:#800; color:#fff;">Delete Object</button>
            </div>

            <hr style="width:100%">
            <h3>Objects</h3>
            <div class="palette">
                <div class="palette-item" draggable="true" data-type="skyscraper">Skyscraper</div>
                <div class="palette-item" draggable="true" data-type="shop">Shop</div>
                <div class="palette-item" draggable="true" data-type="house">House</div>
                <div class="palette-item" draggable="true" data-type="road">Road</div>
                <div class="palette-item" draggable="true" data-type="ring">Ring</div>
                <div class="palette-item" draggable="true" data-type="river">River</div>
                <div class="palette-item" draggable="true" data-type="car">Car</div>
                <div class="palette-item" draggable="true" data-type="orangeTree">Orange Tree</div>
                <div class="palette-item" draggable="true" data-type="bird">Bird</div>
                <div class="palette-item" draggable="true" data-type="bush">Bush</div>
            </div>
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
        `;
        document.head.appendChild(style);

        document.body.appendChild(div);
        this.dom = div;

        this._bindEvents();
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

        // Properties Input Bindings
        const toRad = (deg) => deg * (Math.PI / 180);

        ['x', 'y', 'z', 'rx', 'ry', 'rz'].forEach(axis => {
             const input = this.dom.querySelector(`#prop-${axis}`);
             if (input) {
                 input.onchange = (e) => {
                     const val = parseFloat(e.target.value);
                     if (isNaN(val)) return;
                     const obj = this.devMode.gizmo.selectedObject;
                     if (obj) {
                         if (axis === 'x') obj.position.x = val;
                         if (axis === 'y') obj.position.y = val;
                         if (axis === 'z') obj.position.z = val;

                         // Rotation: Inputs are Degrees, convert to Radians for Three.js
                         if (axis === 'rx') obj.rotation.x = toRad(val);
                         if (axis === 'ry') obj.rotation.y = toRad(val);
                         if (axis === 'rz') obj.rotation.z = toRad(val);

                         // Sync proxy if gizmo is attached
                         if (this.devMode.gizmo) {
                             this.devMode.gizmo.syncProxyToObject();
                         }
                     }
                 };
             }
        });

        this.dom.querySelector('#dev-delete').onclick = () => {
            this.devMode.deleteSelected();
        };

        this.dom.querySelector('#btn-add-waypoint').onclick = () => {
            if (this.devMode.addWaypointToSelected) this.devMode.addWaypointToSelected();
        };

        this.dom.querySelector('#btn-remove-waypoint').onclick = () => {
            if (this.devMode.removeWaypointFromSelected) this.devMode.removeWaypointFromSelected();
        };

        // Drag Start
        const items = this.dom.querySelectorAll('.palette-item');
        items.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('type', item.dataset.type);
                this.devMode.interaction.onDragStart(item.dataset.type);
            });
        });
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
        const panel = this.dom.querySelector('#prop-panel');
        const info = this.dom.querySelector('#prop-id');
        panel.style.display = 'flex';
        info.textContent = `Type: ${object.userData.type || 'Unknown'}`;

        this.updateProperties(object);
    }

    updateProperties(object) {
        if (!object) return;
        const setVal = (id, val) => {
            const el = this.dom.querySelector(`#prop-${id}`);
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

        // Car Controls
        const carControls = this.dom.querySelector('#car-controls');
        if (object.userData.type === 'car') {
            carControls.style.display = 'flex';
            this._updateWaypointList(object);
        } else {
            carControls.style.display = 'none';
        }
    }

    _updateWaypointList(car) {
        const container = this.dom.querySelector('#waypoint-list');
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
                    wp[axis] = val;

                    // Update Visual Sphere
                    const visuals = car.getObjectByName('waypointVisuals');
                    if (visuals) {
                        const spheres = visuals.children.filter(c => c.userData.type === 'waypoint');
                        if (spheres[index]) {
                            spheres[index].position[axis] = val;
                        }
                    }

                    // Update Line
                    if (this.devMode._updateCarLine) {
                        this.devMode._updateCarLine(car);
                    }
                };
                row.appendChild(input);
            });
            container.appendChild(row);
        });
    }

    hideProperties() {
        this.dom.querySelector('#prop-panel').style.display = 'none';
    }
}
