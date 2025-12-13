import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

export class GizmoManager {
    constructor(scene, camera, renderer, interactionManager) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.interaction = interactionManager;

        // Proxy object for handle offset
        // User Request: Visible sphere, floating just above.
        const proxyGeo = new THREE.SphereGeometry(0.5, 16, 16);
        const proxyMat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            depthTest: false,
            transparent: true,
            opacity: 0.8
        });
        this.proxy = new THREE.Mesh(proxyGeo, proxyMat);
        this.proxy.visible = false; // Hidden until selection
        this.proxy.renderOrder = 999; // Ensure on top
        this.scene.add(this.proxy);

        // Create Controls
        this.control = new TransformControls(camera, renderer.domElement);

        // --- COMPATIBILITY FIXES ---
        if (!this.control.isObject3D) {
            this.control.isObject3D = true;
        }

        if (!this.control.children) this.control.children = [];
        if (!this.control.matrix) this.control.matrix = new THREE.Matrix4();
        if (!this.control.matrixWorld) this.control.matrixWorld = new THREE.Matrix4();
        if (!this.control.position) this.control.position = new THREE.Vector3();
        if (!this.control.quaternion) this.control.quaternion = new THREE.Quaternion();
        if (!this.control.scale) this.control.scale = new THREE.Vector3(1, 1, 1);
        if (!this.control.layers) this.control.layers = new THREE.Layers();

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
        patchMethod('dispatchEvent', THREE.EventDispatcher.prototype.dispatchEvent);
        // ---------------------------

        this.control.addEventListener('dragging-changed', (event) => {
            if (this.interaction && this.interaction.devMode && this.interaction.devMode.cameraController) {
                this.interaction.devMode.cameraController.enabled = !event.value;
            }
        });

        // Handle changes from Gizmo (Dragging Handles)
        this.control.addEventListener('change', () => {
             if (this.selectedObject && this.interaction && this.interaction.devMode) {
                 this.syncObjectToProxy(); // Apply gizmo move to object
                 this.interaction.devMode.ui.updateProperties(this.selectedObject);
             }
        });

        this.scene.add(this.control);
        this.selectedObject = null;

        // Configurable offset
        this.offsetY = 5;
    }

    attach(object) {
        this.selectedObject = object;

        // Init Proxy
        this.syncProxyToObject();
        this.proxy.visible = true; // Show the sphere

        // Attach to Proxy instead of object
        this.control.attach(this.proxy);
        this.control.visible = true;

        // Force handles on top
        // TransformControls usually does this, but we can enforce depthTest=false traversal just in case
        if (this.control.traverse) {
            this.control.traverse(child => {
                if (child.material) child.material.depthTest = false;
            });
        }
    }

    detach() {
        this.selectedObject = null;
        this.control.detach();
        this.control.visible = false;
        this.proxy.visible = false; // Hide the sphere
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

    // Sync Logic
    syncProxyToObject() {
        if (!this.selectedObject) return;
        // Place proxy above object
        this.proxy.position.copy(this.selectedObject.position).add(new THREE.Vector3(0, this.offsetY, 0));
        this.proxy.rotation.copy(this.selectedObject.rotation);
        this.proxy.scale.copy(this.selectedObject.scale);
        this.proxy.updateMatrixWorld();
    }

    syncObjectToProxy() {
        if (!this.selectedObject) return;
        // Apply proxy transform back to object
        this.selectedObject.position.copy(this.proxy.position).sub(new THREE.Vector3(0, this.offsetY, 0));
        this.selectedObject.rotation.copy(this.proxy.rotation);
        this.selectedObject.scale.copy(this.proxy.scale);
        this.selectedObject.updateMatrixWorld();
    }

    setMode(mode) {
        this.control.setMode(mode);
    }

    update() {}
}
