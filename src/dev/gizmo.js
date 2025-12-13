import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

export class GizmoManager {
    constructor(scene, camera, renderer, interactionManager) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.interaction = interactionManager;

        // Create Controls
        this.control = new TransformControls(camera, renderer.domElement);

        // --- COMPATIBILITY FIXES ---
        // Patch missing Object3D features due to environment/module resolution issues.
        // These patches ensure the TransformControls instance behaves like a valid Object3D
        // in the current scene graph, preventing crashes during raycasting or updates.

        if (!this.control.isObject3D) {
            this.control.isObject3D = true;
        }

        // Ensure core properties exist
        if (!this.control.children) this.control.children = [];
        if (!this.control.matrix) this.control.matrix = new THREE.Matrix4();
        if (!this.control.matrixWorld) this.control.matrixWorld = new THREE.Matrix4();
        if (!this.control.position) this.control.position = new THREE.Vector3();
        if (!this.control.quaternion) this.control.quaternion = new THREE.Quaternion();
        if (!this.control.scale) this.control.scale = new THREE.Vector3(1, 1, 1);
        if (!this.control.layers) this.control.layers = new THREE.Layers();

        // Patch methods required by Scene and Raycaster
        const patchMethod = (name, impl) => {
            if (typeof this.control[name] !== 'function') {
                this.control[name] = impl;
            }
        };

        patchMethod('removeFromParent', function() {
            if (this.parent) this.parent.remove(this);
        });

        patchMethod('updateMatrixWorld', THREE.Object3D.prototype.updateMatrixWorld);
        patchMethod('raycast', THREE.Object3D.prototype.raycast);
        patchMethod('traverse', THREE.Object3D.prototype.traverse);
        patchMethod('dispatchEvent', THREE.EventDispatcher.prototype.dispatchEvent); // Just in case
        // ---------------------------

        this.control.addEventListener('dragging-changed', (event) => {
            if (this.interaction && this.interaction.devMode && this.interaction.devMode.cameraController) {
                this.interaction.devMode.cameraController.enabled = !event.value;
            }
        });

        this.control.addEventListener('change', () => {
             if (this.selectedObject && this.interaction && this.interaction.devMode) {
                 this.interaction.devMode.ui.updateProperties(this.selectedObject);
             }
        });

        this.scene.add(this.control);
        this.selectedObject = null;
    }

    attach(object) {
        this.selectedObject = object;
        this.control.attach(object);
        this.control.visible = true;
    }

    detach() {
        this.selectedObject = null;
        this.control.detach();
        this.control.visible = false;
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

    setMode(mode) {
        this.control.setMode(mode);
    }

    update() {}
}
