# World and Physics Architecture

## Overview
The `World` class (`src/world/world.js`) serves as the central manager for the game environment. It is responsible for:
1.  **Scene Graph Management**: Adding/removing meshes to the `THREE.Scene`.
2.  **Entity Lifecycle**: Tracking active entities (`colliders`, `updatables`) and updating them.
3.  **Physics Integration**: Managing the `ColliderSystem` and ensuring all entities are registered for collision.

## Entity Spawning Flow
To ensure all systems (Visuals, Logic, Physics) remain in sync, entities should not be manually added to the scene or lists. Instead, use the `World` API:

- **`world.spawnEntity(entity)`**: Adds the entity to the scene, registers it for updates, and adds it to the physics spatial hash.
- **`world.despawnEntity(entity)`**: Removes the entity from the scene, stops updates, and removes it from the physics spatial hash.

## Collider System Ownership
The `ColliderSystem` is owned by `World`. The `App` class accesses it via `world.colliderSystem` only to initialize the `PhysicsEngine`. This ensures that `World` remains the single source of truth for what exists physically in the environment.
