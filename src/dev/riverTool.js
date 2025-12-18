
import * as THREE from 'three';
import { EntityRegistry } from '../world/entities/index.js';

export class RiverTool {
    constructor(app, devMode) {
        this.app = app;
        this.devMode = devMode;
        this.active = false;
        this.ghostMesh = null;
    }

    activate() {
        this.active = true;
        this._createGhost();
    }

    deactivate() {
        this.active = false;
        this._destroyGhost();
    }

    onMouseDown(point) {
        if (!this.active || !point) return;

        // Create the river at the point
        const params = {
            x: point.x,
            y: point.y,
            z: point.z,
            waypoints: [] // Start with just the origin point?
                          // RiverEntity defaults will add a 2nd point if empty.
                          // Let's rely on that for now so it's visible.
        };

        const entity = EntityRegistry.create('river', params);

        if (entity && entity.mesh) {
            // Add to scene
            this.app.renderer.scene.add(entity.mesh);
            this.app.world.addEntity(entity);
            if (this.app.colliderSystem) {
                this.app.colliderSystem.addStatic([entity]);
            }

            // Record history
            this.devMode._recordCreation([entity.mesh], 'Place River');

            // Select it immediately so user can add waypoints
            this.devMode.selectObject(entity.mesh);

            // Exit tool mode (single placement per click? or continuous?)
            // Requirement: "Tool must allow user to click to set initial start node."
            // "Subsequent nodes... manageable through properties".
            // So we place one, then switch to selection/edit mode.
            this.devMode.setPlacementMode(null);
        }
    }

    onMouseMove(point) {
        if (!this.active || !this.ghostMesh || !point) return;

        this.ghostMesh.position.copy(point);
        // Maybe snap? interaction manager handles snapping before passing point?
        // We'll assume point is already snapped if needed, or snap here.
        // But interaction manager passes raw intersection usually, unless we use grid.
        // Let's handle position update.
    }

    _createGhost() {
        if (this.ghostMesh) return;

        // Simple sphere to show where start node will be
        const geo = new THREE.SphereGeometry(2, 16, 16);
        const mat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.5
        });
        this.ghostMesh = new THREE.Mesh(geo, mat);
        this.app.renderer.scene.add(this.ghostMesh);
    }

    _destroyGhost() {
        if (this.ghostMesh) {
            this.app.renderer.scene.remove(this.ghostMesh);
            this.ghostMesh = null;
        }
    }
}
