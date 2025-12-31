import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class RoadEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'road';
    }

    static get displayName() { return 'Road'; }

    createMesh(params) {
        const w = params.width || 10;
        const l = params.length || 10;
        this.params.width = w;
        this.params.length = l;

        const tex = TextureGenerator.createAsphalt();
        // Reset repeat defaults, we will control it
        tex.repeat.set(1, 1);

        const mat = new THREE.MeshStandardMaterial({
            map: tex,
            roughness: 0.9,
            color: 0xffffff // Use full texture color (dark asphalt)
        });

        // Use PlaneGeometry(w, l) for compatibility with existing logic,
        // but Texture scaling handles visual correctness.
        const geo = new THREE.PlaneGeometry(w, l);
        geo.rotateX(-Math.PI / 2);
        geo.translate(0, 0.05, 0); // Lift up slightly

        const mesh = new THREE.Mesh(geo, mat);
        mesh.receiveShadow = true;

        // Initial sync
        this.updateTexture(mesh);

        return mesh;
    }

    updateTexture(mesh) {
        if (mesh && mesh.material.map) {
            // Calculate total length based on geometry length and mesh scale
            // params.length is the geometry base length (l)
            const totalLength = this.params.length * mesh.scale.z;
            // Texture is designed to repeat approx every 10 meters (or whatever feels right)
            // If texture is 1 unit high, repeat = totalLength
            // If texture is "one dash segment", and we want a dash every 10m?
            mesh.material.map.repeat.y = Math.max(1, totalLength / 10);
        }
    }

    update(dt) {
        if (this.mesh) {
            this.updateTexture(this.mesh);
        }
    }
}

export class RiverEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'river';
    }

    static get displayName() { return 'River'; }

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

export class SidewalkEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'sidewalk';
    }

    static get displayName() { return 'Sidewalk'; }

    createMesh(params) {
        // 1 unit wide, 5 units long
        const w = 1;
        const l = 5;
        const h = 0.2;

        const geo = new THREE.BoxGeometry(w, h, l);
        geo.translate(0, h / 2, 0); // Sit on ground

        const concreteTex = TextureGenerator.createConcrete();
        const sidewalkTex = TextureGenerator.createSidewalk();

        const materials = [
            new THREE.MeshStandardMaterial({ map: concreteTex, color: 0xaaaaaa, roughness: 0.8 }), // px
            new THREE.MeshStandardMaterial({ map: concreteTex, color: 0xaaaaaa, roughness: 0.8 }), // nx
            new THREE.MeshStandardMaterial({ map: sidewalkTex, color: 0xffffff, roughness: 0.8 }), // py (Top)
            new THREE.MeshStandardMaterial({ map: concreteTex, color: 0xaaaaaa, roughness: 0.8 }), // ny (Bottom)
            new THREE.MeshStandardMaterial({ map: concreteTex, color: 0xaaaaaa, roughness: 0.8 }), // pz
            new THREE.MeshStandardMaterial({ map: concreteTex, color: 0xaaaaaa, roughness: 0.8 }), // nz
        ];

        const mesh = new THREE.Mesh(geo, materials);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }
}

export class SidewalkCornerEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'sidewalk_corner';
    }

    static get displayName() { return 'Sidewalk Corner'; }

    createMesh(params) {
        // 1 unit wide, 1 unit long (square)
        const w = 1;
        const l = 1;
        const h = 0.2;

        const geo = new THREE.BoxGeometry(w, h, l);
        geo.translate(0, h / 2, 0); // Sit on ground

        const concreteTex = TextureGenerator.createConcrete();

        // Use plain concrete for all sides, including top
        const mat = new THREE.MeshStandardMaterial({
            map: concreteTex,
            color: 0xaaaaaa,
            roughness: 0.8
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }
}

EntityRegistry.register('road', RoadEntity);
EntityRegistry.register('river', RiverEntity);
EntityRegistry.register('sidewalk', SidewalkEntity);
EntityRegistry.register('sidewalk_corner', SidewalkCornerEntity);
