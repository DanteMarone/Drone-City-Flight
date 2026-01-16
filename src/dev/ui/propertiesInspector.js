import * as THREE from 'three';
import { TransformCommand, PropertyChangeCommand } from '../history.js';
import { ColorPickerWidget } from './widgets/colorPicker.js';
import { createVectorInput, createScaleInput, createNumberInput, createTextInput, createCheckbox } from './widgets/inputs.js';

export class PropertiesInspector {
    constructor(devMode, alignTool) {
        this.devMode = devMode;
        this.alignTool = alignTool;
        this.lockScale = false;
        this.content = null;
    }

    render(container) {
        this.content = container;
        const selection = this.devMode.selectedObjects;

        if (!selection || selection.length === 0) {
            container.innerHTML = '<div style="color:#666; font-style:italic;">No object selected</div>';
            return;
        }

        const obj = selection[0];

        // Header
        const header = document.createElement('div');
        header.className = 'dev-prop-title';
        header.textContent = selection.length > 1 ? `${selection.length} Objects Selected` : (obj.userData.type || 'Object');
        container.appendChild(header);

        // Transform
        if (selection.length === 1) {
            this._addPropGroup('Transform', [
                createVectorInput('Position', obj.position, (v) => this._applyTransform(obj, 'position', v)),
                createVectorInput('Rotation', obj.rotation, (v) => this._applyTransform(obj, 'rotation', v), true),
                createScaleInput(obj, this.lockScale, (v) => this.lockScale = v, (v) => this._applyTransform(obj, 'scale', v))
            ]);
        } else {
            // Group Selection - Use Proxy
            const proxy = this.devMode.gizmo ? this.devMode.gizmo.proxy : null;
            if (proxy) {
                this._addPropGroup('Transform (Group)', [
                    createVectorInput('Position', proxy.position, (v) => this._applyProxyTransform('position', v)),
                    createVectorInput('Rotation', proxy.rotation, (v) => this._applyProxyTransform('rotation', v), true),
                    createScaleInput(proxy, this.lockScale, (v) => this.lockScale = v, (v) => this._applyProxyTransform('scale', v), true)
                ]);
            } else {
                container.innerHTML += '<div style="color:#888;">Use Gizmo to transform selection.</div>';
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
                    const isColor = key.toLowerCase().includes('color') ||
                                    (typeof val === 'string' && val.startsWith('#') && val.length === 7) ||
                                    (typeof val === 'number' && key.toLowerCase().includes('color')); // Heuristic

                    if (isColor) {
                        const widget = new ColorPickerWidget(key, val, (newVal) => {
                            this._applyParam(obj, key, newVal);
                        });
                        fields.push(widget.element);
                    } else if (typeof val === 'number') {
                        fields.push(createNumberInput(key, val, (n) => {
                            this._applyParam(obj, key, n);
                        }));
                    } else if (typeof val === 'string') {
                        fields.push(createTextInput(key, val, (s) => {
                            this._applyParam(obj, key, s);
                        }));
                    } else if (typeof val === 'boolean') {
                        fields.push(createCheckbox(key, val, (b) => {
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
        container.appendChild(delBtn);
    }

    sync() {
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
        addBtn.onclick = () => this.devMode.waypoints.add();
        row.appendChild(addBtn);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'dev-btn';
        removeBtn.textContent = 'Remove Last';
        removeBtn.onclick = () => this.devMode.waypoints.remove();
        row.appendChild(removeBtn);

        group.appendChild(row);

        // Wait Time Control
        if (obj.userData.waitTime !== undefined) {
             const waitRow = createNumberInput('Wait Time (s)', obj.userData.waitTime, (val) => {
                 obj.userData.waitTime = val;
                 if (obj.userData.params) obj.userData.params.waitTime = val;
             });
             group.appendChild(waitRow);
        }

        this.content.appendChild(group);
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

        this.devMode.history.push(new TransformCommand(this.devMode, before, after, `Transform ${prop}`));
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
        if (this.devMode.history) {
            this.devMode.history.push(new TransformCommand(this.devMode, before, after, `Transform Group ${prop}`));
        }
    }

    _applyParam(obj, key, val) {
        const oldVal = obj.userData.params[key];
        obj.userData.params[key] = val;

        this.devMode.history.push(new PropertyChangeCommand(
             this.devMode,
             obj.userData.uuid || obj.uuid,
             key,
             oldVal,
             val,
             `Set ${key}`
        ));
    }
}
