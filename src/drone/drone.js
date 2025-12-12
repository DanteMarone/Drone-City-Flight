// src/drone/drone.js
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { damp, clamp } from '../utils/math.js';

export class Drone {
    constructor(scene) {
        this.scene = scene;

        // Physics State
        this.position = new THREE.Vector3(0, 5, 0); // Start higher
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.yaw = 0;
        this.tilt = { pitch: 0, roll: 0 };

        // Drone Mesh
        this.mesh = new THREE.Group();

        // Body
        const bodyGeo = new THREE.BoxGeometry(0.8, 0.2, 0.8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        this.bodyMesh.castShadow = true;
        this.mesh.add(this.bodyMesh);

        // Front indicator
        const noseGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        const noseMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const nose = new THREE.Mesh(noseGeo, noseMat);
        nose.position.set(0, 0, -0.4);
        this.mesh.add(nose);

        this.scene.add(this.mesh);
    }

    update(dt, input) {
        this._updatePhysics(dt, input);
        this._updateVisuals(dt, input);
    }

    _updatePhysics(dt, input) {
        const conf = CONFIG.DRONE;

        // 1. Yaw
        this.yaw += input.yaw * conf.YAW_SPEED * dt;

        // 2. Acceleration
        const accel = new THREE.Vector3(input.x, 0, input.z);
        accel.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        accel.multiplyScalar(conf.ACCELERATION);
        accel.y = input.y * conf.VERTICAL_ACCEL;

        // Apply to velocity
        this.velocity.add(accel.clone().multiplyScalar(dt));

        // 3. Drag
        const hVel = new THREE.Vector3(this.velocity.x, 0, this.velocity.z);
        const vVel = new THREE.Vector3(0, this.velocity.y, 0);

        hVel.sub(hVel.clone().multiplyScalar(conf.DRAG * dt));
        vVel.sub(vVel.clone().multiplyScalar(conf.VERTICAL_DRAG * dt));

        this.velocity.x = hVel.x;
        this.velocity.z = hVel.z;
        this.velocity.y = vVel.y;

        // Add Gravity (optional, but requested behavior implies "Hovering drains 0" so maybe anti-gravity auto-hover?)
        // Spec 3.4.2: "Hovering drains 0 battery when there is no translation and no altitude change"
        // This implies the drone holds altitude automatically if no input.
        // So we do NOT add gravity by default unless we want realistic mode.
        // But Spec 7.1 says "Vertical motion uses acceleration + vertical drag".
        // If we add gravity, we need constant upward force to hover.
        // Let's stick to kinematic vertical control (no gravity) for arcade feel.

        // 4. Update Position
        this.position.add(this.velocity.clone().multiplyScalar(dt));

        // Note: Collision resolution happens in App external loop or we inject PhysicsEngine here.
        // For clean separation, we let App handle collision resolution step after this update.
        // But that means position might penetrate for one frame.
        // Ideally: Predict position, check collision, move.
        // Current Plan: Move here, then Resolve (push back) in App.

        // Apply to mesh
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.yaw;
    }

    _updateVisuals(dt, input) {
        const conf = CONFIG.DRONE;

        // Target tilt
        const targetPitch = input.z * conf.TILT_MAX;

        this.tilt.pitch = damp(this.tilt.pitch, targetPitch, 10, dt);
        this.tilt.roll = damp(this.tilt.roll, -input.x * conf.TILT_MAX, 10, dt);

        this.bodyMesh.rotation.x = this.tilt.pitch;
        this.bodyMesh.rotation.z = this.tilt.roll;
    }
}
