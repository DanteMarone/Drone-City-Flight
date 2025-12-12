// src/ui/compass.js
import * as THREE from 'three';

export class RingCompass {
    constructor(scene, drone, ringsManager) {
        this.scene = scene;
        this.drone = drone;
        this.ringsManager = ringsManager;

        this.arrow = null;
        this._init();
    }

    _init() {
        // A simple 3D arrow that hovers above the drone?
        // Or a 2D HUD element?
        // Spec 4.10: "HUD indicator points toward nearest active ring"
        // Let's do a 2D HUD Arrow for better visibility.

        const layer = document.getElementById('ui-layer');
        this.dom = document.createElement('div');
        this.dom.className = 'hud-compass';
        this.dom.innerHTML = `
            <div class="compass-arrow">➤</div>
            <div class="compass-dist">0m</div>
        `;
        layer.appendChild(this.dom);

        this.arrowEl = this.dom.querySelector('.compass-arrow');
        this.distEl = this.dom.querySelector('.compass-dist');
    }

    update(dt) {
        const rings = this.ringsManager.rings;
        if (rings.length === 0) {
            this.dom.style.opacity = 0;
            return;
        }

        // Find nearest
        let nearest = null;
        let minDist = Infinity;
        const dPos = this.drone.position;

        rings.forEach(r => {
            const d = r.mesh.position.distanceTo(dPos);
            if (d < minDist) {
                minDist = d;
                nearest = r.mesh.position;
            }
        });

        if (nearest) {
            this.dom.style.opacity = 1;
            this.distEl.innerText = `${minDist.toFixed(0)}m`;

            // Calculate angle relative to camera view or drone forward?
            // Usually relative to screen center.
            // We need to project the target position into screen space?
            // Simpler: Just point relative to Drone Heading (if FPV) or Camera Forward.

            // Let's use 3D projection to screen to place it on the edge of screen?
            // "Compass" usually means top of screen strip, or an arrow around the player.

            // Let's do a simple Arrow that rotates.
            // Angle = Atan2(target.z - drone.z, target.x - drone.x) - DroneYaw

            const dx = nearest.x - dPos.x;
            const dz = nearest.z - dPos.z;

            // World Angle
            const worldAngle = Math.atan2(dx, dz); // Atan2(x, z) gives angle from Z axis?
            // Standard: atan2(y,x). Here Z is 'up' in 2D map.
            // Let's say Z is forward (0). X is Right (PI/2).
            // Atan2(x, z).

            // Drone Yaw is rotation around Y.
            // We need Camera Yaw since we look through camera.
            // But we don't have easy access to camera yaw in this class?
            // We can pass camera.

            // Let's stick to "Relative to Drone Forward" which is what `drone.yaw` tracks.
            // If in Chase mode, camera is usually behind drone, so they align.
            // If camera orbits, the arrow might be misleading if it's "Drone Relative".
            // Ideally it should be "Screen Relative".

            // For MVP: Relative to Drone Yaw.

            let angleDiff = worldAngle - this.drone.yaw;
            // Convert to degrees for CSS rotation
            const deg = angleDiff * (180 / Math.PI);

            this.arrowEl.style.transform = `rotate(${deg}deg)`;
        }
    }
}
