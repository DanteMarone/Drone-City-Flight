// src/dev/buildUI.js
import * as THREE from 'three';
import { EntityRegistry } from '../world/entities/index.js';
import { TransformCommand, PropertyChangeCommand, WaypointCommand, cloneWaypointState } from './history.js';

// =============================================================================
// INTERNAL CLASSES
// =============================================================================

class ThumbnailRenderer {
    constructor() {
        this.width = 128;
        this.height = 128;
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.queue = [];
        this.cache = new Map();
        this.isProcessing = false;

        this._init();
    }

    _init() {
        try {
            this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            this.renderer.setSize(this.width, this.height);
            this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        } catch (e) {
            console.warn("ThumbnailRenderer: Could not create WebGLRenderer", e);
            return;
        }

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x222222);

        const amb = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(amb);
        const dir = new THREE.DirectionalLight(0xffffff, 1.5);
        dir.position.set(5, 10, 7);
        this.scene.add(dir);

        this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    }

    queueThumbnail(type, callback) {
        if (this.cache.has(type)) {
            callback(this.cache.get(type));
            return;
        }
        this.queue.push({ type, callback });
        this._processQueue();
    }

    async _processQueue() {
        if (this.isProcessing || this.queue.length === 0 || !this.renderer) return;
        this.isProcessing = true;

        const requestIdleCallback = window.requestIdleCallback || (cb => setTimeout(cb, 50));

        requestIdleCallback(async () => {
            const item = this.queue.shift();
            if (item) {
                const { type, callback } = item;
                const dataUrl = await this._render(type);
                this.cache.set(type, dataUrl);
                callback(dataUrl);

                this.isProcessing = false;
                if (this.queue.length > 0) this._processQueue();
            }
        });
    }

    async _render(type) {
        const ClassRef = EntityRegistry.get(type);
        if (!ClassRef) return null;

        let mesh;
        try {
            const instance = new ClassRef({});
            if (instance.createMesh) {
                mesh = instance.createMesh({});
            } else {
                return null;
            }
        } catch (e) {
            console.warn(`ThumbnailRenderer: Failed to render ${type}`, e);
            return null;
        }

        if (!mesh) return null;

        this.scene.add(mesh);

        const box = new THREE.Box3().setFromObject(mesh);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        mesh.position.sub(center);

        const dist = maxDim * 2.0;
        this.camera.position.set(dist, dist * 0.8, dist);
        this.camera.lookAt(0, 0, 0);

        this.renderer.render(this.scene, this.camera);
        const url = this.renderer.domElement.toDataURL('image/png');

        this.scene.remove(mesh);
        mesh.traverse(o => {
            if (o.geometry) o.geometry.dispose();
        });

        return url;
    }
}

class TopBar {
    constructor(container, devMode) {
        this.devMode = devMode;
        this.dom = document.createElement('div');
        this.dom.className = 'dev-top-bar';
        container.appendChild(this.dom);
        this._render();
        this._bindEvents();
    }

    _render() {
        this.dom.innerHTML = `
            <div class="dev-menu-bar">
                <div class="dev-menu-item" id="menu-file">File</div>
                <div class="dev-menu-item" id="menu-edit">Edit</div>
                <div class="dev-menu-item" id="menu-view">View</div>
            </div>
            <div style="flex:1"></div>
            <div class="dev-toolbar">
                <button class="dev-tool-btn" id="tool-select" title="Select (Esc)">Select</button>
                <button class="dev-tool-btn" id="tool-move" title="Move (T)">Move</button>
                <button class="dev-tool-btn" id="tool-rotate" title="Rotate (R)">Rotate</button>
                <div style="width:1px; background:#444; margin:0 5px;"></div>
                <button class="dev-tool-btn" id="tool-snap" title="Toggle Grid Snap">Snap</button>
                <button class="dev-tool-btn" id="tool-undo" title="Undo (Ctrl+Z)">↶</button>
                <button class="dev-tool-btn" id="tool-redo" title="Redo (Ctrl+Y)">↷</button>
                <div style="width:1px; background:#444; margin:0 5px;"></div>
                <button class="dev-tool-btn dev-btn-danger" id="tool-exit">Exit</button>
            </div>
        `;
    }

