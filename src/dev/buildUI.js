import * as THREE from 'three';
import { EntityRegistry } from '../world/entities/registry.js';
import { ThumbnailRenderer } from './thumbnailRenderer.js';

export class BuildUI {
    constructor() {
        this.devMode = null;
        this.container = null;
        this.outliner = null;
        this.inspector = null;
        this.palette = null;
        this.history = null;
        this.thumbnailRenderer = new ThumbnailRenderer();

        this.selectedCategory = 'All';
        this.expandedGroups = new Set(['Infrastructure', 'Residential', 'Vehicles', 'Nature', 'Props', 'Misc']);
        this.thumbnails = new Map();

        // Inspector State
        this.inspectorTab = 'Properties'; // 'Properties' | 'World'
        this.lockScale = false;

        // For polling/updates
        this.lastHistoryLen = 0;
        this.needsOutlinerUpdate = true;
    }

    init(devMode) {
        this.devMode = devMode;

        // Root
        this.container = document.createElement('div');
        this.container.id = 'dev-ui';
        this.container.style.display = 'none';
        document.body.appendChild(this.container);

        // Panels
        this._createTopBar();
        this._createToolbar();
        this._createOutliner();
        this._createHistory();
        this._createInspector();
        this._createPalette();

        // Save Indicator
        const saveInd = document.createElement('div');
        saveInd.className = 'dev-save-indicator';
        saveInd.id = 'dev-save-indicator';
        saveInd.textContent = 'Map Saved';
        this.container.appendChild(saveInd);

        // Initial Refresh
        this.refreshPalette();
    }

    toggle(show) {
        this.container.style.display = show ? 'flex' : 'none';
        if (show) {
            this.refreshOutliner();
            this.refreshHistory();
            this.refreshInspector();
        }
    }

    update(dt) {
        if (this.container.style.display === 'none') return;

        // Sync Inspector
        if (this.inspectorTab === 'Properties' && this.devMode.selectedObjects.length > 0) {
            this._syncInspector();
        }

        // Check History updates
        if (this.devMode.commandManager &&
            (this.devMode.commandManager.undoStack.length + this.devMode.commandManager.redoStack.length) !== this.lastHistoryLen) {
            this.refreshHistory();
        }
    }

    onObjectListChanged() {
        this.refreshOutliner();
    }

    onSelectionChanged() {
        // Auto-switch to Properties if object selected
        if (this.devMode.selectedObjects.length > 0) {
            this.inspectorTab = 'Properties';
        }
        this.refreshInspector();
        this.refreshOutliner(); // To update selection highlight
    }

    updateProperties(obj) {
        // Compatibility method for high-frequency updates (e.g. dragging)
        if (this.inspectorTab === 'Properties') {
            this._syncInspector();
        }
    }

