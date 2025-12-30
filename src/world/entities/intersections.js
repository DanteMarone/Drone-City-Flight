import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class IntersectionEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'intersection';
        // 'road_intersection_4way', 'road_intersection_3way', 'road_intersection_turn'
        // We will default to 4way/cross if not specified, or respect the type passed in.
        this.variant = params.type || 'road_intersection_4way';
    }

    static get displayName() { return 'Intersection'; }

    createMesh(params) {
        const size = 10;

        // Blank asphalt texture (no lines)
        const tex = TextureGenerator.createAsphaltBlank();

        const mat = new THREE.MeshStandardMaterial({
            map: tex,
            roughness: 0.9,
            color: 0xffffff // Use full texture color
        });

        // 10x10 Plane, lifted slightly to match RoadEntity
        const geo = new THREE.PlaneGeometry(size, size);
        geo.rotateX(-Math.PI / 2);
        geo.translate(0, 0.05, 0);

        const mesh = new THREE.Mesh(geo, mat);
        mesh.receiveShadow = true;

        // Save the variant type in userData if needed later
        mesh.userData.variant = this.variant;

        return mesh;
    }
}

// Register specific variants as separate logical entries for the Palette?
// Or register just one class and let the Palette/Registry handle aliases?
// The spec asks for 3 types. The Registry maps string keys to Classes.
// To have 3 different items in the palette, we might need 3 registrations
// or one class that handles its own type.

// We will register the base class as 'intersection'.
// However, the spec says:
// Types: road_intersection_4way, road_intersection_3way, road_intersection_turn
// If I register them all to IntersectionEntity, I need to make sure the entity knows which one it is.
// The `EntityRegistry` usually creates an instance and passes `params` including `type`.

EntityRegistry.register('road_intersection_4way', IntersectionEntity);
EntityRegistry.register('road_intersection_3way', IntersectionEntity);
EntityRegistry.register('road_intersection_turn', IntersectionEntity);
