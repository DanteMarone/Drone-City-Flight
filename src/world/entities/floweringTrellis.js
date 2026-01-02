import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class FloweringTrellisEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'floweringTrellis';
        this.vineSway = [];
        this.blossomPulses = [];
        this.elapsedTime = 0;
    }

    static get displayName() { return 'Flowering Trellis'; }

    createMesh(params) {
        const group = new THREE.Group();

        const width = params.width || 1.6 + Math.random() * 0.4;
        const height = params.height || 2.2 + Math.random() * 0.6;
        const depth = params.depth || 0.35 + Math.random() * 0.15;

        const baseHeight = 0.35 + Math.random() * 0.1;

        const woodHue = 0.08 + Math.random() * 0.05;
        const woodMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(woodHue, 0.45, 0.38),
            roughness: 0.7,
            metalness: 0.05
        });
        const accentMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(woodHue, 0.35, 0.28),
            roughness: 0.8,
            metalness: 0.04
        });
        const soilMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1d, roughness: 1, metalness: 0 });
        const vineMat = new THREE.MeshStandardMaterial({ color: 0x2f6f3a, roughness: 0.85, metalness: 0.02 });
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x52a14b, roughness: 0.75, metalness: 0.02 });

        const planter = new THREE.Mesh(
            new THREE.BoxGeometry(width, baseHeight, depth),
            accentMat
        );
        planter.position.y = baseHeight / 2;
        planter.castShadow = true;
        planter.receiveShadow = true;
        group.add(planter);

        const soil = new THREE.Mesh(
            new THREE.BoxGeometry(width * 0.9, baseHeight * 0.45, depth * 0.8),
            soilMat
        );
        soil.position.y = baseHeight - soil.geometry.parameters.height / 2 - 0.02;
        soil.receiveShadow = true;
        group.add(soil);

        const postGeo = new THREE.BoxGeometry(0.12, height, 0.08);
        const leftPost = new THREE.Mesh(postGeo, woodMat);
        leftPost.position.set(-width * 0.42, height / 2, 0);
        leftPost.castShadow = true;
        leftPost.receiveShadow = true;
        group.add(leftPost);

        const rightPost = leftPost.clone();
        rightPost.position.x = width * 0.42;
        group.add(rightPost);

        const topBeam = new THREE.Mesh(
            new THREE.BoxGeometry(width * 0.95, 0.08, 0.1),
            woodMat
        );
        topBeam.position.set(0, height - 0.04, 0);
        topBeam.castShadow = true;
        topBeam.receiveShadow = true;
        group.add(topBeam);

        const crossCount = 4 + Math.floor(Math.random() * 2);
        for (let i = 0; i < crossCount; i++) {
            const y = baseHeight + (height - baseHeight) * ((i + 1) / (crossCount + 1));
            const crossBar = new THREE.Mesh(new THREE.BoxGeometry(width * 0.85, 0.05, 0.06), accentMat);
            crossBar.position.set(0, y, 0);
            crossBar.castShadow = true;
            crossBar.receiveShadow = true;
            group.add(crossBar);
        }

        const slatCount = 5;
        for (let i = 0; i < slatCount; i++) {
            const x = -width * 0.35 + (width * 0.7) * (i / (slatCount - 1));
            const slat = new THREE.Mesh(new THREE.BoxGeometry(0.05, height * 0.8, 0.05), accentMat);
            slat.position.set(x, baseHeight + (height * 0.4), -0.03);
            slat.castShadow = true;
            slat.receiveShadow = true;
            group.add(slat);
        }

        const blossomColors = [0xffb7d8, 0xfff0a6, 0xb5f5ec, 0xfed1a1];
        const blossomGeo = new THREE.SphereGeometry(0.07, 12, 12);
        const leafGeo = new THREE.ConeGeometry(0.06, 0.16, 6);

        const vineCount = 3 + Math.floor(Math.random() * 2);
        for (let i = 0; i < vineCount; i++) {
            const vineGroup = new THREE.Group();
            const horizontalOffset = (i - (vineCount - 1) / 2) * (width * 0.22);
            const curve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(horizontalOffset, baseHeight - 0.05, depth * 0.1),
                new THREE.Vector3(horizontalOffset + (Math.random() - 0.5) * 0.2, height * 0.45, depth * 0.18),
                new THREE.Vector3(horizontalOffset + (Math.random() - 0.5) * 0.25, height * 0.8, depth * 0.1),
                new THREE.Vector3(horizontalOffset + (Math.random() - 0.5) * 0.2, height - 0.15, 0)
            ]);

            const tube = new THREE.Mesh(
                new THREE.TubeGeometry(curve, 18, 0.03, 6, false),
                vineMat
            );
            tube.castShadow = true;
            tube.receiveShadow = true;
            vineGroup.add(tube);

            const leafCount = 6 + Math.floor(Math.random() * 4);
            for (let l = 0; l < leafCount; l++) {
                const t = (l + 1) / (leafCount + 1);
                const point = curve.getPointAt(t);
                const leaf = new THREE.Mesh(leafGeo, leafMat);
                leaf.position.copy(point);
                leaf.rotation.z = Math.PI / 2 + (Math.random() - 0.5) * 0.8;
                leaf.rotation.y = Math.random() * Math.PI * 2;
                leaf.castShadow = true;
                leaf.receiveShadow = true;
                vineGroup.add(leaf);

                if (Math.random() < 0.6) {
                    const blossomColor = blossomColors[Math.floor(Math.random() * blossomColors.length)];
                    const blossomMat = new THREE.MeshStandardMaterial({
                        color: blossomColor,
                        roughness: 0.5,
                        metalness: 0.1,
                        emissive: new THREE.Color(blossomColor).multiplyScalar(0.3),
                        emissiveIntensity: 0.6
                    });
                    const blossom = new THREE.Mesh(blossomGeo, blossomMat);
                    blossom.position.copy(point);
                    blossom.position.y += 0.08;
                    blossom.castShadow = true;
                    vineGroup.add(blossom);
                    this.blossomPulses.push({
                        mesh: blossom,
                        base: 0.5 + Math.random() * 0.2,
                        range: 0.4 + Math.random() * 0.4,
                        speed: 1 + Math.random() * 1.5,
                        offset: Math.random() * Math.PI * 2
                    });
                }
            }

            const baseRotation = new THREE.Euler(0, Math.random() * Math.PI * 0.2, 0);
            vineGroup.rotation.copy(baseRotation);
            this.vineSway.push({
                group: vineGroup,
                baseRotation,
                phase: Math.random() * Math.PI * 2,
                speed: 0.6 + Math.random() * 0.6,
                amplitude: 0.03 + Math.random() * 0.03
            });

            group.add(vineGroup);
        }

        return group;
    }

    update(dt) {
        if (!this.mesh) return;
        this.elapsedTime += dt;

        this.vineSway.forEach((vine) => {
            vine.phase += dt * vine.speed;
            vine.group.rotation.x = vine.baseRotation.x + Math.cos(vine.phase) * vine.amplitude * 0.7;
            vine.group.rotation.z = vine.baseRotation.z + Math.sin(vine.phase) * vine.amplitude;
            vine.group.rotation.y = vine.baseRotation.y;
        });

        this.blossomPulses.forEach((blossom) => {
            const pulse = blossom.base + Math.sin(this.elapsedTime * blossom.speed + blossom.offset) * blossom.range;
            blossom.mesh.material.emissiveIntensity = pulse;
        });
    }
}

EntityRegistry.register('floweringTrellis', FloweringTrellisEntity);
