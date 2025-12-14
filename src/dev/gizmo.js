import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

export class GizmoManager {
    constructor(scene, camera, renderer, interactionManager) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.interaction = interactionManager;

        // Group Proxy (Centroid)
        const proxyGeo = new THREE.SphereGeometry(0.5, 16, 16);
        const proxyMat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            depthTest: false,
            transparent: true,
            opacity: 0.8
        });
        this.proxy = new THREE.Mesh(proxyGeo, proxyMat);
        this.proxy.visible = false;
        this.proxy.renderOrder = 999;
        this.scene.add(this.proxy);

        // Selection Indicators (Individual spheres)
        this.selectionHelpers = [];
        this.selectionHelperMat = new THREE.MeshBasicMaterial({
            color: 0xffff00, // Yellow for individual items
            depthTest: false,
            transparent: true,
            opacity: 0.5
        });

        // Create Controls
        this.control = new TransformControls(camera, renderer.domElement);

        this.control.addEventListener('dragging-changed', (event) => {
            if (this.interaction && this.interaction.devMode && this.interaction.devMode.cameraController) {
                this.interaction.devMode.cameraController.enabled = !event.value;
            }

            if (event.value) {
                // Drag Started
                this.captureOffsets();
            } else {
                // Drag Ended
                if (this.selectedObjects.length > 0 && this.interaction.app.colliderSystem) {
                    // Update Physics Bodies for all selected
                    this.selectedObjects.forEach(obj => {
                        let target = obj;
                        if (target.userData.type === 'waypoint' && target.parent?.parent?.userData.type === 'car') {
                            target = target.parent.parent;
                        }
                        this.interaction.app.colliderSystem.updateBody(target);
                    });
                }
            }
        });

        // Handle changes from Gizmo (Dragging Handles)
        this.control.addEventListener('change', () => {
             if (this.selectedObjects.length > 0 && this.interaction && this.interaction.devMode) {
                 this.updateObjectsFromProxy(); // Apply gizmo move to objects

                 // Update UI properties (showing Proxy properties)
                 this.interaction.devMode.ui.updateProperties(this.proxy);
             }
        });

        this.scene.add(this.control.getHelper());

        this.selectedObjects = [];
        this.offsets = []; // Stores { position, quaternion, scale } relative to proxy inverse
        this.offsetY = 5;
    }

    attach(objects) {
        // Normalize input to array
        if (!Array.isArray(objects)) {
            objects = objects ? [objects] : [];
        }

        this.selectedObjects = objects;

        if (this.selectedObjects.length === 0) {
            this.detach();
            return;
        }

        // Calculate Centroid
        const centroid = new THREE.Vector3();
        this.selectedObjects.forEach(obj => centroid.add(obj.position));
        centroid.divideScalar(this.selectedObjects.length);

        // Position Proxy at Centroid (plus offsetY)
        this.proxy.position.copy(centroid).add(new THREE.Vector3(0, this.offsetY, 0));
        this.proxy.rotation.set(0, 0, 0); // Reset rotation for group pivot
        this.proxy.scale.set(1, 1, 1);    // Reset scale
        this.proxy.updateMatrixWorld();
        this.proxy.visible = true;

        // Attach Controls to Proxy
        this.control.attach(this.proxy);

        // Update Visuals (Individual Indicators)
        this.updateSelectionVisuals();

        // Capture initial offsets immediately so we are ready for moves
        this.captureOffsets();

        // Force handles on top
        const helper = this.control.getHelper();
        if (helper && helper.traverse) {
            helper.traverse(child => {
                if (child.material) child.material.depthTest = false;
            });
        }
    }

    detach() {
        this.selectedObjects = [];
        this.control.detach();
        this.proxy.visible = false;
        this.clearSelectionVisuals();
    }

    clearSelectionVisuals() {
        this.selectionHelpers.forEach(h => this.scene.remove(h));
        this.selectionHelpers = [];
    }

    updateSelectionVisuals() {
        this.clearSelectionVisuals();
        const sphereGeo = new THREE.SphereGeometry(0.5, 8, 8); // Low poly is fine

        this.selectedObjects.forEach(obj => {
            const mesh = new THREE.Mesh(sphereGeo, this.selectionHelperMat);
            mesh.position.copy(obj.position);
            mesh.renderOrder = 998;
            this.scene.add(mesh);
            this.selectionHelpers.push(mesh);
        });
    }

    captureOffsets() {
        this.offsets = [];
        const proxyInverse = this.proxy.matrixWorld.clone().invert();

        this.selectedObjects.forEach(obj => {
            // Store the transform of the object relative to the Proxy
            // Matrix: Offset = ProxyInverse * ObjectWorld
            const offsetMatrix = proxyInverse.clone().multiply(obj.matrixWorld);
            this.offsets.push(offsetMatrix);
        });
    }

    updateObjectsFromProxy() {
        if (this.selectedObjects.length === 0) return;

        // Update objects based on Proxy's new transform
        // ObjectNewWorld = ProxyNewWorld * OffsetMatrix

        this.proxy.updateMatrixWorld(); // Ensure current

        this.selectedObjects.forEach((obj, i) => {
            if (!this.offsets[i]) return;

            const newMatrix = this.proxy.matrixWorld.clone().multiply(this.offsets[i]);

            // Decompose back to position/quaternion/scale
            newMatrix.decompose(obj.position, obj.quaternion, obj.scale);
            obj.updateMatrixWorld();
        });

        // Update the visual indicators positions too
        // We can just re-copy positions since objects moved
        let helperIdx = 0;
        this.selectedObjects.forEach(obj => {
            if (obj.userData.type !== 'waypoint' && this.selectionHelpers[helperIdx]) {
                this.selectionHelpers[helperIdx].position.copy(obj.position);
                helperIdx++;
            }
        });
    }

    updateSnapping(grid) {
        if (grid && grid.enabled) {
            this.control.setTranslationSnap(grid.cellSize);
            this.control.setRotationSnap(grid.getRotationSnap());
        } else {
            this.control.setTranslationSnap(null);
            this.control.setRotationSnap(null);
        }
    }

    // Called when direct dragging or property updates happen externally
    // We need to propagate proxy changes to objects
    syncProxyToObjects() {
        // This is essentially updateObjectsFromProxy, but let's keep naming consistent
        this.updateObjectsFromProxy();
    }

    // If we moved an object externally (e.g. physics push), we might want to sync Proxy TO Object?
    // With multi-select, this is ambiguous (which object moved?).
    // Usually we drive from Proxy -> Objects.
    // If objects move individually, the group pivot is stale.
    // For now, we assume DevMode operations drive the transforms.

    update() {}
}