    _bindEvents() {
        this.dom.querySelector('#tool-select').onclick = () => {
             this.devMode.setPlacementMode(null);
        };
        this.dom.querySelector('#tool-move').onclick = () => this.devMode.gizmo.control.setMode('translate');
        this.dom.querySelector('#tool-rotate').onclick = () => this.devMode.gizmo.control.setMode('rotate');

        const snapBtn = this.dom.querySelector('#tool-snap');
        snapBtn.onclick = () => {
            if (this.devMode.grid) {
                const newVal = !this.devMode.grid.enabled;
                this.devMode.grid.setEnabled(newVal);
                this.devMode.gizmo.updateSnapping(this.devMode.grid);
                snapBtn.classList.toggle('active', newVal);
            }
        };

        this.dom.querySelector('#tool-undo').onclick = () => this.devMode.history.undo();
        this.dom.querySelector('#tool-redo').onclick = () => this.devMode.history.redo();
        this.dom.querySelector('#tool-exit').onclick = () => this.devMode.disable();

        this.dom.querySelector('#menu-file').onclick = (e) => this._showContextMenu(e, [
            { label: 'Save Map (JSON)', action: () => this.devMode.saveMap() },
            { label: 'Load Map...', action: () => this._triggerLoad() },
            { label: 'Clear Map', action: () => { if(confirm('Clear map?')) this.devMode.clearMap(); } },
            { type: 'separator' },
            { label: 'Exit Dev Mode', action: () => this.devMode.disable() }
        ]);

        this.dom.querySelector('#menu-edit').onclick = (e) => this._showContextMenu(e, [
            { label: 'Undo', action: () => this.devMode.history.undo() },
            { label: 'Redo', action: () => this.devMode.history.redo() },
            { type: 'separator' },
            { label: 'Duplicate', action: () => this.devMode.duplicateSelected && this.devMode.duplicateSelected() },
            { label: 'Delete', action: () => this.devMode.deleteSelected() },
            { label: 'Copy', action: () => this.devMode.copySelected && this.devMode.copySelected() },
            { label: 'Paste', action: () => this.devMode.pasteClipboard && this.devMode.pasteClipboard() },
        ]);

        this.dom.querySelector('#menu-view').onclick = (e) => this._showContextMenu(e, [
            { label: 'Toggle Grid', action: () => {
                if(this.devMode.grid) {
                   this.devMode.grid.setEnabled(!this.devMode.grid.enabled);
                   const snap = this.dom.querySelector('#tool-snap');
                   snap.classList.toggle('active', this.devMode.grid.enabled);
                }
            }},
            { label: 'Toggle HUD', action: () => {
                document.querySelector('.hud-container').classList.toggle('hidden');
            }}
        ]);
    }

    _triggerLoad() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            if (e.target.files.length > 0) {
                this.devMode.loadMap(e.target.files[0]);
            }
        };
        input.click();
    }

    _showContextMenu(e, items) {
        const old = document.querySelector('.dev-context-menu');
        if (old) old.remove();

        const menu = document.createElement('div');
        menu.className = 'dev-context-menu dev-panel';
        menu.style.cssText = `
            position: fixed;
            top: ${e.clientY + 10}px;
            left: ${e.clientX}px;
            z-index: 2000;
            min-width: 150px;
            border: 1px solid #444;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            padding: 5px 0;
        `;

        items.forEach(item => {
            if (item.type === 'separator') {
                const hr = document.createElement('div');
                hr.style.cssText = 'height:1px; background:#444; margin:4px 0;';
                menu.appendChild(hr);
            } else {
                const el = document.createElement('div');
                el.textContent = item.label;
                el.style.cssText = 'padding:6px 15px; cursor:pointer; font-size:13px; color:#eee;';
                el.onmouseover = () => el.style.background = '#3366ff';
                el.onmouseout = () => el.style.background = 'transparent';
                el.onclick = () => {
                    item.action();
                    menu.remove();
                };
                menu.appendChild(el);
            }
        });

        const closer = (ev) => {
            if (!menu.contains(ev.target) && ev.target !== e.target) {
                menu.remove();
                document.removeEventListener('mousedown', closer);
            }
        };
        setTimeout(() => document.addEventListener('mousedown', closer), 0);

        document.body.appendChild(menu);
    }
}

