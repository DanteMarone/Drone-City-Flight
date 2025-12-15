import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

/**
 * Procedural Pine Tree
 * Made of a trunk cylinder and stacked cones for foliage.
 */
export class PineTreeEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'pineTree';
    }

    static get displayName() { return 'Pine Tree'; }

    createMesh(params) {
        const group = new THREE.Group();

        // 1. Trunk
        // Taller and thinner than the orange tree
        const trunkH = 2.0;
        const trunkR = 0.25;
        const trunkGeo = new THREE.CylinderGeometry(trunkR * 0.8, trunkR, trunkH, 8);
        const trunkMat = new THREE.MeshStandardMaterial({
            color: 0x4a3c31,
            roughness: 0.9
        });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = trunkH / 2;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        group.add(trunk);

        // 2. Foliage (Stacked Cones)
        // We'll stack 3 cones.
        const foliageMat = new THREE.MeshStandardMaterial({
            color: 0x1a4a1a,
            roughness: 0.8,
            flatShading: true // Low-poly look
        });

        const tiers = 3;
        const startY = trunkH * 0.6; // Foliage starts slightly down the trunk
        let currentY = startY;
        let currentR = 1.5;
        let currentH = 2.0;

        for (let i = 0; i < tiers; i++) {
            const coneGeo = new THREE.ConeGeometry(currentR, currentH, 8);
            const cone = new THREE.Mesh(coneGeo, foliageMat);

            cone.position.y = currentY + (currentH / 2);
            cone.castShadow = true;
            cone.receiveShadow = true;
            group.add(cone);

            // Move up for next tier
            currentY += currentH * 0.6; // Overlap
            currentR *= 0.7; // Get narrower
            currentH *= 0.8; // Get shorter
        }

        // 3. Random Variation
        // Randomize overall scale slightly
        const scale = 0.9 + Math.random() * 0.4; // 0.9 to 1.3
        group.scale.set(scale, scale, scale);

        return group;
    }

    /**
     * Define collision volume.
     * We explicitly define a box around the trunk to allow passing under the branches.
     */
    createCollider() {
        const trunkH = 2.0;
        const trunkR = 0.25;
        const scale = this.mesh.scale.y; // Assuming uniform scale from createMesh

        // Box centered at origin (relative to entity position)
        // Trunk starts at y=0 to y=2.0 (scaled)

        const width = trunkR * 2 * scale;
        const height = trunkH * scale;

        // Center of the trunk is at y = height/2 relative to the base
        const min = new THREE.Vector3(-width/2, 0, -width/2);
        const max = new THREE.Vector3(width/2, height, width/2);

        return new THREE.Box3(min, max);
    }
}

EntityRegistry.register('pineTree', PineTreeEntity);
