import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const cylGeo = new THREE.CylinderGeometry(0.04, 0.04, 1, 10);

function createTileTexture(baseColor, groutColor) {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, size, size);

    const tileSize = 24;
    ctx.strokeStyle = groutColor;
    ctx.lineWidth = 3;

    for (let y = 0; y <= size; y += tileSize) {
        for (let x = 0; x <= size; x += tileSize) {
            ctx.strokeRect(x, y, tileSize, tileSize);
        }
    }

    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 120; i++) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
}

export class ApartmentBalconyGardenEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'apartmentBalconyGarden';
        this._time = Math.random() * Math.PI * 2;
        this._bulbMaterials = [];
        this._bulbPhases = [];
        this._hangingLantern = null;
    }

    static get displayName() { return 'Apartment Balcony Garden'; }

    createMesh(params) {
        const group = new THREE.Group();

        const width = params.width ?? 4 + Math.random() * 0.6;
        const depth = params.depth ?? 2 + Math.random() * 0.4;
        const height = params.height ?? 2.8 + Math.random() * 0.3;
        const railingHeight = params.railingHeight ?? 1.05;

        this.params.width = width;
        this.params.depth = depth;
        this.params.height = height;
        this.params.railingHeight = railingHeight;

        const slabMat = new THREE.MeshStandardMaterial({
            map: createTileTexture('#c8c1b5', '#8f8a80'),
            roughness: 0.85
        });
        const wallMat = new THREE.MeshStandardMaterial({ color: 0xc5ccd3, roughness: 0.9 });
        const railMat = new THREE.MeshStandardMaterial({ color: 0x2f3a40, metalness: 0.4, roughness: 0.5 });
        const planterMat = new THREE.MeshStandardMaterial({ color: 0x96583c, roughness: 0.75 });
        const soilMat = new THREE.MeshStandardMaterial({ color: 0x4b3a2a, roughness: 0.9 });
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f7b4f, roughness: 0.8 });
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x8fc2d8,
            roughness: 0.15,
            metalness: 0.6,
            transparent: true,
            opacity: 0.75
        });

        const slab = new THREE.Mesh(boxGeo, slabMat);
        slab.scale.set(width, 0.2, depth);
        slab.position.set(0, 0.1, 0);
        slab.receiveShadow = true;
        group.add(slab);

        const backWall = new THREE.Mesh(boxGeo, wallMat);
        backWall.scale.set(width * 0.98, height, 0.25);
        backWall.position.set(0, height / 2 + 0.2, -depth / 2 + 0.15);
        backWall.castShadow = true;
        backWall.receiveShadow = true;
        group.add(backWall);

        const doorFrame = new THREE.Mesh(boxGeo, railMat);
        doorFrame.scale.set(width * 0.32, height * 0.62, 0.2);
        doorFrame.position.set(-width * 0.15, height * 0.4, -depth / 2 + 0.33);
        group.add(doorFrame);

        const doorGlass = new THREE.Mesh(boxGeo, glassMat);
        doorGlass.scale.set(width * 0.26, height * 0.52, 0.05);
        doorGlass.position.set(-width * 0.15, height * 0.4, -depth / 2 + 0.42);
        group.add(doorGlass);

        const railTop = new THREE.Mesh(boxGeo, railMat);
        railTop.scale.set(width, 0.08, 0.12);
        railTop.position.set(0, railingHeight + 0.25, depth / 2 - 0.18);
        group.add(railTop);

        const railBottom = new THREE.Mesh(boxGeo, railMat);
        railBottom.scale.set(width, 0.06, 0.08);
        railBottom.position.set(0, 0.45, depth / 2 - 0.2);
        group.add(railBottom);

        const barCount = Math.max(5, Math.round(width * 1.1));
        for (let i = 0; i <= barCount; i++) {
            const bar = new THREE.Mesh(cylGeo, railMat);
            bar.scale.set(1, railingHeight, 1);
            const x = -width / 2 + (width / barCount) * i;
            bar.position.set(x, railingHeight / 2 + 0.25, depth / 2 - 0.18);
            group.add(bar);
        }

        const sideRailLeft = new THREE.Mesh(boxGeo, railMat);
        sideRailLeft.scale.set(0.08, railingHeight, depth * 0.8);
        sideRailLeft.position.set(-width / 2 + 0.06, railingHeight / 2 + 0.25, 0);
        group.add(sideRailLeft);

        const sideRailRight = new THREE.Mesh(boxGeo, railMat);
        sideRailRight.scale.set(0.08, railingHeight, depth * 0.8);
        sideRailRight.position.set(width / 2 - 0.06, railingHeight / 2 + 0.25, 0);
        group.add(sideRailRight);

        const planterCount = 2 + Math.floor(Math.random() * 2);
        const planterWidth = width * 0.32;
        for (let i = 0; i < planterCount; i++) {
            const planter = new THREE.Mesh(boxGeo, planterMat);
            planter.scale.set(planterWidth, 0.35, 0.4);
            const x = (i - (planterCount - 1) / 2) * (planterWidth * 1.1);
            planter.position.set(x, 0.45, depth / 2 - 0.35);
            planter.castShadow = true;
            group.add(planter);

            const soil = new THREE.Mesh(boxGeo, soilMat);
            soil.scale.set(planterWidth * 0.92, 0.15, 0.32);
            soil.position.set(x, 0.6, depth / 2 - 0.35);
            group.add(soil);

            const leafCluster = new THREE.Group();
            const leafCount = 4 + Math.floor(Math.random() * 3);
            for (let j = 0; j < leafCount; j++) {
                const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.12 + Math.random() * 0.08, 8, 8), leafMat);
                leaf.position.set(
                    (Math.random() - 0.5) * planterWidth * 0.6,
                    0.72 + Math.random() * 0.2,
                    depth / 2 - 0.35 + (Math.random() - 0.5) * 0.2
                );
                leafCluster.add(leaf);
            }
            group.add(leafCluster);
        }

        const trellis = new THREE.Group();
        const trellisWidth = width * 0.38;
        const trellisHeight = height * 0.7;
        const frameLeft = new THREE.Mesh(cylGeo, railMat);
        frameLeft.scale.set(1, trellisHeight, 1);
        frameLeft.position.set(width * 0.3, trellisHeight / 2 + 0.4, -depth / 2 + 0.35);
        trellis.add(frameLeft);

        const frameRight = new THREE.Mesh(cylGeo, railMat);
        frameRight.scale.set(1, trellisHeight, 1);
        frameRight.position.set(width * 0.3 + trellisWidth, trellisHeight / 2 + 0.4, -depth / 2 + 0.35);
        trellis.add(frameRight);

        for (let i = 0; i < 4; i++) {
            const bar = new THREE.Mesh(cylGeo, railMat);
            bar.scale.set(1, trellisWidth, 1);
            bar.rotation.z = Math.PI / 2;
            bar.position.set(width * 0.3 + trellisWidth / 2, 0.55 + i * (trellisHeight / 4), -depth / 2 + 0.35);
            trellis.add(bar);
        }
        group.add(trellis);

        for (let i = 0; i < 6; i++) {
            const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, trellisHeight * 0.4, 6), leafMat);
            vine.position.set(width * 0.32 + Math.random() * trellisWidth * 0.9, 0.7 + Math.random() * trellisHeight * 0.5, -depth / 2 + 0.32);
            vine.rotation.z = (Math.random() - 0.5) * 0.4;
            trellis.add(vine);
        }

        const cableMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.6 });
        const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, width * 0.9, 10), cableMat);
        cable.rotation.z = Math.PI / 2;
        cable.position.set(0, height * 0.9, depth / 2 - 0.25);
        group.add(cable);

        const bulbGeo = new THREE.SphereGeometry(0.06, 12, 12);
        const bulbCount = 6;
        for (let i = 0; i < bulbCount; i++) {
            const bulbMat = new THREE.MeshStandardMaterial({
                color: 0xfff1c4,
                emissive: 0xffb84a,
                emissiveIntensity: 0.6
            });
            const bulb = new THREE.Mesh(bulbGeo, bulbMat);
            const x = -width * 0.45 + (width * 0.9 / (bulbCount - 1)) * i;
            bulb.position.set(x, height * 0.86, depth / 2 - 0.25);
            bulb.castShadow = true;
            group.add(bulb);
            this._bulbMaterials.push(bulbMat);
            this._bulbPhases.push(Math.random() * Math.PI * 2);
        }

        const lanternGroup = new THREE.Group();
        const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6), cableMat);
        cord.position.set(width * 0.18, height * 0.7, depth * 0.05);
        lanternGroup.add(cord);

        const lanternMat = new THREE.MeshStandardMaterial({
            color: 0xffe1a6,
            emissive: 0xffc06a,
            emissiveIntensity: 0.8
        });
        const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.32, 8), lanternMat);
        lantern.position.set(width * 0.18, height * 0.45, depth * 0.05);
        lanternGroup.add(lantern);

        this._hangingLantern = lanternGroup;
        group.add(lanternGroup);

        return group;
    }

    update(dt) {
        this._time += dt;
        const sway = Math.sin(this._time * 1.3) * 0.1;
        const bob = Math.sin(this._time * 2.1) * 0.05;

        if (this._hangingLantern) {
            this._hangingLantern.rotation.z = sway;
            this._hangingLantern.position.y = bob * 0.15;
        }

        this._bulbMaterials.forEach((material, index) => {
            const phase = this._bulbPhases[index] ?? 0;
            material.emissiveIntensity = 0.5 + Math.sin(this._time * 2.4 + phase) * 0.3;
        });
    }
}

EntityRegistry.register('apartmentBalconyGarden', ApartmentBalconyGardenEntity);
