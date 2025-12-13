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
        this.ghostMesh = null;
        this.selectedObject = null;

        // Bindings
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
        this._onMouseDown = this._onMouseDown.bind(this);

        this.active = false;
    }

    enable() {
        if (this.active) return;
        this.active = true;
        window.addEventListener('mousemove', this._onMouseMove);
        window.addEventListener('mouseup', this._onMouseUp);
        window.addEventListener('mousedown', this._onMouseDown);
    }

    disable() {
        if (!this.active) return;
        this.active = false;
        window.removeEventListener('mousemove', this._onMouseMove);
        window.removeEventListener('mouseup', this._onMouseUp);
        window.removeEventListener('mousedown', this._onMouseDown);
        this._clearGhost();
    }

    onDragStart(type) {
        this.draggedType = type;
        // Create ghost mesh
        // We use the factory but make it transparent?
        // Or just a placeholder box?
        // Factory creates real objects. Let's create a real object and make it transparent.

        const params = { x: 0, z: 0, width: 20 }; // Defaults
        let result;

        // Hack: Create temporarily to get mesh, but don't want it in scene yet?
        // Factory adds to scene immediately.
        // We can let it add, then modify material?

        // Wait, 'dragstart' happens on HTML element.
        // The mouse is over the sidebar.
        // We only show ghost when mouse enters canvas?
        // Actually, HTML5 Drag & Drop is tricky with Canvas.
        // Better: When clicking palette item, we enter "Placement Mode".
        // Not native Drag & Drop.
        // But user asked for "drag and drop interface".
        // If we use native dragstart, we need 'dragover' on canvas to get coordinates.
    }

    // We need to handle 'dragover' on the canvas container to update ghost position
    // And 'drop' to place.

    _getIntersect(e) {
        const rect = this.app.container.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.app.renderer.camera);

        // Raycast against Ground
        // We need a reference to Ground.
        // World.ground is available.
        if (this.app.world.ground) {
            const intersects = this.raycaster.intersectObject(this.app.world.ground);
            if (intersects.length > 0) {
                return intersects[0].point;
            }
        }
        // Fallback: Plane at Y=0
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const target = new THREE.Vector3();
        this.raycaster.ray.intersectPlane(plane, target);
        return target;
    }

    _onMouseMove(e) {
        // Handle Moving Selected Object
        if (this.selectedObject && this.isDraggingObject) {
            const point = this._getIntersect(e);
            if (point) {
                this.selectedObject.position.set(point.x, this.selectedObject.position.y, point.z);
            }
        }
    }

    _onMouseDown(e) {
        // Select object to move
        if (e.button !== 0) return; // Left click only

        // Calculate mouse pos
        const rect = this.app.container.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.app.renderer.camera);

        // Intersect with world objects
        // We need a list of selectable objects.
        // World.colliders has { mesh, box }.
        // Rings.rings has { mesh }.

        const candidates = [];
        this.app.world.colliders.forEach(c => { if(c.mesh) candidates.push(c.mesh); });
        this.app.rings.rings.forEach(r => { if(r.mesh) candidates.push(r.mesh); });

        const intersects = this.raycaster.intersectObjects(candidates, true); // Recursive for children

        if (intersects.length > 0) {
            // Find root object (the one with userData.type)
            let obj = intersects[0].object;
            while(obj.parent && obj.parent.type !== 'Scene' && !obj.userData.type) {
                obj = obj.parent;
            }

            if (obj.userData.type) {
                this.selectedObject = obj;
                this.isDraggingObject = true;
                // Highlight?
            }
        }
    }

    _onMouseUp(e) {
        this.isDraggingObject = false;
        this.selectedObject = null;
    }

    _clearGhost() {
        if (this.ghostMesh) {
            this.app.renderer.scene.remove(this.ghostMesh);
            this.ghostMesh = null;
        }
    }
}

// Extension to handle HTML5 Drag/Drop from UI
export function setupDragDrop(interaction, container) {
    container.addEventListener('dragover', (e) => {
        e.preventDefault(); // Allow drop
        const point = interaction._getIntersect(e);
        if (point && interaction.draggedType) {
            // Show ghost?
            // Creating/Destroying mesh every frame is bad.
            // Ideally we create one ghost and move it.
            // Simplified: Just show cursor?
            // Or create ghost once.
        }
    });

    container.addEventListener('drop', (e) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('type');
        const point = interaction._getIntersect(e);

        if (type && point) {
            console.log(`Dropping ${type} at`, point);

            // Create Object
            if (type === 'ring') {
                interaction.app.rings.spawnRingAt(point);
            } else {
                // Buildings/Roads
                const collider = interaction.factory.createObject(type, { x: point.x, z: point.z });
                if (collider) {
                    interaction.app.world.colliders.push(collider);
                }
            }
        }
    });
}
