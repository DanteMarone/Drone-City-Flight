// src/dev/devMode.js
import * as THREE from 'three';
import { DevCameraController } from './devCamera.js';
import { DevUI } from './devUI.js';
import { InteractionManager } from './interaction.js';

export class DevMode {
    constructor(app) {
        this.app = app;
        this.enabled = false;

        // Controllers
        this.cameraController = new DevCameraController(app.renderer.camera, app.container);
        this.ui = new DevUI(this);
        this.interaction = new InteractionManager(this.app, this);
    }

    toggle() {
        if (this.enabled) this.disable();
        else this.enable();
    }

    enable() {
        console.log("DevMode: Enabled");
        this.enabled = true;

        // 1. Hide Drone
        if (this.app.drone) this.app.drone.group.visible = false;

        // 2. Hide HUD
        if (this.app.hud) document.getElementById('hud-layer').style.display = 'none';

        // 3. Switch Camera Controller
        // Store original position?
        this.app.cameraController.enabled = false;
        this.cameraController.enabled = true;
        this.cameraController.euler.setFromQuaternion(this.app.renderer.camera.quaternion); // Sync rotation

        // 4. Show Dev UI
        this.ui.show();

        // 5. Enable Interaction
        this.interaction.enable();

        // Setup Drag Drop on Container
        import('./interaction.js').then(({ setupDragDrop }) => {
            setupDragDrop(this.interaction, this.app.container);
        });

        // 6. Pause Physics?
        // User didn't strictly say pause physics, but usually Dev Mode is "Edit Mode".
        // "When in dev mode... switch to God Mode... Remove drone."
        // We probably shouldn't update physics/traffic simulation while editing?
        // Or maybe traffic keeps going?
        // Let's pause simulation to avoid chaos while editing.
        this.app.paused = true; // Wait, app.paused stops the loop?
        // App.paused stops everything including rendering if checking loop?
        // In App.js: "if (this.paused) { return; }" -> Yes, it stops update.
        // We need RENDER to continue, but GAMEPLAY to stop.
        // App.js handles Pause Menu by just returning.
        // We need a separate "Simulation Paused" vs "App Paused".
        // For now, let's just NOT call update() on drone/physics in App.js if devMode is on.
    }

    disable() {
        console.log("DevMode: Disabled");
        this.enabled = false;

        if (this.app.drone) this.app.drone.group.visible = true;
        if (this.app.hud) document.getElementById('hud-layer').style.display = 'block';

        this.cameraController.enabled = false;
        this.app.cameraController.enabled = true; // This might snap camera back to drone

        this.ui.hide();
        this.interaction.disable();

        // Resume simulation logic handled in App.update
    }

    update(dt) {
        if (!this.enabled) return;
        this.cameraController.update(dt);
        // We do NOT update physics/drone/traffic here.
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
