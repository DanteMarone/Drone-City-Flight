import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

/**
 * Oak Tree
 * Sturdy trunk with a large, cloud-like canopy of spheres.
 */
export class OakTreeEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'oakTree';
    }

    static get displayName() { return 'Oak Tree'; }

    createMesh(params) {
        const group = new THREE.Group();

        // 1. Trunk
        const trunkH = 2.5;
        const trunkR = 0.5;
        const trunkGeo = new THREE.CylinderGeometry(trunkR * 0.9, trunkR * 1.2, trunkH, 8);
        const trunkMat = new THREE.MeshStandardMaterial({
            color: 0x5c4033, // Dark brown
            roughness: 0.9
        });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = trunkH / 2;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        group.add(trunk);

        // 2. Canopy (Cluster of Spheres)
        const foliageMat = new THREE.MeshStandardMaterial({
            color: 0x2d5a27, // Forest Green
            roughness: 0.9,
            flatShading: false
        });

        // Main central foliage
        const mainCanopy = new THREE.Mesh(new THREE.SphereGeometry(2.0, 8, 8), foliageMat);
        mainCanopy.position.y = trunkH + 1.0;
        mainCanopy.castShadow = true;
        mainCanopy.receiveShadow = true;
        group.add(mainCanopy);

        // Random additional blobs to make it irregular
        // Use a seeded randomness based on params or random if fresh
        // We'll just use random for now (simple)
        // ATLAS OPTIMIZATION: Use fixed seed-like behavior for template consistency
        // if instancing is enabled, or fallback to random.
        // Actually, for Instancing to work, we need a standard geometry.
        // We will generate a fixed set of blobs.
        const count = 6;
        const blobGeo = new THREE.SphereGeometry(1, 7, 7); // Reuse base geometry

        for (let i = 0; i < count; i++) {
            // Pseudo-random but deterministic loop
            const r = 1.0 + (i % 3) * 0.3;
            const blob = new THREE.Mesh(blobGeo, foliageMat);
            blob.scale.set(r, r, r); // Scale instead of new geometry

            // Spread around
            const angle = (i / count) * Math.PI * 2;
            // ATLAS: Deterministic placement for instancing alignment
            const dist = 0.8 + (i % 2) * 0.6; // Alternating distance
            const heightOffset = ((i % 3) - 1) * 0.5; // -0.5, 0, 0.5

            blob.position.set(
                Math.cos(angle) * dist,
                trunkH + 1.0 + heightOffset,
                Math.sin(angle) * dist
            );

            blob.castShadow = true;
            blob.receiveShadow = true;
            group.add(blob);
        }

        // Randomize overall scale slightly
        const s = 0.9 + Math.random() * 0.3;
        group.scale.set(s, s, s);

        return group;
    }

}

EntityRegistry.register('oakTree', OakTreeEntity);