class Outliner {
    constructor(container, devMode) {
        this.devMode = devMode;
        this.dom = document.createElement('div');
        this.dom.className = 'dev-panel dev-outliner';
        container.appendChild(this.dom);

        this._renderHeader();
        this._renderList();

        this.refreshInterval = setInterval(() => this.refresh(), 2000);
    }

    _renderHeader() {
        this.dom.innerHTML = `
            <div class="dev-panel-header">
                <span>World Outliner</span>
                <span id="outliner-count" style="font-weight:normal; color:#888; font-size:0.8em">0 items</span>
            </div>
            <div class="dev-panel-content" id="outliner-list"></div>
        `;
    }

    _renderList() {
    }

    refresh() {
        const list = this.dom.querySelector('#outliner-list');
        const count = this.dom.querySelector('#outliner-count');
        if (!list) return;

        const scrollTop = list.scrollTop;

        list.innerHTML = '';

        const entities = this.devMode.app.world.colliders;
        count.textContent = `${entities.length} items`;

        const groups = {
            'Vehicles': [],
            'Infrastructure': [],
            'Nature': [],
            'Props': [],
            'Other': []
        };

        entities.forEach(ent => {
            const type = ent.userData.type || 'unknown';
            if (ent.userData.isVehicle) {
                groups['Vehicles'].push(ent);
            } else if (['road', 'bridge', 'sidewalk', 'river'].includes(type)) {
                groups['Infrastructure'].push(ent);
            } else if (['tree', 'rock', 'cloud'].some(t => type.includes(t))) {
                groups['Nature'].push(ent);
            } else {
                groups['Other'].push(ent);
            }
        });

        const createItem = (ent, indent = 0) => {
            const el = document.createElement('div');
            el.className = 'dev-tree-item';

            const isSelected = this.devMode.selectedObjects.includes(ent);
            if (isSelected) el.classList.add('selected');

            const name = ent.userData.uuid ? `${ent.userData.type} (${ent.userData.uuid.substr(0,4)})` : ent.userData.type;

            el.innerHTML = `
                <span class="dev-tree-icon">${this._getIcon(ent.userData.type)}</span>
                <span>${name}</span>
                <span class="dev-tree-eye ${ent.visible ? '' : 'is-hidden'}">👁️</span>
            `;

            el.onclick = (e) => {
                if (e.target.classList.contains('dev-tree-eye')) {
                    ent.visible = !ent.visible;
                    e.target.classList.toggle('is-hidden', !ent.visible);

                    if (ent.userData.isVehicle && ent.userData.waypointGroup) {
                         ent.userData.waypointGroup.visible = ent.visible && this.devMode.enabled;
                    }

                    return;
                }

                if (e.shiftKey) {
                    const newSel = [...this.devMode.selectedObjects];
                    if (isSelected) {
                        const idx = newSel.indexOf(ent);
                        if (idx > -1) newSel.splice(idx, 1);
                    } else {
                        newSel.push(ent);
                    }
                    this.devMode.selectObjects(newSel);
                } else {
                    this.devMode.selectObjects([ent]);
                }
            };

            return el;
        };

        Object.entries(groups).forEach(([name, items]) => {
            if (items.length === 0) return;

            const groupHeader = document.createElement('div');
            groupHeader.className = 'dev-tree-item';
            groupHeader.style.fontWeight = 'bold';
            groupHeader.style.color = '#aaa';
            groupHeader.textContent = `▼ ${name} (${items.length})`;
            list.appendChild(groupHeader);

            items.forEach(ent => {
                const item = createItem(ent, 1);
                item.style.paddingLeft = '20px';
                list.appendChild(item);
            });
        });

        list.scrollTop = scrollTop;
    }

