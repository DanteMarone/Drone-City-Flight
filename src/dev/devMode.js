// src/dev/devMode.js
import * as THREE from 'three';
import { DevCameraController } from './devCamera.js';
import { DevUI } from './devUI.js';
import { InteractionManager, setupDragDrop } from './interaction.js';
import { GridSystem } from './grid.js';
import { GizmoManager } from './gizmo.js';
import { EntityRegistry } from '../world/entities/index.js';

export class DevMode {
    constructor(app) {
        this.app = app;
        this.enabled = false;

        this.selectedObjects = []; // Replaces single selectedObject
        this.clipboard = null;

        // Controllers
        this.cameraController = new DevCameraController(app.renderer.camera, app.container);
        this.ui = new DevUI(this);
        this.interaction = new InteractionManager(this.app, this);

        // New Systems
        this.grid = new GridSystem(app.renderer.scene);
        this.gizmo = new GizmoManager(app.renderer.scene, app.renderer.camera, app.renderer, this.interaction);

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

        // 2. Hide HUD
        const hudEl = document.querySelector('.hud-container');
        if (hudEl) hudEl.style.display = 'none';

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

        // Pause Gameplay
        this.app.paused = true;
    }

    disable() {
        console.log("DevMode: Disabled");
        this.enabled = false;

        if (this.app.drone) this.app.drone.mesh.visible = true;
        const hudEl = document.querySelector('.hud-container');
        if (hudEl) hudEl.style.display = 'block';

        this.cameraController.enabled = false;
        this.app.cameraController.enabled = true;

        this.ui.hide();
        this.interaction.disable();

        this.grid.helper.visible = false;
        this.gizmo.detach();
        this.selectObject(null);

        // Hide Waypoint Visuals
        this._setWaypointVisibility(false);
        this.app.paused = false;
    }

