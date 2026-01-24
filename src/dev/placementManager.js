import * as THREE from 'three';
import { EntityRegistry } from '../world/entities/index.js';
import { getMouseIntersection } from './utils.js';

export class PlacementManager {
    constructor(app, devMode) {
        this.app = app;
        this.devMode = devMode;

        // Raycaster for internal use (if needed separate from InteractionManager)
        this.raycaster = new THREE.Raycaster();

        this.ghostMesh = null;
        this.ghostMaterial = new THREE.MeshBasicMaterial({
            color: 0x44ff44,
            transparent: true,
            opacity: 0.5,
            depthTest: true,
            depthWrite: false
        });

        this.activePlacement = null; // { anchor: Vector3, type: string }
        this.draggedType = null;
    }

    onDragStart(type) {
        this.draggedType = type;
    }

    handleMouseDown(e) {
        const point = getMouseIntersection(
            e,
            this.app.container,
            this.devMode.cameraController.camera,
            this.app.renderer.scene,
            this.raycaster,
            this.app.world.ground
        );

        if (!point) return;

        if (this.devMode.grid && this.devMode.grid.enabled) {
            this.devMode.grid.snap(point);
        }

        if (!this.ghostMesh) {
            this._createGhost(this.devMode.placementMode);
        }

        this.activePlacement = {
            anchor: point.clone(),
            type: this.devMode.placementMode
        };

        this._updatePlacementGhost(point);
    }

    handleMouseMove(e) {
        const point = getMouseIntersection(
            e,
            this.app.container,
            this.devMode.cameraController.camera,
            this.app.renderer.scene,
            this.raycaster,
            this.app.world.ground
        );

        if (!point) return;

        if (this.devMode.grid && this.devMode.grid.enabled) {
            this.devMode.grid.snap(point);
        }

        if (this.activePlacement) {
            // Dragging to stretch
            this._updatePlacementGhost(point);
        } else {
            // Hovering
            if (!this.ghostMesh) this._createGhost(this.devMode.placementMode);
            this.ghostMesh.position.copy(point);
            this.ghostMesh.rotation.set(0, 0, 0);
            this.ghostMesh.scale.set(1, 1, 1);
        }
    }

    handleMouseUp(e) {
        if (!this.activePlacement) return;

        const type = this.activePlacement.type;
        const ghost = this.ghostMesh;

        // Params logic
        const params = {};
        if (type === 'road') {
            params.length = 1; // Roads use scaling for texture tiling
        } else if (type === 'river') {
            params.length = ghost.scale.z; // Rivers use geometry size
        }

        const entity = EntityRegistry.create(type, params);

        if (entity && entity.mesh) {
            entity.mesh.position.copy(ghost.position);
            entity.mesh.rotation.copy(ghost.rotation);

            if (type === 'road') {
                entity.mesh.scale.copy(ghost.scale);
            } else {
                // River geometry is already sized by params.length, keep scale at 1
                entity.mesh.scale.set(1, 1, 1);
            }

            entity.mesh.updateMatrixWorld();
            // Re-create collider with new scale/geometry
            entity.box = entity.createCollider();

            this.app.renderer.scene.add(entity.mesh);
            this.app.world.addEntity(entity);
            if (this.app.colliderSystem) {
                this.app.colliderSystem.addStatic([entity]);
            }

            this.devMode._recordCreation([entity.mesh], `Place ${type}`);

            if (entity.updateTexture) {
                entity.updateTexture(entity.mesh);
            }
        }

        this.activePlacement = null;
        this._destroyGhost();

        // Deselect tool
        this.devMode.setPlacementMode(null);
    }

    cancelPlacement() {
        this.activePlacement = null;
        this._destroyGhost();
    }