    _getIcon(type) {
        if (!type) return '📦';
        if (type.includes('vehicle') || type.includes('car')) return '🚗';
        if (type.includes('tree')) return '🌳';
        if (type.includes('road')) return '🛣️';
        if (type.includes('building') || type.includes('house')) return '🏠';
        return '📦';
    }

    updateSelection() {
        this.refresh();
    }
}

class Inspector {
    constructor(container, devMode) {
        this.devMode = devMode;
        this.dom = document.createElement('div');
        this.dom.className = 'dev-panel dev-inspector';
        container.appendChild(this.dom);

        this.currentUUIDs = [];
        this._renderBase();
    }

    _renderBase() {
        this.dom.innerHTML = `
            <div class="dev-panel-header">Inspector</div>
            <div class="dev-panel-content" id="insp-content">
                <div style="color:#888; text-align:center; padding:20px;">No Selection</div>
            </div>
        `;
    }

    update(objects) {
        const content = this.dom.querySelector('#insp-content');
        if (!objects || objects.length === 0) {
            content.innerHTML = '<div style="color:#888; text-align:center; padding:20px;">No Selection</div>';
            this.currentUUIDs = [];
            return;
        }

        const isMulti = objects.length > 1;
        const target = objects[0];
        const type = isMulti ? 'Multi-Selection' : (target.userData.type || 'Object');
        const uuid = isMulti ? `${objects.length} items` : (target.userData.uuid ? target.userData.uuid.substr(0,8) : 'N/A');

        content.innerHTML = '';

        const info = document.createElement('div');
        info.style.marginBottom = '10px';
        info.innerHTML = `
            <div style="font-size:1.1em; font-weight:bold; color:white;">${type}</div>
            <div style="font-size:0.8em; color:#666;">ID: ${uuid}</div>
        `;
        content.appendChild(info);

        this._renderTransform(content, objects);

        if (!isMulti && target.userData.params) {
            this._renderDynamicParams(content, target);
        }

        if (!isMulti && (target.userData.isVehicle || target.userData.type === 'waypoint')) {
            const vehicle = target.userData.type === 'waypoint' ? target.userData.vehicle : target;
            if (vehicle) this._renderVehicleControls(content, vehicle);
        }

        const actions = document.createElement('div');
        actions.className = 'dev-prop-section';
        actions.innerHTML = `
            <button class="dev-btn dev-btn-danger" style="width:100%" id="insp-delete">Delete Object</button>
        `;
        actions.querySelector('#insp-delete').onclick = () => this.devMode.deleteSelected();
        content.appendChild(actions);
    }

