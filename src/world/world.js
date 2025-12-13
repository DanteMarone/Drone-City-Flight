/* src/world/world.js
   Resolved world update logic supporting both car and pickup manual pathing,
   including ping-pong wait behavior for pickups.
*/

import * as THREE from 'three';

export class World {
    constructor() {
        this.colliders = [];
        // ... rest ...
    }

    update(dt) {
        // Iterate through all manually placed objects in colliders
        // Note: this.colliders contains objects created in DevMode that were registered.
        this.colliders.forEach(c => {
            const mesh = c.mesh;
            const isCar = mesh && mesh.userData.type === 'car';
            const isPickup = mesh && mesh.userData.type === 'pickup';

            if ((isCar || isPickup) && mesh.userData.waypoints && mesh.userData.waypoints.length > 0) {
                const anchor = mesh;
                const waypoints = anchor.userData.waypoints;
                const path = [new THREE.Vector3(0, 0, 0), ...waypoints];

                // Initialize State
                if (anchor.userData.targetIndex === undefined) {
                    anchor.userData.targetIndex = 1;
                    anchor.userData.movingForward = true;
                }

                // Handle Waiting state
                if (anchor.userData.waitTimer > 0) {
                    anchor.userData.waitTimer -= dt;
                    if (anchor.userData.waitTimer <= 0) {
                        anchor.userData.waitTimer = 0;
                        if (anchor.userData.loopMode === 'pingpong') {
                            if (anchor.userData.targetIndex === 0) {
                                anchor.userData.movingForward = true;
                                anchor.userData.targetIndex = 1;
                            } else if (anchor.userData.targetIndex === path.length - 1) {
                                anchor.userData.movingForward = false;
                                anchor.userData.targetIndex = path.length - 2;
                            }
                        }
                    } else {
                        return; // Still waiting this frame
                    }
                }

                let targetIdx = anchor.userData.targetIndex;
                const targetPos = path[targetIdx].clone();

                // Move model children relative to anchor
                const modelChildren = anchor.children.filter(ch => ch.name !== 'waypointVisuals' && ch.visible !== false);

                // Example simple movement: immediate snap for demonstration (actual code likely interpolates)
                // Use a small movement step for smoothness, but ensure this logic coexists with prior bicycle code.
                const speed = anchor.userData.speed || 5.0;
                const currentPos = modelChildren.length ? modelChildren[0].position.clone() : new THREE.Vector3(0,0,0);
                const moveVec = targetPos.clone().sub(currentPos);
                const dist = moveVec.length();
                if (dist > 0.001) {
                    // move toward target
                    const step = Math.min(dt * speed, dist);
                    moveVec.normalize().multiplyScalar(step);
                    modelChildren.forEach(child => child.position.add(moveVec));
                    // Rotate to face target
                    const worldTarget = anchor.localToWorld(targetPos.clone());
                    modelChildren.forEach(child => child.lookAt(worldTarget));
                } else {
                    // Snap to target
                    modelChildren.forEach(child => child.position.copy(targetPos));

                    // Update Logic for pingpong vs circular
                    if (anchor.userData.loopMode === 'pingpong') {
                        if (targetIdx === path.length - 1) {
                            // Reached End -> Wait or turn
                            const wait = anchor.userData.waitTime || 0;
                            if (wait > 0) {
                                anchor.userData.waitTimer = wait;
                            } else {
                                anchor.userData.movingForward = false;
                                anchor.userData.targetIndex = Math.max(1, path.length - 2);
                            }
                        } else if (targetIdx === 0) {
                            const wait = anchor.userData.waitTime || 0;
                            if (wait > 0) {
                                anchor.userData.waitTimer = wait;
                            } else {
                                anchor.userData.movingForward = true;
                                anchor.userData.targetIndex = 1;
                            }
                        } else {
                            if (anchor.userData.movingForward) {
                                anchor.userData.targetIndex++;
                            } else {
                                anchor.userData.targetIndex--;
                            }
                        }
                    } else {
                        // Circular default
                        if (targetIdx < path.length - 1) {
                            anchor.userData.targetIndex++;
                        } else {
                            anchor.userData.targetIndex = 0;
                        }
                    }
                }
            }

            // ... existing collider handling for bicycles and other objects should remain ...
        });
    }

    // ... other World methods ...
}
