import * as THREE from 'three';
import { TransformCommand } from './history.js';
import { EntityRegistry } from '../world/entities/index.js';
import { getMouseIntersection } from './utils.js';

export class InteractionManager {
    constructor(app, devMode) {
        this.app = app;
        this.devMode = devMode;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.draggedType = null;
        this.active = false;
        this.dragStartStates = null;

        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);

        this.isDragging = false;
        this.dragTarget = null;
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

        if (this.devMode.placementManager) {
            this.devMode.placementManager.cancelPlacement();
        }
    }

    cancelPlacement() {
        if (this.devMode.placementManager) {
            this.devMode.placementManager.cancelPlacement();
        }
    }

    onDragStart(type) {
        if (this.devMode.placementManager) {
            this.devMode.placementManager.onDragStart(type);
        }
    }

    _getIntersect(e) {
        return getMouseIntersection(
            e,
            this.app.container,
            this.devMode.cameraController.camera,
            this.app.renderer.scene,
            this.raycaster,
            this.app.world.ground
        );
    }

    _onMouseDown(e) {
        if (!this.active) return;
        if (e.button !== 0) return;
        if (e.target !== this.app.renderer.domElement) return;

        // Priority: Smart Placement
        if (this.devMode.placementMode && this.devMode.placementManager) {
            this.devMode.placementManager.handleMouseDown(e);
            return;
        }

        if (this.devMode.gizmo && this.devMode.gizmo.control.axis !== null) return;

        const rect = this.app.container.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera({ x, y }, this.devMode.cameraController.camera);

        const intersects = this.raycaster.intersectObjects(this.app.renderer.scene.children, true);

        let hit = null;
        for (const i of intersects) {
            let obj = i.object;
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

        if (this.devMode.selectedObjects.length > 0) {
            this.isDragging = true;
            this.dragStartStates = this.devMode.captureTransforms(this.devMode.selectedObjects);

            if (hit) {
                this.dragTarget = this.devMode.gizmo.proxy;
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
                this.dragStartStates = null;
            }
        }
    }

    _onMouseMove(e) {
        if (!this.active) return;

        if (this.devMode.placementMode && this.devMode.placementManager) {
            this.devMode.placementManager.handleMouseMove(e);
            return;
        }

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

                this.dragTarget.position.set(newPos.x, this.dragTarget.position.y, newPos.z);

                if (this.devMode.gizmo) {
                    this.devMode.gizmo.syncProxyToObjects();
                }

                if (this.devMode.ui) {
                    this.devMode.ui.updateProperties(this.dragTarget);
                }
            }
        }
    }

    _onMouseUp(e) {
        if (this.devMode.placementMode && this.devMode.placementManager) {
            this.devMode.placementManager.handleMouseUp(e);
            return;
        }

        if (this.isDragging) {
            this.isDragging = false;
            if (this.devMode.cameraController && this.devMode.cameraController.setRotationLock) {
                this.devMode.cameraController.setRotationLock(false);
            }

             if (this.devMode.selectedObjects.length > 0 && this.app.colliderSystem) {
                this.devMode.selectedObjects.forEach(obj => {
                    let target = obj;
                    if (target.userData.type === 'waypoint' && target.parent?.parent?.userData?.isVehicle) {
                        target = target.parent.parent;
                    }
                    if (this.app.colliderSystem.updateBody) {
                        this.app.colliderSystem.updateBody(target);
                    }
                });
            }

            const endStates = this.devMode.captureTransforms(this.devMode.selectedObjects);
            if (this.dragStartStates && this.devMode._transformsChanged(this.dragStartStates, endStates)) {
                this.devMode.history.push(new TransformCommand(this.devMode, this.dragStartStates, endStates, 'Move objects'));
            }
            this.dragStartStates = null;
            this.dragTarget = null;
        }
    }
}