    _renderTransform(parent, objects) {
        const section = document.createElement('div');
        section.className = 'dev-prop-section';

        const proxy = this.devMode.gizmo.proxy;
        const target = (objects.length > 0 && proxy) ? proxy : objects[0];

        const createRow = (label, axis, value, step=1, callback) => {
            const row = document.createElement('div');
            row.className = 'dev-prop-row';
            row.innerHTML = `<label>${label}</label>`;

            const input = document.createElement('input');
            input.type = 'number';
            input.className = 'dev-prop-input';
            input.step = step;
            input.value = (value !== undefined) ? value.toFixed(2) : 0;

            input.onfocus = () => {
                this.devMode.captureTransforms(objects);
            };

            input.onchange = (e) => {
                const val = parseFloat(e.target.value);
                if (isNaN(val)) return;
                callback(val);

                if (this.devMode.gizmo) {
                    this.devMode.gizmo.syncProxyToObjects();
                    this.devMode.app.colliderSystem.updateBody(objects[0]);
                }
            };

            row.appendChild(input);
            return row;
        };

        const toDeg = (r) => r * (180/Math.PI);
        const toRad = (d) => d * (Math.PI/180);

        section.appendChild(createRow('Position X', 'x', target.position.x, 1, v => target.position.x = v));
        section.appendChild(createRow('Position Y', 'y', target.position.y, 1, v => target.position.y = v));
        section.appendChild(createRow('Position Z', 'z', target.position.z, 1, v => target.position.z = v));

        section.appendChild(createRow('Rotation X', 'rx', toDeg(target.rotation.x), 1, v => target.rotation.x = toRad(v)));
        section.appendChild(createRow('Rotation Y', 'ry', toDeg(target.rotation.y), 1, v => target.rotation.y = toRad(v)));
        section.appendChild(createRow('Rotation Z', 'rz', toDeg(target.rotation.z), 1, v => target.rotation.z = toRad(v)));

        // Scale Section with Lock
        const scaleSection = document.createElement('div');
        scaleSection.innerHTML = `<div style="display:flex; justify-content:space-between; margin-top:5px; margin-bottom:2px;"><span style="color:#aaa; font-size:0.9em">Scale</span><label style="font-size:0.8em; display:flex; align-items:center; gap:4px;"><input type="checkbox" id="prop-scale-lock" checked> Lock</label></div>`;
        section.appendChild(scaleSection);

        const createScaleRow = (label, axis, value, callback) => {
             const row = document.createElement('div');
            row.className = 'dev-prop-row';
            row.innerHTML = `<label>${label}</label>`;
            const input = document.createElement('input');
            input.type = 'number';
            input.className = 'dev-prop-input';
            input.step = 0.1;
            input.value = value.toFixed(2);
            input.id = `prop-${axis}`; // ID for lookup

            input.onfocus = () => this.devMode.captureTransforms(objects);

            input.onchange = (e) => {
                const val = parseFloat(e.target.value);
                if(isNaN(val)) return;

                const lock = section.querySelector('#prop-scale-lock').checked;
                // Get current scale to calculate ratio
                // Note: target is proxy or object
                const current = target.scale[axis === 'sx' ? 'x' : axis === 'sy' ? 'y' : 'z'];
                // Ratio
                const ratio = val / current;

                if (lock) {
                    target.scale.multiplyScalar(ratio);
                    // Update other inputs
                    ['sx', 'sy', 'sz'].forEach(k => {
                        const el = section.querySelector(`#prop-${k}`);
                        if(el) {
                            const ax = k === 'sx' ? 'x' : k === 'sy' ? 'y' : 'z';
                            el.value = target.scale[ax].toFixed(2);
                        }
                    });
                } else {
                    callback(val);
                }

                if (this.devMode.gizmo) {
                    this.devMode.gizmo.syncProxyToObjects();
                    this.devMode.app.colliderSystem.updateBody(objects[0]);
                }
            };
            row.appendChild(input);
            return row;
        };

        section.appendChild(createScaleRow('Scale X', 'sx', target.scale.x, v => target.scale.x = v));
        section.appendChild(createScaleRow('Scale Y', 'sy', target.scale.y, v => target.scale.y = v));
        section.appendChild(createScaleRow('Scale Z', 'sz', target.scale.z, v => target.scale.z = v));

        parent.appendChild(section);
    }

    _renderDynamicParams(parent, object) {
        const params = object.userData.params;
        const keys = Object.keys(params).filter(k => !['uuid', 'type', 'isVehicle', 'waitTime'].includes(k)); // waitTime handled separately

        if (keys.length === 0) return;

        const section = document.createElement('div');
        section.className = 'dev-prop-section';
        section.innerHTML = '<div style="margin-bottom:5px; color:#aaa; font-weight:bold;">Parameters</div>';

        keys.forEach(key => {
            const val = params[key];
            const type = typeof val;

            const row = document.createElement('div');
            row.className = 'dev-prop-row';

            const labelStr = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            row.innerHTML = `<label title="${key}">${labelStr}</label>`;

            if (type === 'number') {
                const input = document.createElement('input');
                input.type = 'number';
                input.className = 'dev-prop-input';
                input.value = val;
                input.step = val % 1 !== 0 ? 0.1 : 1;

                let startVal = null;
                input.onfocus = () => startVal = params[key];
                input.onchange = (e) => {
                    const next = parseFloat(e.target.value);
                    params[key] = next;
                    this.devMode.history.push(new PropertyChangeCommand(
                        this.devMode, object.userData.uuid, key, startVal, next, `Change ${key}`
                    ));
                    startVal = null;
                };
                row.appendChild(input);
            } else if (type === 'boolean') {
                const input = document.createElement('input');
                input.type = 'checkbox';
                input.checked = val;
                input.onchange = (e) => {
                    const next = e.target.checked;
                    params[key] = next;
                };
                row.appendChild(input);
            } else {
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'dev-prop-input';
                input.value = val;
                input.onchange = (e) => {
                     params[key] = e.target.value;
                };
                row.appendChild(input);
            }

            section.appendChild(row);
        });

        parent.appendChild(section);
    }

