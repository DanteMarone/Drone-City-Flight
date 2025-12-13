// src/dev/interaction.js
import * as THREE from 'three';
import { ObjectFactory } from '../world/factory.js';

export class InteractionManager {
    constructor(app, devMode) {
        this.app = app;
        this.devMode = devMode;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.factory = new ObjectFactory(app.renderer.scene);

        this.draggedType = null;
        this.active = false;

        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);

        this.isDragging = false;
        this.dragObject = null;
        this.dragPlane = new THREE.Plane();
        this.dragOffset = new THREE.Vector3();
    }

    enable() {
        if (this.active) return;
        this.active = true;
        window.addEventListener('mousedown', this._onMouseDown);
        window.addEventListener('mousemove', this._onMouseMove);
        window.addEventListener('mouseup', this._onMouseUp);
        // Mouse move/up needed for drag-drop ghosting, handled by setupDragDrop mainly
    }

    disable() {
        if (!this.active) return;
        this.active = false;
        window.removeEventListener('mousedown', this._onMouseDown);
        window.removeEventListener('mousemove', this._onMouseMove);
        window.removeEventListener('mouseup', this._onMouseUp);
    }

    onDragStart(type) {
        this.draggedType = type;
    }

    _getIntersect(e) {
        const rect = this.app.container.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.devMode.cameraController.camera);

        // Grid Snap Logic applied to point?
        // intersectPlane fallback is good.
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const target = new THREE.Vector3();
        this.raycaster.ray.intersectPlane(plane, target);

        // Apply Snapping here if we are "Placing"
        // But for generic intersection, we return raw point.
        return target;
    }

    _onMouseDown(e) {
        if (!this.active) return;
        if (e.button !== 0) return; // Left click only

        // Ignore if clicking on UI (only allow canvas clicks)
        if (e.target !== this.app.renderer.domElement) return;

        // Check if we are hovering gizmo axes
        if (this.devMode.gizmo && this.devMode.gizmo.control.axis !== null) return;

        // Raycast
        const rect = this.app.container.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera({ x, y }, this.devMode.cameraController.camera);

        const intersects = this.raycaster.intersectObjects(this.app.renderer.scene.children, true);

        let hit = null;
        for (const i of intersects) {
            // Check if it's a gizmo part that "axis" didn't catch?
            // Usually TransformControls handles its own events if attached.
            // But we ignore gizmo visual parts in selection search.

            // Traverse to find "selectable" root
            let obj = i.object;
            while (obj) {
                if (obj.userData && obj.userData.type) {
                    hit = obj;
                    break;
                }
                if (obj.parent === this.app.renderer.scene) break;
                obj = obj.parent;
            }
            if (hit) break;
        }

        if (hit) {
            this.devMode.selectObject(hit);

            // Initiate Drag
            this.isDragging = true;
            this.dragObject = hit;

            // Disable Camera Rotation
            if (this.devMode.cameraController && this.devMode.cameraController.setRotationLock) {
                this.devMode.cameraController.setRotationLock(true);
            }

            // Plane at object height
            this.dragPlane.setComponents(0, 1, 0, -hit.position.y);

            // Calculate offset
            const intersect = new THREE.Vector3();
            this.raycaster.ray.intersectPlane(this.dragPlane, intersect);
            if (intersect) {
                this.dragOffset.subVectors(hit.position, intersect);
            }
        } else {
            // Clicked void?
            this.devMode.selectObject(null);
        }
    }

    _onMouseMove(e) {
        if (!this.active) return;

        if (this.isDragging && this.dragObject) {
            const rect = this.app.container.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            this.raycaster.setFromCamera({ x, y }, this.devMode.cameraController.camera);

            const intersect = new THREE.Vector3();
            if (this.raycaster.ray.intersectPlane(this.dragPlane, intersect)) {
                const newPos = intersect.add(this.dragOffset);

                // Snap
                if (this.devMode.grid && this.devMode.grid.enabled) {
                    newPos.x = Math.round(newPos.x);
                    newPos.z = Math.round(newPos.z);
                }

                // Apply
                this.dragObject.position.set(newPos.x, this.dragObject.position.y, newPos.z);

                // Update Properties Panel
                if (this.devMode.ui) {
                    this.devMode.ui.updateProperties(this.dragObject);
                }
            }
        }
    }

    _onMouseUp(e) {
        if (this.isDragging) {
            this.isDragging = false;

            // Enable Camera Rotation
            if (this.devMode.cameraController && this.devMode.cameraController.setRotationLock) {
                this.devMode.cameraController.setRotationLock(false);
            }

            if (this.dragObject && this.app.colliderSystem) {
                // Update Physics
                if (this.app.colliderSystem.updateBody) {
                    this.app.colliderSystem.updateBody(this.dragObject);
                }
            }
            this.dragObject = null;
        }
    }
}

// Extension to handle HTML5 Drag/Drop from UI
export function setupDragDrop(interaction, container) {
    container.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    container.addEventListener('drop', (e) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('type');
        let point = interaction._getIntersect(e);

        if (type && point) {
            // Apply Grid Snap
            if (interaction.devMode.grid && interaction.devMode.grid.enabled) {
                point = interaction.devMode.grid.snap(point);
            }

            console.log(`Dropping ${type} at`, point);

            // Create Object
            if (type === 'ring') {
                interaction.app.rings.spawnRingAt(point);
                // Select it?
                // Rings spawnRingAt returns nothing currently, but adds to array.
                // We should probably allow selecting it.
                // Ring mesh has userData.type='ring'.
            } else if (type === 'river') {
                const res = interaction.factory.createRiver({ x: point.x, z: point.z });
                if (res && res.mesh) interaction.devMode.selectObject(res.mesh);
            } else if (type === 'car') {
                const res = interaction.factory.createCar({ x: point.x, z: point.z });
                if (res && res.mesh) interaction.devMode.selectObject(res.mesh);
            } else if (type === 'bird') {
                const res = interaction.factory.createBird({ x: point.x, z: point.z });
                if (res && res.mesh) {
                    interaction.app.world.birdSystem.add(res.mesh);
                    interaction.devMode.selectObject(res.mesh);
                }
            } else if (type === 'bush') {
                const res = interaction.factory.createBush({ x: point.x, z: point.z });
                if (res && res.mesh) interaction.devMode.selectObject(res.mesh);
                // Bushes are visual only, no collider registration needed
            } else {
                // Buildings/Roads
                const collider = interaction.factory.createObject(type, { x: point.x, z: point.z });
                if (collider) {
                    interaction.app.world.colliders.push(collider);
                    interaction.app.colliderSystem.addStatic([collider]);
                    interaction.devMode.selectObject(collider.mesh);
                }
            }
        }
    });
}
