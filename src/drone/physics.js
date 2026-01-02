// src/drone/physics.js
import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class PhysicsEngine {
    constructor(colliderSystem) {
        this.colliderSystem = colliderSystem;
    }

    resolveCollisionsFor(entity, dynamicColliders, options = {}) {
        const radius = options.radius ?? CONFIG.DRONE.RADIUS;
        const restitution = options.restitution ?? CONFIG.DRONE.COLLISION_RESTITUTION;
        const friction = options.friction ?? CONFIG.DRONE.COLLISION_FRICTION;
        const hits = this.colliderSystem.checkCollisions(entity.position, radius, dynamicColliders);

        hits.forEach(hit => {
            // 1. Positional Correction (Push out)
            if (hit.penetration > 0) {
                entity.position.add(hit.normal.clone().multiplyScalar(hit.penetration));
            }

            // 2. Velocity Response (Bounce)
            // v' = v - (1 + e) * (v . n) * n
            const velocity = entity.velocity;
            const vDotN = velocity.dot(hit.normal);

            if (vDotN < 0) {
                const impulse = -(1 + restitution) * vDotN;
                velocity.add(hit.normal.clone().multiplyScalar(impulse));

                // Friction
                const normalComponent = hit.normal.clone().multiplyScalar(velocity.dot(hit.normal));
                const tangent = velocity.clone().sub(normalComponent);
                tangent.multiplyScalar(friction);
                velocity.copy(normalComponent.add(tangent));
            }
        });

        return hits;
    }

    resolveCollisions(drone, dynamicColliders) {
        const hits = this.resolveCollisionsFor(drone, dynamicColliders, {
            radius: CONFIG.DRONE.RADIUS,
            restitution: CONFIG.DRONE.COLLISION_RESTITUTION,
            friction: CONFIG.DRONE.COLLISION_FRICTION
        });
        return hits.length > 0;
    }
}