    _renderVehicleControls(parent, vehicle) {
        const section = document.createElement('div');
        section.className = 'dev-prop-section';
        section.innerHTML = '<div style="margin-bottom:5px; color:#aaa; font-weight:bold;">Vehicle Path</div>';

        const btnRow = document.createElement('div');
        btnRow.style.display = 'flex';
        btnRow.style.gap = '5px';
        btnRow.style.marginBottom = '10px';

        const addBtn = document.createElement('button');
        addBtn.className = 'dev-btn';
        addBtn.textContent = '+ Add Node';
        addBtn.style.flex = '1';
        addBtn.onclick = () => this.devMode.addWaypointToSelected();

        const delBtn = document.createElement('button');
        delBtn.className = 'dev-btn';
        delBtn.textContent = '- Last Node';
        delBtn.style.flex = '1';
        delBtn.onclick = () => this.devMode.removeWaypointFromSelected();

        btnRow.appendChild(addBtn);
        btnRow.appendChild(delBtn);
        section.appendChild(btnRow);

        // Wait Time Control
        // Check userData.waitTime or params.waitTime
        const currentWait = vehicle.userData.waitTime ?? vehicle.userData.params?.waitTime;
        if (currentWait !== undefined) {
             const waitRow = document.createElement('div');
             waitRow.className = 'dev-prop-row';
             waitRow.innerHTML = `<label>Wait Time</label>`;

             const waitInput = document.createElement('input');
             waitInput.type = 'number';
             waitInput.className = 'dev-prop-input';
             waitInput.value = currentWait;
             waitInput.min = 0;

             let startWait = null;
             waitInput.onfocus = () => startWait = vehicle.userData.waitTime ?? vehicle.userData.params?.waitTime;
             waitInput.onchange = (e) => {
                 const val = parseFloat(e.target.value);
                 if(isNaN(val)) return;
                 vehicle.userData.waitTime = val;
                 if(vehicle.userData.params) vehicle.userData.params.waitTime = val;

                 this.devMode.history.push(new PropertyChangeCommand(
                     this.devMode, vehicle.userData.uuid, 'waitTime', startWait, val, 'Change wait time'
                 ));
             };
             waitRow.appendChild(waitInput);
             section.appendChild(waitRow);
        }

        if (vehicle.userData.waypoints) {
            vehicle.userData.waypoints.forEach((wp, idx) => {
                const row = document.createElement('div');
                row.style.cssText = 'display:flex; gap:2px; margin-bottom:2px; align-items:center;';
                row.innerHTML = `<span style="width:15px; color:#666; font-size:0.8em;">${idx}</span>`;

                ['x', 'y', 'z'].forEach(axis => {
                    const inp = document.createElement('input');
                    inp.type = 'number';
                    inp.className = 'dev-prop-input';
                    inp.style.width = '30px';
                    inp.value = wp[axis].toFixed(1);
                    inp.onchange = (e) => {
                        wp[axis] = parseFloat(e.target.value);
                        if (this.devMode._syncWaypointVisuals) this.devMode._syncWaypointVisuals(vehicle);
                        if (this.devMode.app.colliderSystem) this.devMode.app.colliderSystem.updateBody(vehicle);
                    };
                    row.appendChild(inp);
                });
                section.appendChild(row);
            });
        }

        parent.appendChild(section);
    }
}

class AssetBrowser {
    constructor(container, devMode) {
        this.devMode = devMode;
        this.dom = document.createElement('div');
        this.dom.className = 'dev-panel dev-assets';
        container.appendChild(this.dom);

        this.thumbnailRenderer = new ThumbnailRenderer();
        this.currentTab = 'All';

        this._render();
        this._populate();
    }

