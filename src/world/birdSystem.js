import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class BirdSystem {
    constructor(scene) {
        this.scene = scene;
        this.birds = [];
        this.drone = null;

        // Vectors for reuse
        this._vecToDrone = new THREE.Vector3();
        this._vecToStart = new THREE.Vector3();
    }

    setDrone(drone) {
        this.drone = drone;
    }

    add(birdMesh) {
        // Ensure it has required data
        if (!birdMesh.userData.startPos) {
            birdMesh.userData.startPos = birdMesh.position.clone();
        }

        const bird = {
            mesh: birdMesh,
            state: 'IDLE', // IDLE, CHASE, RETURN
            wings: birdMesh.userData.wings,
            animTime: Math.random() * 10
        };

        this.birds.push(bird);
    }

    remove(birdMesh) {
        const idx = this.birds.findIndex(b => b.mesh === birdMesh);
        if (idx !== -1) {
            this.birds.splice(idx, 1);
        }
    }

    update(dt) {
        if (!this.drone) return;

        const dronePos = this.drone.mesh.position;
        const conf = CONFIG.BIRD;

        for (const bird of this.birds) {
            this._updateBird(bird, dt, dronePos, conf);
        }
    }

    _updateBird(bird, dt, dronePos, conf) {
        const mesh = bird.mesh;
        const startPos = mesh.userData.startPos;

        // Distances
        const distToDrone = mesh.position.distanceTo(dronePos);
        const distToStart = mesh.position.distanceTo(startPos);

        // State Transition Logic
        if (bird.state === 'IDLE') {
            if (distToDrone < conf.CHASE_RADIUS) {
                bird.state = 'CHASE';
            } else {
                // Return if drifted (sanity check)
                if (distToStart > 5) bird.state = 'RETURN';
            }
        } else if (bird.state === 'CHASE') {
            if (distToStart > conf.RETURN_RADIUS) {
                bird.state = 'RETURN';
            }
            // Logic for "catching"
            // If very close, maybe just stay there attacking?
            // Spec says "if caught... rapidly consumes battery".
            // It doesn't say "stop chasing".
            // So if > 50m from start, return. Else chase.
        } else if (bird.state === 'RETURN') {
            if (distToStart < 1.0) {
                bird.state = 'IDLE';
            }
        }

        // Movement Logic
        let target = null;
        let speed = conf.SPEED;

        if (bird.state === 'CHASE') {
            target = dronePos;
        } else if (bird.state === 'RETURN') {
            target = startPos;
        } else {
            // IDLE: Bob around start pos
            // We can just hover or slowly circle.
            // Let's just hover for now to keep it simple as requested "back and forth bounce"
            // Actually the "bounce" request was for animation.
            // Let's make IDLE just hover at start.
            target = startPos;
            speed = 2.0; // Slow return/idle adjustment
        }

        // Move towards target
        const dir = this._vecToDrone.subVectors(target, mesh.position).normalize();

        // Face target
        if (bird.state !== 'IDLE' || distToStart > 0.1) {
            // Smooth rotation? Or instant lookAt. Instant is fine for birds usually.
            mesh.lookAt(target);
        }

        // Apply Velocity
        if (mesh.position.distanceTo(target) > 0.5) {
            mesh.position.addScaledVector(dir, speed * dt);
        }

        // Animation (Bounce / Flap)
        bird.animTime += dt * 10; // Flap speed
        if (bird.wings) {
            // Rotate wings? Or Scale Y?
            // Wings are boxes. Rotating around Z (forward) or X (pitch)?
            // Wings are children.
            // Flap: Rotate around Z.
            // But wings is a single mesh. We can scale Y to simulate flapping if pivot is center.
            // Or just translate Y.
            // Simplest: Scale Y of the wings mesh
            // (assuming centered pivot, which they are).
            // Original: 1.2, 0.05, 0.4.
            // Flap: scale.y between 0.2 and 1.0?
            // No, that changes thickness.
            // User asked for "back and forth bounce".
            // "Give the bird a constant animation so it looks like it's flapping back and forth even when it's motionless."

            // Let's oscillate the entire bird Y slightly?
            // And maybe rotate wings local Z?
            // Let's oscillate wings Scale Y from 1 to 5 (making them thick/thin)? No.
            // Let's just oscillate the wings mesh position Y relative to body.
            bird.wings.position.y = 0.1 + Math.sin(bird.animTime) * 0.05;
        }

        // Bobbing whole bird (Bounce)
        // mesh.position.y += Math.sin(bird.animTime * 0.5) * 0.01;
        // Be careful not to fight physics movement.
        // If moving, movement overrides.

        // Collision & Attack
        if (bird.state === 'CHASE' && distToDrone < conf.COLLISION_RADIUS) {
            // Attack!
            // Assuming drone has battery manager
            if (this.drone.battery) {
                // Drain battery
                // drain is rate * dt
                // current is property.
                // We don't have a public 'drain' method that accepts amount,
                // but we can modify current directly or add a method.
                // BatteryManager has `current` property.
                this.drone.battery.current -= CONFIG.BATTERY.DRAIN_COLLISION * dt;
                if (this.drone.battery.current < 0) this.drone.battery.current = 0;
            }
        }
    }
}