    refreshVisibility() {
        if (this.enabled) {
            this._setWaypointVisibility(true);
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
        // We need to check if ANY selected object is a waypoint or car
        // Or simplified: Just check the selected objects list.

        // For performance, maybe only check if gizmo is active?
        // But dragging happens in InteractionManager/Gizmo.

        // Let's iterate selected objects to update lines if needed
        this.selectedObjects.forEach(sel => {
            if (sel.userData.type === 'waypoint') {
                const vehicle = sel.userData.vehicle;
                if (vehicle) {
                    const idx = sel.userData.index;
                    if (idx !== undefined && vehicle.userData.waypoints) {
                         vehicle.userData.waypoints[idx].copy(sel.position);
                         this._updateCarLine(vehicle);
                    }
                }
            } else if (['car', 'bicycle', 'pickupTruck'].includes(sel.userData.type)) {
                this._updateCarLine(sel);
            }
        });
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

    addWaypointToSelected() {
        // Only works if a single car/bicycle is selected, or we iterate all.
        // User requirements say "Any options that don't apply to all... should not be displayed"
        // If multiple cars selected, we could add waypoint to all?
        // For now, let's limit to single selection for waypoints or just the first valid one.
        // But UI logic should probably handle the button visibility.

        // Let's apply to ALL selected cars.
        const cars = this.selectedObjects.filter(o => ['car', 'bicycle', 'pickupTruck'].includes(o.userData.type));
        if (cars.length === 0) return;

        cars.forEach(car => {
            if (car.userData.waypoints.length >= 5) {
                console.warn(`Car ${car.id} max waypoints reached.`);
                return;
            }

            const visualGroup = car.userData.waypointGroup;
            if (!visualGroup) return;

            const lastPos = car.userData.waypoints.length > 0
                ? car.userData.waypoints[car.userData.waypoints.length - 1]
                : car.position.clone();

            const newPos = lastPos.clone().add(new THREE.Vector3(10, 0, 0));

            car.userData.waypoints.push(newPos);
            const idx = car.userData.waypoints.length - 1;

            const orbGeo = new THREE.SphereGeometry(0.5, 16, 16);
            const orbMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const orb = new THREE.Mesh(orbGeo, orbMat);
            orb.position.copy(newPos);
            orb.userData = { type: 'waypoint', isHelper: true, index: idx, vehicle: car };
            visualGroup.add(orb);

            visualGroup.visible = true;
            if (visualGroup.parent !== this.app.renderer.scene) {
                this.app.renderer.scene.add(visualGroup);
            }

            if (car.userData.waypoints.length === 1 && !visualGroup.getObjectByName('pathLine')) {
                 const material = new THREE.LineBasicMaterial({ color: 0xffffff });
                 const points = [car.position.clone(), newPos];
                 const geometry = new THREE.BufferGeometry().setFromPoints(points);
                 const line = new THREE.Line(geometry, material);
                 line.name = 'pathLine';
                 visualGroup.add(line);
            } else {
                this._updateCarLine(car);
            }
            if (this.app.colliderSystem) this.app.colliderSystem.updateBody(car);
        });

        // Refresh properties if only 1 is selected (showing detailed view)
        if (this.selectedObjects.length === 1) {
            this.ui.updateProperties(this.selectedObjects[0]);
        }
    }

    removeWaypointFromSelected() {
        const cars = this.selectedObjects.filter(o => ['car', 'bicycle', 'pickupTruck'].includes(o.userData.type));

        cars.forEach(car => {
            if (car.userData.waypoints.length === 0) return;

            car.userData.waypoints.pop();
            const visualGroup = car.userData.waypointGroup;
            if (visualGroup) {
                const spheres = visualGroup.children.filter(c => c.userData.type === 'waypoint');
                if (spheres.length > 0) {
                    const lastSphere = spheres[spheres.length - 1];
                    visualGroup.remove(lastSphere);
                }
                if (car.userData.waypoints.length === 0) {
                    const line = visualGroup.getObjectByName('pathLine');
                    if (line) visualGroup.remove(line);
                } else {
                    this._updateCarLine(car);
                }
            }
            if (this.app.colliderSystem) this.app.colliderSystem.updateBody(car);
        });

        if (this.selectedObjects.length === 1) {
            this.ui.updateProperties(this.selectedObjects[0]);
        }
    }

    selectObject(object, shiftKey = false) {
        if (!object) {
            // Deselect all
            this.selectedObjects = [];
            this.gizmo.detach();
            this.ui.hideProperties();
            return;
        }

        if (shiftKey) {
            // Toggle
            const idx = this.selectedObjects.indexOf(object);
            if (idx !== -1) {
                // Remove
                this.selectedObjects.splice(idx, 1);
            } else {
                // Add
                this.selectedObjects.push(object);
            }
        } else {
            // Single Select
            // If already selected and single click, we might just want to keep it selected.
            // But prompt says: "Clicking on a new object without holding select should only select the single item and clear the group."
            // Implicitly, clicking the SAME object without shift should probably just keep it selected (or reset group to just that one).
            this.selectedObjects = [object];
        }

        if (this.selectedObjects.length === 0) {
             this.gizmo.detach();
             this.ui.hideProperties();
        } else {
            // Pass the whole array to gizmo
            this.gizmo.attach(this.selectedObjects);

            // Show properties.
            // If multiple, Gizmo will manage the "Proxy" and UI should show that.
            if (this.selectedObjects.length > 1) {
                this.ui.showProperties(this.gizmo.proxy); // Show Group Properties
            } else {
                this.ui.showProperties(this.selectedObjects[0]);
            }
        }
    }

    _handleShortcuts(e) {
        if (!this.enabled) return;
        if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

        if (e.ctrlKey) {
            if (e.code === 'KeyC') {
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

    copySelected() {
        if (!this.selectedObjects.length) return false;
        const target = this.selectedObjects[0];
        const data = this._serializeMesh(target);
        if (!data) return false;
        this.clipboard = data;
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
        const mesh = this._instantiateFromClipboard(this._deepClone(this.clipboard));
        if (mesh) {
            this.selectObject(mesh);
        }
        return mesh;
    }

    duplicateSelected() {
        const copied = this.copySelected();
        if (!copied) return null;
        return this.pasteClipboard();
    }

    deleteSelected() {
        if (this.selectedObjects.length > 0) {
            // Create a copy because we modify the array during iteration if we weren't careful,
            // but here we just clear selection at the end.
            const toDelete = [...this.selectedObjects];

            toDelete.forEach(obj => {
                 if (obj.userData.type === 'waypoint') return; // Skip explicit waypoint deletion via DEL key for now

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

            this.selectObject(null);
        }
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
            rings: this.app.rings.exportRings()
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
                this.app.loadMap(data);
            } catch (err) {
                console.error("Failed to load map:", err);
                alert("Invalid map file");
            }
        };
        reader.readAsText(file);
    }
}
