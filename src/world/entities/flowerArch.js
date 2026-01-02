import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

/**
 * Flowering garden arch with animated blossoms for park pathways.
 */
export class FlowerArchEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'flowerArch';
        this.time = Math.random() * Math.PI * 2;
        this.blossoms = [];
    }

    static get displayName() { return 'Flower Arch'; }

    createMesh() {
        const group = new THREE.Group();

        const baseWidth = 2.6;
        const baseDepth = 1.1;
        const baseHeight = 0.18;
        const postHeight = 2.2;
        const postRadius = 0.12;
        const archRadius = 1.15;

        const stoneMat = new THREE.MeshStandardMaterial({
            color: 0xb8b2a7,
            roughness: 0.9,
            metalness: 0.0
        });
        const vineMat = new THREE.MeshStandardMaterial({
            color: 0x2f7d4f,
            roughness: 0.85
        });
        const leafMat = new THREE.MeshStandardMaterial({
            color: 0x3e9b5d,
            roughness: 0.8
        });

        const base = new THREE.Mesh(
            new THREE.BoxGeometry(baseWidth, baseHeight, baseDepth),
            stoneMat
        );
        base.position.y = baseHeight / 2;
        base.receiveShadow = true;
        group.add(base);

        const postGeo = new THREE.CylinderGeometry(postRadius, postRadius * 1.1, postHeight, 12);
        const leftPost = new THREE.Mesh(postGeo, stoneMat);
        leftPost.position.set(-archRadius, baseHeight + postHeight / 2, 0);
        leftPost.castShadow = true;
        leftPost.receiveShadow = true;
        group.add(leftPost);

        const rightPost = new THREE.Mesh(postGeo, stoneMat);
        rightPost.position.set(archRadius, baseHeight + postHeight / 2, 0);
        rightPost.castShadow = true;
        rightPost.receiveShadow = true;
        group.add(rightPost);

        const arch = new THREE.Mesh(
            new THREE.TorusGeometry(archRadius, postRadius * 0.9, 10, 32, Math.PI),
            stoneMat
        );
        arch.rotation.z = Math.PI;
        arch.position.y = baseHeight + postHeight + archRadius * 0.12;
        arch.castShadow = true;
        arch.receiveShadow = true;
        group.add(arch);

        const archCap = new THREE.Mesh(
            new THREE.CylinderGeometry(postRadius * 1.1, postRadius * 1.1, postRadius * 2.2, 10),
            stoneMat
        );
        archCap.rotation.z = Math.PI / 2;
        archCap.position.y = baseHeight + postHeight + archRadius * 0.12;
        archCap.castShadow = true;
        archCap.receiveShadow = true;
        group.add(archCap);

        const vineLeft = this.createVine(
            [
                new THREE.Vector3(-archRadius + 0.12, baseHeight + 0.2, 0.15),
                new THREE.Vector3(-archRadius + 0.05, baseHeight + 1.0, -0.1),
                new THREE.Vector3(-archRadius + 0.08, baseHeight + 1.8, 0.12),
                new THREE.Vector3(0, baseHeight + postHeight + archRadius * 0.3, 0.18)
            ],
            vineMat,
            leafMat
        );
        group.add(vineLeft.group);

        const vineRight = this.createVine(
            [
                new THREE.Vector3(archRadius - 0.12, baseHeight + 0.3, -0.12),
                new THREE.Vector3(archRadius - 0.04, baseHeight + 1.1, 0.05),
                new THREE.Vector3(archRadius - 0.06, baseHeight + 1.9, -0.08),
                new THREE.Vector3(0.1, baseHeight + postHeight + archRadius * 0.28, -0.15)
            ],
            vineMat,
            leafMat
        );
        group.add(vineRight.group);

        const topVine = this.createVine(
            [
                new THREE.Vector3(-0.8, baseHeight + postHeight + archRadius * 0.25, 0.18),
                new THREE.Vector3(-0.3, baseHeight + postHeight + archRadius * 0.35, -0.2),
                new THREE.Vector3(0.3, baseHeight + postHeight + archRadius * 0.4, 0.12),
                new THREE.Vector3(0.9, baseHeight + postHeight + archRadius * 0.25, -0.18)
            ],
            vineMat,
            leafMat
        );
        group.add(topVine.group);

        this.blossoms.push(...vineLeft.blossoms, ...vineRight.blossoms, ...topVine.blossoms);

        const planterMat = new THREE.MeshStandardMaterial({
            color: 0x6a4c3b,
            roughness: 0.95
        });
        const planterGeo = new THREE.BoxGeometry(0.6, 0.25, baseDepth * 0.85);
        const leftPlanter = new THREE.Mesh(planterGeo, planterMat);
        leftPlanter.position.set(-archRadius - 0.45, baseHeight + 0.12, 0);
        leftPlanter.castShadow = true;
        leftPlanter.receiveShadow = true;
        group.add(leftPlanter);

        const rightPlanter = leftPlanter.clone();
        rightPlanter.position.x = archRadius + 0.45;
        group.add(rightPlanter);

        const soilMat = new THREE.MeshStandardMaterial({ color: 0x3b2a1f, roughness: 1.0 });
        const soilGeo = new THREE.BoxGeometry(0.5, 0.1, baseDepth * 0.7);
        const leftSoil = new THREE.Mesh(soilGeo, soilMat);
        leftSoil.position.set(leftPlanter.position.x, leftPlanter.position.y + 0.16, 0);
        group.add(leftSoil);

        const rightSoil = leftSoil.clone();
        rightSoil.position.x = rightPlanter.position.x;
        group.add(rightSoil);

        return group;
    }

    createVine(points, vineMat, leafMat) {
        const group = new THREE.Group();
        const curve = new THREE.CatmullRomCurve3(points);
        const vineGeo = new THREE.TubeGeometry(curve, 24, 0.05, 6, false);
        const vine = new THREE.Mesh(vineGeo, vineMat);
        vine.castShadow = true;
        vine.receiveShadow = true;
        group.add(vine);

        const blossomColors = [0xff8ccf, 0xffc1e4, 0xff6f91, 0xffd3b4];
        const blossoms = [];
        const leafCount = 8 + Math.floor(Math.random() * 5);
        for (let i = 0; i < leafCount; i++) {
            const t = 0.1 + Math.random() * 0.8;
            const point = curve.getPointAt(t);
            const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), leafMat);
            leaf.position.copy(point);
            leaf.scale.set(1, 0.5, 1);
            leaf.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            leaf.castShadow = true;
            group.add(leaf);

            if (Math.random() > 0.35) {
                const blossomMat = new THREE.MeshStandardMaterial({
                    color: blossomColors[Math.floor(Math.random() * blossomColors.length)],
                    emissive: 0xff7acb,
                    emissiveIntensity: 0.4,
                    roughness: 0.6
                });
                const blossom = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), blossomMat);
                blossom.position.copy(point).add(new THREE.Vector3(0, 0.06, 0));
                blossom.castShadow = true;
                group.add(blossom);
                blossoms.push({
                    mesh: blossom,
                    baseIntensity: 0.3 + Math.random() * 0.3,
                    pulseOffset: Math.random() * Math.PI * 2
                });
            }
        }

        return { group, blossoms };
    }

    update(dt) {
        this.time += dt;
        for (const blossom of this.blossoms) {
            const pulse = Math.sin(this.time * 2.2 + blossom.pulseOffset) * 0.2;
            blossom.mesh.material.emissiveIntensity = blossom.baseIntensity + pulse;
            const scale = 1 + Math.sin(this.time * 1.6 + blossom.pulseOffset) * 0.05;
            blossom.mesh.scale.setScalar(scale);
        }
    }
}

EntityRegistry.register('flowerArch', FlowerArchEntity);
