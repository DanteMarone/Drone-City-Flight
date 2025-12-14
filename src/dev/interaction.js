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
        // this.dragObject stores the object being "clicked" on,
        // but if multi-selected, we might drag the proxy.
        this.dragTarget = null; // Can be an object or the proxy
        this.dragPlane = new THREE.Plane();
        this.dragOffset = new THREE.Vector3();
    }

    enable() {
        if (this.active) return;
        this.active = true;
        window.addEventListener('mousedown', this._onMouseDown);
        window.addEventListener('mousemove', this._onMouseMove);
        window.addEventListener('mouseup', this._onMouseUp);
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

        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const target = new THREE.Vector3();
        this.raycaster.ray.intersectPlane(plane, target);
        return target;
    }

    _onMouseDown(e) {
        if (!this.active) return;
        if (e.button !== 0) return;

        if (e.target !== this.app.renderer.domElement) return;
        if (this.devMode.gizmo && this.devMode.gizmo.control.axis !== null) return;

        const rect = this.app.container.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera({ x, y }, this.devMode.cameraController.camera);

        const intersects = this.raycaster.intersectObjects(this.app.renderer.scene.children, true);

        let hit = null;
        for (const i of intersects) {
            let obj = i.object;
            // Ignore Helpers
            if (obj.userData && obj.userData.isHelper && obj.userData.type !== 'waypoint') continue;
            if (obj.userData && obj.userData.type === 'gizmoProxy') continue;

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

        this.devMode.selectObject(hit, e.shiftKey);

        // Drag Logic setup
        if (this.devMode.selectedObjects.length > 0) {
            this.isDragging = true;

            // If we clicked on an object that is part of the selection, we want to move the GROUP.
            // If the hit object is in selectedObjects, we are good.
            // If we clicked "background" (hit=null) but we have selection?
            // Standard behavior: click background deselects (handled by selectObject(null)).

            if (hit) {
                // Determine what to drag.
                // We always drag the PROXY if multiple objects are selected or if the single object is selected.
                // GizmoManager manages the Proxy position.
                this.dragTarget = this.devMode.gizmo.proxy;

                // We need to ensure offsets are captured because we are about to move the proxy manually
                this.devMode.gizmo.captureOffsets();

                if (this.devMode.cameraController && this.devMode.cameraController.setRotationLock) {
                    this.devMode.cameraController.setRotationLock(true);
                }

                this.dragPlane.setComponents(0, 1, 0, -this.dragTarget.position.y);

                const intersect = new THREE.Vector3();
                this.raycaster.ray.intersectPlane(this.dragPlane, intersect);
                if (intersect) {
                    this.dragOffset.subVectors(this.dragTarget.position, intersect);
                }
            } else {
                this.isDragging = false;
            }
        }
    }

    _onMouseMove(e) {
        if (!this.active) return;

        if (this.isDragging && this.dragTarget) {
            const rect = this.app.container.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            this.raycaster.setFromCamera({ x, y }, this.devMode.cameraController.camera);

            const intersect = new THREE.Vector3();
            if (this.raycaster.ray.intersectPlane(this.dragPlane, intersect)) {
                const newPos = intersect.add(this.dragOffset);

                if (this.devMode.grid && this.devMode.grid.enabled) {
                    newPos.x = Math.round(newPos.x);
                    newPos.z = Math.round(newPos.z);
                }

                // Move the Proxy
                this.dragTarget.position.set(newPos.x, this.dragTarget.position.y, newPos.z);

                // Sync Objects to Proxy
                if (this.devMode.gizmo) {
                    this.devMode.gizmo.syncProxyToObjects();
                }

                // Update UI
                if (this.devMode.ui) {
                    this.devMode.ui.updateProperties(this.dragTarget);
                }
            }
        }
    }

    _onMouseUp(e) {
        if (this.isDragging) {
            this.isDragging = false;
            if (this.devMode.cameraController && this.devMode.cameraController.setRotationLock) {
                this.devMode.cameraController.setRotationLock(false);
            }

            // Update Physics for all selected
             if (this.devMode.selectedObjects.length > 0 && this.app.colliderSystem) {
                this.devMode.selectedObjects.forEach(obj => {
                    let target = obj;
                    if (target.userData.type === 'waypoint' && target.parent?.parent?.userData.type === 'car') {
                        target = target.parent.parent;
                    }
                    if (this.app.colliderSystem.updateBody) {
                        this.app.colliderSystem.updateBody(target);
                    }
                });
            }

            this.dragTarget = null;
        }
    }
}

export function setupDragDrop(interaction, container) {
    document.body.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    document.body.addEventListener('drop', (e) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('type');
        let point = interaction._getIntersect(e);

        if (type && point) {
            if (interaction.devMode.grid && interaction.devMode.grid.enabled) {
                point = interaction.devMode.grid.snap(point);
            }

            console.log(`Dropping ${type} at`, point);

            if (type === 'ring') {
                interaction.app.rings.spawnRingAt(point);
                // Rings handle their own registration internally in RingManager
            } else {
                // Use ObjectFactory (which delegates to EntityRegistry)
                const entity = interaction.factory.createObject(type, { x: point.x, z: point.z });

                if (entity && entity.mesh) {
                    // Centralized Registration
                    interaction.app.world.addEntity(entity);

                    // Add to Physics (Static/SpatialHash)
                    if (interaction.app.colliderSystem) {
                        interaction.app.colliderSystem.addStatic([entity]);
                    }

                    // Select it (Clear previous, select new)
                    interaction.devMode.selectObject(entity.mesh);

                    // Special Visuals Check
                    if (['car', 'bicycle'].includes(type) && interaction.devMode.enabled) {
                        const visuals = entity.mesh.getObjectByName('waypointVisuals');
                        if (visuals) visuals.visible = true;
                    }
                }
            }
        }
    });
}
