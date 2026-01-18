# Drone City Flight

A 3D drone flight simulation game built with Three.js.

## Developer Documentation

### Core Systems
*   **[Drone System Architecture](./docs/drone_system.md)**: Details on the physics, controls, and battery logic for the player character.
*   **[Entity System](./docs/entity_system.md)**: Guide to creating and managing world objects.
*   **[Physics & Collisions](./docs/physics.md)**: Overview of the custom kinematic physics engine and SpatialHash optimization.
*   **[Developer Tools](./docs/dev_tools.md)**: Guide to the in-game level editor and UI architecture.

### Specialized Gameplay Systems
*   **[Bird AI System](./docs/bird_system.md)**: Behavior trees for bird NPCs.
*   **[NPC System](./docs/npc_system.md)**: Logic for active agents like angry residents.
*   **[Vehicle System](./docs/vehicle_system.md)**: Cars, buses, and waypoint-based traffic logic.
*   **[Infrastructure](./docs/infrastructure.md)**: Procedural roads and rivers.
*   **[Time Cycle](./docs/time_cycle.md)**: Day/Night cycle implementation.

### Adding New Object Types

The project uses an Entity-Component-like system for world objects. To add a new object type:

1.  **Create Entity Class**: Create a new class in `src/world/entities/` extending `BaseEntity`.
    *   Implement `createMesh(params)`: Return the THREE.Object3D for the entity.
    *   (Optional) Implement `createCollider()`: Return a custom `THREE.Box3` if the default bounding box is insufficient.
    *   (Optional) Implement `update(dt)`: For dynamic objects.

    ```javascript
    // src/world/entities/myObject.js
    import { BaseEntity, EntityRegistry } from './index.js';
    import * as THREE from 'three';

    export class MyObjectEntity extends BaseEntity {
        constructor(params) {
            super(params);
            this.type = 'myObject';
        }

        createMesh(params) {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
            return mesh;
        }
    }

    EntityRegistry.register('myObject', MyObjectEntity);
    ```

2.  **Register**: Ensure your file is imported in `src/world/entities/index.js` (or imported somewhere that runs) so `EntityRegistry.register` is called.

3.  **Use**: The new type is now available via `ObjectFactory` or `EntityRegistry.create('myObject', params)`. It will automatically support serialization and Dev Mode placement if added to the UI palette.
