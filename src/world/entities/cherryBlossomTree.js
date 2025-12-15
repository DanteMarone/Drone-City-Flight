import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

/**
 * Cherry Blossom Tree
 * Similar structure to a deciduous tree but with pink foliage and gently falling petals.
 */
export class CherryBlossomTreeEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'cherryBlossomTree';
        this.petals = [];
        this.time = Math.random() * 100;
    }

    static get displayName() { return 'Cherry Blossom'; }

    createMesh(params) {
        const group = new THREE.Group();

        // 1. Trunk (Darker/Reddish bark)
        const trunkH = 2.2;
        const trunkR = 0.4;
        const trunkGeo = new THREE.CylinderGeometry(trunkR * 0.8, trunkR * 1.1, trunkH, 7);
        const trunkMat = new THREE.MeshStandardMaterial({
            color: 0x3d2817,
            roughness: 0.9
        });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = trunkH / 2;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        group.add(trunk);

        // 2. Canopy (Pink)
        const foliageMat = new THREE.MeshStandardMaterial({
            color: 0xffb7c5, // Sakura Pink
            roughness: 1.0,
            flatShading: true
        });

        // Create main foliage volume
        // We use slightly smaller, more numerous spheres for a "fluffy" look
        const count = 12;
        for (let i = 0; i < count; i++) {
            const r = 0.8 + Math.random() * 0.6;
            const blob = new THREE.Mesh(new THREE.SphereGeometry(r, 6, 6), foliageMat);

            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 1.5;
            const height = trunkH + 0.5 + Math.random() * 1.5;

            blob.position.set(
                Math.cos(angle) * dist,
                height,
                Math.sin(angle) * dist
            );

            blob.castShadow = true;
            blob.receiveShadow = true;
            group.add(blob);
        }

        // 3. Falling Petals (Visuals)
        // We create a few small planes that we will animate in update()
        const petalGeo = new THREE.PlaneGeometry(0.1, 0.1);
        const petalMat = new THREE.MeshBasicMaterial({
            color: 0xffcccc,
            side: THREE.DoubleSide
        });

        const petalCount = 5;
        this.petals = [];

        for (let i = 0; i < petalCount; i++) {
            const petal = new THREE.Mesh(petalGeo, petalMat);
            this.resetPetal(petal, trunkH);
            // Random initial state
            petal.position.y = (Math.random() * 2) + 0.5;
            group.add(petal);
            this.petals.push({ mesh: petal, speed: 0.5 + Math.random() * 0.5, offset: Math.random() * 10 });
        }

        return group;
    }

    resetPetal(petal, trunkH) {
        // Spawn somewhere in the canopy
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 2.0;
        petal.position.set(
            Math.cos(angle) * dist,
            trunkH + 1.5 + Math.random(),
            Math.sin(angle) * dist
        );
        petal.rotation.set(Math.random(), Math.random(), Math.random());
    }

    update(dt) {
        this.time += dt;

        // Animate petals
        // They fall down and spiral slightly
        if (this.petals) {
            for (const p of this.petals) {
                p.mesh.position.y -= p.speed * dt;

                // Spiral motion
                const t = this.time + p.offset;
                p.mesh.position.x += Math.cos(t * 2) * 0.01;
                p.mesh.position.z += Math.sin(t * 2) * 0.01;
                p.mesh.rotation.x += dt;
                p.mesh.rotation.y += dt * 0.5;

                // Reset if hit ground (y <= 0)
                if (p.mesh.position.y <= 0.1) {
                    this.resetPetal(p.mesh, 2.2);
                }
            }
        }
    }
}

EntityRegistry.register('cherryBlossomTree', CherryBlossomTreeEntity);