    _render() {
        this.dom.innerHTML = `
            <div class="dev-tabs" id="asset-tabs">
                <div class="dev-tab active" data-cat="All">All</div>
                <div class="dev-tab" data-cat="Infrastructure">Roads</div>
                <div class="dev-tab" data-cat="Residential">Buildings</div>
                <div class="dev-tab" data-cat="Nature">Nature</div>
                <div class="dev-tab" data-cat="Vehicles">Vehicles</div>
                <div class="dev-tab" data-cat="Props">Props</div>
            </div>
            <div class="dev-panel-content" style="padding:0;">
                <input type="text" id="asset-search" placeholder="Search..."
                    style="width:100%; box-sizing:border-box; padding:5px; background:#222; color:white; border:none; border-bottom:1px solid #333;">
                <div class="dev-asset-grid" id="asset-grid"></div>
            </div>
        `;

        this.dom.querySelectorAll('.dev-tab').forEach(tab => {
            tab.onclick = () => {
                this.dom.querySelectorAll('.dev-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentTab = tab.dataset.cat;
                this._populate();
            };
        });

        this.dom.querySelector('#asset-search').oninput = (e) => {
            this._populate(e.target.value);
        };
    }

    _populate(filterText = '') {
        const grid = this.dom.querySelector('#asset-grid');
        grid.innerHTML = '';

        const entries = Array.from(EntityRegistry.registry.entries());
        const sorted = entries.sort((a, b) => a[0].localeCompare(b[0]));

        sorted.forEach(([type, ClassRef]) => {
            if (this.currentTab !== 'All') {
                if (!this._matchCategory(type, this.currentTab)) return;
            }

            if (filterText && !type.toLowerCase().includes(filterText.toLowerCase())) return;

            const name = ClassRef.displayName || type;

            const item = document.createElement('div');
            item.className = 'dev-asset-item';
            item.draggable = true;
            item.dataset.type = type;
            item.title = name;

            const img = document.createElement('img');
            img.className = 'dev-asset-thumb';
            img.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkeT0iLjNlbSIgZmlsbD0iIzU1NSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+4p2hPC90ZXh0Pjwvc3ZnPg==';

            this.thumbnailRenderer.queueThumbnail(type, (url) => {
                if(url) img.src = url;
            });

            item.appendChild(img);

            const label = document.createElement('div');
            label.className = 'dev-asset-name';
            label.textContent = name;
            item.appendChild(label);

            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('type', type);
                this.devMode.interaction.onDragStart(type);
            });

            item.addEventListener('click', () => {
                if (type === 'road') {
                    this.devMode.setPlacementMode('road');
                }
            });

            grid.appendChild(item);
        });
    }

    _getCategory(type) {
        if (['road', 'bridge', 'sidewalk', 'river'].some(t => type.includes(t))) return 'Infrastructure';
        if (['house', 'apartment', 'tower', 'office'].some(t => type.includes(t))) return 'Residential';
        if (['tree', 'rock', 'cloud', 'bush', 'flower'].some(t => type.includes(t))) return 'Nature';
        if (['car', 'truck', 'bus', 'van', 'cycle'].some(t => type.includes(t))) return 'Vehicles';
        return 'Props';
    }

    _matchCategory(type, cat) {
        const actual = this._getCategory(type);
        if (cat === 'Residential' && (actual === 'Residential' || type.includes('commercial'))) return true;
        return actual === cat;
    }
}

class EnvironmentPanel {
    constructor(container, devMode) {
        this.devMode = devMode;
        this.dom = document.createElement('div');
        this.dom.className = 'dev-panel';
        this.dom.style.borderTop = '1px solid #333';
        container.appendChild(this.dom);

        this._render();
        this._bindEvents();
    }

