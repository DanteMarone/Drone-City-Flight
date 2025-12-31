import * as THREE from 'three';
import { BaseEntity } from './base.js';

export class GroupEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'group';
    }

    createMesh(params) {
        const group = new THREE.Group();
        group.userData.type = 'group';
        return group;
    }

    postInit() {
        // Group logic handled by DevMode
        // When loaded from map, DevMode (or loader) will attach children
    }
}
