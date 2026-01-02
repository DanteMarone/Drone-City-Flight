// src/drone/camera.js
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { damp, lerp } from '../utils/math.js';

export class CameraController {
    constructor(camera, target) {
        this.camera = camera;
        this.target = target;

        // State
        this.mode = 'CHASE'; // 'CHASE' | 'FPV'
        this.orbitAngles = { theta: 0, phi: 0.3 }; // Spherical coords offset for Chase

        // Config copies for runtime tweaking
        this.sensitivity = CONFIG.INPUT.SENSITIVITY.CHASE_MOUSE;
        this.offset = new THREE.Vector3(
            CONFIG.CAMERA.CHASE_OFFSET.x,
            CONFIG.CAMERA.CHASE_OFFSET.y,
            CONFIG.CAMERA.CHASE_OFFSET.z
        );

        this.currentPos = new THREE.Vector3();
        this.currentLookAt = new THREE.Vector3();

        // Mouse Drag handling
        this.isDragging = false;
        this.lastMouse = { x: 0, y: 0 };

        this._setupInput();
    }

    _setupInput() {
        document.addEventListener('mousedown', (e) => {
            if (e.button === 2) { // RMB
                this.isDragging = true;
                this.lastMouse.x = e.clientX;
                this.lastMouse.y = e.clientY;
            }
        });
        document.addEventListener('mouseup', () => this.isDragging = false);
        document.addEventListener('mousemove', (e) => {
            if (this.isDragging && this.mode === 'CHASE') {
                const dx = e.clientX - this.lastMouse.x;
                const dy = e.clientY - this.lastMouse.y;

                this.orbitAngles.theta -= dx * this.sensitivity;
                this.orbitAngles.phi -= dy * this.sensitivity;

                // Clamp vertical look
                this.orbitAngles.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, this.orbitAngles.phi));

                this.lastMouse.x = e.clientX;
                this.lastMouse.y = e.clientY;
            }
        });

        // Prevent context menu
        document.addEventListener('contextmenu', e => e.preventDefault());
    }

    toggleMode() {
        this.mode = this.mode === 'CHASE' ? 'FPV' : 'CHASE';
        // Reset orbit on switch back to chase? Maybe not.
    }

    setTarget(target) {
        this.target = target;
    }

    update(dt, input) {
        if (input.toggleCamera) this.toggleMode();

        // Handle Q/E tilt (Orbit Phi)
        // Q (cameraUp) should increase phi (Upwards to Top-Down)
        // E (cameraDown) should decrease phi (Downwards to Horizontal)
        if (this.mode === 'CHASE') {
            if (input.cameraUp) this.orbitAngles.phi += 2.0 * dt;
            if (input.cameraDown) this.orbitAngles.phi -= 2.0 * dt;
            this.orbitAngles.phi = Math.max(0.01, Math.min(Math.PI / 2, this.orbitAngles.phi));
        }

        // Snap Behind Logic (Spec 3.2.4)
        // If moving (translating) and NOT dragging mouse, gently reset theta to 0 (behind drone)
        const isMoving = Math.abs(input.z) > 0.1 || Math.abs(input.x) > 0.1;
        if (isMoving && !this.isDragging && this.mode === 'CHASE') {
            // "Behind" relative to drone means angle 0 relative to drone's back.
            // Our theta is absolute offset angle? No, let's treat theta as offset from drone Yaw.
            // Actually simplest is: Theta tends toward 0.
            const snapSpeed = CONFIG.CAMERA.CHASE_SNAP_SPEED;

            // Shortest angle interpolation
            let angle = this.orbitAngles.theta;
            // Normalize to -PI..PI
            while (angle > Math.PI) angle -= Math.PI * 2;
            while (angle < -Math.PI) angle += Math.PI * 2;

            this.orbitAngles.theta = damp(angle, 0, snapSpeed, dt);
        }

        this._updateTransform(dt);
    }

    _updateTransform(dt) {
        const dronePos = this.target.position;
        const droneYaw = this.target.yaw;

        if (this.mode === 'FPV') {
            // Place camera at nose of drone
            const fwd = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0,1,0), droneYaw);
            // Tilt matching
            const tilt = this.target.tilt || { pitch: 0 };

            // FPV Position: slightly forward
            const fpvPos = dronePos.clone().add(new THREE.Vector3(0, 0, -0.4).applyAxisAngle(new THREE.Vector3(0,1,0), droneYaw));

            this.camera.position.copy(fpvPos);
            // Look forward + tilt
            const lookTarget = fpvPos.clone().add(fwd).add(new THREE.Vector3(0, -tilt.pitch, 0)); // Approx tilt
            this.camera.lookAt(lookTarget);

            // Apply Roll to camera? FPV usually has roll.
            // ThreeJS camera.rotation.z
            this.camera.rotation.z = (this.target.tilt ? this.target.tilt.roll : 0);

        } else {
            // CHASE
            this.camera.rotation.z = 0; // No roll in chase

            // Calculate offset based on Spherical coords + Drone Yaw
            // Theta is offset from Drone Rear
            const dist = this.offset.z; // radius
            const hDist = dist * Math.cos(this.orbitAngles.phi);
            const vDist = dist * Math.sin(this.orbitAngles.phi); // Height offset

            // Final Yaw = DroneYaw + Theta + PI (since 0 is "behind", but normally 0 is +Z which is "back" in ThreeJS? No, -Z is forward)
            // If Drone looks -Z. Behind is +Z.
            // We want camera at +Z (Behind).
            // Let's calculate offset vector.

            const totalYaw = droneYaw + this.orbitAngles.theta;
            const offsetX = hDist * Math.sin(totalYaw); // +X is left?
            const offsetZ = hDist * Math.cos(totalYaw);

            const targetPos = new THREE.Vector3(
                dronePos.x + offsetX,
                dronePos.y + vDist + 0.5, // 0.5 pivot height
                dronePos.z + offsetZ
            );

            // Smooth Camera follow (Damp)
            this.currentPos.lerp(targetPos, 1.0 - Math.exp(-10 * dt)); // Fast follow

            this.camera.position.copy(this.currentPos);
            this.camera.lookAt(dronePos);
        }
    }
}
