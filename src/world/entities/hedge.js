import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class HedgeEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'hedge';
    }

    static get displayName() { return 'Hedge'; }

    createMesh(params) {
        const w = params.width || 2;
        const h = params.height || 1.5;
        const d = params.depth || 1;

        // Ensure params are updated for serialization if defaults were used
        this.params.width = w;
        this.params.height = h;
        this.params.depth = d;

        const geo = new THREE.BoxGeometry(w, h, d);

        // Use grass texture for leafy look
        const tex = TextureGenerator.createGrass();
        // Scale texture repeat based on size to keep detail consistent
        tex.repeat.set(w * 0.5, h * 0.5);

        const mat = new THREE.MeshStandardMaterial({
            map: tex,
            color: 0x55aa55, // Tint it slightly darker/richer green
            roughness: 1.0,
            metalness: 0.0
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Pivot adjustment: Move geometry up so mesh origin is at bottom center
        geo.translate(0, h/2, 0);

        return mesh;
    }
}

EntityRegistry.register('hedge', HedgeEntity);
