import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

/**
 * Cypress Tree
 * Tall, narrow conifer with layered cones and softly glowing seed pods.
 */
export class CypressTreeEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'cypressTree';
        this.time = Math.random() * 100;
        this.glowPods = [];
    }

    static get displayName() { return 'Cypress Tree'; }

    createMesh() {
        const group = new THREE.Group();

        const trunkH = 2.8 + Math.random() * 0.6;
        const trunkR = 0.25 + Math.random() * 0.05;
        const trunkGeo = new THREE.CylinderGeometry(trunkR * 0.8, trunkR * 1.3, trunkH, 7);
        const trunkMat = new THREE.MeshStandardMaterial({
            color: 0x4b3621,
            roughness: 0.95
        });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = trunkH / 2;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        group.add(trunk);

        const foliageMat = new THREE.MeshStandardMaterial({
            color: 0x1f4d2b,
            roughness: 0.9,
            flatShading: true
        });

        const coneCount = 3;
        const baseRadius = 1.2 + Math.random() * 0.2;
        const coneHeight = 1.4 + Math.random() * 0.3;

        for (let i = 0; i < coneCount; i++) {
            const scale = 1 - i * 0.25;
            const coneGeo = new THREE.ConeGeometry(baseRadius * scale, coneHeight, 7);
            const cone = new THREE.Mesh(coneGeo, foliageMat);
            cone.position.y = trunkH - 0.2 + i * (coneHeight * 0.55);
            cone.castShadow = true;
            cone.receiveShadow = true;
            group.add(cone);
        }

        const podMat = new THREE.MeshStandardMaterial({
            color: 0xffc86b,
            emissive: 0xffb347,
            emissiveIntensity: 0.8,
            roughness: 0.6
        });
        const podGeo = new THREE.SphereGeometry(0.1, 8, 8);
        const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.25, 6);
        const stemMat = new THREE.MeshStandardMaterial({
            color: 0x6b4f2a,
            roughness: 0.9
        });

        const podCount = 6;
        this.glowPods = [];

        for (let i = 0; i < podCount; i++) {
            const angle = (i / podCount) * Math.PI * 2;
            const radius = 0.55 + Math.random() * 0.2;
            const yOffset = trunkH + 0.6 + Math.random() * 0.8;

            const stem = new THREE.Mesh(stemGeo, stemMat);
            stem.position.set(Math.cos(angle) * radius, yOffset, Math.sin(angle) * radius);
            stem.rotation.z = Math.cos(angle) * 0.4;
            stem.rotation.x = Math.sin(angle) * 0.4;
            stem.castShadow = true;
            stem.receiveShadow = true;
            group.add(stem);

            const pod = new THREE.Mesh(podGeo, podMat.clone());
            pod.position.set(
                Math.cos(angle) * radius,
                yOffset - 0.18,
                Math.sin(angle) * radius
            );
            pod.castShadow = true;
            pod.receiveShadow = true;
            group.add(pod);

            this.glowPods.push({
                mesh: pod,
                baseY: pod.position.y,
                phase: Math.random() * Math.PI * 2
            });
        }

        return group;
    }

    update(dt) {
        this.time += dt;

        for (const pod of this.glowPods) {
            const pulse = 0.6 + Math.sin(this.time * 2 + pod.phase) * 0.4;
            pod.mesh.material.emissiveIntensity = pulse;
            pod.mesh.position.y = pod.baseY + Math.sin(this.time * 1.5 + pod.phase) * 0.05;
        }
    }
}

EntityRegistry.register('cypressTree', CypressTreeEntity);
