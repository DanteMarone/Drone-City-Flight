// src/dev/devMode.js
import * as THREE from 'three';
import { DevCameraController } from './devCamera.js';
import { DevUI } from './devUI.js';
import { InteractionManager, setupDragDrop } from './interaction.js';
import { GridSystem } from './grid.js';
import { GizmoManager } from './gizmo.js';

export class DevMode {
    constructor(app) {
        this.app = app;
        this.enabled = false;

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
        this.cameraController.euler.setFromQuaternion(this.app.renderer.camera.quaternion);

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
        // Iterate through all colliders (which track the cars)
        if (this.app.world && this.app.world.colliders) {
            this.app.world.colliders.forEach(c => {
                const obj = c.mesh;
                if (obj && ['car', 'bicycle'].includes(obj.userData.type)) {
                    const visuals = obj.getObjectByName('waypointVisuals');
                    if (visuals) visuals.visible = visible;
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
        const sel = this.gizmo.selectedObject;
        if (sel && sel.userData.type === 'waypoint') {
            const visualGroup = sel.parent;
            if (visualGroup && visualGroup.parent && ['car', 'bicycle'].includes(visualGroup.parent.userData.type)) {
                const car = visualGroup.parent;
                // Sync underlying data
                // Find index of this waypoint in visuals
                const wpMeshes = visualGroup.children.filter(c => c.userData.type === 'waypoint');
                const idx = wpMeshes.indexOf(sel);
                if (idx !== -1) {
                    car.userData.waypoints[idx].copy(sel.position);
                    this._updateCarLine(car);
                }
            }
        }
    }

    _updateCarLine(carGroup) {
        const visualGroup = carGroup.getObjectByName('waypointVisuals');
        if (!visualGroup) return;

        const line = visualGroup.getObjectByName('pathLine');
        if (line) {
             const points = [new THREE.Vector3(0,0,0), ...carGroup.userData.waypoints];
             line.geometry.dispose();
             line.geometry = new THREE.BufferGeometry().setFromPoints(points);
        }
    }

    addWaypointToSelected() {
        const car = this.gizmo.selectedObject;
        if (!car || !['car', 'bicycle'].includes(car.userData.type)) return;

        if (car.userData.waypoints.length >= 5) {
            alert("Maximum 5 waypoints allowed.");
            return;
        }

        const visualGroup = car.getObjectByName('waypointVisuals');
        if (!visualGroup) return; // Should exist

        // Determine position: Last waypoint or default offset
        const lastPos = car.userData.waypoints.length > 0
            ? car.userData.waypoints[car.userData.waypoints.length - 1]
            : new THREE.Vector3(0,0,0);

        const newPos = lastPos.clone().add(new THREE.Vector3(10, 0, 0)); // Offset 10m

        // Add to data
        car.userData.waypoints.push(newPos);

        // Add visual
        const orbGeo = new THREE.SphereGeometry(0.5, 16, 16);
        const orbMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const orb = new THREE.Mesh(orbGeo, orbMat);
        orb.position.copy(newPos);
        orb.userData = { type: 'waypoint', isHelper: true };
        visualGroup.add(orb);

        // Create line if first waypoint
        if (car.userData.waypoints.length === 1 && !visualGroup.getObjectByName('pathLine')) {
             const material = new THREE.LineBasicMaterial({ color: 0xffffff });
             const points = [new THREE.Vector3(0,0,0), newPos];
             const geometry = new THREE.BufferGeometry().setFromPoints(points);
             const line = new THREE.Line(geometry, material);
             line.name = 'pathLine';
             visualGroup.add(line);
        } else {
            this._updateCarLine(car);
        }
        if (this.app.colliderSystem) this.app.colliderSystem.updateBody(car);
        this.ui.updateProperties(car);
    }

    removeWaypointFromSelected() {
        const car = this.gizmo.selectedObject;
        if (!car || !['car', 'bicycle'].includes(car.userData.type)) return;

        if (car.userData.waypoints.length === 0) return;

        // Remove from data
        car.userData.waypoints.pop();

        // Remove visual
        const visualGroup = car.getObjectByName('waypointVisuals');
        if (visualGroup) {
            // Find last waypoint sphere
            // VisualGroup children include line and spheres.
            // Filter spheres
            const spheres = visualGroup.children.filter(c => c.userData.type === 'waypoint');
            if (spheres.length > 0) {
                const lastSphere = spheres[spheres.length - 1];
                visualGroup.remove(lastSphere);
            }

            // Update or remove line
            if (car.userData.waypoints.length === 0) {
                const line = visualGroup.getObjectByName('pathLine');
                if (line) visualGroup.remove(line);
            } else {
                this._updateCarLine(car);
            }
        }
        if (this.app.colliderSystem) this.app.colliderSystem.updateBody(car);
        this.ui.updateProperties(car);
    }

    selectObject(object) {
        // Called by InteractionManager or Gizmo
        if (!object) {
            this.gizmo.detach();
            this.ui.hideProperties();
            return;
        }

        // Verify object is valid for selection (already checked by raycast usually)
        this.gizmo.attach(object);
        this.ui.showProperties(object);
    }

    deleteSelected() {
        if (this.gizmo.selectedObject) {
            const obj = this.gizmo.selectedObject;
            this.selectObject(null);

            // Remove from scene and collider system
            this.app.renderer.scene.remove(obj);
            if (this.app.colliderSystem) {
                this.app.colliderSystem.remove(obj);
            }
            // Also remove from world.colliders
            if (this.app.world && this.app.world.colliders) {
                 const idx = this.app.world.colliders.findIndex(c => c.mesh === obj);
                 if (idx !== -1) this.app.world.colliders.splice(idx, 1);
            }
        }
    }

    // Commands
    clearMap() {
        this.app.world.clear();
        this.app.rings.clear();
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
                this.app.loadMap(data); // We'll implement this in App
            } catch (err) {
                console.error("Failed to load map:", err);
                alert("Invalid map file");
            }
        };
        reader.readAsText(file);
    }
}
