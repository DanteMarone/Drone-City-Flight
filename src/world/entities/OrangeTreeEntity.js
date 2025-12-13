import * as THREE from 'three';
import { BuildingEntity } from './BuildingEntity.js';

export class OrangeTreeEntity extends BuildingEntity {
    static type = 'orangeTree';

    createMesh() {
        const { textureLoader } = this.context.resources;
        const { x = 0, z = 0 } = this.params;

        const group = new THREE.Group();
        group.position.set(x, 0, z);

        const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 2, 8);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 1;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        group.add(trunk);

        const sphereGeo = new THREE.SphereGeometry(1.5, 16, 16);
        const tex = textureLoader.load('/textures/orange_tree.png');
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(4, 2);

        const leavesMat = new THREE.MeshStandardMaterial({
            map: tex,
            roughness: 0.8,
            color: 0xffffff
        });

        const leaves = new THREE.Mesh(sphereGeo, leavesMat);
        leaves.position.y = 2.5;
        leaves.castShadow = true;
        leaves.receiveShadow = true;
        group.add(leaves);

        this.mesh = group;
        return group;
    }
}
