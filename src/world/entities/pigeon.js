import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class PigeonEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'pigeon';
        if (params.y === undefined) this.position.y = 4.5;
    }

    static get displayName() { return 'Pigeon'; }

    createMesh(params) {
        const group = new THREE.Group();
        group.userData.startPos = this.position.clone();
        group.userData.birdType = 'pigeon';

        // Body
        const bodyGeo = new THREE.CapsuleGeometry(0.15, 0.4, 6, 12);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x9d9d9d, roughness: 0.7 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.rotation.x = Math.PI / 2;
        body.castShadow = true;
        group.add(body);

        // Wings
        const wingGeo = new THREE.BoxGeometry(0.9, 0.05, 0.3);
        const wingMat = new THREE.MeshStandardMaterial({ color: 0x7f7f7f, roughness: 0.8 });
        const wings = new THREE.Mesh(wingGeo, wingMat);
        wings.position.y = 0.08;
        wings.castShadow = true;
        group.add(wings);

        // Head
        const headGeo = new THREE.SphereGeometry(0.12, 10, 10);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xb3b3b3, roughness: 0.7 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(0, 0.12, 0.28);
        head.castShadow = true;
        group.add(head);

        // Beak
        const beakGeo = new THREE.ConeGeometry(0.05, 0.12, 6);
        const beakMat = new THREE.MeshStandardMaterial({ color: 0xffc857, roughness: 0.6 });
        const beak = new THREE.Mesh(beakGeo, beakMat);
        beak.rotation.x = Math.PI / 2;
        beak.position.set(0, 0.1, 0.4);
        group.add(beak);

        group.userData.wings = wings;
        return group;
    }
}

EntityRegistry.register('pigeon', PigeonEntity);
