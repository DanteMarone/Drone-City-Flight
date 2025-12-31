// src/dev/ui/inspector.js
import * as THREE from 'three';
import { createPanel } from './domUtils.js';
import { TransformCommand, PropertyChangeCommand } from '../history.js';

export class Inspector {
    constructor(devMode, container, alignTool) {
        this.devMode = devMode;
        this.parentContainer = container;
        this.alignTool = alignTool;
        this.inspectorTab = 'Properties'; // 'Properties' | 'World'
        this.lockScale = false;
        this.content = null;
        this.idCounter = 0;
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
            this._renderProperties();
        } else {
            this._renderWorldControls();
        }
    }

    sync() {
        if (this.inspectorTab === 'Properties' && this.devMode.selectedObjects.length > 0) {
            this._syncInspector();
        }
    }

    updateProperties(obj) {
        // Called by GizmoManager when dragging
        this.sync();
    }

    _renderProperties() {
        const selection = this.devMode.selectedObjects;
        if (!selection || selection.length === 0) {
            this.content.innerHTML = '<div style="color:#666; font-style:italic;">No object selected</div>';
            return;
        }

        const obj = selection[0];

        // Header
        const header = document.createElement('div');
        header.className = 'dev-prop-title';
        header.textContent = selection.length > 1 ? `${selection.length} Objects Selected` : (obj.userData.type || 'Object');
        this.content.appendChild(header);

        // Transform
        if (selection.length === 1) {
            this._addPropGroup('Transform', [
                this._createVectorInput('Position', obj.position, (v) => this._applyTransform(obj, 'position', v)),
                this._createVectorInput('Rotation', obj.rotation, (v) => this._applyTransform(obj, 'rotation', v), true),
                this._createScaleInput(obj)
            ]);
        } else {
            // Group Selection - Use Proxy
            const proxy = this.devMode.gizmo ? this.devMode.gizmo.proxy : null;
            if (proxy) {
                this._addPropGroup('Transform (Group)', [
                    this._createVectorInput('Position', proxy.position, (v) => this._applyProxyTransform('position', v)),
                    this._createVectorInput('Rotation', proxy.rotation, (v) => this._applyProxyTransform('rotation', v), true),
                    this._createScaleInput(proxy, true) // Pass true for isProxy
                ]);
            } else {
                this.content.innerHTML += '<div style="color:#888;">Use Gizmo to transform selection.</div>';
            }
        }

        // Align Tool Integration
        if (this.alignTool && this.alignTool.createUI) {
            const alignUI = this.alignTool.createUI();
            if (alignUI) {
                this._addPropGroup('Alignment', [alignUI]);
            }
        }

        // Params (Single Object only)
        if (selection.length === 1) {
            if (obj.userData.params) {
                const ignoredParams = new Set(['uuid', 'type', 'x', 'y', 'z', 'rotX', 'rotY', 'rotZ', 'width', 'height', 'depth', 'scale', 'waypoints', 'isVehicle', 'waitTime']);

                const fields = [];
                Object.keys(obj.userData.params).forEach(key => {
                    if (ignoredParams.has(key)) return;
                    const val = obj.userData.params[key];

                    if (typeof val === 'number') {
                        fields.push(this._createNumberInput(key, val, (n) => {
                            this._applyParam(obj, key, n);
                        }));
                    } else if (typeof val === 'string') {
                        fields.push(this._createTextInput(key, val, (s) => {
                            this._applyParam(obj, key, s);
                        }));
                    } else if (typeof val === 'boolean') {
                        fields.push(this._createCheckbox(key, val, (b) => {
                            this._applyParam(obj, key, b);
                        }));
                    }
                });
                if (fields.length > 0) {
                    this._addPropGroup('Parameters', fields);
                }
            }

            // Waypoints (Vehicles)
            if (obj.userData.isVehicle || obj.userData.type === 'vehicle' || obj.userData.type === 'car' || obj.userData.type === 'truck') {
                this._renderWaypoints(obj);
            }
        }

        // Delete Button
        const delBtn = document.createElement('button');
        delBtn.className = 'dev-btn dev-btn-danger';
        delBtn.textContent = 'Delete Selected';
        delBtn.style.marginTop = '10px';
        delBtn.onclick = () => this.devMode.deleteSelected();
        this.content.appendChild(delBtn);
    }

    _renderWaypoints(obj) {
        const wpCount = obj.userData.waypoints ? obj.userData.waypoints.length : 0;

        const group = document.createElement('div');
        group.className = 'dev-prop-group';

        const title = document.createElement('div');
        title.className = 'dev-prop-title';
        title.textContent = `Waypoints (${wpCount})`;
        group.appendChild(title);

        const row = document.createElement('div');
        row.className = 'dev-btn-row';

        const addBtn = document.createElement('button');
        addBtn.className = 'dev-btn';
        addBtn.textContent = 'Add';
        addBtn.title = 'Add waypoint after selection or at end';
        addBtn.onclick = () => this.devMode.addWaypointToSelected();
        row.appendChild(addBtn);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'dev-btn';
        removeBtn.textContent = 'Remove Last';
        removeBtn.onclick = () => this.devMode.removeWaypointFromSelected();
        row.appendChild(removeBtn);

        group.appendChild(row);

        // Wait Time Control
        if (obj.userData.waitTime !== undefined) {
             const waitRow = this._createNumberInput('Wait Time (s)', obj.userData.waitTime, (val) => {
                 obj.userData.waitTime = val;
                 if (obj.userData.params) obj.userData.params.waitTime = val;
             });
             group.appendChild(waitRow);
        }

        this.content.appendChild(group);
    }

    _renderWorldControls() {
        const container = document.createElement('div');
        container.className = 'dev-system-section';

        // Environment
        const envGroup = document.createElement('div');
        envGroup.innerHTML = '<div class="dev-prop-title">Environment</div>';

        // Time of Day
        if (this.devMode.app.world.timeCycle) {
            const tc = this.devMode.app.world.timeCycle;

            // Slider
            const sliderRow = document.createElement('div');
            sliderRow.className = 'dev-prop-row';
            sliderRow.innerHTML = '<div class="dev-prop-label">Time</div>';

            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = '0';
            slider.max = '24';
            slider.step = '0.1';
            slider.style.flex = '1';
            slider.value = tc.time;
            slider.oninput = (e) => {
                tc.time = parseFloat(e.target.value);
            };
            sliderRow.appendChild(slider);
            envGroup.appendChild(sliderRow);

            // Time Speed
            const speedRow = this._createNumberInput('Speed', tc.speed, (v) => tc.speed = v);
            envGroup.appendChild(speedRow);

            // Time Locked
            const lockedRow = this._createCheckbox('Time Locked', tc.isLocked, (b) => {
                tc.isLocked = b;
            });
            envGroup.appendChild(lockedRow);
        }

        // Wind
        if (this.devMode.app.world.wind) {
            envGroup.appendChild(document.createElement('br'));
            envGroup.innerHTML += '<div class="dev-prop-title">Wind</div>';

            const wind = this.devMode.app.world.wind;
            envGroup.appendChild(this._createNumberInput('Speed', wind.speed, (v) => wind.speed = v));
            envGroup.appendChild(this._createNumberInput('Direction', wind.direction, (v) => wind.direction = v));
        }

        // Gameplay
        envGroup.appendChild(document.createElement('br'));

        const gameplayTitle = document.createElement('div');
        gameplayTitle.className = 'dev-prop-title';
        gameplayTitle.textContent = 'Gameplay';
        envGroup.appendChild(gameplayTitle);

        if (this.devMode.app.world.batteryDrain !== undefined) {
             envGroup.appendChild(this._createNumberInput('Battery Drain', this.devMode.app.world.batteryDrain, (v) => {
                 this.devMode.app.world.batteryDrain = v;
             }));
        }

        container.appendChild(envGroup);
        this.content.appendChild(container);
    }

    _syncInspector() {
        const selection = this.devMode.selectedObjects;
        if (!selection || selection.length === 0) return;

        if (selection.length === 1) {
            const obj = selection[0];
            this._syncVectorInput('Position', obj.position);
            this._syncVectorInput('Rotation', obj.rotation, true);
            this._syncVectorInput('Scale', obj.scale);
        } else {
             // Multi-select: Sync from Proxy
             const proxy = this.devMode.gizmo ? this.devMode.gizmo.proxy : null;
             if (proxy) {
                 this._syncVectorInput('Position', proxy.position);
                 this._syncVectorInput('Rotation', proxy.rotation, true);
                 this._syncVectorInput('Scale', proxy.scale);
             }
        }
    }

    _addPropGroup(title, elements) {
        const group = document.createElement('div');
        group.className = 'dev-prop-group';
        const t = document.createElement('div');
        t.className = 'dev-prop-title';
        t.textContent = title;
        group.appendChild(t);
        elements.forEach(el => group.appendChild(el));
        this.content.appendChild(group);
    }

    _createVectorInput(label, vec, callback, isEuler=false) {
        const row = document.createElement('div');
        row.className = 'dev-prop-row';
        const l = document.createElement('div');
        l.className = 'dev-prop-label';
        l.textContent = label;
        row.appendChild(l);

        const div = document.createElement('div');
        div.className = 'dev-prop-vector';

        ['x', 'y', 'z'].forEach(axis => {
            const inp = document.createElement('input');
            inp.type = 'number';
            inp.step = isEuler ? '1' : '0.1';
            inp.className = 'dev-prop-input';
            inp.id = `insp-${label}-${axis}`;
            inp.setAttribute('aria-label', `${label} ${axis.toUpperCase()}`);

            let val = vec[axis];
            if (isEuler) val = THREE.MathUtils.radToDeg(val);
            inp.value = val.toFixed(2);

            inp.onchange = (e) => {
                const n = parseFloat(e.target.value);
                const current = isEuler ? THREE.MathUtils.radToDeg(vec[axis]) : vec[axis];
                if (Math.abs(n - current) < 0.001) return;

                const newVec = vec.clone();
                if (isEuler) {
                    const eClone = vec.clone();
                    if (axis === 'x') eClone.x = THREE.MathUtils.degToRad(n);
                    if (axis === 'y') eClone.y = THREE.MathUtils.degToRad(n);
                    if (axis === 'z') eClone.z = THREE.MathUtils.degToRad(n);
                    callback(eClone);
                } else {
                    newVec[axis] = n;
                    callback(newVec);
                }
            };
            div.appendChild(inp);
        });
        row.appendChild(div);
        return row;
    }

    _createScaleInput(obj, isProxy=false) {
        const label = 'Scale';
        const vec = obj.scale;

        const row = document.createElement('div');
        row.className = 'dev-prop-row';

        // Label + Lock Checkbox
        const labelDiv = document.createElement('div');
        labelDiv.className = 'dev-prop-label';
        labelDiv.style.display = 'flex';
        labelDiv.style.flexDirection = 'column';

        const txt = document.createElement('span');
        txt.textContent = label;
        labelDiv.appendChild(txt);

        const lockId = `prop-lock-${this.idCounter++}`;
        const lockLabel = document.createElement('label');
        lockLabel.className = 'dev-prop-checkbox-label';
        lockLabel.htmlFor = lockId;

        const check = document.createElement('input');
        check.id = lockId;
        check.type = 'checkbox';
        check.checked = this.lockScale;
        check.style.width = '10px';
        check.style.height = '10px';
        check.onchange = (e) => this.lockScale = e.target.checked;
        lockLabel.appendChild(check);
        lockLabel.appendChild(document.createTextNode('Lock'));
        labelDiv.appendChild(lockLabel);

        row.appendChild(labelDiv);

        const div = document.createElement('div');
        div.className = 'dev-prop-vector';

        ['x', 'y', 'z'].forEach(axis => {
            const inp = document.createElement('input');
            inp.type = 'number';
            inp.step = '0.1';
            inp.className = 'dev-prop-input';
            inp.id = `insp-${label}-${axis}`;
            inp.setAttribute('aria-label', `${label} ${axis.toUpperCase()}`);
            inp.value = vec[axis].toFixed(2);

            inp.onchange = (e) => {
                const n = parseFloat(e.target.value);
                if (Math.abs(n - vec[axis]) < 0.001) return;

                if (this.lockScale) {
                    const newVec = new THREE.Vector3(n, n, n);
                    if (isProxy) {
                        this._applyProxyTransform('scale', newVec);
                    } else {
                        this._applyTransform(obj, 'scale', newVec);
                    }
                } else {
                    const newVec = vec.clone();
                    newVec[axis] = n;
                    if (isProxy) {
                        this._applyProxyTransform('scale', newVec);
                    } else {
                        this._applyTransform(obj, 'scale', newVec);
                    }
                }
            };
            div.appendChild(inp);
        });
        row.appendChild(div);
        return row;
    }

    _syncVectorInput(label, vec, isEuler=false) {
        ['x', 'y', 'z'].forEach(axis => {
            const inp = document.getElementById(`insp-${label}-${axis}`);
            if (inp && document.activeElement !== inp) {
                let val = vec[axis];
                if (isEuler) val = THREE.MathUtils.radToDeg(val);
                inp.value = val.toFixed(2);
            }
        });
    }

    _createNumberInput(key, val, cb) {
        const id = `prop-num-${this.idCounter++}`;
        const row = document.createElement('div');
        row.className = 'dev-prop-row';

        const l = document.createElement('label');
        l.className = 'dev-prop-label';
        l.textContent = key;
        l.htmlFor = id;
        row.appendChild(l);

        const inp = document.createElement('input');
        inp.id = id;
        inp.type = 'number';
        inp.className = 'dev-prop-input';
        inp.value = val;
        inp.onchange = (e) => cb(parseFloat(e.target.value));
        row.appendChild(inp);
        return row;
    }

    _createTextInput(key, val, cb) {
        const id = `prop-text-${this.idCounter++}`;
        const row = document.createElement('div');
        row.className = 'dev-prop-row';

        const l = document.createElement('label');
        l.className = 'dev-prop-label';
        l.textContent = key;
        l.htmlFor = id;
        row.appendChild(l);

        const inp = document.createElement('input');
        inp.id = id;
        inp.type = 'text';
        inp.className = 'dev-prop-input';
        inp.value = val;
        inp.onchange = (e) => cb(e.target.value);
        row.appendChild(inp);
        return row;
    }

    _createCheckbox(key, val, cb) {
        const id = `prop-bool-${this.idCounter++}`;
        const row = document.createElement('div');
        row.className = 'dev-prop-row';

        const l = document.createElement('label');
        l.className = 'dev-prop-label';
        l.textContent = key;
        l.htmlFor = id;
        row.appendChild(l);

        const inp = document.createElement('input');
        inp.id = id;
        inp.type = 'checkbox';
        inp.checked = val;
        inp.onchange = (e) => cb(e.target.checked);
        row.appendChild(inp);
        return row;
    }

    _applyTransform(obj, prop, val) {
        // Snapshot before
        const before = [{
            object: obj,
            position: obj.position.clone(),
            rotation: obj.rotation.clone(),
            scale: obj.scale.clone()
        }];

        // Apply locally
        if (prop === 'position') obj.position.copy(val);
        if (prop === 'rotation') obj.rotation.copy(val);
        if (prop === 'scale') obj.scale.copy(val);

        obj.updateMatrixWorld();
        if (this.devMode.gizmo) this.devMode.gizmo.attach(obj); // Refresh gizmo
        if (this.devMode.app.colliderSystem) this.devMode.app.colliderSystem.updateBody(obj);

        // Snapshot after
        const after = [{
            object: obj,
            position: obj.position.clone(),
            rotation: obj.rotation.clone(),
            scale: obj.scale.clone()
        }];

        this.devMode.commandManager.push(new TransformCommand(this.devMode, before, after, `Transform ${prop}`));
    }

    _applyProxyTransform(prop, val) {
        if (!this.devMode.gizmo || !this.devMode.gizmo.proxy) return;

        const proxy = this.devMode.gizmo.proxy;
        const selection = this.devMode.selectedObjects;

        // Capture start state
        const before = this.devMode.captureTransforms(selection);

        // Update Proxy
        if (prop === 'position') proxy.position.copy(val);
        if (prop === 'rotation') proxy.rotation.copy(val);
        if (prop === 'scale') proxy.scale.copy(val);

        proxy.updateMatrixWorld();

        // Propagate to objects
        this.devMode.gizmo.syncProxyToObjects();

        // Update physics
        if (this.devMode.app.colliderSystem) {
            selection.forEach(obj => {
                 let target = obj;
                 // Handle waypoints/special hierarchies if needed
                 if (target.userData.type === 'waypoint' && target.parent?.parent?.userData?.isVehicle) {
                     target = target.parent.parent;
                 }
                 this.devMode.app.colliderSystem.updateBody(target);
            });
        }

        // Capture end state
        const after = this.devMode.captureTransforms(selection);

        // Push History
        if (this.devMode.commandManager) {
            this.devMode.commandManager.push(new TransformCommand(this.devMode, before, after, `Transform Group ${prop}`));
        }
    }

    _applyParam(obj, key, val) {
        const oldVal = obj.userData.params[key];
        obj.userData.params[key] = val;

        this.devMode.commandManager.push(new PropertyChangeCommand(
             this.devMode,
             obj.userData.uuid || obj.uuid,
             key,
             oldVal,
             val,
             `Set ${key}`
        ));
    }
}
