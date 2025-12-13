import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

export class GizmoManager {
    constructor(scene, camera, renderer, interactionManager) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.control = new TransformControls(camera, renderer.domElement);
        this.interaction = interactionManager; // To disable other inputs when dragging

        this.control.addEventListener('dragging-changed', (event) => {
            // Disable camera controls while dragging gizmo
            if (this.interaction && this.interaction.devMode && this.interaction.devMode.cameraController) {
                this.interaction.devMode.cameraController.enabled = !event.value;
            }
        });

        // Listen for change events to update UI
        this.control.addEventListener('change', () => {
             if (this.selectedObject && this.interaction && this.interaction.devMode) {
                 this.interaction.devMode.ui.updateProperties(this.selectedObject);
             }
        });

        scene.add(this.control);
        this.selectedObject = null;
    }

    attach(object) {
        this.selectedObject = object;
        this.control.attach(object);
        // Ensure visible
        this.control.visible = true;
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


    detach() {
        this.selectedObject = null;
        this.control.detach();
    }

    setMode(mode) {
        // mode: 'translate', 'rotate', 'scale'
        this.control.setMode(mode);
    }

    update() {
        // TransformControls usually handles its own update via event listeners on domElement,
        // but sometimes manual update is needed if camera changes without events?
        // Actually, no, it updates in render loop if added to scene.
    }
}