    _createGhost(type) {
        if (this.ghostMesh) this._destroyGhost();

        let mesh = null;

        if (type === 'ring') {
             const geo = new THREE.TorusGeometry(1.5, 0.2, 8, 16);
             mesh = new THREE.Mesh(geo, this.ghostMaterial);
        } else {
             // Use generic create, but override params for road/river
             let params = { x: 0, y: 0, z: 0 };
             if (type === 'road' || type === 'river') params.length = 1;

             const entity = EntityRegistry.create(type, params);
             if (entity && entity.mesh) {
                 mesh = entity.mesh;
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
            this.ghostMesh.traverse((obj) => {
                obj.raycast = () => {};
            });

            this.app.renderer.scene.add(this.ghostMesh);
        }
    }

    _updateGhost(point) {
        if (!this.ghostMesh) return;
        this.ghostMesh.position.copy(point);
    }

    _updatePlacementGhost(currentPoint) {
        if (!this.activePlacement || !this.ghostMesh) return;

        const anchor = this.activePlacement.anchor;
        let diff = new THREE.Vector3().subVectors(currentPoint, anchor);

        // Grid Snap Logic: Strict Alignment
        if (this.devMode.grid && this.devMode.grid.enabled) {
            // Determine dominant axis
            if (Math.abs(diff.x) >= Math.abs(diff.z)) {
                diff.z = 0; // Lock to X
            } else {
                diff.x = 0; // Lock to Z
            }
            // Ensure strict 1-unit increments
            diff.x = Math.round(diff.x);
            diff.z = Math.round(diff.z);
        }

        let len = diff.length();

        // Road/River Specific: Enforce whole unit length
        if (this.activePlacement.type === 'road' || this.activePlacement.type === 'river') {
            // Ensure integer lengths (1.0, 2.0, 3.0...)
            len = Math.round(len);
            if (len < 1) len = 1;

            // Adjust diff to match snapped length while preserving direction
            if (diff.lengthSq() > 0.001) {
                diff.normalize().multiplyScalar(len);
            } else {
                // Default direction if length was zero
                diff.set(0, 0, len);
            }
        } else {
            len = Math.max(1, len);
        }

        let angle = 0;
        if (diff.lengthSq() > 0.01) {
            angle = Math.atan2(diff.x, diff.z);
        }

        const finalPos = new THREE.Vector3().addVectors(anchor, diff.clone().multiplyScalar(0.5));

        this.ghostMesh.position.copy(finalPos);
        this.ghostMesh.rotation.y = angle;
        this.ghostMesh.scale.z = len;
    }

    _destroyGhost() {
        if (this.ghostMesh) {
            this.app.renderer.scene.remove(this.ghostMesh);
            this.ghostMesh = null;
        }
    }
}

export function setupDragDrop(placementManager, container) {
    document.body.addEventListener('dragenter', (e) => {});

    document.body.addEventListener('dragover', (e) => {
        e.preventDefault();
        const type = placementManager.draggedType;
        if (!type) return;

        if (e.target === container) {
             const point = getMouseIntersection(
                 e,
                 container,
                 placementManager.devMode.cameraController.camera,
                 placementManager.app.renderer.scene,
                 placementManager.raycaster,
                 placementManager.app.world.ground
             );

             if (point) {
                 if (placementManager.devMode.grid && placementManager.devMode.grid.enabled) {
                     placementManager.devMode.grid.snap(point);
                 }

                 if (!placementManager.ghostMesh) {
                     placementManager._createGhost(type);
                 }
                 placementManager._updateGhost(point);
             } else {
                 placementManager._destroyGhost();
             }
        } else {
             placementManager._destroyGhost();
        }
    });

    document.body.addEventListener('dragleave', (e) => {
        if (e.target === container) {
             placementManager._destroyGhost();
        }
    });

    document.body.addEventListener('drop', (e) => {
        e.preventDefault();
        placementManager._destroyGhost();

        const type = e.dataTransfer.getData('type');

        const point = getMouseIntersection(
            e,
            container,
            placementManager.devMode.cameraController.camera,
            placementManager.app.renderer.scene,
            placementManager.raycaster,
            placementManager.app.world.ground
        );

        if (type && point) {
            if (placementManager.devMode.grid && placementManager.devMode.grid.enabled) {
                placementManager.devMode.grid.snap(point);
            }

            console.log(`Dropping ${type} at`, point);

            if (type === 'ring') {
                placementManager.app.rings.spawnRingAt(point);
                const spawned = placementManager.app.rings.rings?.[placementManager.app.rings.rings.length - 1];
                if (spawned?.mesh) {
                    placementManager.devMode._recordCreation([spawned.mesh], 'Create ring');
                }
            } else {
                const entity = EntityRegistry.create(type, { x: point.x, z: point.z });

                if (entity && entity.mesh) {
                    placementManager.app.renderer.scene.add(entity.mesh);
                    placementManager.app.world.addEntity(entity);

                    if (placementManager.app.colliderSystem) {
                        placementManager.app.colliderSystem.addStatic([entity]);
                    }

                    placementManager.devMode.selectObject(entity.mesh);
                    placementManager.devMode._recordCreation([entity.mesh], 'Create object');

                    if (entity.mesh.userData.isVehicle && placementManager.devMode.enabled) {
                        const wg = entity.mesh.userData.waypointGroup;
                        if (wg) {
                            wg.visible = true;
                            if (wg.parent !== placementManager.app.renderer.scene) {
                                placementManager.app.renderer.scene.add(wg);
                            }
                        }
                    }
                }
            }
        }
    });
}
