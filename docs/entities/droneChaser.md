# Drone Chaser

## Overview
A hostile ground-level NPC that sprints toward nearby drones, swinging a glowing baton and draining battery power on contact. The chaser respects obstacles and gives up after a short pursuit, returning to its home spot.

## Visuals
- Composite humanoid built from cylinders, boxes, and spheres (hooded torso, backpack, legs, and arms).
- Visor face texture generated on a CanvasTexture for a distinct “hunter” look.
- Emissive baton for a subtle glow accent.

## Key Parameters
- `detectionRange`: Distance at which the chaser begins pursuit.
- `chaseDuration`: Maximum time the chaser will pursue before returning.
- `maxChaseDistance`: Maximum distance from home before the chaser disengages.
- `speed` / `returnSpeed`: Movement speed while chasing and returning.
- `attackRange`: Distance required to strike the drone.
- `attackDamage`: Battery drain applied per hit.
- `attackCooldown`: Time between strikes.
- `collisionRadius`: Sphere radius used for obstacle avoidance.

## Behavior
- Uses local obstacle checks to steer around objects when chasing or returning.
- Plays a run-cycle animation by swinging arms and legs.
- Attacks the drone at close range, reducing battery and spawning impact particles.

## Dependencies
- Extends `BaseEntity`.
- Uses `EntityRegistry` for palette registration.
- Relies on `ColliderSystem` for obstacle avoidance.
