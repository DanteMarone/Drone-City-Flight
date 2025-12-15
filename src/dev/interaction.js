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
        this.roadPlacementStart = null;
        this.roadPreview = null;
        this.roadOutlinePreview = null;
        this.roadPlacementActive = false;
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
        if (type !== 'road') {
            this._clearRoadPreview();
        }
    }

    _snapPoint(point) {
        if (this.devMode.grid && this.devMode.grid.enabled && this.devMode.grid.snap) {
            return this.devMode.grid.snap(point.clone());
        }
        return point.clone();
    }

    _clearRoadPreview() {
        this.roadPlacementStart = null;
        this.roadPlacementActive = false;
        const previews = [this.roadPreview, this.roadOutlinePreview];
        previews.forEach((helper) => {
            if (helper) {
                this.app.renderer.scene.remove(helper);
                helper.geometry.dispose();
                helper.material.dispose();
            }
        });
        this.roadPreview = null;
        this.roadOutlinePreview = null;
    }

    _updateRoadPreview(endPoint) {
        if (!this.roadPlacementStart) return;
        const start = this.roadPlacementStart;
        const points = [start, endPoint];
        const roadWidth = 10;

        // Center line
        if (!this.roadPreview) {
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color: 0xffff00 });
            this.roadPreview = new THREE.Line(geometry, material);
            this.roadPreview.userData.isHelper = true;
            this.app.renderer.scene.add(this.roadPreview);
        } else {
            this.roadPreview.geometry.setFromPoints(points);
        }

        // Outline
        const direction = new THREE.Vector3().subVectors(endPoint, start);
        direction.normalize();
        const perp = new THREE.Vector3(-direction.z, 0, direction.x).multiplyScalar(roadWidth / 2);

        const outlinePoints = [
            start.clone().add(perp),
            start.clone().sub(perp),
            endPoint.clone().sub(perp),
            endPoint.clone().add(perp)
        ];

        // close loop
        outlinePoints.push(outlinePoints[0].clone());

        if (!this.roadOutlinePreview) {
            const outlineGeo = new THREE.BufferGeometry().setFromPoints(outlinePoints);
            const outlineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
            this.roadOutlinePreview = new THREE.LineLoop(outlineGeo, outlineMat);
            this.roadOutlinePreview.userData.isHelper = true;
            this.app.renderer.scene.add(this.roadOutlinePreview);
        } else {
            this.roadOutlinePreview.geometry.setFromPoints(outlinePoints);
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

        if (this.roadPlacementActive) {
            // Allow the release to finalize placement instead of starting selections
            e.preventDefault();
            return;
        }

        if (e.target !== this.app.renderer.domElement) return;
        if (this.devMode.gizmo && this.devMode.gizmo.control.axis !== null) return;

        // Reset road preview if we are beginning a new drag unrelated to road placement
        if (this.draggedType !== 'road') {
            this._clearRoadPreview();
        }

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
        } else if (this.roadPlacementActive) {
            const point = this._getIntersect(e);
            if (point) {
                this._updateRoadPreview(this._snapPoint(point));
            }
        }
    }

    _onMouseUp(e) {
        if (this.roadPlacementActive && e.button === 0 && e.target === this.app.renderer.domElement) {
            const point = this._getIntersect(e);
            if (point && this.roadPlacementStart) {
                const snappedStart = this._snapPoint(this.roadPlacementStart);
                const snappedEnd = this._snapPoint(point);
                const dx = snappedEnd.x - snappedStart.x;
                const dz = snappedEnd.z - snappedStart.z;
                const distance = Math.max(Math.hypot(dx, dz), 1);

                let desiredLength = distance;
                if (e.shiftKey) {
                    const userLength = parseFloat(prompt('Road length:', `${Math.round(distance)}`));
                    if (!Number.isNaN(userLength) && userLength > 0) {
                        desiredLength = userLength;
                    }
                }

                const angle = Math.atan2(dx, dz);
                const center = new THREE.Vector3(
                    snappedStart.x + dx * 0.5,
                    snappedStart.y,
                    snappedStart.z + dz * 0.5
                );

                const entity = this.factory.createObject('road', {
                    x: center.x,
                    y: center.y,
                    z: center.z,
                    rotY: angle,
                    length: desiredLength
                });

                if (entity && entity.mesh) {
                    this.app.world.addEntity(entity);
                    if (this.app.colliderSystem) {
                        this.app.colliderSystem.addStatic([entity]);
                    }
                    this.devMode.selectObject(entity.mesh);
                }
            }

            this._clearRoadPreview();
            return;
        }

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
}

export function setupDragDrop(interaction, container) {
    document.body.addEventListener('dragover', (e) => {
        e.preventDefault();

        if (interaction.draggedType === 'road' && interaction.roadPlacementActive) {
            const point = interaction._getIntersect(e);
            if (point) {
                interaction._updateRoadPreview(interaction._snapPoint(point));
            }
        }
    });

    document.body.addEventListener('drop', (e) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('type');
        let point = interaction._getIntersect(e);

        if (!point) {
            interaction._clearRoadPreview();
            return;
        }

        if (type && point) {
            if (interaction.devMode.grid && interaction.devMode.grid.enabled) {
                point = interaction.devMode.grid.snap(point);
            }

            console.log(`Dropping ${type} at`, point);

            if (type === 'ring') {
                interaction.app.rings.spawnRingAt(point);
                // Rings handle their own registration internally in RingManager
            } else if (type === 'road') {
                interaction._clearRoadPreview();
                interaction.roadPlacementStart = interaction._snapPoint(point);
                interaction.roadPlacementActive = true;
                interaction._updateRoadPreview(interaction.roadPlacementStart);
                interaction.draggedType = null;
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
