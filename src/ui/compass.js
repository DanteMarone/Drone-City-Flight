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

            // Calculate angle relative to Drone Forward
            // In ThreeJS: Forward is -Z. Right is +X.
            // Math.atan2(x, z) assumes 0 is +Z.
            // Target vector relative to drone
            const dx = nearest.x - dPos.x;
            const dz = nearest.z - dPos.z;

            // Angle of target in world space (0 at +Z, PI/2 at +X)
            // atan2(x, z)
            const targetAngle = Math.atan2(dx, dz);

            // Drone Yaw: 0 means facing -Z?
            // Check drone.js: "this.mesh.rotation.y = this.yaw;"
            // Standard ThreeJS: 0 rotation faces initial state.
            // Initial state: Drone usually modeled facing -Z or +Z?
            // Drone body is box. Nose is at -0.4 Z. So Forward is -Z.
            // If yaw = 0, drone faces -Z.

            // We want angle relative to drone nose.
            // Vector to target: (dx, dz).
            // Rotate this vector by -Yaw to align with drone local space?

            // Or simpler:
            // Drone Forward Angle in World (relative to +Z):
            // If yaw=0, forward is -Z (Angle PI).
            // If yaw=PI/2 (Left turn), forward is -X (Angle -PI/2).
            // Actually, let's verify standard ThreeJS rotation.
            // Rot Y positive is CCW around Y.
            // +Z -> +X is -90 deg?
            // Let's stick to `angleDiff = targetAngle - droneAngle`.

            // If yaw = 0, drone looks at -Z. targetAngle should be relative to -Z.
            // targetAngle = atan2(x, z). 0 is +Z. PI is -Z.
            // So if target is at -Z, targetAngle is PI.
            // We want arrow to point UP (0 deg) when target is in front.
            // So we want (targetAngle - PI) = 0.

            // If yaw rotates, say Yaw = PI/2 (turned Left, facing +X).
            // Target at +X. targetAngle = PI/2.
            // We want arrow UP (0 deg).
            // Formula: arrowAngle = targetAngle - (Yaw + PI).
            // Check: PI/2 - (PI/2 + PI) = -PI.
            // -PI corresponds to pointing UP? No, usually 0 is Up in CSS rotation?
            // CSS rotate(0deg) is usually UP if the icon is drawn UP.
            // Let's assume Arrow icon ➤ points Right by default?
            // HTML: ➤ is right pointing.
            // So 0 deg points Right. -90 deg points Up.

            // Desired visual: Point towards target relative to drone forward.
            // Bearing = targetAngle - (DroneYaw + PI).
            // If Bearing is 0 (Front), we want Arrow to point Up.
            // Since Arrow ➤ points Right, we need rotate(-90deg).

            // Formula:
            // rot = (targetAngle - (this.drone.yaw + Math.PI)) * 180/PI - 90;

            let bearing = targetAngle - (this.drone.yaw + Math.PI);
            // Negate bearing because CSS rotation is CW but Math angle is CCW-ish relative to screen?
            // See Plan Step 1 analysis:
            // Bearing 0 -> Up (-90). (0 -> -90)
            // Bearing -90 (Right) -> Right (0). (-90 -> 0)
            // Bearing 90 (Left) -> Left (180). (90 -> -180)
            // Function: f(b) = -b - 90.

            let deg = (-bearing * 180 / Math.PI) - 90;

            this.arrowEl.style.transform = `rotate(${deg}deg)`;
        }
    }
}
