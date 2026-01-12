// src/dev/devMode.js
import { DevCameraController } from './devCamera.js';
import { BuildUI } from './buildUI.js';
import { InteractionManager, setupDragDrop } from './interaction.js';
import { GridSystem } from './grid.js';
import { GizmoManager } from './gizmo.js';
import { DevClipboardManager } from './devClipboardManager.js';
import { DevSelectionManager } from './devSelectionManager.js';
import { CommandManager, TransformCommand, cloneTransform } from './history.js';
import { WaypointManager } from './waypointManager.js';

export class DevMode {
    constructor(app) {
        this.app = app;
        this.enabled = false;

        this.selectedObjects = []; // Replaces single selectedObject
        this.history = new CommandManager(this);

        this.placementMode = null; // Type of object being placed (e.g. 'road')

        // Controllers
        this.cameraController = new DevCameraController(app.renderer.camera, app.container);
        this.ui = new BuildUI(this);
        this.interaction = new InteractionManager(this.app, this);

        // New Systems
        this.grid = new GridSystem(app.renderer.scene);
        this.gizmo = new GizmoManager(app.renderer.scene, app.renderer.camera, app.renderer, this.interaction, this);
        this.waypoints = new WaypointManager(this);
        this.selectionManager = new DevSelectionManager(this);
        this.clipboardManager = new DevClipboardManager(this);

        // One-time setup for drag-drop
        setupDragDrop(this.interaction, this.app.container);

        // Init UI
        this.ui.init(this);

        // Listen for toggle key
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Backquote') {
                this.toggle();
            }
        });

        window.addEventListener('keydown', (e) => this._handleShortcuts(e));
    }

    toggle() {
        if (this.enabled) this.disable();
        else this.enable();
    }

    enable() {
        console.log("DevMode: Enabled");
        this.app.notifications.show("Dev Mode Enabled", "info", 2000);
        this.enabled = true;

        // 1. Hide Drone
        if (this.app.drone) this.app.drone.mesh.visible = false;

        // 2. Hide HUD (Terminal) & Minimap
        const hudEl = document.querySelector('.hud-container');
        if (hudEl) hudEl.style.display = 'none';
        if (this.app.minimap) this.app.minimap.setVisible(false);

        // Dismiss Tutorial Permanently
        if (this.app.tutorial) {
            this.app.tutorial.complete();
        }

        // 3. Switch Camera Controller
        this.app.cameraController.enabled = false;
        this.cameraController.enabled = true;
        this.cameraController.euler.setFromQuaternion(this.app.renderer.camera, 'YXZ');

        // 4. Show Dev UI
        this.ui.toggle(true);

        // 5. Enable Interaction
        this.interaction.enable();

        // 6. Enable Gizmo & Grid (if previously on)
        if (this.grid.enabled) this.grid.helper.visible = true;

        // 7. Show Waypoint Visuals
        this.refreshVisibility();

        // 8. Clear Drone Effects
        if (this.app.drone && this.app.drone.resetAltitudeEffects) {
            this.app.drone.resetAltitudeEffects();
        }

        // Pause Gameplay
        this.app.paused = true;
    }

    disable() {
        if (!this.enabled) return;
        console.log("DevMode: Disabled");
        this.app.notifications.show("Dev Mode Disabled", "info", 2000);
        this.enabled = false;

        if (this.app.drone) this.app.drone.mesh.visible = true;
        const hudEl = document.querySelector('.hud-container');
        if (hudEl) hudEl.style.display = 'block';
        if (this.app.minimap) this.app.minimap.setVisible(true);

        this.cameraController.enabled = false;
        this.app.cameraController.enabled = true;

        this.ui.toggle(false);
        this.interaction.disable();

        // Cleanup
        this.selectObject(null);
        this.setPlacementMode(null); // Cancel placement
        this.gizmo.detach();

        this.grid.helper.visible = false;

        // Hide Waypoint Visuals
        this.waypoints.setVisibility(false);
        this._setPlayerStartVisibility(false);
        this.app.paused = false;
    }

    setPlacementMode(type) {
        this.placementMode = type;
        if (type) {
            console.log(`Entered Placement Mode: ${type}`);
            this.selectObject(null); // Deselect current
            // InteractionManager handles the rest
        } else {
            // Cancelled
            if (this.interaction.activePlacement) {
                this.interaction.cancelPlacement();
            }
        }
    }

    refreshVisibility() {
        if (this.enabled) {
            this.waypoints.setVisibility(true);
            this._setPlayerStartVisibility(true);
        }
    }

    _setPlayerStartVisibility(visible) {
        if (this.app.world && this.app.world.colliders) {
            this.app.world.colliders.forEach(c => {
                if (c.type === 'playerStart' && c.mesh) {
                    c.mesh.visible = visible;
                }
            });
        }
    }

    update(dt) {
        if (!this.enabled) return;
        this.cameraController.update(dt);
        this.grid.update(this.cameraController.camera);
        this.gizmo.updateSnapping(this.grid);
        this.gizmo.update();

        // Update Line Visuals if a waypoint is being moved
        this.waypoints.update(dt);
    }

    captureTransforms(targets = this.selectedObjects) {
        if (!targets) return [];
        return targets.map(obj => cloneTransform(obj));
    }

    _transformsChanged(before, after) {
        if (!before || !after || before.length !== after.length) return true;
        for (let i = 0; i < before.length; i++) {
            const b = before[i];
            const a = after[i];
            if (!b.object || !a.object) return true;
            if (!b.position.equals(a.position)) return true;
            if (!b.rotation.equals(a.rotation)) return true;
            if (!b.scale.equals(a.scale)) return true;
        }
        return false;
    }

    applyTransformSnapshot(states) {
        if (!states || states.length === 0) return;
        const toUpdate = new Set();

        states.forEach(state => {
            const obj = state.object;
            if (!obj) return;

            obj.position.copy(state.position);
            obj.rotation.copy(state.rotation);
            obj.scale.copy(state.scale);
            obj.updateMatrixWorld();

            if (obj.userData?.type === 'waypoint') {
                const vehicle = obj.userData.vehicle;
                const idx = obj.userData.index;
                if (vehicle && idx !== undefined && vehicle.userData?.waypoints?.[idx]) {
                    vehicle.userData.waypoints[idx].copy(obj.position);
                    this.waypoints.updateLine(vehicle);
                    toUpdate.add(vehicle);
                }
            } else if (obj.userData?.isVehicle) {
                this.waypoints.updateLine(obj);
                toUpdate.add(obj);
            } else {
                toUpdate.add(obj);
            }
        });

        if (this.app.colliderSystem) {
            toUpdate.forEach(obj => this.app.colliderSystem.updateBody(obj));
        }

        if (this.selectedObjects.length > 0) {
            this.gizmo.attach(this.selectedObjects);
        }

        if (this.selectedObjects.length === 1) {
            this.ui.updateProperties(this.selectedObjects[0]);
        } else if (this.selectedObjects.length > 1) {
            this.ui.updateProperties(this.gizmo.proxy);
        }
    }

    selectObject(object, shiftKey = false) {
        this.selectionManager.selectObject(object, shiftKey);
    }

    selectObjects(objects) {
        this.selectionManager.selectObjects(objects);
    }

    _handleShortcuts(e) {
        if (!this.enabled) return;
        if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

        if (e.code === 'Delete') {
            e.preventDefault();
            this.deleteSelected();
            return;
        }

        if (e.key === 'Escape') {
            if (this.placementMode) {
                this.setPlacementMode(null);
            } else {
                this.selectObject(null);
            }
            return;
        }

        if (e.ctrlKey) {
            if (e.code === 'KeyZ') {
                e.preventDefault();
                this.history.undo();
            } else if (e.code === 'KeyY') {
                e.preventDefault();
                this.history.redo();
            } else if (e.code === 'KeyC') {
                e.preventDefault();
                this.copySelected();
            } else if (e.code === 'KeyV') {
                e.preventDefault();
                this.pasteClipboard();
            } else if (e.code === 'KeyD') {
                e.preventDefault();
                this.duplicateSelected();
            }
        }
    }

    copySelected() {
        return this.clipboardManager.copySelected();
    }

    pasteClipboard() {
        return this.clipboardManager.pasteClipboard();
    }

    duplicateSelected() {
        return this.clipboardManager.duplicateSelected();
    }

    _deepClone(data) {
        return this.clipboardManager._deepClone(data);
    }

    _instantiateFromClipboard(data) {
        return this.clipboardManager._instantiateFromClipboard(data);
    }

    _removeObjects(objects) {
        return this.clipboardManager._removeObjects(objects);
    }

    _recordCreation(objects, description = 'Create object') {
        return this.clipboardManager._recordCreation(objects, description);
    }

    deleteSelected() {
        return this.clipboardManager.deleteSelected();
    }

    // Commands
    clearMap() {
        this.app.world.clear();
        this.app.rings.clear();
        if (this.app.colliderSystem) {
            this.app.colliderSystem.clear();
        }
        this.selectObject(null);
    }

    saveMap() {
        const mapData = {
            version: 1,
            objects: this.app.world.exportMap().objects,
            rings: this.app.rings.exportRings(),
            history: this.history.toJSON()
        };

        const blob = new Blob([JSON.stringify(mapData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'custom_map.json';
        a.click();
        URL.revokeObjectURL(url);

        this.app.notifications.show("Map Exported Successfully", "success");
    }

    loadMap(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                // Hybrid Load Logic is handled in App.loadMap, but we need to pass the history data
                // App.loadMap receives the whole data object.
                this.app.loadMap(data);
            } catch (err) {
                console.error("Failed to load map:", err);
                this.app.notifications.show("Invalid Map File", "error");
            }
        };
        reader.readAsText(file);
    }
}
