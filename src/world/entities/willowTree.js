import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

/**
 * Willow Tree
 * Short thick trunk with a cascading canopy of hanging "vines".
 */
export class WillowTreeEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'willowTree';
        this.time = Math.random() * 100;
        this.vines = []; // Store references to sway them
    }

    static get displayName() { return 'Willow Tree'; }

    createMesh(params) {
        const group = new THREE.Group();

        // 1. Trunk
        // Short, thick, gnarly
        const trunkH = 1.5;
        const trunkR = 0.6;
        const trunkGeo = new THREE.CylinderGeometry(trunkR, trunkR * 1.3, trunkH, 8);
        const trunkMat = new THREE.MeshStandardMaterial({
            color: 0x3b2e25, // Deep brown
            roughness: 1.0
        });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = trunkH / 2;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        group.add(trunk);

        // 2. Canopy Base (Hidden/Structural)
        // A sphere at the top to hold the vines
        const canopyCenter = new THREE.Group();
        canopyCenter.position.y = trunkH;
        group.add(canopyCenter);

        // 3. Vines (Drooping branches)
        const vineMat = new THREE.MeshStandardMaterial({
            color: 0x556b2f, // Olive Green
            roughness: 0.9,
            side: THREE.DoubleSide
        });

        // We create many thin cylinders hanging down
        const vineCount = 30;
        this.vines = [];

        for (let i = 0; i < vineCount; i++) {
            const vineLen = 1.5 + Math.random() * 1.5;
            const vineGeo = new THREE.CylinderGeometry(0.05, 0.02, vineLen, 4);

            // Translate geometry so origin is at the top
            vineGeo.translate(0, -vineLen / 2, 0);

            const vine = new THREE.Mesh(vineGeo, vineMat);

            // Position in a circle/dome
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.5 + Math.random() * 1.5; // Spread out

            // Start higher up for outer ones to form a dome shape
            const yOffset = Math.random() * 0.5;

            vine.position.set(
                Math.cos(angle) * radius,
                yOffset,
                Math.sin(angle) * radius
            );

            // Initial slight rotation outward
            vine.rotation.z = (Math.random() - 0.5) * 0.2;
            vine.rotation.x = (Math.random() - 0.5) * 0.2;

            vine.castShadow = true;
            vine.receiveShadow = true;

            canopyCenter.add(vine);

            // Store for animation: { mesh, phase, speed }
            this.vines.push({
                mesh: vine,
                phase: Math.random() * Math.PI * 2,
                speed: 1.0 + Math.random()
            });
        }

        // Add a central foliage blob to hide the trunk top
        const topGeo = new THREE.SphereGeometry(1.2, 7, 6);
        const topMesh = new THREE.Mesh(topGeo, vineMat);
        canopyCenter.add(topMesh);

        return group;
    }

    createCollider() {
        const trunkH = 1.5;
        const trunkR = 0.6;
        const scale = this.mesh.scale.y || 1;
        const w = trunkR * 2 * scale;
        const h = trunkH * scale;

        const min = new THREE.Vector3(-w/2, 0, -w/2);
        const max = new THREE.Vector3(w/2, h, w/2);
        return new THREE.Box3(min, max);
    }

    update(dt) {
        this.time += dt;

        // Animate vines
        for (const v of this.vines) {
            // Sway rotation
            const sway = Math.sin(this.time * v.speed + v.phase) * 0.1;
            // Apply to X and Z rotation
            v.mesh.rotation.x = sway;
            v.mesh.rotation.z = sway * 0.5; // Asynchronous sway
        }
    }
}

EntityRegistry.register('willowTree', WillowTreeEntity);
