# Drone Chaser

## Overview
A hostile runner that spots the drone, sprints after it for a short burst, and attempts to strike if the drone gets too close to the ground. The chaser uses simple obstacle-avoidance pathfinding to weave around nearby colliders.

## Visuals
- Composite primitives: box legs and boots, cylindrical torso, spherical head, and box arms.
- Emissive accents: a glowing baton tip and antenna orb for a high-tech hunter silhouette.
- Procedural face texture: canvas-drawn visor, eyes, and warning stripe.

## Key Parameters
- `moveSpeed` (number): Run speed while chasing.
- `aggroRange` (number): Detection range to start the chase.
- `chaseDuration` (number): Seconds to keep chasing after losing line of sight.
- `attackRange` (number): Distance required to strike the drone.
- `attackDamage` (number): Battery drain per hit.
- `attackCooldown` (number): Seconds between attacks.
- `pathProbeDistance` (number): Obstacle probe distance for pathfinding.
- `collisionRadius` (number): Radius used for collision probes.
- `collisionHeight` (number): Height offset for collision probes.

## Dependencies
- Extends `BaseEntity`.
- Uses `EntityRegistry` for registration.
- Relies on `ColliderSystem` checks via `window.app.colliderSystem` for obstacle-aware chasing.
