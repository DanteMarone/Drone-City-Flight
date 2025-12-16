import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

/**
 * Palm Tree
 * Tall, thin trunk with large radiating fronds at the top.
 */
export class PalmTreeEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'palmTree';
        this.time = Math.random() * 100;
        this.frondGroup = null;
    }

    static get displayName() { return 'Palm Tree'; }

    createMesh(params) {
        const group = new THREE.Group();

        // 1. Trunk
        // Tall and curved/leaning slightly
        // We simulate curve by rotating the whole mesh or just making a straight cylinder
        // A straight but thin cylinder is fine for MVP + slight lean
        const trunkH = 4.5;
        const trunkR = 0.25;

        // Use a segmented trunk for a bit of texture
        const trunkGeo = new THREE.CylinderGeometry(trunkR * 0.7, trunkR, trunkH, 7, 4);
        const trunkMat = new THREE.MeshStandardMaterial({
            color: 0x8b7d6b, // Sandy brown
            roughness: 0.9,
            flatShading: true
        });

        // Perturb vertices to make it look organic/rough?
        // Too expensive for MVP.

        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = trunkH / 2;
        trunk.castShadow = true;
        trunk.receiveShadow = true;

        // Slight natural lean
        const leanX = (Math.random() - 0.5) * 0.2;
        const leanZ = (Math.random() - 0.5) * 0.2;
        trunk.rotation.set(leanX, 0, leanZ);

        group.add(trunk);

        // 2. Fronds (The Crown)
        this.frondGroup = new THREE.Group();
        // Position at top of trunk (accounting for lean roughly)
        // We'll just put it at local y = trunkH and let hierarchy handle it if we parented to trunk
        // But here we parent to group, so we need to match trunk tip.
        // Actually, easier to add frondGroup TO the trunk.

        trunk.add(this.frondGroup);
        this.frondGroup.position.y = trunkH / 2; // Relative to trunk center

        const frondMat = new THREE.MeshStandardMaterial({
            color: 0x4a7023,
            roughness: 0.8,
            side: THREE.DoubleSide
        });

        const frondCount = 7;
        for (let i = 0; i < frondCount; i++) {
            // A frond is a long, thin plane/box arched out
            // We use a Group for the pivot point
            const frondPivot = new THREE.Group();

            // The frond mesh
            // Scale x = width, y = length (z is thickness)
            const fGeo = new THREE.PlaneGeometry(0.6, 2.5, 2, 4);
            // Bend the frond:
            // We can't easily bend PlaneGeometry without vertex manipulation.
            // But we can rotate it down.
            const frondMesh = new THREE.Mesh(fGeo, frondMat);

            // Offset so pivot is at the base
            frondMesh.position.y = 1.25; // Half length

            // Rotate the mesh to arch out
            frondMesh.rotation.x = -Math.PI / 4; // 45 degrees out

            frondPivot.add(frondMesh);

            // Rotate pivot around Y axis
            frondPivot.rotation.y = (i / frondCount) * Math.PI * 2;

            // Add a little randomness to the arch
            frondPivot.rotation.x = (Math.random() * 0.2);

            frondMesh.castShadow = true;
            frondMesh.receiveShadow = true;

            this.frondGroup.add(frondPivot);
        }

        return group;
    }

    update(dt) {
        this.time += dt;

        // Sway the frond group gently
        if (this.frondGroup) {
            // Wind sway
            const swayX = Math.sin(this.time * 1.5) * 0.05;
            const swayZ = Math.cos(this.time * 1.2) * 0.05;

            this.frondGroup.rotation.x = swayX;
            this.frondGroup.rotation.z = swayZ;
        }
    }
}

EntityRegistry.register('palmTree', PalmTreeEntity);
