import * as THREE from 'three';
import { CreatureEntity } from './BuildingEntity.js';

export class BirdEntity extends CreatureEntity {
    static type = 'bird';

    createMesh() {
        const { x = 0, z = 0 } = this.params;
        const group = new THREE.Group();
        group.position.set(x, 5, z);
        group.userData.startPos = new THREE.Vector3(x, 5, z);

        const bodyGeo = new THREE.ConeGeometry(0.2, 0.8, 8);
        bodyGeo.rotateX(Math.PI / 2);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3366cc, roughness: 0.6 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.castShadow = true;
        group.add(body);

        const wingGeo = new THREE.BoxGeometry(1.2, 0.05, 0.4);
        const wingMat = new THREE.MeshStandardMaterial({ color: 0x2255bb, roughness: 0.7 });
        const wings = new THREE.Mesh(wingGeo, wingMat);
        wings.position.y = 0.1;
        wings.castShadow = true;
        group.add(wings);

        group.userData.wings = wings;
        return group;
    }

    static fromSerialized(context, data) {
        const instance = super.fromSerialized(context, data);
        if (instance?.mesh) {
            instance.mesh.userData.startPos = instance.mesh.position.clone();
        }
        return instance;
    }
}
