// src/drone/drone.js
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { damp } from '../utils/math.js';

export class Drone {
    constructor(scene) {
        this.scene = scene;

        // Physics State
        this.position = new THREE.Vector3(0, 5, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.yaw = 0;
        this.tilt = { pitch: 0, roll: 0 };
        this.propellerAngle = 0;

        // Drone Mesh Components
        this.mesh = new THREE.Group();
        this.propellers = []; // Array of meshes to rotate

        this._buildDroneMesh();

        this.scene.add(this.mesh);
    }

    _buildDroneMesh() {
        const whiteMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.3, metalness: 0.1 });
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6 });
        const camMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.8 });

        // 1. Central Body (Streamlined)
        // Main fuselage: Rounded box
        const fuselageGeo = new THREE.CapsuleGeometry(0.25, 0.6, 4, 8);
        fuselageGeo.rotateX(Math.PI / 2); // Align Z
        const fuselage = new THREE.Mesh(fuselageGeo, whiteMat);
        fuselage.scale.set(1, 0.6, 1); // Flatten slightly
        fuselage.castShadow = true;
        this.mesh.add(fuselage);

        // 2. Arms (X shape)
        const armLen = 0.45;
        const armGeo = new THREE.CylinderGeometry(0.04, 0.04, armLen * 2.2, 8);
        armGeo.rotateZ(Math.PI / 2); // Align X

        const arm1 = new THREE.Mesh(armGeo, whiteMat);
        arm1.rotation.y = Math.PI / 4;
        arm1.castShadow = true;
        this.mesh.add(arm1);

        const arm2 = new THREE.Mesh(armGeo, whiteMat);
        arm2.rotation.y = -Math.PI / 4;
        arm2.castShadow = true;
        this.mesh.add(arm2);

        // 3. Motors & Propellers
        const motorGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.15, 16);
        const propGeo = new THREE.BoxGeometry(0.6, 0.01, 0.06);

        const armOffsets = [
            { x: 1, z: 1, dir: 1 },  // FL
            { x: -1, z: 1, dir: -1 }, // FR
            { x: -1, z: -1, dir: 1 }, // BR
            { x: 1, z: -1, dir: -1 }  // BL
        ];

        // Scale factor for offsets
        const offsetScale = 0.55;

        armOffsets.forEach((off, i) => {
            const group = new THREE.Group();
            group.position.set(off.x * offsetScale, 0.05, off.z * offsetScale);

            // Motor
            const motor = new THREE.Mesh(motorGeo, darkMat);
            motor.position.y = 0;
            group.add(motor);

            // Propeller
            const prop = new THREE.Mesh(propGeo, darkMat);
            prop.position.y = 0.1;
            // Add visual hub
            const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.05), whiteMat);
            hub.position.y = 0.12;
            prop.add(hub);

            group.add(prop);
            this.mesh.add(group);

            this.propellers.push({ mesh: prop, dir: off.dir });

            // Landing Leg?
            const leg = new THREE.Mesh(
                new THREE.CylinderGeometry(0.02, 0.01, 0.2),
                whiteMat
            );
            leg.position.set(off.x * offsetScale, -0.15, off.z * offsetScale);
            this.mesh.add(leg);
        });

        // 4. Camera (Front Gimbal)
        const gimbalGroup = new THREE.Group();
        gimbalGroup.position.set(0, -0.1, 0.4); // Under nose

        const camBox = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.2), darkMat);
        const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 16), camMat);
        lens.rotation.x = Math.PI / 2;
        lens.position.z = 0.1;
        camBox.add(lens);

        gimbalGroup.add(camBox);
        this.mesh.add(gimbalGroup);
    }

    update(dt, input) {
        this._updatePhysics(dt, input);
        this._updateVisuals(dt, input);
    }

    _updatePhysics(dt, input) {
        const conf = CONFIG.DRONE;

        // Yaw
        this.yaw += input.yaw * conf.YAW_SPEED * dt;

        // Acceleration
        const accel = new THREE.Vector3(input.x, 0, input.z);
        accel.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        accel.multiplyScalar(conf.ACCELERATION);
        accel.y = input.y * conf.VERTICAL_ACCEL;

        // Apply to velocity
        this.velocity.add(accel.clone().multiplyScalar(dt));

        // Drag
        const hVel = new THREE.Vector3(this.velocity.x, 0, this.velocity.z);
        const vVel = new THREE.Vector3(0, this.velocity.y, 0);

        hVel.sub(hVel.clone().multiplyScalar(conf.DRAG * dt));
        vVel.sub(vVel.clone().multiplyScalar(conf.VERTICAL_DRAG * dt));

        this.velocity.x = hVel.x;
        this.velocity.z = hVel.z;
        this.velocity.y = vVel.y;

        // Move
        this.position.add(this.velocity.clone().multiplyScalar(dt));

        // Apply
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.yaw;
    }

    _updateVisuals(dt, input) {
        const conf = CONFIG.DRONE;

        // Tilt
        const targetPitch = input.z * conf.TILT_MAX;
        this.tilt.pitch = damp(this.tilt.pitch, targetPitch, 10, dt);
        this.tilt.roll = damp(this.tilt.roll, -input.x * conf.TILT_MAX, 10, dt);

        // Apply Tilt to Mesh (Body)
        // Since mesh.rotation.y is controlled by Yaw, we apply tilt to the CHILDREN or rotate the Group?
        // Usually, Mesh rotation Y is World Yaw. Mesh rotation X/Z is local tilt.
        // Order: YXZ usually.
        this.mesh.rotation.x = this.tilt.pitch;
        this.mesh.rotation.z = this.tilt.roll;

        // Propellers
        // Spin fast
        const speed = 20.0 + this.velocity.length() * 2.0;
        this.propellerAngle += speed * dt;

        this.propellers.forEach(p => {
            p.mesh.rotation.y = this.propellerAngle * p.dir;
        });
    }
}
