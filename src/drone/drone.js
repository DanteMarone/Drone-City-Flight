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
        this.radius = CONFIG.DRONE.RADIUS;

        // Drone Mesh Components
        this.mesh = new THREE.Group();
        this.tiltGroup = new THREE.Group(); // Inner group for Pitch/Roll
        this.mesh.add(this.tiltGroup);

        this.propellers = []; // Array of meshes to rotate

        this._buildDroneMesh();

        this.scene.add(this.mesh);

        // Whiteout Overlay
        this.whiteoutOverlay = document.createElement('div');
        this.whiteoutOverlay.style.position = 'fixed';
        this.whiteoutOverlay.style.top = '0';
        this.whiteoutOverlay.style.left = '0';
        this.whiteoutOverlay.style.width = '100%';
        this.whiteoutOverlay.style.height = '100%';
        this.whiteoutOverlay.style.backgroundColor = 'white';
        this.whiteoutOverlay.style.pointerEvents = 'none';
        this.whiteoutOverlay.style.zIndex = '9999';
        this.whiteoutOverlay.style.opacity = '0';
        this.whiteoutOverlay.style.transition = 'opacity 0.1s linear'; // Smooth transition
        document.body.appendChild(this.whiteoutOverlay);
    }

    _buildDroneMesh() {
        const whiteMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.3, metalness: 0.1 });
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6 });
        const camMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.8 });

        // Add everything to this.tiltGroup instead of this.mesh

        // 1. Central Body (Streamlined)
        const fuselageGeo = new THREE.CapsuleGeometry(0.25, 0.6, 4, 8);
        fuselageGeo.rotateX(Math.PI / 2); // Align Z
        const fuselage = new THREE.Mesh(fuselageGeo, whiteMat);
        fuselage.scale.set(1, 0.6, 1);
        fuselage.castShadow = true;
        this.tiltGroup.add(fuselage);

        // 2. Arms (X shape)
        // Arms need to reach 0.55 * sqrt(2) ~= 0.78
        // Cylinder length 1.6 to be safe (0.8 each side)
        const armLen = 1.6;
        const armGeo = new THREE.CylinderGeometry(0.04, 0.04, armLen, 8);
        armGeo.rotateZ(Math.PI / 2); // Align X

        const arm1 = new THREE.Mesh(armGeo, whiteMat);
        arm1.rotation.y = Math.PI / 4;
        arm1.castShadow = true;
        this.tiltGroup.add(arm1);

        const arm2 = new THREE.Mesh(armGeo, whiteMat);
        arm2.rotation.y = -Math.PI / 4;
        arm2.castShadow = true;
        this.tiltGroup.add(arm2);

        // 3. Motors & Propellers
        const motorGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.15, 16);
        const propGeo = new THREE.BoxGeometry(0.6, 0.01, 0.06);

        const armOffsets = [
            { x: 1, z: 1, dir: 1 },  // FL
            { x: -1, z: 1, dir: -1 }, // FR
            { x: -1, z: -1, dir: 1 }, // BR
            { x: 1, z: -1, dir: -1 }  // BL
        ];

        // Scale factor for offsets (Spread)
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

            // Visual hub (Cap)
            // Prop is at 0.1 (center). Top surface at 0.105.
            // Hub height 0.02 -> 0.01 half.
            // Hub Center = 0.105 + 0.01 = 0.115.
            const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.02), whiteMat);
            hub.position.y = 0.115; // Just sitting on top
            // Add hub to scene group or prop?
            // If added to prop, it rotates with prop.
            // Position relative to prop center (0,0,0).
            // Prop center is at Y=0.1 relative to group.
            // If I add to prop, y should be relative to prop center.
            // Prop Height 0.01. Top is 0.005.
            // Hub bottom needs to be at 0.005.
            // Hub center = 0.005 + 0.01 = 0.015.
            hub.position.set(0, 0.015, 0);

            // Re-creating prop to hold hub
            prop.add(hub);

            group.add(prop);
            this.tiltGroup.add(group);

            this.propellers.push({ mesh: prop, dir: off.dir });

            // Landing Leg
            const leg = new THREE.Mesh(
                new THREE.CylinderGeometry(0.02, 0.01, 0.2),
                whiteMat
            );
            leg.position.set(off.x * offsetScale, -0.15, off.z * offsetScale);
            this.tiltGroup.add(leg);
        });

        // 4. Camera (Front Gimbal)
        // Forward is -Z. Move to front.
        const gimbalGroup = new THREE.Group();
        gimbalGroup.position.set(0, -0.1, -0.4);

        const camBox = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.2), darkMat);
        const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 16), camMat);
        lens.rotation.x = Math.PI / 2;
        lens.position.z = -0.1; // Pointing Forward (-Z local)
        camBox.add(lens);

        gimbalGroup.add(camBox);
        this.tiltGroup.add(gimbalGroup);
    }

    update(dt, input) {
        this._updatePhysics(dt, input);
        this._updateVisuals(dt, input);
        this._updateAltitudeEffects();
    }

    resetAltitudeEffects() {
        this.whiteoutOverlay.style.opacity = '0';
        if (this.scene.fog) {
            this.scene.fog.density = 0;
        }
    }

    _updateAltitudeEffects() {
        // Check if Dev Mode is active (assuming global app reference or passed in constructor)
        // Since constructor only got 'scene', we might need 'app' or check global.
        // The memory says 'window.app' is available.
        if (window.app && window.app.devMode && window.app.devMode.enabled) {
            this.resetAltitudeEffects();
            return;
        }

        const maxAlt = CONFIG.DRONE.MAX_ALTITUDE;
        const startAlt = maxAlt - 20; // Start effect 20m before max
        const currentAlt = this.position.y;

        // Clamp Altitude
        if (currentAlt > maxAlt) {
            this.position.y = maxAlt;
            this.velocity.y = Math.min(0, this.velocity.y); // Stop upward velocity
            this.mesh.position.y = maxAlt;
        }

        // Calculate Effect Intensity (0.0 to 1.0)
        let intensity = 0;
        if (currentAlt > startAlt) {
            intensity = (currentAlt - startAlt) / (maxAlt - startAlt);
            intensity = Math.min(Math.max(intensity, 0), 1);
        }

        // Apply to Overlay
        this.whiteoutOverlay.style.opacity = intensity.toString();

        // Apply to Fog (Create if missing)
        // We use FogExp2 for realistic distance falloff
        if (intensity > 0) {
            if (!this.scene.fog) {
                this.scene.fog = new THREE.FogExp2(0xffffff, 0);
            }
            // Density range: 0 to 0.05 (adjust as needed for "thick")
            // 0.05 is quite thick
            const maxDensity = 0.1;
            this.scene.fog.density = intensity * maxDensity;
            this.scene.fog.color.setHex(0xffffff); // Ensure white
        } else {
            if (this.scene.fog) {
                this.scene.fog.density = 0;
            }
        }
    }

    _updatePhysics(dt, input) {
        const conf = CONFIG.DRONE;

        // Yaw (Applied to mesh Y, which is World Vertical)
        this.yaw += input.yaw * conf.YAW_SPEED * dt;

        // Acceleration
        const accel = new THREE.Vector3(input.x, 0, input.z);
        accel.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        accel.multiplyScalar(conf.ACCELERATION);
        accel.y = input.y * conf.VERTICAL_ACCEL;

        // Apply to velocity
        this.velocity.add(accel.clone().multiplyScalar(dt));

        // Wind Force
        if (window.app && window.app.world && window.app.world.wind) {
            const wind = window.app.world.wind;
            if (wind.speed > 0) {
                // Convert degrees to radians
                const rad = wind.direction * (Math.PI / 180);

                // Calculate direction (0 = North/-Z, 90 = East/+X)
                // Using sin for X and -cos for Z aligns with compass 0 at North
                const windDir = new THREE.Vector3(Math.sin(rad), 0, -Math.cos(rad));

                // Force calculation:
                // We add a small acceleration per frame.
                // Factor 2.0 ensures 10 speed feels significant but not overwhelming against drag.
                const windForce = windDir.multiplyScalar(wind.speed * 2.0 * dt);
                this.velocity.add(windForce);
            }
        }

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

        // Apply Position and Yaw to Main Mesh
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.yaw;
    }

    _updateVisuals(dt, input) {
        const conf = CONFIG.DRONE;

        // Tilt logic
        const targetPitch = input.z * conf.TILT_MAX;
        this.tilt.pitch = damp(this.tilt.pitch, targetPitch, 10, dt);
        this.tilt.roll = damp(this.tilt.roll, -input.x * conf.TILT_MAX, 10, dt);

        // Apply Pitch/Roll to Inner Group
        // This ensures Pitch doesn't affect the Yaw axis of rotation
        this.tiltGroup.rotation.x = this.tilt.pitch;
        this.tiltGroup.rotation.z = this.tilt.roll;

        // Propellers
        const speed = 20.0 + this.velocity.length() * 2.0;
        this.propellerAngle += speed * dt;

        this.propellers.forEach(p => {
            p.mesh.rotation.y = this.propellerAngle * p.dir;
        });
    }
}
