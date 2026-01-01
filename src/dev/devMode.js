// src/dev/devMode.js
import * as THREE from 'three';
import { DevCameraController } from './devCamera.js';
import { BuildUI } from './buildUI.js';
import { InteractionManager, setupDragDrop } from './interaction.js';
import { GridSystem } from './grid.js';
import { GizmoManager } from './gizmo.js';
import { EntityRegistry } from '../world/entities/index.js';
import { CommandManager, CreateObjectCommand, DeleteObjectCommand, TransformCommand, cloneTransform } from './history.js';
import { WaypointManager } from './waypointManager.js';

export class DevMode {
    constructor(app) {
        this.app = app;
        this.enabled = false;

        this.selectedObjects = []; // Replaces single selectedObject
        this.clipboard = null;
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

        // 2. Hide HUD (Terminal)
        const hudEl = document.querySelector('.hud-container');
        if (hudEl) hudEl.style.display = 'none';

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

    _removeObjects(objects) {
        if (!objects) return;
        objects.forEach(obj => {
            if (!obj || obj.userData?.type === 'waypoint') return;

            if (obj.userData.waypointGroup) {
                this.app.renderer.scene.remove(obj.userData.waypointGroup);
            }
            this.app.renderer.scene.remove(obj);
            if (this.app.colliderSystem) {
                this.app.colliderSystem.remove(obj);
            }
            if (this.app.world) {
                this.app.world.removeEntity(obj);
            }
        });
    }

    selectObject(object, shiftKey = false) {
        if (!object) {
            this.selectObjects([]);
            return;
        }

        let nextSelection = [];

        if (shiftKey) {
            const idx = this.selectedObjects.indexOf(object);
            if (idx !== -1) {
                nextSelection = [
                    ...this.selectedObjects.slice(0, idx),
                    ...this.selectedObjects.slice(idx + 1),
                ];
            } else {
                nextSelection = [...this.selectedObjects, object];
            }
        } else {
            nextSelection = [object];
        }

        this.selectObjects(nextSelection);
    }

    selectObjects(objects) {
        this.selectedObjects = objects || [];

        if (this.selectedObjects.length === 0) {
            this.gizmo.detach();
        } else {
            this.gizmo.attach(this.selectedObjects);
        }

        if (this.ui && this.ui.onSelectionChanged) this.ui.onSelectionChanged();
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

    _deepClone(data) {
        if (!data) return data;
        if (typeof structuredClone === 'function') {
            return structuredClone(data);
        }
        return JSON.parse(JSON.stringify(data));
    }

    _findEntityByMesh(mesh) {
        if (!this.app?.world?.colliders) return null;
        return this.app.world.colliders.find((entity) => entity.mesh === mesh) || null;
    }

    _serializeMesh(mesh) {
        if (!mesh) return null;

        const entity = this._findEntityByMesh(mesh);
        if (entity?.serialize) {
            return this._deepClone(entity.serialize());
        }

        if (mesh.userData?.type === 'ring') {
            return {
                type: 'ring',
                position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
                rotation: { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z },
                scale: { x: mesh.scale.x, y: mesh.scale.y, z: mesh.scale.z }
            };
        }

        if (mesh.userData?.type) {
            const params = this._deepClone(mesh.userData.params || {});
            return {
                type: mesh.userData.type,
                params,
                position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
                rotation: { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z },
                scale: { x: mesh.scale.x, y: mesh.scale.y, z: mesh.scale.z }
            };
        }

        return null;
    }

    _recordCreation(objects, description = 'Create object') {
        const serialized = (objects || [])
            .map(obj => this._serializeMesh(obj))
            .filter(Boolean);

        if (serialized.length) {
            this.history.push(new CreateObjectCommand(this, serialized, objects, description));
        }
    }

    copySelected() {
        if (!this.selectedObjects.length) return false;
        const serialized = this.selectedObjects
            .map(obj => this._serializeMesh(obj))
            .filter(Boolean);

        if (!serialized.length) return false;
        this.clipboard = serialized;
        return true;
    }

    _instantiateFromClipboard(data) {
        if (!data) return null;
        if (data.type === 'ring' && this.app?.rings) {
            const position = data.position || { x: 0, y: 0, z: 0 };
            const rotation = data.rotation || { x: 0, y: 0, z: 0 };
            this.app.rings.spawnRingAt(position, rotation);
            const spawned = this.app.rings.rings[this.app.rings.rings.length - 1];
            if (spawned?.mesh && data.scale) {
                spawned.mesh.scale.set(data.scale.x, data.scale.y, data.scale.z);
            }
            return spawned?.mesh || null;
        }

        const params = this._deepClone(data.params || {});
        // Ensure UUID is preserved or assigned
        if (!params.uuid && data.params?.uuid) {
            params.uuid = data.params.uuid;
        }

        if (data.position) {
            params.x = data.position.x;
            params.y = data.position.y;
            params.z = data.position.z;
        }
        if (data.rotation) {
            params.rotX = data.rotation.x;
            params.rotY = data.rotation.y;
            params.rotZ = data.rotation.z;
        }

        const entity = EntityRegistry.create(data.type, params);
        if (!entity || !entity.mesh) return null;

        if (data.scale) {
            entity.mesh.scale.set(data.scale.x, data.scale.y, data.scale.z);
            if (entity.box) {
                entity.box.setFromObject(entity.mesh);
            }
        }

        this.app.renderer.scene.add(entity.mesh);
        this.app.world.addEntity(entity);
        if (this.app.colliderSystem) {
            this.app.colliderSystem.addStatic([entity]);
        }

        if (entity.mesh.userData?.waypointGroup && this.enabled) {
            const wg = entity.mesh.userData.waypointGroup;
            wg.visible = true;
            if (wg.parent !== this.app.renderer.scene) {
                this.app.renderer.scene.add(wg);
            }
        }

        return entity.mesh;
    }

    pasteClipboard() {
        if (!this.clipboard) return null;

        const clipboardItems = Array.isArray(this.clipboard)
            ? this.clipboard
            : [this.clipboard];

        const newObjects = clipboardItems
            .map(item => this._instantiateFromClipboard(this._deepClone(item)))
            .filter(Boolean);

        if (newObjects.length > 0) {
            this.selectObjects(newObjects);
            this._recordCreation(newObjects, 'Paste objects');
            return newObjects;
        }

        return null;
    }

    duplicateSelected() {
        const copied = this.copySelected();
        if (!copied) return null;
        return this.pasteClipboard();
    }

    deleteSelected() {
        if (this.selectedObjects.length === 0) return;

        // Separate waypoints from regular objects
        const waypoints = this.selectedObjects.filter(o => o.userData.type === 'waypoint');
        const objects = this.selectedObjects.filter(o => o.userData.type !== 'waypoint');

        // Handle regular objects
        if (objects.length > 0) {
            const serialized = objects
                .map(obj => this._serializeMesh(obj))
                .filter(Boolean);

            if (serialized.length) {
                const command = new DeleteObjectCommand(this, serialized, 'Delete objects');
                this._removeObjects(objects);
                this.history.push(command);
            }
        }

        // Handle waypoints via WaypointManager
        if (waypoints.length > 0) {
            this.waypoints.delete(waypoints);
        }

        this.selectObject(null);
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
