import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class BirdEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'bird';
        // Override position Y default
        if (params.y === undefined) this.position.y = 5;
    }

    createMesh(params) {
        const group = new THREE.Group();
        group.userData.startPos = this.position.clone();

        // Body: Cone
        const bodyGeo = new THREE.ConeGeometry(0.2, 0.8, 8);
        bodyGeo.rotateX(Math.PI / 2); // Point forward (Z)
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3366cc, roughness: 0.6 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.castShadow = true;
        group.add(body);

        // Wings: Two thin boxes
        const wingGeo = new THREE.BoxGeometry(1.2, 0.05, 0.4);
        const wingMat = new THREE.MeshStandardMaterial({ color: 0x2255bb, roughness: 0.7 });
        const wings = new THREE.Mesh(wingGeo, wingMat);
        wings.position.y = 0.1;
        wings.castShadow = true;
        group.add(wings);

        group.userData.wings = wings;
        return group;
    }

    // Note: Bird logic (flying) is handled by BirdSystem, not here.
    // This entity just provides the mesh.
}

EntityRegistry.register('bird', BirdEntity);
