import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { TextureGenerator } from '../../utils/textures.js';
import { EntityRegistry } from './registry.js';

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const cylGeo = new THREE.CylinderGeometry(0.05, 0.05, 1, 10);

export class BalconyGardenEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'balconyGarden';
        this.time = 0;
        this.lightBulbs = [];
        this.spinner = null;
    }

    static get displayName() { return 'Balcony Garden'; }

    createMesh(params) {
        const group = new THREE.Group();

        const width = params.width ?? 6.2;
        const depth = params.depth ?? 3.2;
        const height = params.height ?? 3.1;
        const railingHeight = params.railingHeight ?? 1.1;
        const trellisHeight = params.trellisHeight ?? 1.8;

        const planterHue = params.planterHue ?? (16 + Math.random() * 18);
        const plantHue = params.plantHue ?? (105 + Math.random() * 25);
        const lightTint = params.lightTint ?? (0.85 + Math.random() * 0.15);

        this.params.width = width;
        this.params.depth = depth;
        this.params.height = height;
        this.params.railingHeight = railingHeight;
        this.params.trellisHeight = trellisHeight;
        this.params.planterHue = planterHue;
        this.params.plantHue = plantHue;
        this.params.lightTint = lightTint;

        const concreteTex = TextureGenerator.createConcrete({ scale: 2.2 });
        const slabMat = new THREE.MeshStandardMaterial({ map: concreteTex, color: 0xdad6cf });
        const wallMat = new THREE.MeshStandardMaterial({ map: concreteTex, color: 0xc0c6cf });
        const railMat = new THREE.MeshStandardMaterial({ color: 0x2e3238, metalness: 0.4, roughness: 0.55 });
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b6a4a, roughness: 0.8 });
        const planterMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(`hsl(${planterHue}, 38%, 42%)`), roughness: 0.9 });
        const soilMat = new THREE.MeshStandardMaterial({ color: 0x4d3a2c, roughness: 0.95 });
        const plantMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(`hsl(${plantHue}, 45%, 38%)`), roughness: 0.85 });

        const slab = new THREE.Mesh(boxGeo, slabMat);
        slab.scale.set(width, 0.3, depth);
        slab.position.set(0, 0.15, 0);
        slab.receiveShadow = true;
        group.add(slab);

        const backWall = new THREE.Mesh(boxGeo, wallMat);
        backWall.scale.set(width * 0.98, height, 0.25);
        backWall.position.set(0, height / 2 + 0.3, -depth / 2 + 0.15);
        backWall.receiveShadow = true;
        backWall.castShadow = true;
        group.add(backWall);

        const railTop = new THREE.Mesh(boxGeo, railMat);
        railTop.scale.set(width, 0.1, 0.12);
        railTop.position.set(0, railingHeight + 0.3, depth / 2 - 0.2);
        group.add(railTop);

        const railBottom = new THREE.Mesh(boxGeo, railMat);
        railBottom.scale.set(width, 0.08, 0.08);
        railBottom.position.set(0, 0.5, depth / 2 - 0.22);
        group.add(railBottom);

        const barCount = Math.max(4, Math.round(width));
        for (let i = 0; i <= barCount; i++) {
            const bar = new THREE.Mesh(cylGeo, railMat);
            bar.scale.set(1, railingHeight, 1);
            const x = -width / 2 + (width / barCount) * i;
            bar.position.set(x, railingHeight / 2 + 0.3, depth / 2 - 0.2);
            group.add(bar);
        }

        const sideRailLeft = new THREE.Mesh(boxGeo, railMat);
        sideRailLeft.scale.set(0.1, railingHeight, depth * 0.8);
        sideRailLeft.position.set(-width / 2 + 0.05, railingHeight / 2 + 0.3, 0);
        group.add(sideRailLeft);

        const sideRailRight = new THREE.Mesh(boxGeo, railMat);
        sideRailRight.scale.set(0.1, railingHeight, depth * 0.8);
        sideRailRight.position.set(width / 2 - 0.05, railingHeight / 2 + 0.3, 0);
        group.add(sideRailRight);

        const trellisFrame = new THREE.Mesh(boxGeo, woodMat);
        trellisFrame.scale.set(width * 0.75, trellisHeight, 0.08);
        trellisFrame.position.set(0, height * 0.6 + 0.3, -depth / 2 + 0.22);
        group.add(trellisFrame);

        const slatCount = 6;
        for (let i = 0; i < slatCount; i++) {
            const slat = new THREE.Mesh(boxGeo, woodMat);
            slat.scale.set(width * 0.72, 0.06, 0.06);
            slat.position.set(0, height * 0.28 + 0.3 + (trellisHeight / (slatCount + 1)) * (i + 1), -depth / 2 + 0.3);
            group.add(slat);
        }

        const vineCount = 5;
        for (let i = 0; i < vineCount; i++) {
            const vine = new THREE.Mesh(cylGeo, plantMat);
            vine.scale.set(0.7, trellisHeight * 0.6, 0.7);
            vine.rotation.z = Math.PI / 2;
            vine.position.set(-width * 0.3 + (width * 0.6 / (vineCount - 1)) * i, height * 0.6, -depth / 2 + 0.35);
            group.add(vine);
        }

        const planterCount = 3;
        for (let i = 0; i < planterCount; i++) {
            const planter = new THREE.Mesh(boxGeo, planterMat);
            planter.scale.set(width * 0.26, 0.4, 0.7);
            const x = -width * 0.3 + (width * 0.3) * i;
            planter.position.set(x, 0.55, depth / 2 - 0.55);
            planter.castShadow = true;
            group.add(planter);

            const soil = new THREE.Mesh(boxGeo, soilMat);
            soil.scale.set(width * 0.22, 0.12, 0.62);
            soil.position.set(x, 0.72, depth / 2 - 0.55);
            group.add(soil);

            const plantCluster = new THREE.Group();
            const leafCount = 5;
            for (let j = 0; j < leafCount; j++) {
                const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), plantMat);
                leaf.position.set(
                    (Math.random() - 0.5) * 0.35,
                    0.2 + Math.random() * 0.25,
                    (Math.random() - 0.5) * 0.35
                );
                plantCluster.add(leaf);
            }
            plantCluster.position.set(x, 0.85, depth / 2 - 0.55);
            group.add(plantCluster);
        }

        const cable = new THREE.Mesh(cylGeo, railMat);
        cable.scale.set(1, width * 0.82, 1);
        cable.rotation.z = Math.PI / 2;
        cable.position.set(0, height * 0.9 + 0.3, depth * 0.05);
        group.add(cable);

        const bulbMat = new THREE.MeshStandardMaterial({
            color: 0xfff3c4,
            emissive: new THREE.Color(0xffc96b),
            emissiveIntensity: 0.6,
            roughness: 0.3
        });
        const bulbCount = 5;
        for (let i = 0; i < bulbCount; i++) {
            const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), bulbMat.clone());
            bulb.position.set(
                -width * 0.35 + (width * 0.7 / (bulbCount - 1)) * i,
                height * 0.85 + 0.35,
                depth * 0.12
            );
            group.add(bulb);
            this.lightBulbs.push(bulb);
        }

        const spinnerGroup = new THREE.Group();
        const spinnerBody = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.4, 6), railMat);
        spinnerBody.rotation.x = Math.PI;
        spinnerGroup.add(spinnerBody);

        const spinnerHub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 10), railMat);
        spinnerHub.position.y = -0.1;
        spinnerGroup.add(spinnerHub);

        const spinnerRing = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 8, 18), railMat);
        spinnerRing.rotation.x = Math.PI / 2;
        spinnerRing.position.y = -0.2;
        spinnerGroup.add(spinnerRing);

        spinnerGroup.position.set(width * 0.28, height * 0.75, depth * 0.2);
        this.spinner = spinnerGroup;
        group.add(spinnerGroup);

        return group;
    }

    update(dt) {
        this.time += dt;
        const glow = 0.45 + Math.sin(this.time * 2.2) * 0.25;
        this.lightBulbs.forEach((bulb, index) => {
            const pulse = glow + Math.sin(this.time * 3 + index) * 0.1;
            bulb.material.emissiveIntensity = pulse * (this.params.lightTint ?? 1);
        });

        if (this.spinner) {
            this.spinner.rotation.y = this.time * 1.5;
            this.spinner.rotation.z = Math.sin(this.time * 0.9) * 0.2;
        }
    }
}

EntityRegistry.register('balconyGarden', BalconyGardenEntity);
