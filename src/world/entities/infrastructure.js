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
        const width = params.width || 10;
        const length = params.length || 10;
        this.params.width = width;
        this.params.length = length;

        const mat = new THREE.MeshStandardMaterial({
            map: TextureGenerator.createAsphalt(),
            roughness: 0.9,
            color: 0x555555
        });

        this._applyRoadTiling(mat, width, length);

        const geo = this._buildGeometry(width, length);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.receiveShadow = true;
        return mesh;
    }

    updateDimensions(width, length) {
        if (!this.mesh) return;
        this.params.width = width;
        this.params.length = length;

        const geo = this._buildGeometry(width, length);
        this.mesh.geometry.dispose();
        this.mesh.geometry = geo;
        this._applyRoadTiling(this.mesh.material, width, length);
    }

    _buildGeometry(width, length) {
        const geo = new THREE.PlaneGeometry(width, length);
        geo.rotateX(-Math.PI / 2);
        geo.translate(0, 0.05, 0); // Lift up slightly
        return geo;
    }

    _applyRoadTiling(material, width, length) {
        if (!material || !material.map) return;
        const tileSize = 2; // Repeat every 2 units to avoid stretching artifacts
        material.map.repeat.set(width / tileSize, length / tileSize);
        material.map.wrapS = THREE.RepeatWrapping;
        material.map.wrapT = THREE.RepeatWrapping;
        material.map.needsUpdate = true;
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

EntityRegistry.register('road', RoadEntity);
EntityRegistry.register('river', RiverEntity);
