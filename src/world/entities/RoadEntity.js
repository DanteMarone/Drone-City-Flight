import * as THREE from 'three';
import { BaseEntity } from './BaseEntity.js';

export class RoadEntity extends BaseEntity {
    static type = 'road';

    createMesh() {
        const { materials } = this.context.resources;
        const { x = 0, z = 0, width, length } = this.params;
        const w = Number(width) || 10;
        const l = Number(length) || 10;

        this.params = { ...this.params, width: w, length: l };

        const mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(w, l),
            materials.road
        );
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(x, 0.05, z);
        mesh.receiveShadow = true;

        return mesh;
    }

    shouldCreateCollider() {
        return false;
    }
}
