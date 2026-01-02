import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const cylGeo = new THREE.CylinderGeometry(0.05, 0.05, 1, 10);
const sphereGeo = new THREE.SphereGeometry(0.12, 12, 12);

const createAwningTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f5f0e6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const stripeColors = ['#c9544b', '#f2b86c'];
    const stripeWidth = 16;
    for (let i = 0; i < canvas.width / stripeWidth; i++) {
        ctx.fillStyle = stripeColors[i % stripeColors.length];
        ctx.fillRect(i * stripeWidth, 0, stripeWidth, canvas.height);
    }

    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 120; i++) {
        const shade = Math.floor(30 + Math.random() * 60);
        ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
    }
    ctx.globalAlpha = 1;

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1.5, 1.5);
    return texture;
};

export class ShopBalconyEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'shopBalcony';
        this.time = 0;
        this.lightBulbs = [];
        this.chimeGroup = null;
        this.planterPlants = [];
    }

    static get displayName() {
        return 'Shop Balcony';
    }

    createMesh(params) {
        const group = new THREE.Group();

        const width = params.width ?? 5.4;
        const depth = params.depth ?? 2.6;
        const height = params.height ?? 3.1;
        const railingHeight = params.railingHeight ?? 1.05;
        const planterCount = params.planterCount ?? 3;

        this.params.width = width;
        this.params.depth = depth;
        this.params.height = height;
        this.params.railingHeight = railingHeight;
        this.params.planterCount = planterCount;

        const concreteTex = TextureGenerator.createConcrete({ scale: 2 });
        const baseMat = new THREE.MeshStandardMaterial({ map: concreteTex, color: 0xdedbd4 });
        const wallMat = new THREE.MeshStandardMaterial({ map: concreteTex, color: 0xc7cdd6 });
        const railMat = new THREE.MeshStandardMaterial({ color: 0x2d3136, metalness: 0.35, roughness: 0.55 });
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x7b5b3d, roughness: 0.75 });

        const slab = new THREE.Mesh(boxGeo, baseMat);
        slab.scale.set(width, 0.25, depth);
        slab.position.set(0, 0.12, 0);
        slab.castShadow = true;
        slab.receiveShadow = true;
        group.add(slab);

        const backWall = new THREE.Mesh(boxGeo, wallMat);
        backWall.scale.set(width * 0.98, height, 0.28);
        backWall.position.set(0, height / 2 + 0.25, -depth / 2 + 0.15);
        backWall.castShadow = true;
        backWall.receiveShadow = true;
        group.add(backWall);

        const doorFrame = new THREE.Mesh(boxGeo, woodMat);
        doorFrame.scale.set(width * 0.38, height * 0.64, 0.18);
        doorFrame.position.set(0, height * 0.42, -depth / 2 + 0.28);
        group.add(doorFrame);

        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x8fb7cc,
            roughness: 0.15,
            metalness: 0.6,
            emissive: 0x1b2c3a,
            emissiveIntensity: 0.4
        });
        const doorGlass = new THREE.Mesh(boxGeo, glassMat);
        doorGlass.scale.set(width * 0.3, height * 0.54, 0.06);
        doorGlass.position.set(0, height * 0.42, -depth / 2 + 0.4);
        group.add(doorGlass);

        const railTop = new THREE.Mesh(boxGeo, railMat);
        railTop.scale.set(width, 0.1, 0.12);
        railTop.position.set(0, railingHeight + 0.32, depth / 2 - 0.2);
        group.add(railTop);

        const railBottom = new THREE.Mesh(boxGeo, railMat);
        railBottom.scale.set(width, 0.08, 0.08);
        railBottom.position.set(0, 0.5, depth / 2 - 0.22);
        group.add(railBottom);

        const barCount = Math.max(4, Math.round(width));
        for (let i = 0; i <= barCount; i++) {
            const bar = new THREE.Mesh(cylGeo, railMat);
            bar.scale.set(1, railingHeight, 1);
            bar.position.set(-width / 2 + (width / barCount) * i, railingHeight / 2 + 0.32, depth / 2 - 0.2);
            group.add(bar);
        }

        const sideRailLeft = new THREE.Mesh(boxGeo, railMat);
        sideRailLeft.scale.set(0.1, railingHeight, depth * 0.8);
        sideRailLeft.position.set(-width / 2 + 0.05, railingHeight / 2 + 0.32, 0);
        group.add(sideRailLeft);

        const sideRailRight = new THREE.Mesh(boxGeo, railMat);
        sideRailRight.scale.set(0.1, railingHeight, depth * 0.8);
        sideRailRight.position.set(width / 2 - 0.05, railingHeight / 2 + 0.32, 0);
        group.add(sideRailRight);

        const awningMat = new THREE.MeshStandardMaterial({ map: createAwningTexture(), roughness: 0.7 });
        const awning = new THREE.Mesh(boxGeo, awningMat);
        awning.scale.set(width * 0.9, 0.12, depth * 0.6);
        awning.position.set(0, height + 0.48, -depth * 0.08);
        awning.rotation.x = -Math.PI / 9;
        group.add(awning);

        const stringMat = new THREE.MeshStandardMaterial({ color: 0x4c4f55, roughness: 0.6 });
        const stringLine = new THREE.Mesh(cylGeo, stringMat);
        stringLine.scale.set(1, width * 0.9, 1);
        stringLine.rotation.z = Math.PI / 2;
        stringLine.position.set(0, railingHeight + 0.8, depth * 0.2);
        group.add(stringLine);

        const bulbMat = new THREE.MeshStandardMaterial({
            color: 0xfff0c5,
            emissive: 0xffc76e,
            emissiveIntensity: 0.7,
            roughness: 0.3
        });
        const bulbCount = Math.max(4, Math.round(width));
        for (let i = 0; i < bulbCount; i++) {
            const bulb = new THREE.Mesh(sphereGeo, bulbMat.clone());
            const x = -width * 0.4 + (width * 0.8 / (bulbCount - 1)) * i;
            bulb.position.set(x, railingHeight + 0.72, depth * 0.2);
            this.lightBulbs.push(bulb);
            group.add(bulb);
        }

        const planterMat = new THREE.MeshStandardMaterial({ color: 0x8a5a3c, roughness: 0.85 });
        const soilMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.9 });
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x3f7b51, roughness: 0.8 });
        const blossomMat = new THREE.MeshStandardMaterial({ color: 0xe8a1b0, roughness: 0.7 });

        const planterSpacing = Math.max(1, planterCount - 1);
        for (let i = 0; i < planterCount; i++) {
            const planterGroup = new THREE.Group();
            const planter = new THREE.Mesh(boxGeo, planterMat);
            planter.scale.set(width * 0.18, 0.35, 0.35);
            planter.position.set(0, 0.2, 0);
            planterGroup.add(planter);

            const soil = new THREE.Mesh(boxGeo, soilMat);
            soil.scale.set(width * 0.17, 0.15, 0.32);
            soil.position.set(0, 0.35, 0);
            planterGroup.add(soil);

            const plant = new THREE.Group();
            const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.4, 8), leafMat);
            stem.position.set(0, 0.6, 0);
            plant.add(stem);
            for (let j = 0; j < 4; j++) {
                const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), leafMat);
                leaf.position.set(Math.cos(j * 1.6) * 0.15, 0.72 + (j % 2) * 0.06, Math.sin(j * 1.6) * 0.12);
                plant.add(leaf);
            }
            const blossom = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), blossomMat);
            blossom.position.set(0, 0.9, 0.05);
            plant.add(blossom);
            planterGroup.add(plant);

            const offset = -width * 0.35 + (width * 0.7 / planterSpacing) * i;
            planterGroup.position.set(offset, 0.15, depth / 2 - 0.4);
            this.planterPlants.push(plant);
            group.add(planterGroup);
        }

        const chimeMat = new THREE.MeshStandardMaterial({ color: 0xb5c2c9, metalness: 0.6, roughness: 0.3 });
        const chimeGroup = new THREE.Group();
        const chimeTop = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.08, 12), chimeMat);
        chimeTop.position.set(0, 0.12, 0);
        chimeGroup.add(chimeTop);

        for (let i = 0; i < 4; i++) {
            const chime = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8), chimeMat);
            chime.position.set(Math.cos(i * 1.57) * 0.12, -0.2, Math.sin(i * 1.57) * 0.12);
            chimeGroup.add(chime);
        }

        const clapper = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), chimeMat);
        clapper.position.set(0, -0.5, 0);
        chimeGroup.add(clapper);

        chimeGroup.position.set(width * 0.32, height * 0.8, -depth * 0.15);
        this.chimeGroup = chimeGroup;
        group.add(chimeGroup);

        return group;
    }

    update(dt) {
        this.time += dt;
        const sway = Math.sin(this.time * 1.3) * 0.18;
        const pulse = 0.4 + Math.sin(this.time * 2.2) * 0.25;

        if (this.chimeGroup) {
            this.chimeGroup.rotation.z = sway;
            this.chimeGroup.rotation.x = sway * 0.4;
        }

        this.planterPlants.forEach((plant, index) => {
            plant.rotation.z = sway * (0.25 + index * 0.05);
        });

        this.lightBulbs.forEach((bulb, index) => {
            bulb.material.emissiveIntensity = pulse + (index % 2) * 0.1;
        });
    }
}

EntityRegistry.register('shopBalcony', ShopBalconyEntity);
