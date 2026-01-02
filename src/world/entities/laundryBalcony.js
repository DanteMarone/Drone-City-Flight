import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { TextureGenerator } from '../../utils/textures.js';
import { EntityRegistry } from './registry.js';

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const cylGeo = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);

export class LaundryBalconyEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'laundryBalcony';
        this.swingTime = 0;
        this.clothPanels = [];
        this.hangingPlant = null;
    }

    static get displayName() { return 'Laundry Balcony'; }

    createMesh(params) {
        const group = new THREE.Group();

        const width = params.width ?? 6;
        const depth = params.depth ?? 3.4;
        const height = params.height ?? 3.2;
        const railingHeight = params.railingHeight ?? 1.1;
        const awningDepth = params.awningDepth ?? depth * 0.55;
        const awningDrop = params.awningDrop ?? 0.35;

        this.params.width = width;
        this.params.depth = depth;
        this.params.height = height;
        this.params.railingHeight = railingHeight;
        this.params.awningDepth = awningDepth;
        this.params.awningDrop = awningDrop;

        const concreteTex = TextureGenerator.createConcrete({ scale: 2 });
        const baseMat = new THREE.MeshStandardMaterial({ map: concreteTex, color: 0xd9d6cf });
        const wallMat = new THREE.MeshStandardMaterial({ map: concreteTex, color: 0xc2c6d1 });
        const railMat = new THREE.MeshStandardMaterial({ color: 0x2f3338, metalness: 0.3, roughness: 0.6 });
        const accentMat = new THREE.MeshStandardMaterial({ color: 0x6b5b4d });

        const base = new THREE.Mesh(boxGeo, baseMat);
        base.scale.set(width, 0.3, depth);
        base.position.set(0, 0.15, 0);
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const backWall = new THREE.Mesh(boxGeo, wallMat);
        backWall.scale.set(width * 0.98, height, 0.25);
        backWall.position.set(0, height / 2 + 0.3, -depth / 2 + 0.15);
        backWall.castShadow = true;
        backWall.receiveShadow = true;
        group.add(backWall);

        const doorFrame = new THREE.Mesh(boxGeo, accentMat);
        doorFrame.scale.set(width * 0.42, height * 0.65, 0.2);
        doorFrame.position.set(0, height * 0.42, -depth / 2 + 0.3);
        group.add(doorFrame);

        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x9ec5d9,
            roughness: 0.2,
            metalness: 0.6,
            emissive: 0x1d2d3f,
            emissiveIntensity: 0.45
        });
        const doorGlass = new THREE.Mesh(boxGeo, glassMat);
        doorGlass.scale.set(width * 0.36, height * 0.55, 0.05);
        doorGlass.position.set(0, height * 0.42, -depth / 2 + 0.42);
        group.add(doorGlass);

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

        const awning = new THREE.Mesh(boxGeo, accentMat);
        awning.scale.set(width * 0.95, 0.12, awningDepth);
        awning.position.set(0, height + 0.5, -depth * 0.05);
        awning.rotation.x = -Math.PI / 12;
        group.add(awning);

        const awningSkirt = new THREE.Mesh(boxGeo, accentMat);
        awningSkirt.scale.set(width * 0.9, awningDrop, 0.08);
        awningSkirt.position.set(0, height + 0.32, awningDepth / 2 - depth * 0.15);
        group.add(awningSkirt);

        const lineMat = new THREE.MeshStandardMaterial({ color: 0x4b4f56 });
        const line = new THREE.Mesh(cylGeo, lineMat);
        line.scale.set(1, width * 0.8, 1);
        line.rotation.z = Math.PI / 2;
        line.position.set(0, railingHeight + 0.8, 0);
        group.add(line);

        const clothGeo = new THREE.PlaneGeometry(width * 0.2, 0.9, 6, 2);
        const clothColors = [0xffb3ba, 0xbad6ff, 0xbaf2d8, 0xffe2a7];
        const clothCount = 3;
        for (let i = 0; i < clothCount; i++) {
            const clothMat = new THREE.MeshStandardMaterial({
                color: clothColors[i % clothColors.length],
                side: THREE.DoubleSide,
                roughness: 0.8
            });
            const cloth = new THREE.Mesh(clothGeo, clothMat);
            cloth.position.set((i - 1) * width * 0.22, railingHeight + 0.35, 0);
            cloth.rotation.y = Math.PI / 2;
            cloth.castShadow = true;
            this.clothPanels.push(cloth);
            group.add(cloth);
        }

        const potMat = new THREE.MeshStandardMaterial({ color: 0xa46b45, roughness: 0.7 });
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x3d7f4f, roughness: 0.8 });
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.35, 10), potMat);
        pot.position.set(-width * 0.28, 0.55, depth * 0.1);

        const plant = new THREE.Group();
        plant.add(pot);
        for (let i = 0; i < 4; i++) {
            const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), leafMat);
            leaf.position.set(Math.cos(i * 1.6) * 0.2, 0.25 + Math.sin(i) * 0.05, Math.sin(i * 1.6) * 0.2);
            plant.add(leaf);
        }
        plant.position.set(-width * 0.25, 0, depth * 0.12);
        this.hangingPlant = plant;
        group.add(plant);

        const lightMat = new THREE.MeshStandardMaterial({
            color: 0xffe6b0,
            emissive: 0xffd37a,
            emissiveIntensity: 0.7
        });
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), lightMat);
        lamp.position.set(width * 0.25, height * 0.7, -depth * 0.3);
        group.add(lamp);

        return group;
    }

    update(dt) {
        this.swingTime += dt;
        const sway = Math.sin(this.swingTime * 1.4) * 0.18;
        const flutter = Math.sin(this.swingTime * 3.2) * 0.08;

        this.clothPanels.forEach((panel, index) => {
            const direction = index % 2 === 0 ? 1 : -1;
            panel.rotation.z = sway * direction;
            panel.position.y = (this.params.railingHeight ?? 1.1) + 0.35 + flutter * direction;
        });

        if (this.hangingPlant) {
            this.hangingPlant.rotation.z = sway * 0.4;
            this.hangingPlant.rotation.x = flutter * 0.2;
        }
    }
}

EntityRegistry.register('laundryBalcony', LaundryBalconyEntity);
