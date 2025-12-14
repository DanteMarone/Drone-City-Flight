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

        const intersects = this.raycaster.intersectObjects(this.app.renderer.scene.children, true);

        for (const hit of intersects) {
            // Check for ground
            if (this.app.world && hit.object === this.app.world.ground) {
                return hit.point;
            }

            // Check for entity
            let obj = hit.object;
            while (obj) {
                if (obj.userData && obj.userData.type) {
                    return hit.point;
                }
                if (obj.parent === this.app.renderer.scene) break;
                obj = obj.parent;
            }
        }

        return null;
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
            this.isDragging = true;
            this.dragObject = hit;

            if (this.devMode.cameraController && this.devMode.cameraController.setRotationLock) {
                this.devMode.cameraController.setRotationLock(true);
            }

            this.dragPlane.setComponents(0, 1, 0, -hit.position.y);

            const intersect = new THREE.Vector3();
            this.raycaster.ray.intersectPlane(this.dragPlane, intersect);
            if (intersect) {
                this.dragOffset.subVectors(hit.position, intersect);
            }
        } else {
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

                if (this.devMode.grid && this.devMode.grid.enabled) {
                    newPos.x = Math.round(newPos.x);
                    newPos.z = Math.round(newPos.z);
                }

                this.dragObject.position.set(newPos.x, this.dragObject.position.y, newPos.z);

                if (this.devMode.gizmo) {
                    this.devMode.gizmo.syncProxyToObject();
                }

                if (this.devMode.ui) {
                    this.devMode.ui.updateProperties(this.dragObject);
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
            if (this.dragObject && this.app.colliderSystem) {
                if (this.app.colliderSystem.updateBody) {
                    this.app.colliderSystem.updateBody(this.dragObject);
                }
            }
            this.dragObject = null;
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
                // We assume createObject handles all mapped types (river, car, bird, building, etc.)
                // Note: ObjectFactory wraps 'river' now too.
                const entity = interaction.factory.createObject(type, { x: point.x, y: point.y, z: point.z });

                if (entity && entity.mesh) {
                    // Centralized Registration
                    interaction.app.world.addEntity(entity); // Adds to colliders, handles BirdSystem

                    // Add to Physics (Static/SpatialHash)
                    // Note: Entities are added as "Static" by default here.
                    // Even cars are "static" in terms of collision type (not dynamic rigidbodies), just moving static objects.
                    if (interaction.app.colliderSystem) {
                        interaction.app.colliderSystem.addStatic([entity]);
                    }

                    // Select it
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
