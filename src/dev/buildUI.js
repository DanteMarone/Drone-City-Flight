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

    // --- Helpers ---

    _createPanel(cls, title) {
        const p = document.createElement('div');
        p.className = `dev-panel ${cls}`;
        if (title) { // Allow optional title
            const h = document.createElement('div');
            h.className = 'dev-panel-header';
            h.textContent = title;
            p.appendChild(h);
        }
        return p;
    }

    _getCategory(type) {
        type = type.toLowerCase();
        if (type.includes('house') || type.includes('apartment') || type.includes('residential')) return 'Residential';
        if (type.includes('road') || type.includes('sidewalk') || type.includes('infra') || type.includes('light') || type.includes('fire') || type.includes('bridge') || type.includes('runway')) return 'Infrastructure';
        if (type.includes('car') || type.includes('vehicle') || type.includes('bus') || type.includes('truck') || type.includes('scooter')) return 'Vehicles';
        if (type.includes('tree') || type.includes('rock') || type.includes('pond') || type.includes('mushroom') || type.includes('lotus')) return 'Nature';
        if (type.includes('sign') || type.includes('billboard') || type.includes('barrier') || type.includes('stall') || type.includes('vending') || type.includes('tower') || type.includes('antenna') || type.includes('hvac')) return 'Props';
        return 'Misc';
    }

    _addPropGroup(title, elements) {
        const group = document.createElement('div');
        group.className = 'dev-prop-group';
        const t = document.createElement('div');
        t.className = 'dev-prop-title';
        t.textContent = title;
        group.appendChild(t);
        elements.forEach(el => group.appendChild(el));
        this.inspector.appendChild(group);
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

    _createScaleInput(obj) {
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

        const lockLabel = document.createElement('label');
        lockLabel.className = 'dev-prop-checkbox-label';
        const check = document.createElement('input');
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
            inp.value = vec[axis].toFixed(2);

            inp.onchange = (e) => {
                const n = parseFloat(e.target.value);
                if (Math.abs(n - vec[axis]) < 0.001) return;

                if (this.lockScale) {
                    const newVec = new THREE.Vector3(n, n, n);
                    this._applyTransform(obj, 'scale', newVec);
                } else {
                    const newVec = vec.clone();
                    newVec[axis] = n;
                    this._applyTransform(obj, 'scale', newVec);
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
