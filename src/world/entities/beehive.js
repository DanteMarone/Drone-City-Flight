import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class BeehiveEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'beehive';

        // Seed for potential variations
        // The date component is fixed for consistency, random is instance based.
        const date = new Date().toISOString().split('T')[0];
        this.seed = params.seed || `${date}-${Math.floor(Math.random() * 1000)}`;
    }

    static get displayName() { return 'Beehive'; }

    createMesh(params) {
        const group = new THREE.Group();

        // --- Materials ---
        const woodColor = params.color || 0xFFFFFF; // White hive by default, or maybe natural wood 0xD2B48C
        const woodMat = new THREE.MeshStandardMaterial({
            color: woodColor,
            roughness: 0.8
        });
        const roofMat = new THREE.MeshStandardMaterial({
            color: 0x8899AA, // Metallic grey
            roughness: 0.4,
            metalness: 0.3
        });
        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x555555,
            roughness: 0.9
        });
        const entranceMat = new THREE.MeshStandardMaterial({ color: 0x111111 });

        // --- Geometry Construction ---

        // 1. Base Stand (Simple 4-legged stand or a pallet block)
        // Let's do a simple pallet block style
        const baseGeo = new THREE.BoxGeometry(0.7, 0.2, 0.9);
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.1;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        // 2. Hive Bodies (Supers) - Stacked boxes
        // Bottom Deep
        const boxWidth = 0.65;
        const boxDepth = 0.8;
        const deepHeight = 0.5;

        const deepSuperGeo = new THREE.BoxGeometry(boxWidth, deepHeight, boxDepth);
        const deepSuper = new THREE.Mesh(deepSuperGeo, woodMat);
        deepSuper.position.y = 0.2 + (deepHeight / 2); // Sit on base
        deepSuper.castShadow = true;
        deepSuper.receiveShadow = true;
        group.add(deepSuper);

        // Entrance Slit (attached to bottom of Deep Super)
        const entranceGeo = new THREE.BoxGeometry(0.4, 0.05, 0.02);
        const entrance = new THREE.Mesh(entranceGeo, entranceMat);
        entrance.position.set(0, 0.2 + 0.05, boxDepth/2 + 0.01);
        group.add(entrance);

        // Top Medium Super (Honey store)
        const mediumHeight = 0.35;
        const mediumSuperGeo = new THREE.BoxGeometry(boxWidth, mediumHeight, boxDepth);
        const mediumSuper = new THREE.Mesh(mediumSuperGeo, woodMat);
        mediumSuper.position.y = 0.2 + deepHeight + (mediumHeight / 2) + 0.01; // Tiny gap for realism
        mediumSuper.castShadow = true;
        mediumSuper.receiveShadow = true;
        group.add(mediumSuper);

        // 3. Roof (Telescoping Cover)
        const roofOverhang = 0.05;
        const roofHeight = 0.1;

        // Flat part of cover
        const roofGeo = new THREE.BoxGeometry(boxWidth + roofOverhang*2, roofHeight, boxDepth + roofOverhang*2);
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = 0.2 + deepHeight + mediumHeight + 0.01 + (roofHeight / 2);
        roof.castShadow = true;
        roof.receiveShadow = true;
        group.add(roof);

        // --- Bee Particles ---
        // We'll add a group to hold the bees.
        // We won't add them to 'group' directly if we want to rotate them independently without rotating the hive,
        // but since 'update(dt)' rotates specific children, we can add them to a 'beeGroup'.
        this.beeGroup = new THREE.Group();
        this.beeGroup.position.set(0, 0.8, 0); // Center of activity

        const beeGeo = new THREE.BoxGeometry(0.04, 0.04, 0.06); // Tiny bee
        const beeMat = new THREE.MeshBasicMaterial({ color: 0xFFDD00 }); // Bright yellow, unlit for visibility

        // Create 5 bees
        this.bees = [];
        const beeCount = 5;
        for(let i=0; i<beeCount; i++) {
            const bee = new THREE.Mesh(beeGeo, beeMat);

            // Random initial position in a cloud around the hive
            const radius = 0.6 + Math.random() * 0.4;
            const theta = Math.random() * Math.PI * 2;
            const yOffset = (Math.random() - 0.5) * 0.6;

            bee.position.set(
                Math.cos(theta) * radius,
                yOffset,
                Math.sin(theta) * radius
            );

            // Store some orbit data for animation
            bee.userData = {
                angle: theta,
                radius: radius,
                speed: 1.5 + Math.random() * 1.5,
                yBase: yOffset,
                yAmp: 0.1 + Math.random() * 0.1,
                yFreq: 2.0 + Math.random() * 2.0
            };

            this.beeGroup.add(bee);
            this.bees.push(bee);
        }

        group.add(this.beeGroup);

        return group;
    }

    update(dt) {
        if (!this.beeGroup) return;

        // Animate bees
        const time = Date.now() * 0.001;

        for (const bee of this.bees) {
            const d = bee.userData;

            // Orbit logic
            d.angle += d.speed * dt;

            // Bobbing logic
            const y = d.yBase + Math.sin(time * d.yFreq) * d.yAmp;

            bee.position.set(
                Math.cos(d.angle) * d.radius,
                y,
                Math.sin(d.angle) * d.radius
            );

            // Face forward (tangent to circle)
            // atan2(x, z) gives angle. We want tangent.
            bee.rotation.y = -d.angle;
        }
    }
}

EntityRegistry.register('beehive', BeehiveEntity);
