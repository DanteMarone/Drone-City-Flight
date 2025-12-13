import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class BushEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'bush';
    }

    createMesh(params) {
        const group = new THREE.Group();

        let bushMat;
        // Basic material fallback since we don't want async loader here blocking return
        // Ideally we use a cached texture loader or the one passed in context if available.
        // For now, simple material.
        bushMat = new THREE.MeshStandardMaterial({ color: 0x228822, roughness: 1.0 });

        // If we want texture, we need access to a loader.
        // TextureGenerator helps, but "bush.png" is an asset.
        // We can create a static loader helper or just use color.

        const count = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
            const r = 0.3 + Math.random() * 0.4;
            const geo = new THREE.SphereGeometry(r, 8, 8);
            const mesh = new THREE.Mesh(geo, bushMat);

            const ox = (Math.random() - 0.5) * 1.2;
            const oz = (Math.random() - 0.5) * 1.2;
            const oy = r * 0.8 + Math.random() * 0.5;
            mesh.position.set(ox, oy, oz);

            const s = 0.7 + Math.random() * 0.6;
            mesh.scale.set(s, s, s);

            mesh.castShadow = true;
            mesh.receiveShadow = true;
            group.add(mesh);
        }
        return group;
    }

    createCollider() {
        return null; // Bushes have no collision
    }
}

export class OrangeTreeEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'orangeTree';
    }

    createMesh(params) {
        const group = new THREE.Group();

        // Trunk
        const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 2, 8);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 1;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        group.add(trunk);

        // Leaves
        const sphereGeo = new THREE.SphereGeometry(1.5, 16, 16);
        const leavesMat = new THREE.MeshStandardMaterial({
            color: 0x22aa22, // Fallback color
            roughness: 0.8
        });

        // Try to apply texture if available globally or lazily?
        // We skip texture loading for simplicity unless we pass a loader.
        // But original code loaded 'orange_tree.png'.

        const leaves = new THREE.Mesh(sphereGeo, leavesMat);
        leaves.position.y = 2.5;
        leaves.castShadow = true;
        leaves.receiveShadow = true;
        group.add(leaves);

        return group;
    }
}

EntityRegistry.register('bush', BushEntity);
EntityRegistry.register('orangeTree', OrangeTreeEntity);