    _render() {
        this.dom.innerHTML = `
            <div class="dev-panel-header">Environment</div>
            <div class="dev-panel-content">
                <div class="dev-prop-section">
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                        <span>Time of Day</span>
                        <span id="env-time-display">12:00</span>
                    </div>
                    <input type="range" id="env-time-slider" min="0" max="24" step="0.1" value="12" style="width:100%">

                    <div class="dev-prop-row" style="margin-top:8px;">
                        <label>Speed</label>
                        <input type="number" id="env-day-speed" class="dev-prop-input" value="10">
                    </div>

                    <div class="dev-prop-row">
                        <label>Lock Time</label>
                        <input type="checkbox" id="env-time-lock">
                    </div>
                </div>

                <div class="dev-prop-section">
                     <div class="dev-prop-row">
                        <label>Wind Spd</label>
                        <input type="range" id="env-wind-speed" min="0" max="100" style="flex:1">
                     </div>
                     <div class="dev-prop-row">
                        <label>Wind Dir</label>
                        <input type="range" id="env-wind-dir" min="0" max="360" style="flex:1">
                     </div>
                </div>
            </div>
        `;
    }

    _bindEvents() {
        const timeSlider = this.dom.querySelector('#env-time-slider');
        const timeDisplay = this.dom.querySelector('#env-time-display');
        const daySpeed = this.dom.querySelector('#env-day-speed');
        const timeLock = this.dom.querySelector('#env-time-lock');
        const windSpeed = this.dom.querySelector('#env-wind-speed');
        const windDir = this.dom.querySelector('#env-wind-dir');

        timeSlider.oninput = (e) => {
            const val = parseFloat(e.target.value);
            if (this.devMode.app.world.timeCycle) {
                this.devMode.app.world.timeCycle.time = val;
                this.devMode.app.world.timeCycle.update(0);
                this._updateDisplay(val);
            }
        };

        daySpeed.onchange = (e) => {
             const val = parseFloat(e.target.value);
             if (this.devMode.app.world.timeCycle) {
                 this.devMode.app.world.timeCycle.speed = val;
             }
        };

        timeLock.onchange = (e) => {
            if (this.devMode.app.world.timeCycle) {
                this.devMode.app.world.timeCycle.isLocked = e.target.checked;
            }
        };

        windSpeed.oninput = (e) => {
            if (this.devMode.app.world.wind) {
                this.devMode.app.world.wind.speed = parseFloat(e.target.value);
            }
        };

        windDir.oninput = (e) => {
            if (this.devMode.app.world.wind) {
                this.devMode.app.world.wind.direction = parseFloat(e.target.value);
            }
        };
    }

    _updateDisplay(time) {
        const h = Math.floor(time);
        const m = Math.floor((time - h) * 60);
        const disp = this.dom.querySelector('#env-time-display');
        if (disp) disp.textContent = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }

    update() {
        const world = this.devMode.app.world;
        if (!world) return;

        if (world.timeCycle) {
            this.dom.querySelector('#env-time-slider').value = world.timeCycle.time;
            this.dom.querySelector('#env-day-speed').value = world.timeCycle.speed;
            this.dom.querySelector('#env-time-lock').checked = world.timeCycle.isLocked;
            this._updateDisplay(world.timeCycle.time);
        }

        if (world.wind) {
            this.dom.querySelector('#env-wind-speed').value = world.wind.speed;
            this.dom.querySelector('#env-wind-dir').value = world.wind.direction;
        }
    }
}

// =============================================================================
// MAIN CLASS
// =============================================================================

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

    // Parity Integration Methods for DevMode

    updateProperties(object) {
        // Delegate to Inspector
        // We must wrap in array as Inspector expects array
        const selection = object ? [object] : this.devMode.selectedObjects;
        if (this.inspector) this.inspector.update(selection);
    }

    showProperties(object) {
        this.updateProperties(object);
    }

    hideProperties() {
        if (this.inspector) this.inspector.update([]);
    }

    onSelectionChanged(selection) {
        if (this.inspector) this.inspector.update(selection);
        if (this.outliner) this.outliner.updateSelection(selection);
    }

    update() {
        // Called every frame by DevMode?
        // We can update EnvPanel if needed (e.g. time moving)
        // But EnvPanel only needs update on show or interact usually.
    }

    updateWaypointList(vehicle) {
        // Delegate to Inspector if selected
        if (this.devMode.selectedObjects.includes(vehicle)) {
            this.inspector.update(this.devMode.selectedObjects);
        }
    }

    _filterPalette(query) {
        if (this.assets) this.assets._populate(query);
    }
}
