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

        // Add the helper (visual representation) to the scene
        // TransformControls is not an Object3D, but getHelper() returns one.
        this.scene.add(this.control.getHelper());

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
        // this.control.visible = true; // Not needed on control itself if using helper, but helper handles visibility via attach/detach usually.
        // Actually TransformControls.detach() sets _root.visible = false. attach() sets it to true.

        // Force handles on top
        // Traverse the helper, not the control
        const helper = this.control.getHelper();
        if (helper && helper.traverse) {
            helper.traverse(child => {
                if (child.material) child.material.depthTest = false;
            });
        }
    }

    detach() {
        this.selectedObject = null;
        this.control.detach();
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
