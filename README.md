# Drone City Flight

A 3D drone flight simulation game built with Three.js.

## Developer Documentation

### [Developer Tools Architecture](./docs/dev_tools.md)
A comprehensive guide to the in-game level editor, including selection, history, and object creation workflows.

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
