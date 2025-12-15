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

    _createGeometry(width, length) {
        const geo = new THREE.PlaneGeometry(width, length);
        geo.rotateX(-Math.PI / 2);
        geo.translate(0, 0.05, 0); // Lift up slightly
        return geo;
    }

    _getTextureRepeat(width, length) {
        const tileSize = 5;
        const repeatX = Math.max(1, width / tileSize);
        const repeatY = Math.max(1, length / tileSize);
        return new THREE.Vector2(repeatX, repeatY);
    }

    _applyTextureScaling(map, width, length) {
        if (!map) return;
        const repeat = this._getTextureRepeat(width, length);
        map.repeat.copy(repeat);
        map.needsUpdate = true;
    }

    createMesh(params) {
        const w = params.width || 10;
        const l = params.length || 10;
        this.params.width = w;
        this.params.length = l;

        const map = TextureGenerator.createAsphalt();
        this._applyTextureScaling(map, w, l);

        const mat = new THREE.MeshStandardMaterial({
            map,
            roughness: 0.9,
            color: 0x555555
        });

        // Use BufferGeometry rotation/translation to persist through BaseEntity.init's transform override
        const geo = this._createGeometry(w, l);

        const mesh = new THREE.Mesh(geo, mat);
        mesh.receiveShadow = true;
        return mesh;
    }

    updateDimensions({ width, length }) {
        const w = width ?? this.params.width ?? 10;
        const l = length ?? this.params.length ?? 10;
        this.params.width = w;
        this.params.length = l;

        if (!this.mesh) return;

        const geo = this._createGeometry(w, l);
        this.mesh.geometry.dispose();
        this.mesh.geometry = geo;
        this.mesh.geometry.needsUpdate = true;

        if (this.mesh.material?.map) {
            this._applyTextureScaling(this.mesh.material.map, w, l);
        }

        this.mesh.userData.params = this.params;
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
