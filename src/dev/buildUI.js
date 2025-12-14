import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { ObjectFactory } from '../world/entities/registry.js';

export class BuildUI {
    constructor(buildMode) {
        this.buildMode = buildMode;
        this.container = null;
        this._init();
    }

    _init() {
        // Create UI Overlay
        this.container = document.createElement('div');
        this.container.id = 'build-ui';
        // Updated Styling: Dark Slate Blue, borders, game feel
        this.container.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            width: 320px;
            background: #1e293b;
            border: 1px solid #334155;
            color: #f8fafc;
            padding: 15px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 14px;
            display: none;
            flex-direction: column;
            gap: 12px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            max-height: 90vh;
            overflow-y: auto;
            z-index: 1000;
        `;

        // Updated Strings: Build Mode / Resume Flight
        const header = document.createElement('h2');
        header.textContent = 'Build Mode';
        header.style.margin = '0 0 10px 0';
        header.style.fontSize = '18px';
        header.style.color = '#38bdf8'; // Light Blue
        header.style.textAlign = 'center';
        this.container.appendChild(header);

        // --- Tools Section ---
        const toolsGroup = this._createSection('Tools');

        const controls = document.createElement('div');
        controls.style.display = 'flex';
        controls.style.gap = '8px';
        controls.style.marginBottom = '8px';

        // Tooltips added
        const translateBtn = this._createButton('Move', () => this.buildMode.gizmo.control.setMode('translate'));
        translateBtn.title = 'Translate Object (T)';

        const rotateBtn = this._createButton('Rotate', () => this.buildMode.gizmo.control.setMode('rotate'));
        rotateBtn.title = 'Rotate Object (R)';

        // Toggle Grid Snap
        const snapLabel = document.createElement('label');
        snapLabel.style.display = 'flex';
        snapLabel.style.alignItems = 'center';
        snapLabel.style.gap = '5px';
        snapLabel.style.cursor = 'pointer';

        this.snapCheckbox = document.createElement('input');
        this.snapCheckbox.type = 'checkbox';
        this.snapCheckbox.checked = true; // Default to checked
        this.snapCheckbox.addEventListener('change', (e) => {
            this.buildMode.grid.setEnabled(e.target.checked);
        });

        snapLabel.appendChild(this.snapCheckbox);
        snapLabel.appendChild(document.createTextNode('Grid Snap'));

        controls.appendChild(translateBtn);
        controls.appendChild(rotateBtn);
        toolsGroup.appendChild(controls);
        toolsGroup.appendChild(snapLabel);
        this.container.appendChild(toolsGroup);

        // --- Objects Section ---
        const objectsGroup = this._createSection('Objects');
        const objectsList = document.createElement('div');
        objectsList.style.display = 'grid';
        objectsList.style.gridTemplateColumns = '1fr 1fr';
        objectsList.style.gap = '8px';

        // Get available types from Registry
        const types = ObjectFactory.getTypes();
        types.forEach(type => {
            const btn = this._createButton(type, () => this._spawnObject(type));
            // Style tweak for object buttons
            btn.style.fontSize = '12px';
            objectsList.appendChild(btn);
        });

        objectsGroup.appendChild(objectsList);
        this.container.appendChild(objectsGroup);


        // --- Properties Panel ---
        this.propertiesPanel = document.createElement('div');
        this.propertiesPanel.style.marginTop = '10px';
        this.propertiesPanel.style.borderTop = '1px solid #334155';
        this.propertiesPanel.style.paddingTop = '10px';
        this.propertiesPanel.style.display = 'none';
        this.container.appendChild(this.propertiesPanel);

        // --- Action Buttons ---
        const actionsGroup = document.createElement('div');
        actionsGroup.style.display = 'flex';
        actionsGroup.style.flexDirection = 'column';
        actionsGroup.style.gap = '8px';
        actionsGroup.style.marginTop = '10px';

        const saveBtn = this._createButton('Save Map', () => this._saveMap());
        saveBtn.style.background = '#0f172a';

        const loadBtn = this._createFileButton('Load Map', (e) => this._loadMap(e));

        const clearBtn = this._createButton('Clear Map', () => {
            if(confirm('Are you sure you want to clear the map?')) {
                this.buildMode.clearMap();
            }
        });
        clearBtn.style.background = '#7f1d1d'; // Dark Red

        const exitBtn = this._createButton('Resume Flight', () => this.buildMode.disable());
        exitBtn.style.background = '#15803d'; // Green
        exitBtn.style.fontWeight = 'bold';

        actionsGroup.appendChild(saveBtn);
        actionsGroup.appendChild(loadBtn);
        actionsGroup.appendChild(clearBtn);
        actionsGroup.appendChild(exitBtn);
        this.container.appendChild(actionsGroup);

        document.body.appendChild(this.container);
    }

    _createSection(titleText) {
        const section = document.createElement('div');
        section.style.background = 'rgba(255,255,255,0.05)';
        section.style.padding = '10px';
        section.style.borderRadius = '4px';
        section.style.marginBottom = '5px';

        const title = document.createElement('div');
        title.textContent = titleText;
        title.style.fontSize = '12px';
        title.style.fontWeight = 'bold';
        title.style.textTransform = 'uppercase';
        title.style.color = '#94a3b8';
        title.style.marginBottom = '8px';

        section.appendChild(title);
        return section;
    }

    _createButton(text, onClick) {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.style.padding = '8px 12px'; // Larger touch target
        btn.style.background = '#334155';
        btn.style.color = 'white';
        btn.style.border = 'none';
        btn.style.borderRadius = '4px';
        btn.style.cursor = 'pointer';
        btn.style.fontSize = '13px';
        btn.style.transition = 'background 0.2s';

        btn.addEventListener('mouseover', () => btn.style.background = '#475569');
        btn.addEventListener('mouseout', () => {
             // Revert if not specific colored button (hacky but simple)
             if (btn.textContent === 'Resume Flight') btn.style.background = '#15803d';
             else if (btn.textContent === 'Clear Map') btn.style.background = '#7f1d1d';
             else if (btn.textContent === 'Save Map') btn.style.background = '#0f172a';
             else btn.style.background = '#334155';
        });

        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent canvas click
            onClick();
        });
        return btn;
    }

    _createFileButton(text, onFileSelect) {
        const label = document.createElement('label');
        label.style.display = 'block';

        const btnDiv = this._createButton(text, () => {});
        btnDiv.style.width = '100%';
        btnDiv.style.display = 'block';
        btnDiv.style.textAlign = 'center';
        // Note: click event on label triggers input

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.style.display = 'none';
        input.addEventListener('change', onFileSelect);

        label.appendChild(input);
        label.appendChild(btnDiv);
        return label;
    }

    _spawnObject(type) {
        const entity = ObjectFactory.create(type);
        if (!entity) return;

        // Position in front of camera
        const spawnPos = new THREE.Vector3(0, 0, -10).applyQuaternion(this.buildMode.app.camera.quaternion).add(this.buildMode.app.camera.position);
        spawnPos.y = Math.max(0, spawnPos.y); // Keep above ground

        // Snap if grid enabled
        if (this.buildMode.grid.enabled) {
            spawnPos.copy(this.buildMode.grid.snap(spawnPos));
        }

        entity.mesh.position.copy(spawnPos);

        this.buildMode.app.world.addEntity(entity);

        // Add to physics explicitly for static objects
        this.buildMode.app.colliderSystem.addStatic([entity]);

        // Select it
        this.buildMode.selectObject(entity.mesh);
    }

    setGridSnap(enabled) {
        if (this.snapCheckbox) {
            this.snapCheckbox.checked = enabled;
        }
    }

    show() {
        this.container.style.display = 'flex';
    }

    hide() {
        this.container.style.display = 'none';
    }

    updateSelection(selectedObjects) {
        this.propertiesPanel.innerHTML = '';

        if (!selectedObjects || selectedObjects.length === 0) {
            this.propertiesPanel.style.display = 'none';
            return;
        }

        this.propertiesPanel.style.display = 'block';

        if (selectedObjects.length > 1) {
             const title = document.createElement('div');
             title.textContent = `${selectedObjects.length} Objects Selected`;
             title.style.fontWeight = 'bold';
             title.style.marginBottom = '5px';
             this.propertiesPanel.appendChild(title);

             // Setup Transform Controls for Group Proxy
             this._addTransformInputs(this.buildMode.gizmo.proxy, true);
             return;
        }

        const obj = selectedObjects[0];
        const title = document.createElement('div');
        title.textContent = obj.userData.type || 'Object';
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '5px';
        this.propertiesPanel.appendChild(title);

        this._addTransformInputs(obj);
        this._addObjectSpecificControls(obj);
    }

    _addTransformInputs(obj, isProxy = false) {
        const createInput = (label, axis, value, onChange) => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.justifyContent = 'space-between';
            row.style.marginBottom = '4px';

            const lbl = document.createElement('span');
            lbl.textContent = `${label} ${axis}`;
            lbl.style.width = '50px';

            const input = document.createElement('input');
            input.type = 'number';
            input.value = value.toFixed(2);
            input.step = 0.1;
            input.style.width = '60px';
            input.style.background = '#0f172a';
            input.style.color = 'white';
            input.style.border = '1px solid #475569';

            input.addEventListener('change', (e) => onChange(parseFloat(e.target.value)));

            row.appendChild(lbl);
            row.appendChild(input);
            return row;
        };

        const updateTransform = () => {
            if (isProxy) {
                // If moving proxy, we sync back to objects
                this.buildMode.gizmo.syncProxyToObject();
            } else {
                // If moving single object, update physics body
                this.buildMode.app.colliderSystem.updateBody(obj);
                // Also update gizmo visual
                if (this.buildMode.gizmo.control.object === obj) {
                    // Gizmo is attached to object directly? (Actually in our logic it attaches to proxy always now?)
                    // Wait, BuildMode.selectObject always attaches to proxy logic via gizmo.attach([obj]).
                    // So we should probably update the PROXY if we change the object value directly?
                    // Actually, if we change the object directly, the proxy is now out of sync.
                    // Ideally we should manipulate the PROXY if selected, or re-attach.

                    // Re-attaching is safest to re-center proxy.
                    this.buildMode.gizmo.attach(this.buildMode.selectedObjects);
                }
            }
        };

        // Position
        ['x', 'y', 'z'].forEach(axis => {
            this.propertiesPanel.appendChild(createInput('Pos', axis.toUpperCase(), obj.position[axis], (val) => {
                obj.position[axis] = val;
                updateTransform();
            }));
        });

        // Rotation (Euler)
        ['x', 'y', 'z'].forEach(axis => {
            this.propertiesPanel.appendChild(createInput('Rot', axis.toUpperCase(), obj.rotation[axis], (val) => {
                obj.rotation[axis] = val;
                updateTransform();
            }));
        });

        // Scale
        // Lock Aspect Ratio Checkbox
        const lockRow = document.createElement('div');
        const lockCheck = document.createElement('input');
        lockCheck.type = 'checkbox';
        lockCheck.checked = true;
        lockRow.appendChild(lockCheck);
        lockRow.appendChild(document.createTextNode(' Lock Scale'));
        this.propertiesPanel.appendChild(lockRow);

        ['x', 'y', 'z'].forEach(axis => {
            this.propertiesPanel.appendChild(createInput('Scl', axis.toUpperCase(), obj.scale[axis], (val) => {
                if (lockCheck.checked) {
                    obj.scale.set(val, val, val);
                    // Update all inputs
                    // (Requires keeping refs to inputs, skipping for MVP/Quick impl)
                } else {
                    obj.scale[axis] = val;
                }
                updateTransform();
            }));
        });
    }

    _addObjectSpecificControls(obj) {
        // Example: Wait Time for Cars
        if (obj.userData.params && obj.userData.params.waitTime !== undefined) {
             const row = document.createElement('div');
             row.style.marginTop = '8px';
             row.appendChild(document.createTextNode('Wait Time (s): '));

             const input = document.createElement('input');
             input.type = 'number';
             input.value = obj.userData.params.waitTime;
             input.style.width = '50px';
             input.addEventListener('change', (e) => {
                 obj.userData.params.waitTime = parseFloat(e.target.value);
             });

             row.appendChild(input);
             this.propertiesPanel.appendChild(row);
        }
    }

    updateProperties(proxy) {
        // Called by Gizmo when dragging handles
        // We just re-render selection to update input values
        // Throttle this if performance issues arise
        this.updateSelection(this.buildMode.selectedObjects);
    }

    _saveMap() {
        const data = {
            objects: [],
            rings: []
        };

        // Save Objects
        this.buildMode.app.world.colliders.forEach(entity => {
            // Only save entities that have a type (created via factory)
            if (entity.userData.type) {
                data.objects.push({
                    type: entity.userData.type,
                    transform: {
                        position: entity.mesh.position.toArray(),
                        rotation: entity.mesh.rotation.toArray(), // Euler
                        scale: entity.mesh.scale.toArray()
                    },
                    params: entity.userData.params || {}
                });
            }
        });

        // Save Rings
        // (Assuming RingSystem exposes rings)
        // rings.js seems to manage rings internally.
        // If rings are BaseEntity, they might be in colliders?
        // Let's assume for now we just save what's in colliders.

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'map.json';
        a.click();
    }

    _loadMap(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.buildMode.app.loadMap(data);
            } catch (err) {
                console.error('Failed to load map', err);
                alert('Invalid map file');
            }
        };
        reader.readAsText(file);
    }
}
