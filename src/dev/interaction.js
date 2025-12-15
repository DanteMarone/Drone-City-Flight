// src/dev/interaction.js
import * as THREE from 'three';
import { ObjectFactory } from '../world/factory.js';
import { RoadEntity } from '../world/entities/infrastructure.js';

export class InteractionManager {
    constructor(app, devMode) {
        this.app = app;
        this.devMode = devMode;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.factory = new ObjectFactory(app.renderer.scene);

        this.draggedType = null;
        this.active = false;
        this.roadPlacement = { start: null, preview: null };

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
        this._resetRoadPlacement();
    }

    onDragStart(type) {
        this.draggedType = type;
        this._resetRoadPlacement();
    }

    _resetRoadPlacement() {
        if (this.roadPlacement.preview && this.roadPlacement.preview.mesh) {
            const mesh = this.roadPlacement.preview.mesh;
            this.app.renderer.scene.remove(mesh);
            if (mesh.geometry) mesh.geometry.dispose();
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach((m) => m.dispose && m.dispose());
            } else if (mesh.material && mesh.material.dispose) {
                mesh.material.dispose();
            }
        }
        this.roadPlacement = { start: null, preview: null };
    }

    _updateRoadPlacement(point) {
        if (this.draggedType !== 'road') return;
        if (!point) {
            return;
        }

        if (!this.roadPlacement.start) {
            this.roadPlacement.start = point.clone();
        }

        const start = this.roadPlacement.start;
        const dir = new THREE.Vector3().subVectors(point, start);
        const length = Math.max(dir.length(), 1);
        const mid = start.clone().addScaledVector(dir, 0.5);
        const angle = Math.atan2(dir.x, dir.z);
        const width = this.roadPlacement.preview?.params.width || 10;

        if (!this.roadPlacement.preview) {
            const road = new RoadEntity({ length, width, x: mid.x, z: mid.z, rotY: angle });
            road.init();
            road.mesh.userData.isHelper = true;
            if (road.mesh.material) {
                road.mesh.material.transparent = true;
                road.mesh.material.opacity = 0.6;
            }
            this.roadPlacement.preview = road;
            this.app.renderer.scene.add(road.mesh);
        } else {
            const preview = this.roadPlacement.preview;
            if (preview.updateDimensions) {
                preview.updateDimensions(width, length);
            }
            preview.mesh.position.set(mid.x, preview.mesh.position.y, mid.z);
            preview.mesh.rotation.y = angle;
        }
    }

    _getIntersect(e) {
        const rect = this.app.container.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.devMode.cameraController.camera);

        // Raycast against all objects in the scene
        const intersects = this.raycaster.intersectObjects(this.app.renderer.scene.children, true);

        for (const i of intersects) {
            // Check if valid surface
            // 1. Ground
            if (i.object === this.app.world.ground) {
                return i.point;
            }

            // 2. Existing Entity (userData.type)
            // Need to traverse up to find if it's part of an entity, or check directly
            // Most entities have userData on the mesh or a parent group.
            let obj = i.object;
            while (obj) {
                // Ignore Helpers and Gizmos
                if (obj.userData && (obj.userData.isHelper || obj.userData.type === 'gizmoProxy')) {
                    break; // Skip this branch
                }

                if (obj.userData && obj.userData.type) {
                    // Valid Entity
                    return i.point;
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
                    if (target.userData.type === 'waypoint' && ['car', 'pickupTruck'].includes(target.parent?.parent?.userData.type)) {
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

    _finalizeRoadPlacement(point) {
        let startPoint = this.roadPlacement.start;
        if (!startPoint && point) {
            startPoint = point.clone();
        }
        if (!startPoint || !point) {
            this._resetRoadPlacement();
            return null;
        }

        const dir = new THREE.Vector3().subVectors(point, startPoint);
        const length = Math.max(dir.length(), 1);
        const mid = startPoint.clone().addScaledVector(dir, 0.5);
        const angle = Math.atan2(dir.x, dir.z);
        const width = this.roadPlacement.preview?.params.width || 10;

        const entity = this.factory.createObject('road', { x: mid.x, z: mid.z, length, rotY: angle, width });
        this._resetRoadPlacement();
        return entity;
    }
}

export function setupDragDrop(interaction, container) {
    document.body.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (interaction.draggedType === 'road') {
            let point = interaction._getIntersect(e);
            if (interaction.devMode.grid && interaction.devMode.grid.enabled && point) {
                point = interaction.devMode.grid.snap(point);
            }
            interaction._updateRoadPlacement(point);
        }
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
            } else if (type === 'road') {
                const entity = interaction._finalizeRoadPlacement(point);
                if (entity && entity.mesh) {
                    interaction.app.world.addEntity(entity);
                    if (interaction.app.colliderSystem) {
                        interaction.app.colliderSystem.addStatic([entity]);
                    }
                    interaction.devMode.selectObject(entity.mesh);
                }
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
                    if (['car', 'bicycle', 'pickupTruck'].includes(type) && interaction.devMode.enabled) {
                        // Use the new standard: userData.waypointGroup
                        const wg = entity.mesh.userData.waypointGroup;
                        if (wg) {
                            wg.visible = true;
                            if (wg.parent !== interaction.app.renderer.scene) {
                                interaction.app.renderer.scene.add(wg);
                            }
                        }
                    }
                }
            }
        }
    });
}
