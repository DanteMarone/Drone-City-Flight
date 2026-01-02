import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

/**
 * Maple Tree
 * Warm autumn canopy with gentle sway and drifting leaf orbiters.
 */
export class MapleTreeEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'mapleTree';
        this.time = Math.random() * 100;
        this.canopyGroup = null;
        this.leafOrbiters = [];
    }

    static get displayName() { return 'Maple Tree'; }

    createMesh(params) {
        const group = new THREE.Group();

        // Trunk
        const trunkHeight = 3.2;
        const trunkTop = 0.35;
        const trunkBottom = 0.6;
        const trunkGeo = new THREE.CylinderGeometry(trunkTop, trunkBottom, trunkHeight, 8);
        const trunkMat = new THREE.MeshStandardMaterial({
            color: 0x6a4b3a,
            roughness: 0.9
        });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = trunkHeight / 2;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        group.add(trunk);

        // Roots
        const rootGeo = new THREE.CylinderGeometry(0.08, 0.22, 0.6, 6);
        for (let i = 0; i < 4; i++) {
            const root = new THREE.Mesh(rootGeo, trunkMat);
            const angle = (i / 4) * Math.PI * 2;
            root.position.set(Math.cos(angle) * 0.5, 0.25, Math.sin(angle) * 0.5);
            root.rotation.z = Math.PI / 2.6;
            root.rotation.y = angle;
            root.castShadow = true;
            root.receiveShadow = true;
            group.add(root);
        }

        // Branches
        const branchGeo = new THREE.CylinderGeometry(0.08, 0.18, 1.3, 6);
        for (let i = 0; i < 3; i++) {
            const branch = new THREE.Mesh(branchGeo, trunkMat);
            branch.position.y = trunkHeight * (0.6 + i * 0.08);
            branch.rotation.z = (i - 1) * 0.5;
            branch.rotation.y = i * 1.5;
            branch.castShadow = true;
            branch.receiveShadow = true;
            group.add(branch);
        }

        // Canopy
        this.canopyGroup = new THREE.Group();
        this.canopyGroup.position.y = trunkHeight * 0.85;
        group.add(this.canopyGroup);

        const leafColors = [
            0xd96c2a,
            0xf0a340,
            0xc84e2f,
            0xe7b45a,
            0xd67b3d
        ];
        const leafGeo = new THREE.SphereGeometry(1.0, 8, 8);

        for (let i = 0; i < 7; i++) {
            const color = leafColors[i % leafColors.length];
            const leafMat = new THREE.MeshStandardMaterial({
                color,
                roughness: 0.85,
                flatShading: true
            });
            const cluster = new THREE.Mesh(leafGeo, leafMat);
            const radius = 1.4 + (i % 3) * 0.25;
            const angle = (i / 7) * Math.PI * 2;
            const height = 1.2 + (i % 2) * 0.4;

            cluster.position.set(
                Math.cos(angle) * radius * 0.6,
                height,
                Math.sin(angle) * radius * 0.6
            );
            const scale = 0.85 + (i % 3) * 0.2;
            cluster.scale.set(scale, scale, scale);
            cluster.castShadow = true;
            cluster.receiveShadow = true;
            this.canopyGroup.add(cluster);
        }

        // Orbiting leaves
        const orbiterGeo = new THREE.IcosahedronGeometry(0.08, 0);
        for (let i = 0; i < 6; i++) {
            const leafMat = new THREE.MeshStandardMaterial({
                color: leafColors[(i + 2) % leafColors.length],
                roughness: 0.6,
                emissive: 0x2a1b0d,
                emissiveIntensity: 0.2
            });
            const leaf = new THREE.Mesh(orbiterGeo, leafMat);
            const angle = (i / 6) * Math.PI * 2;
            const radius = 1.4 + (i % 2) * 0.25;
            leaf.position.set(Math.cos(angle) * radius, 1.4 + (i % 3) * 0.2, Math.sin(angle) * radius);
            leaf.castShadow = true;
            leaf.receiveShadow = true;
            this.canopyGroup.add(leaf);
            this.leafOrbiters.push({
                mesh: leaf,
                angle,
                radius,
                height: leaf.position.y,
                speed: 0.6 + i * 0.08
            });
        }

        const overallScale = 0.95 + Math.random() * 0.2;
        group.scale.set(overallScale, overallScale, overallScale);

        return group;
    }

    update(dt) {
        this.time += dt;
        if (!this.canopyGroup) return;

        const sway = Math.sin(this.time * 0.6) * 0.04;
        this.canopyGroup.rotation.z = sway;
        this.canopyGroup.rotation.x = sway * 0.6;

        for (const orbiter of this.leafOrbiters) {
            orbiter.angle += dt * orbiter.speed * 0.4;
            orbiter.mesh.position.x = Math.cos(orbiter.angle) * orbiter.radius;
            orbiter.mesh.position.z = Math.sin(orbiter.angle) * orbiter.radius;
            orbiter.mesh.position.y = orbiter.height + Math.sin(this.time * 1.2 + orbiter.angle) * 0.1;
            orbiter.mesh.rotation.y += dt * 0.8;
            orbiter.mesh.rotation.x += dt * 0.4;
        }
    }
}

EntityRegistry.register('mapleTree', MapleTreeEntity);
