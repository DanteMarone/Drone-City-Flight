// src/dev/devMode.js
import * as THREE from 'three';
import { DevCameraController } from './devCamera.js';
import { BuildUI } from './buildUI.js';
import { InteractionManager, setupDragDrop } from './interaction.js';
import { GridSystem } from './grid.js';
import { GizmoManager } from './gizmo.js';
import { EntityRegistry } from '../world/entities/index.js';
import { CommandManager, CreateObjectCommand, DeleteObjectCommand, TransformCommand, WaypointCommand, cloneTransform, cloneWaypointState } from './history.js';

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

        // One-time setup for drag-drop
        setupDragDrop(this.interaction, this.app.container);

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
        this.ui.show();

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
        this.enabled = false;

        if (this.app.drone) this.app.drone.mesh.visible = true;
        const hudEl = document.querySelector('.hud-container');
        if (hudEl) hudEl.style.display = 'block';

        this.cameraController.enabled = false;
        this.app.cameraController.enabled = true;

        this.ui.hide();
        this.interaction.disable();

        // Cleanup
        this.selectObject(null);
        this.setPlacementMode(null); // Cancel placement
        this.gizmo.detach();

        this.grid.helper.visible = false;

        // Hide Waypoint Visuals
        this._setWaypointVisibility(false);
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
            this._setWaypointVisibility(true);
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

    _setWaypointVisibility(visible) {
        if (this.app.world && this.app.world.colliders) {
            this.app.world.colliders.forEach(c => {
                const obj = c.mesh;
                if (obj && obj.userData.waypointGroup) {
                    obj.userData.waypointGroup.visible = visible;
                    // Ensure they are in scene
                    if (visible && obj.userData.waypointGroup.parent !== this.app.renderer.scene) {
                        this.app.renderer.scene.add(obj.userData.waypointGroup);
                    } else if (!visible && obj.userData.waypointGroup.parent === this.app.renderer.scene) {
                        this.app.renderer.scene.remove(obj.userData.waypointGroup);
                    }
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
        this.selectedObjects.forEach(sel => {
            if (sel.userData.type === 'waypoint') {
                const vehicle = sel.userData.vehicle;
                if (vehicle) {
                    const idx = sel.userData.index;
                    if (idx !== undefined && vehicle.userData.waypoints) {
                         vehicle.userData.waypoints[idx].copy(sel.position);
                         this._updateCarLine(vehicle);

                         // Check for River Entity rebuild
                         this._triggerEntityRebuild(vehicle);
                    }
                }
            } else if (sel.userData.isVehicle || sel.userData.isPath) {
                this._updateCarLine(sel);
                this._triggerEntityRebuild(sel);
            }
        });
    }

    _triggerEntityRebuild(mesh) {
        const entity = this._findEntityByMesh(mesh);
        if (entity && typeof entity.rebuildGeometry === 'function') {
            entity.rebuildGeometry();
        }
    }

    _updateCarLine(vehicleMesh) {
        const visualGroup = vehicleMesh.userData.waypointGroup;
        if (!visualGroup) return;

        const line = visualGroup.getObjectByName('pathLine');
        if (line) {
             // Path: Vehicle Position -> Waypoint 1 -> ...
             const points = [vehicleMesh.position.clone(), ...vehicleMesh.userData.waypoints];
             line.geometry.dispose();
             line.geometry = new THREE.BufferGeometry().setFromPoints(points);
        }
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
                    this._updateCarLine(vehicle);
                    this._triggerEntityRebuild(vehicle);
                    toUpdate.add(vehicle);
                }
            } else if (obj.userData?.isVehicle || obj.userData?.isPath) {
                this._updateCarLine(obj);
                this._triggerEntityRebuild(obj);
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

    applyWaypointSnapshot(states) {
        if (!states || states.length === 0) return;

        states.forEach(state => {
            if (!state.car) return;
            state.car.userData.waypoints = state.waypoints.map(wp => wp.clone());
            this._syncWaypointVisuals(state.car);
            this._triggerEntityRebuild(state.car);
            if (this.app.colliderSystem) {
                this.app.colliderSystem.updateBody(state.car);
            }
        });

        if (this.selectedObjects.length === 1) {
            this.ui.updateProperties(this.selectedObjects[0]);
        }
    }

    _syncWaypointVisuals(car) {
        const visualGroup = car.userData.waypointGroup;
        if (!visualGroup) return;

        const oldLine = visualGroup.getObjectByName('pathLine');
        if (oldLine) {
            oldLine.geometry.dispose();
            visualGroup.remove(oldLine);
        }

        const oldWaypoints = visualGroup.children.filter(c => c.userData?.type === 'waypoint');
        oldWaypoints.forEach(c => visualGroup.remove(c));

        // Color coding: Cyan for Rivers, White for generic/vehicles
        const color = car.userData.type === 'river' ? 0x00ffff : 0xffffff;

        const orbGeo = new THREE.SphereGeometry(0.5, 16, 16);
        const orbMat = new THREE.MeshBasicMaterial({ color: color });

        (car.userData.waypoints || []).forEach((wp, idx) => {
            const orb = new THREE.Mesh(orbGeo, orbMat);
            orb.position.copy(wp);
            orb.userData = { type: 'waypoint', isHelper: true, index: idx, vehicle: car };
            visualGroup.add(orb);
        });

        if (car.userData.waypoints?.length) {
            // Match line color to orbs
            const color = car.userData.type === 'river' ? 0x00ffff : 0xffffff;
            const material = new THREE.LineBasicMaterial({ color: color });
            const points = [car.position.clone(), ...car.userData.waypoints];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, material);
            line.name = 'pathLine';
            visualGroup.add(line);
        }

        if (this.enabled) {
            visualGroup.visible = true;
            if (visualGroup.parent !== this.app.renderer.scene) {
                this.app.renderer.scene.add(visualGroup);
            }
        } else {
            visualGroup.visible = false;
            if (visualGroup.parent === this.app.renderer.scene) {
                this.app.renderer.scene.remove(visualGroup);
            }
        }
    }

    addWaypointToSelected() {
        const waypoints = this.selectedObjects.filter(o => o.userData.type === 'waypoint');
        const cars = this.selectedObjects.filter(o => o.userData.isVehicle || o.userData.isPath);

        // Combine cars and unique cars derived from selected waypoints
        const targets = new Map();

        cars.forEach(car => targets.set(car.uuid, { car, index: -1 })); // -1 means append
        waypoints.forEach(wp => {
            const car = wp.userData.vehicle;
            if (car) {
                targets.set(car.uuid, { car, index: wp.userData.index });
            }
        });

        if (targets.size === 0) return;

        const carList = Array.from(targets.values()).map(t => t.car);
        const beforeStates = carList.map(cloneWaypointState);
        let changed = false;
        let newSelection = [];

        targets.forEach(({ car, index }) => {
            if (car.userData.waypoints.length >= 20) { // Limit reasonable number
                console.warn(`Car ${car.uuid} max waypoints reached.`);
                return;
            }

            changed = true;

            let insertIndex;
            let refPos;

            const wpCount = car.userData.waypoints.length;
            const isLast = (index === -1) || (index === wpCount - 1);

            if (isLast) {
                insertIndex = wpCount;
                if (wpCount > 0) {
                    refPos = car.userData.waypoints[wpCount - 1];
                } else {
                    refPos = car.position.clone();
                }
            } else {
                insertIndex = index + 1;
                refPos = car.userData.waypoints[index];
            }

            const newPos = refPos.clone().add(new THREE.Vector3(10, 0, 0));

            car.userData.waypoints.splice(insertIndex, 0, newPos);

            this._syncWaypointVisuals(car);
            this._triggerEntityRebuild(car);

            if (this.app.colliderSystem) this.app.colliderSystem.updateBody(car);

            // Find the new waypoint orb to select it
            if (car.userData.waypointGroup) {
                const orb = car.userData.waypointGroup.children.find(c =>
                    c.userData.type === 'waypoint' && c.userData.index === insertIndex
                );
                if (orb) newSelection.push(orb);
            }
        });

        if (changed) {
            const afterStates = carList.map(cloneWaypointState);
            this.history.push(new WaypointCommand(this, beforeStates, afterStates, 'Add waypoint'));

            if (newSelection.length > 0) {
                this.selectObjects(newSelection);
            } else if (this.selectedObjects.length === 1) {
                this.ui.updateProperties(this.selectedObjects[0]);
            }
        }
    }

    removeWaypointFromSelected() {
        const cars = this.selectedObjects.filter(o => o.userData.isVehicle || o.userData.isPath);

        const beforeStates = cars.map(cloneWaypointState);
        let changed = false;

        cars.forEach(car => {
            if (car.userData.waypoints.length === 0) return;

            changed = true;

            car.userData.waypoints.pop();
            this._syncWaypointVisuals(car);
            this._triggerEntityRebuild(car);
            if (this.app.colliderSystem) this.app.colliderSystem.updateBody(car);
        });

        if (this.selectedObjects.length === 1) {
            this.ui.updateProperties(this.selectedObjects[0]);
        }

        if (changed) {
            const afterStates = cars.map(cloneWaypointState);
            this.history.push(new WaypointCommand(this, beforeStates, afterStates, 'Remove waypoint'));
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
            if (this.app.world && this.app.world.colliders) {
                const idx = this.app.world.colliders.findIndex(c => c.mesh === obj);
                if (idx !== -1) this.app.world.colliders.splice(idx, 1);
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
            this.ui.hideProperties();
            return;
        }

        this.gizmo.attach(this.selectedObjects);

        if (this.selectedObjects.length > 1) {
            this.ui.showProperties(this.gizmo.proxy);
        } else {
            this.ui.showProperties(this.selectedObjects[0]);
        }
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

        // Handle waypoints
        if (waypoints.length > 0) {
            // Group by vehicle
            const targets = new Map();
            waypoints.forEach(wp => {
                const car = wp.userData.vehicle;
                if (car) {
                    if (!targets.has(car.uuid)) {
                        targets.set(car.uuid, { car, indices: [] });
                    }
                    targets.get(car.uuid).indices.push(wp.userData.index);
                }
            });

            const cars = Array.from(targets.values()).map(t => t.car);
            const beforeStates = cars.map(cloneWaypointState);
            let changed = false;

            targets.forEach(({ car, indices }) => {
                if (!car.userData.waypoints) return;

                // Sort indices descending to remove safely
                indices.sort((a, b) => b - a);

                indices.forEach(idx => {
                    if (idx >= 0 && idx < car.userData.waypoints.length) {
                         car.userData.waypoints.splice(idx, 1);
                         changed = true;
                    }
                });

                this._syncWaypointVisuals(car);
                this._triggerEntityRebuild(car);
                if (this.app.colliderSystem) this.app.colliderSystem.updateBody(car);
            });

            if (changed) {
                const afterStates = cars.map(cloneWaypointState);
                this.history.push(new WaypointCommand(this, beforeStates, afterStates, 'Delete waypoint'));
            }
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
                alert("Invalid map file");
            }
        };
        reader.readAsText(file);
    }
}
