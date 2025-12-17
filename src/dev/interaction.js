// src/dev/interaction.js
import * as THREE from 'three';
import { ObjectFactory } from '../world/factory.js';
import { TransformCommand } from './history.js';
import { EntityRegistry } from '../world/entities/index.js';

export class InteractionManager {
    constructor(app, devMode) {
        this.app = app;
        this.devMode = devMode;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.factory = new ObjectFactory(app.renderer.scene);

        this.draggedType = null;
        this.active = false;
        this.dragStartStates = null;

        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);

        this.isDragging = false;
        // this.dragObject stores the object being "clicked" on,
        // but if multi-selected, we might drag the proxy.
        this.dragTarget = null; // Can be an object or the proxy
        this.dragPlane = new THREE.Plane();
        this.dragOffset = new THREE.Vector3();

        // Ghost Preview
        this.ghostMesh = null;
        this.ghostMaterial = new THREE.MeshBasicMaterial({
            color: 0x44ff44,
            transparent: true,
            opacity: 0.5,
            depthTest: true,
            depthWrite: false
        });
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
        this._destroyGhost();
    }

    onDragStart(type) {
        this.draggedType = type;
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
            this.dragStartStates = this.devMode.captureTransforms(this.devMode.selectedObjects);

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
                this.dragStartStates = null;
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

    // --- Ghost Preview Methods ---

    _createGhost(type) {
        if (this.ghostMesh) this._destroyGhost();

        let mesh = null;

        if (type === 'ring') {
             // Replicate RingManager Geometry
             // Geometry shared: TorusGeometry(1.5, 0.2, 8, 16)
             const geo = new THREE.TorusGeometry(1.5, 0.2, 8, 16);
             mesh = new THREE.Mesh(geo, this.ghostMaterial);
             // Default orientation in RingManager is not X=PI/2, it's variable.
             // But for ghost we should probably just default to upright or flat?
             // RingManager: spawnRingAt does not set rotation, but spawnRing sets rotX=0, rotY=random.
             // We'll leave it flat (default Torus is flat on XY, usually we want it upright or flat?)
             // TorusGeometry is in XY plane. Z is normal.
             // RingManager doesn't rotate X. So it stands up like a wheel if Y is up? No.
             // If Torus is in XY, and Y is world up, it's standing like a wheel.
             // That seems correct for flying through.
        } else {
             // Use EntityRegistry to create a temporary entity
             const entity = EntityRegistry.create(type, { x: 0, y: 0, z: 0 });
             if (entity && entity.mesh) {
                 mesh = entity.mesh;
                 // We don't need the entity itself, just the mesh.
                 // We must NOT call world.addEntity(entity) or colliderSystem.addStatic.
             }
        }

        if (mesh) {
            this.ghostMesh = mesh;
            this.ghostMesh.traverse((child) => {
                if (child.isMesh) {
                    child.material = this.ghostMaterial;
                    child.castShadow = false;
                    child.receiveShadow = false;
                }
            });
            // Ensure ghost doesn't block raycasts
            this.ghostMesh.traverse((obj) => {
                obj.raycast = () => {}; // Disable raycasting for ghost
            });

            this.app.renderer.scene.add(this.ghostMesh);
        }
    }

    _updateGhost(point) {
        if (!this.ghostMesh) return;
        this.ghostMesh.position.copy(point);
    }

    _destroyGhost() {
        if (this.ghostMesh) {
            this.app.renderer.scene.remove(this.ghostMesh);
            // Dispose geometry if it was created specifically for ghost (like ring)
            // But entity geometry might be shared?
            // Safer to just remove from scene.
            if (this.ghostMesh.geometry) {
                 // this.ghostMesh.geometry.dispose(); // Only if unique?
            }
            this.ghostMesh = null;
        }
    }
}

export function setupDragDrop(interaction, container) {
    // We use document.body for drag events to cover the whole window
    // But we need to filter for canvas interaction logic

    let currentDragType = null;

    document.body.addEventListener('dragenter', (e) => {
         const type = e.dataTransfer.getData('type') || interaction.draggedType; // getData might be empty on dragenter in some browsers
         // Note: e.dataTransfer.getData() is protected in dragenter/dragover in Chrome/Firefox for security.
         // We might need to rely on a global state or assume the last onDragStart set interaction.draggedType?
         // But draggedType is set in dev/buildUI.js (or wherever dragstart is initiated).
         // The palette is in the same window, so we can probably trust interaction.draggedType if set by buildUI.
    });

    document.body.addEventListener('dragover', (e) => {
        e.preventDefault(); // Necessary to allow dropping

        // We rely on interaction.draggedType being set by the drag source (BuildUI)
        const type = interaction.draggedType;
        if (!type) return;

        // Check if we are over the canvas
        if (e.target === interaction.app.renderer.domElement) {
             let point = interaction._getIntersect(e);
             if (point) {
                 if (interaction.devMode.grid && interaction.devMode.grid.enabled) {
                     point = interaction.devMode.grid.snap(point);
                 }

                 if (!interaction.ghostMesh) {
                     interaction._createGhost(type);
                 }
                 interaction._updateGhost(point);
             } else {
                 // Off ground? Hide/Destroy ghost
                 interaction._destroyGhost();
             }
        } else {
             // Over UI or off canvas
             interaction._destroyGhost();
        }
    });

    document.body.addEventListener('dragleave', (e) => {
        // e.target is the element we are leaving.
        // If we leave the canvas, destroy ghost.
        if (e.target === interaction.app.renderer.domElement) {
             interaction._destroyGhost();
        }
    });

    document.body.addEventListener('drop', (e) => {
        e.preventDefault();
        interaction._destroyGhost(); // Cleanup ghost immediately

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
                const spawned = interaction.app.rings.rings?.[interaction.app.rings.rings.length - 1];
                if (spawned?.mesh) {
                    interaction.devMode._recordCreation([spawned.mesh], 'Create ring');
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

                    interaction.devMode._recordCreation([entity.mesh], 'Create object');

                    // Special Visuals Check: Generic isVehicle
                    if (entity.mesh.userData.isVehicle && interaction.devMode.enabled) {
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
