import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class RoadEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'road';
    }

    createMesh(params) {
        const w = params.width || 10;
        const l = params.length || 10;
        this.params.width = w;
        this.params.length = l;

        const mat = new THREE.MeshStandardMaterial({
            map: TextureGenerator.createAsphalt(),
            roughness: 0.9,
            color: 0x555555
        });

        // Use BufferGeometry rotation/translation to persist through BaseEntity.init's transform override
        const geo = new THREE.PlaneGeometry(w, l);
        geo.rotateX(-Math.PI / 2);
        geo.translate(0, 0.05, 0); // Lift up slightly

        const mesh = new THREE.Mesh(geo, mat);
        mesh.receiveShadow = true;
        return mesh;
    }

    createCollider() {
        return null;
    }
}

export class RiverEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'river';
    }

    createMesh(params) {
        const w = params.width || 50;
        const l = params.length || 50;
        this.params.width = w;
        this.params.length = l;

        const geo = new THREE.PlaneGeometry(w, l);
        geo.rotateX(-Math.PI / 2);
        geo.translate(0, 0.06, 0);

        const mat = new THREE.MeshStandardMaterial({
            color: 0x2244aa,
            roughness: 0.1,
            metalness: 0.8
        });
        const mesh = new THREE.Mesh(geo, mat);
        return mesh;
    }

    createCollider() {
        return null;
    }
}

EntityRegistry.register('road', RoadEntity);
EntityRegistry.register('river', RiverEntity);
