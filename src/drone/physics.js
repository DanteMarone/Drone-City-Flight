// src/drone/physics.js
import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class PhysicsEngine {
    constructor(colliderSystem) {
        this.colliderSystem = colliderSystem;
    }

    resolveCollisions(body, dynamicColliders, options = {}) {
        const radius = body.radius ?? CONFIG.DRONE.RADIUS;
        const hits = this.colliderSystem.checkCollisions(body.position, radius, dynamicColliders);
        const restitution = options.restitution ?? 0.5;
        const friction = options.friction ?? 0.9;

        hits.forEach(hit => {
            // 1. Positional Correction (Push out)
            if (hit.penetration > 0) {
                body.position.add(hit.normal.clone().multiplyScalar(hit.penetration));
            }

            // 2. Velocity Response (Bounce)
            // v' = v - (1 + e) * (v . n) * n
            const velocity = body.velocity;
            const vDotN = velocity.dot(hit.normal);

            if (vDotN < 0) {
                const impulse = -(1 + restitution) * vDotN;
                velocity.add(hit.normal.clone().multiplyScalar(impulse));

                // Friction
                const normalComponent = hit.normal.clone().multiplyScalar(velocity.dot(hit.normal));
                const tangent = velocity.clone().sub(normalComponent).multiplyScalar(friction);
                velocity.copy(normalComponent.add(tangent));
            }
        });

        return hits;
    }
}