    // --- Top Bar ---
    _createTopBar() {
        const bar = document.createElement('div');
        bar.className = 'dev-top-bar';

        // Dev Mode Menu
        this._createMenu(bar, 'Dev Mode', [
            { label: 'Resume Game', action: () => this.devMode.disable() },
            { separator: true },
            { label: 'Save Map', shortcut: 'Ctrl+S', action: () => this.devMode.saveMap() },
            { label: 'Load Map...', action: () => this._triggerLoad() },
            { separator: true },
            { label: 'Clear Map', action: () => { if(confirm('Clear map?')) this.devMode.clearMap(); } },
            { label: 'Exit Dev Mode', action: () => this.devMode.disable() }
        ]);

        // Edit Menu
        this._createMenu(bar, 'Edit', [
            { label: 'Undo', shortcut: 'Ctrl+Z', action: () => this.devMode.history.undo() },
            { label: 'Redo', shortcut: 'Ctrl+Y', action: () => this.devMode.history.redo() },
            { separator: true },
            { label: 'Copy', shortcut: 'Ctrl+C', action: () => this.devMode.copySelected() },
            { label: 'Paste', shortcut: 'Ctrl+V', action: () => this.devMode.pasteClipboard() },
            { label: 'Duplicate', shortcut: 'Ctrl+D', action: () => this.devMode.duplicateSelected() },
            { label: 'Delete', shortcut: 'Del', action: () => this.devMode.deleteSelected() }
        ]);

        // View Menu (Tools)
        this._createMenu(bar, 'View', [
             { label: 'Toggle Grid', action: () => {
                 this.devMode.grid.enabled = !this.devMode.grid.enabled;
                 this.devMode.grid.helper.visible = this.devMode.grid.enabled;
             }},
             { label: 'Toggle HUD', action: () => {
                 const hud = document.querySelector('.hud-container');
                 if(hud) hud.style.display = hud.style.display === 'none' ? 'block' : 'none';
             }}
        ]);

        this.container.appendChild(bar);

        // Close menus when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dev-menu-btn')) {
                document.querySelectorAll('.dev-dropdown').forEach(d => d.classList.remove('visible'));
                document.querySelectorAll('.dev-menu-btn').forEach(b => b.classList.remove('active'));
            }
        });
    }

    _createToolbar() {
        const bar = document.createElement('div');
        bar.className = 'dev-toolbar';

        const addBtn = (label, action, title='') => {
            const btn = document.createElement('div');
            btn.className = 'dev-tool-btn';
            btn.textContent = label;
            btn.title = title;
            btn.onclick = action;
            bar.appendChild(btn);
        };

        addBtn('Exit', () => this.devMode.disable(), 'Exit Dev Mode');

        const sep = document.createElement('div');
        sep.style.width = '1px';
        sep.style.height = '20px';
        sep.style.background = '#555';
        sep.style.margin = '0 5px';
        bar.appendChild(sep);

        addBtn('Undo', () => this.devMode.history.undo(), 'Ctrl+Z');
        addBtn('Redo', () => this.devMode.history.redo(), 'Ctrl+Y');

        const sep2 = sep.cloneNode();
        bar.appendChild(sep2);

        addBtn('Grid', () => {
             this.devMode.grid.enabled = !this.devMode.grid.enabled;
             this.devMode.grid.helper.visible = this.devMode.grid.enabled;
        }, 'Toggle Grid');

        this.container.appendChild(bar);
    }

    _createMenu(parent, label, items) {
        const container = document.createElement('div');
        container.style.position = 'relative';

        const btn = document.createElement('button');
        btn.className = 'dev-menu-btn';
        btn.textContent = label;

        const dropdown = document.createElement('div');
        dropdown.className = 'dev-dropdown';

        btn.onclick = (e) => {
            e.stopPropagation();
            const wasVisible = dropdown.classList.contains('visible');
            // Close all others
            document.querySelectorAll('.dev-dropdown').forEach(d => d.classList.remove('visible'));
            document.querySelectorAll('.dev-menu-btn').forEach(b => b.classList.remove('active'));

            if (!wasVisible) {
                dropdown.classList.add('visible');
                btn.classList.add('active');
            }
        };

        items.forEach(item => {
            if (item.separator) {
                const sep = document.createElement('div');
                sep.className = 'dev-dropdown-separator';
                dropdown.appendChild(sep);
            } else {
                const div = document.createElement('div');
                div.className = 'dev-dropdown-item';

                const span = document.createElement('span');
                span.textContent = item.label;
                div.appendChild(span);

                if (item.shortcut) {
                    const sc = document.createElement('span');
                    sc.className = 'dev-dropdown-shortcut';
                    sc.textContent = item.shortcut;
                    div.appendChild(sc);
                }

                div.onclick = () => {
                    item.action();
                    dropdown.classList.remove('visible');
                    btn.classList.remove('active');
                };
                dropdown.appendChild(div);
            }
        });

        container.appendChild(btn);
        container.appendChild(dropdown);
        parent.appendChild(container);
    }

    _triggerLoad() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        fileInput.onchange = (e) => {
            if (e.target.files.length > 0) {
                this.devMode.loadMap(e.target.files[0]);
            }
        };
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    }

    // --- Outliner ---
    _createOutliner() {
        const panel = this._createPanel('dev-outliner', 'World Outliner');
        this.outliner = document.createElement('div');
        this.outliner.className = 'dev-outliner-content';
        panel.appendChild(this.outliner);
        this.container.appendChild(panel);
    }

    refreshOutliner() {
        if (!this.outliner) return;
        this.outliner.innerHTML = '';

        const groups = {};
        const all = this.devMode.app.world.colliders;

        all.forEach(entity => {
            if (!entity.mesh) return;
            const cat = this._getCategory(entity.type || entity.constructor.name);
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(entity);
        });

        Object.keys(groups).sort().forEach(cat => {
            const groupDiv = document.createElement('div');
            groupDiv.className = `dev-outliner-group ${this.expandedGroups.has(cat) ? '' : 'collapsed'}`;

            const header = document.createElement('div');
            header.className = 'dev-outliner-group-header';
            header.textContent = `${cat} (${groups[cat].length})`;
            header.onclick = () => {
                if (this.expandedGroups.has(cat)) this.expandedGroups.delete(cat);
                else this.expandedGroups.add(cat);
                this.refreshOutliner();
            };
            groupDiv.appendChild(header);

            if (this.expandedGroups.has(cat)) {
                groups[cat].forEach(entity => {
                    const item = document.createElement('div');
                    const isSelected = this.devMode.selectedObjects.includes(entity.mesh);
                    item.className = `dev-outliner-item ${isSelected ? 'selected' : ''}`;

                    // Allow clicking anywhere on row to select
                    item.onclick = (e) => {
                        // Don't trigger if clicked on visibility toggle
                        if (e.target.classList.contains('dev-outliner-visibility')) return;
                        // Multi-select with shift
                        this.devMode.selectObject(entity.mesh, e.shiftKey);
                    };

                    const name = document.createElement('span');
                    const displayName = entity.constructor.displayName || entity.type || 'Object';
                    name.textContent = displayName;
                    item.appendChild(name);

                    // Visibility Toggle
                    const vis = document.createElement('div');
                    vis.className = `dev-outliner-visibility ${entity.mesh.visible ? '' : 'is-hidden'}`;
                    vis.title = 'Toggle Visibility';
                    vis.onclick = (e) => {
                        e.stopPropagation();
                        entity.mesh.visible = !entity.mesh.visible;
                        vis.className = `dev-outliner-visibility ${entity.mesh.visible ? '' : 'is-hidden'}`;
                    };
                    item.appendChild(vis);

                    groupDiv.appendChild(item);
                });
            }
            this.outliner.appendChild(groupDiv);
        });
    }

    // --- Inspector ---
    _createInspector() {
        const panel = this._createPanel('dev-inspector', 'Properties'); // Title will be overwritten by tabs
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
                this.refreshInspector();
            };
            tabs.appendChild(tab);
        });
        panel.appendChild(tabs);

        const content = document.createElement('div');
        content.className = 'dev-inspector-content';
        panel.appendChild(content);

        this.inspectorPanel = panel; // Reference to full panel if needed
        this.inspector = content; // Content area
        this.container.appendChild(panel);
    }

    refreshInspector() {
        if (!this.inspector) return;
        this.inspector.innerHTML = '';

        // Update Tabs Active State
        const tabs = this.container.querySelectorAll('.dev-inspector-tab');
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

    _renderProperties() {
        const selection = this.devMode.selectedObjects;
        if (!selection || selection.length === 0) {
            this.inspector.innerHTML = '<div style="color:#666; font-style:italic;">No object selected</div>';
            return;
        }

        const obj = selection[0];

        // Header
        const header = document.createElement('div');
        header.className = 'dev-prop-title';
        header.textContent = selection.length > 1 ? `${selection.length} Objects Selected` : (obj.userData.type || 'Object');
        this.inspector.appendChild(header);

        // Transform
        if (selection.length === 1) {
            this._addPropGroup('Transform', [
                this._createVectorInput('Position', obj.position, (v) => this._applyTransform(obj, 'position', v)),
                this._createVectorInput('Rotation', obj.rotation, (v) => this._applyTransform(obj, 'rotation', v), true),
                this._createScaleInput(obj)
            ]);
        } else {
             // Multi-select transform handled by gizmo mostly, but could show centroid here?
             // For now, minimal multi-select UI
             this.inspector.innerHTML += '<div style="color:#888;">Use Gizmo to transform selection.</div>';
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
        this.inspector.appendChild(delBtn);
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

        // Wait Time Control (Specific to Vehicles usually)
        if (obj.userData.waitTime !== undefined) {
             const waitRow = this._createNumberInput('Wait Time (s)', obj.userData.waitTime, (val) => {
                 obj.userData.waitTime = val;
                 // Also update params if it exists there to be safe
                 if (obj.userData.params) obj.userData.params.waitTime = val;
             });
             group.appendChild(waitRow);
        }

        this.inspector.appendChild(group);
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
                // Also update persistent world setting if needed, but TimeCycle is authoritative at runtime
                // The serialize function reads from tc.isLocked anyway via environment object
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

        container.appendChild(envGroup);
        this.inspector.appendChild(container);
    }

    _syncInspector() {
        const selection = this.devMode.selectedObjects;
        if (!selection || selection.length === 0) return;
        const obj = selection[0];

        if (selection.length === 1) {
            this._syncVectorInput('Position', obj.position);
            this._syncVectorInput('Rotation', obj.rotation, true);
            this._syncVectorInput('Scale', obj.scale);
        }
    }

    // --- Palette ---
    _createPalette() {
        const container = document.createElement('div');
        container.className = 'dev-palette-container dev-panel';

        // Tabs
        const header = document.createElement('div');
        header.className = 'dev-panel-header';
        header.style.padding = '0';
        header.style.justifyContent = 'flex-start';

        const tabsDiv = document.createElement('div');
        tabsDiv.className = 'dev-palette-tabs';
        this.tabsDiv = tabsDiv;
        header.appendChild(tabsDiv);

        container.appendChild(header);

        this.palette = document.createElement('div');
        this.palette.className = 'dev-palette-grid';
        container.appendChild(this.palette);

        this.container.appendChild(container); // Append panel to root
    }

    refreshPalette() {
        if (!this.palette) return;
        this.tabsDiv.innerHTML = '';
        this.palette.innerHTML = '';

        const categories = ['All', 'Residential', 'Infrastructure', 'Vehicles', 'Nature', 'Props'];
        categories.forEach(cat => {
            const tab = document.createElement('div');
            tab.className = `dev-palette-tab ${this.selectedCategory === cat ? 'active' : ''}`;
            tab.textContent = cat;
            tab.onclick = () => {
                this.selectedCategory = cat;
                this.refreshPalette();
            };
            this.tabsDiv.appendChild(tab);
        });

        // Populate Grid
        EntityRegistry.registry.forEach((Cls, type) => {
            const cat = this._getCategory(type);
            if (this.selectedCategory !== 'All' && cat !== this.selectedCategory) return;

            const item = document.createElement('div');
            item.className = 'dev-palette-item';
            item.draggable = true;

            // Thumbnail
            const img = document.createElement('img');
            img.className = 'dev-palette-thumb';
            if (this.thumbnails.has(type)) {
                img.src = this.thumbnails.get(type);
            } else {
                // Generate async
                setTimeout(() => {
                   const url = this.thumbnailRenderer.generate(Cls);
                   if (url) {
                       this.thumbnails.set(type, url);
                       img.src = url;
                   }
                }, 0);
            }
            item.appendChild(img);

            // Label
            const label = document.createElement('div');
            label.className = 'dev-palette-name';
            label.textContent = Cls.displayName || type;
            item.appendChild(label);

            // Drag Events
            item.ondragstart = (e) => {
                e.dataTransfer.setData('text/plain', type);
                e.dataTransfer.setData('type', type);
                if (this.devMode.interaction) {
                    this.devMode.interaction.onDragStart(type);
                }
            };
            item.ondragend = () => {
                // this.devMode.interaction.onDragEnd(); // if needed
            };

            // Click to create (fallback)
            item.onclick = () => {
                this.devMode.setPlacementMode(type);
            };

            this.palette.appendChild(item);
        });
    }

    // --- History ---
    _createHistory() {
        const panel = this._createPanel('dev-history', 'Timeline');
        this.history = document.createElement('div');
        this.history.className = 'dev-history-list';
        panel.appendChild(this.history);
        this.container.appendChild(panel);
    }

    refreshHistory() {
        if (!this.history || !this.devMode.commandManager) return;
        this.history.innerHTML = '';

        const stack = this.devMode.commandManager.undoStack;
        this.lastHistoryLen = stack.length + this.devMode.commandManager.redoStack.length;

        // Show last 10
        const start = Math.max(0, stack.length - 10);
        for (let i = stack.length - 1; i >= start; i--) {
            const cmd = stack[i];
            const item = document.createElement('div');
            item.className = 'dev-history-item';
            item.textContent = cmd.description || 'Unknown Action';
            this.history.appendChild(item);
        }
    }

    showSaveIndicator() {
        const ind = document.getElementById('dev-save-indicator');
        if (ind) {
            ind.style.display = 'block';
            ind.style.animation = 'none';
            ind.offsetHeight; /* trigger reflow */
            ind.style.animation = 'fadeOut 2s forwards 2s';
        }
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
                    // Update all axes proportionally or to same value?
                    // Typically uniform scale means all axes = same value OR all axes multiply by same ratio.
                    // For simplicity in a game editor, setting one usually sets all if "locked".
                    const ratio = n / vec[axis]; // Calculate ratio if we wanted proportional, but uniform setting is easier
                    // Let's set all to 'n' for uniform scaling behavior which is standard for "Scale" usually.
                    // Actually, proportional is better if object is 1x2x1.
                    // But here, we usually start at 1,1,1.
                    // Let's just set all to n.
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
        const row = document.createElement('div');
        row.className = 'dev-prop-row';
        const l = document.createElement('div');
        l.className = 'dev-prop-label';
        l.textContent = key;
        row.appendChild(l);

        const inp = document.createElement('input');
        inp.type = 'number';
        inp.className = 'dev-prop-input';
        inp.value = val;
        inp.onchange = (e) => cb(parseFloat(e.target.value));
        row.appendChild(inp);
        return row;
    }

    _createTextInput(key, val, cb) {
         const row = document.createElement('div');
        row.className = 'dev-prop-row';
        const l = document.createElement('div');
        l.className = 'dev-prop-label';
        l.textContent = key;
        row.appendChild(l);

        const inp = document.createElement('input');
        inp.type = 'text';
        inp.className = 'dev-prop-input';
        inp.value = val;
        inp.onchange = (e) => cb(e.target.value);
        row.appendChild(inp);
        return row;
    }

    _createCheckbox(key, val, cb) {
        const row = document.createElement('div');
        row.className = 'dev-prop-row';
        const l = document.createElement('div');
        l.className = 'dev-prop-label';
        l.textContent = key;
        row.appendChild(l);

        const inp = document.createElement('input');
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

        this.devMode.commandManager.push({
            type: 'Transform',
            description: `Transform ${prop}`,
            undo: () => {
                obj.position.copy(before[0].position);
                obj.rotation.copy(before[0].rotation);
                obj.scale.copy(before[0].scale);
                obj.updateMatrixWorld();
                if (this.devMode.app.colliderSystem) this.devMode.app.colliderSystem.updateBody(obj);
                this._syncInspector();
            },
            redo: () => {
                obj.position.copy(after[0].position);
                obj.rotation.copy(after[0].rotation);
                obj.scale.copy(after[0].scale);
                obj.updateMatrixWorld();
                if (this.devMode.app.colliderSystem) this.devMode.app.colliderSystem.updateBody(obj);
                this._syncInspector();
            }
        });
    }

    _applyParam(obj, key, val) {
        const oldVal = obj.userData.params[key];
        obj.userData.params[key] = val;

        this.devMode.commandManager.push({
             description: `Set ${key}`,
             undo: () => { obj.userData.params[key] = oldVal; this.refreshInspector(); },
             redo: () => { obj.userData.params[key] = val; this.refreshInspector(); }
        });
    }
}
