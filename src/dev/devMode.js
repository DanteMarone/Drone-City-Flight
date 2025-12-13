// src/dev/devMode.js
import * as THREE from 'three';
import { DevCameraController } from './devCamera.js';
import { DevUI } from './devUI.js';
import { InteractionManager } from './interaction.js';
import { GridSystem } from './grid.js';
import { GizmoManager } from './gizmo.js';

export class DevMode {
    constructor(app) {
        this.app = app;
        this.enabled = false;

        // Controllers
        this.cameraController = new DevCameraController(app.renderer.camera, app.container);
        this.ui = new DevUI(this);
        this.interaction = new InteractionManager(this.app, this);

        // New Systems
        this.grid = new GridSystem(app.renderer.scene);
        this.gizmo = new GizmoManager(app.renderer.scene, app.renderer.camera, app.renderer, this.interaction);
    }

    toggle() {
        if (this.enabled) this.disable();
        else this.enable();
    }

    enable() {
        console.log("DevMode: Enabled");
        this.enabled = true;

        // 1. Hide Drone
        if (this.app.drone) this.app.drone.mesh.visible = false;

        // 2. Hide HUD
        const hudEl = document.querySelector('.hud-container');
        if (hudEl) hudEl.style.display = 'none';

        // 3. Switch Camera Controller
        this.app.cameraController.enabled = false;
        this.cameraController.enabled = true;
        this.cameraController.euler.setFromQuaternion(this.app.renderer.camera.quaternion);

        // 4. Show Dev UI
        this.ui.show();

        // 5. Enable Interaction
        this.interaction.enable();

        // 6. Enable Gizmo & Grid (if previously on)
        if (this.grid.enabled) this.grid.helper.visible = true;

        import('./interaction.js').then(({ setupDragDrop }) => {
            setupDragDrop(this.interaction, this.app.container);
        });

        // Pause Gameplay
        this.app.paused = true;
    }

    disable() {
        console.log("DevMode: Disabled");
        this.enabled = false;

        if (this.app.drone) this.app.drone.mesh.visible = true;
        const hudEl = document.querySelector('.hud-container');
        if (hudEl) hudEl.style.display = 'block';

        this.cameraController.enabled = false;
        this.app.cameraController.enabled = true;

        this.ui.hide();
        this.interaction.disable();

        this.grid.helper.visible = false;
        this.gizmo.detach();
        this.selectObject(null);
    }

    update(dt) {
        if (!this.enabled) return;
        this.cameraController.update(dt);
        // Gizmo/Grid doesn't need explicit update usually, but just in case
        this.gizmo.update();
    }

    selectObject(object) {
        // Called by InteractionManager or Gizmo
        if (!object) {
            this.gizmo.detach();
            this.ui.hideProperties();
            return;
        }

        // Verify object is valid for selection (already checked by raycast usually)
        this.gizmo.attach(object);
        this.ui.showProperties(object);
    }

    deleteSelected() {
        if (this.gizmo.selectedObject) {
            const obj = this.gizmo.selectedObject;
            this.selectObject(null);

            // Remove from scene and collider system
            this.app.renderer.scene.remove(obj);
            // Need to remove from collider system too if registered!
            // Currently collider system doesn't have easy 'remove' by object reference
            // But we can rebuild spatial hash on map save/load.
            // For runtime, we might leave ghost collider or need method.
            // Assumption: Dev Mode edits are for visual placement mainly, collision sync happens on reload?
            // Or we should try to remove it.
            // For now, just remove visual.
            // If it's a "placed" object, it might be in `app.world.objects` array if we track them.
            // `exportMap` iterates scene children with userData.type. So removing from scene is enough for save/load.
        }
    }

    // Commands
    clearMap() {
        this.app.world.clear();
        this.app.rings.clear();
    }

    saveMap() {
        const mapData = {
            version: 1,
            objects: this.app.world.exportMap().objects,
            rings: this.app.rings.exportRings()
        };

        const blob = new Blob([JSON.stringify(mapData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'custom_map.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    loadMap(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.app.loadMap(data); // We'll implement this in App
            } catch (err) {
                console.error("Failed to load map:", err);
                alert("Invalid map file");
            }
        };
        reader.readAsText(file);
    }
}
