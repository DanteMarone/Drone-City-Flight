import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

function createCanopyTexture(primary = '#d64541', secondary = '#f5f5f5') {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = secondary;
    ctx.fillRect(0, 0, size, size);

    const stripeWidth = size / 6;
    ctx.fillStyle = primary;
    for (let i = 0; i < size + stripeWidth; i += stripeWidth * 2) {
        ctx.fillRect(i, 0, stripeWidth, size);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 1);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

export class MarketStallEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'marketStall';
        this.lightPhase = Math.random() * Math.PI * 2;
        this.lights = [];
        this.canopyCloth = null;
        this.canopyBaseY = 0;
        this.swayTime = Math.random() * Math.PI * 2;
    }

    static get displayName() { return 'Market Stall'; }

    createMesh() {
        const group = new THREE.Group();

        const stallWidth = 1.8 + Math.random() * 0.8;
        const stallDepth = 1.1 + Math.random() * 0.35;
        const counterHeight = 0.85;
        const roofHeight = 2.2;

        const woodMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(0.08, 0.45, 0.35),
            roughness: 0.7,
            metalness: 0.05
        });

        const frameMat = new THREE.MeshStandardMaterial({
            color: 0xaaaaaa,
            metalness: 0.6,
            roughness: 0.35
        });

        const canopyMat = new THREE.MeshStandardMaterial({
            map: createCanopyTexture(),
            side: THREE.DoubleSide,
            roughness: 0.6,
            metalness: 0.05
        });

        // Platform
        const platformGeo = new THREE.BoxGeometry(stallWidth, 0.12, stallDepth);
        const platform = new THREE.Mesh(platformGeo, woodMat);
        platform.position.y = 0.06;
        platform.castShadow = true;
        platform.receiveShadow = true;
        group.add(platform);

        // Counter surface
        const counterGeo = new THREE.BoxGeometry(stallWidth * 0.9, 0.08, stallDepth * 0.6);
        const counter = new THREE.Mesh(counterGeo, woodMat);
        counter.position.set(0, counterHeight, -stallDepth * 0.08);
        counter.castShadow = true;
        counter.receiveShadow = true;
        group.add(counter);

        // Support posts
        const postGeo = new THREE.CylinderGeometry(0.04, 0.05, roofHeight, 8);
        const postOffsets = [
            [-stallWidth / 2 + 0.1, roofHeight / 2, -stallDepth / 2 + 0.1],
            [stallWidth / 2 - 0.1, roofHeight / 2, -stallDepth / 2 + 0.1],
            [-stallWidth / 2 + 0.1, roofHeight / 2, stallDepth / 2 - 0.1],
            [stallWidth / 2 - 0.1, roofHeight / 2, stallDepth / 2 - 0.1]
        ];
        postOffsets.forEach(([x, y, z]) => {
            const post = new THREE.Mesh(postGeo, frameMat);
            post.position.set(x, y, z);
            post.castShadow = true;
            post.receiveShadow = true;
            group.add(post);
        });

        // Roof frame
        const beamGeo = new THREE.BoxGeometry(stallWidth, 0.06, 0.06);
        const frontBeam = new THREE.Mesh(beamGeo, frameMat);
        frontBeam.position.set(0, roofHeight, -stallDepth / 2 + 0.06);
        frontBeam.castShadow = true;
        group.add(frontBeam);

        const backBeam = frontBeam.clone();
        backBeam.position.z = stallDepth / 2 - 0.06;
        group.add(backBeam);

        const sideBeamGeo = new THREE.BoxGeometry(0.06, 0.06, stallDepth - 0.12);
        const leftBeam = new THREE.Mesh(sideBeamGeo, frameMat);
        leftBeam.position.set(-stallWidth / 2 + 0.06, roofHeight, 0);
        leftBeam.castShadow = true;
        group.add(leftBeam);

        const rightBeam = leftBeam.clone();
        rightBeam.position.x = stallWidth / 2 - 0.06;
        group.add(rightBeam);

        // Canopy cloth
        const canopyGeo = new THREE.PlaneGeometry(stallWidth * 1.05, stallDepth * 1.05);
        this.canopyCloth = new THREE.Mesh(canopyGeo, canopyMat);
        this.canopyCloth.rotation.x = -Math.PI / 8;
        this.canopyCloth.position.set(0, roofHeight + 0.02, -stallDepth * 0.1);
        this.canopyCloth.castShadow = true;
        this.canopyBaseY = this.canopyCloth.position.y;
        group.add(this.canopyCloth);

        // Front drape
        const drapeGeo = new THREE.PlaneGeometry(stallWidth * 1.02, stallDepth * 0.4);
        const drape = new THREE.Mesh(drapeGeo, canopyMat);
        drape.position.set(0, roofHeight - drapeGeo.parameters.height / 2, -stallDepth / 2 - 0.01);
        drape.castShadow = true;
        group.add(drape);

        // Crates with produce
        const crateColors = [0x9b7653, 0x8a6f4d, 0x7d5a4f];
        for (let i = 0; i < 3; i++) {
            const crateWidth = 0.4 + Math.random() * 0.1;
            const crateDepth = 0.3 + Math.random() * 0.1;
            const crateHeight = 0.25 + Math.random() * 0.05;

            const crateGeo = new THREE.BoxGeometry(crateWidth, crateHeight, crateDepth);
            const crateMat = new THREE.MeshStandardMaterial({
                color: crateColors[i % crateColors.length],
                roughness: 0.8,
                metalness: 0.05
            });

            const crate = new THREE.Mesh(crateGeo, crateMat);
            crate.position.set(-stallWidth * 0.3 + i * 0.35, counterHeight + crateHeight / 2 + 0.04, -stallDepth * 0.02);
            crate.castShadow = true;
            crate.receiveShadow = true;
            group.add(crate);

            // Produce pile
            const fruitCount = 4 + Math.floor(Math.random() * 3);
            for (let f = 0; f < fruitCount; f++) {
                const fruit = new THREE.Mesh(
                    new THREE.SphereGeometry(0.05 + Math.random() * 0.02, 10, 8),
                    new THREE.MeshStandardMaterial({
                        color: new THREE.Color().setHSL(0.3 + Math.random() * 0.2, 0.7, 0.45 + Math.random() * 0.1),
                        roughness: 0.5,
                        metalness: 0.05
                    })
                );
                fruit.position.set(
                    crate.position.x + (Math.random() - 0.5) * crateWidth * 0.8,
                    crate.position.y + crateHeight / 2 + 0.05 + Math.random() * 0.05,
                    crate.position.z + (Math.random() - 0.5) * crateDepth * 0.8
                );
                fruit.castShadow = true;
                group.add(fruit);
            }
        }

        // Hanging string lights
        const bulbCount = 6;
        for (let i = 0; i < bulbCount; i++) {
            const bulb = new THREE.Mesh(
                new THREE.SphereGeometry(0.04, 8, 8),
                new THREE.MeshStandardMaterial({
                    color: 0xfff3b0,
                    emissive: 0xffd27f,
                    emissiveIntensity: 0.6,
                    roughness: 0.4,
                    metalness: 0.2
                })
            );
            const t = (i / (bulbCount - 1)) - 0.5;
            bulb.position.set(stallWidth * t, roofHeight - 0.05 - Math.sin(Math.PI * (i / (bulbCount - 1))) * 0.08, -stallDepth / 2 + 0.05);
            bulb.castShadow = true;
            group.add(bulb);
            this.lights.push(bulb);
        }

        return group;
    }

    update(dt) {
        this.lightPhase += dt * 2;
        this.swayTime += dt;

        const flicker = (Math.sin(this.lightPhase * 3) + 1) / 2;
        this.lights.forEach((bulb, index) => {
            const offset = Math.sin(this.lightPhase + index * 0.6) * 0.25 + flicker * 0.6;
            bulb.material.emissiveIntensity = 0.4 + offset * 0.3;
            bulb.scale.setScalar(1 + offset * 0.05);
        });

        if (this.canopyCloth) {
            const sway = Math.sin(this.swayTime * 0.8) * 0.05;
            this.canopyCloth.rotation.z = sway;
            this.canopyCloth.position.y = this.canopyBaseY + Math.sin(this.swayTime) * 0.02;
        }
    }
}

EntityRegistry.register('marketStall', MarketStallEntity);
