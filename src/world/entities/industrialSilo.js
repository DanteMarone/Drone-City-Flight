import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textureGenerator.js';

export class IndustrialSiloEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'industrialSilo';
    }

    static get displayName() { return 'Industrial Silo'; }

    // Static cache for texture and materials
    static cachedStripeTexture = null;
    static cachedMaterials = null;

    static getMaterials() {
        if (!IndustrialSiloEntity.cachedMaterials) {
            IndustrialSiloEntity.cachedMaterials = {
                body: new THREE.MeshStandardMaterial({
                    color: 0xcccccc,
                    roughness: 0.4,
                    metalness: 0.6
                }),
                roof: new THREE.MeshStandardMaterial({
                    color: 0xeeeeee,
                    roughness: 0.5,
                    metalness: 0.4
                }),
                legs: new THREE.MeshStandardMaterial({ color: 0x444444 }),
                ladder: new THREE.MeshStandardMaterial({ color: 0x333333 })
            };
        }
        return IndustrialSiloEntity.cachedMaterials;
    }

    static getStripeTexture() {
        if (!IndustrialSiloEntity.cachedStripeTexture) {
             const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');

            // Fill yellow
            ctx.fillStyle = '#ffcc00';
            ctx.fillRect(0, 0, 256, 64);

            // Draw black stripes
            ctx.fillStyle = '#000000';
            for (let i = -64; i < 256; i += 32) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i + 16, 0);
                ctx.lineTo(i - 16, 64);
                ctx.lineTo(i - 32, 64);
                ctx.fill();
            }

            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.ClampToEdgeWrapping;
            tex.repeat.set(4, 1);
            IndustrialSiloEntity.cachedStripeTexture = tex;
        }
        return IndustrialSiloEntity.cachedStripeTexture;
    }

    createMesh(params) {
        const height = params.height || 10;
        const radius = params.radius || 3;

        const group = new THREE.Group();
        const mats = IndustrialSiloEntity.getMaterials();

        // 1. Main Tank Body (Metallic Cylinder)
        const bodyGeo = new THREE.CylinderGeometry(radius, radius, height, 16);
        const body = new THREE.Mesh(bodyGeo, mats.body);
        body.position.y = height / 2;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        // 2. Conical Roof
        const roofHeight = 2;
        const roofGeo = new THREE.ConeGeometry(radius + 0.2, roofHeight, 16);
        const roof = new THREE.Mesh(roofGeo, mats.roof);
        roof.position.y = height + roofHeight / 2;
        roof.castShadow = true;
        group.add(roof);

        // 3. Support Legs
        const legCount = 4;
        const legHeight = 2;
        const legRadius = 0.3;
        const legGeo = new THREE.CylinderGeometry(legRadius, legRadius, legHeight, 8);

        // Lift the whole tank up by legHeight
        body.position.y += legHeight;
        roof.position.y += legHeight;

        for (let i = 0; i < legCount; i++) {
            const angle = (i / legCount) * Math.PI * 2;
            const lx = Math.cos(angle) * (radius * 0.8);
            const lz = Math.sin(angle) * (radius * 0.8);

            const leg = new THREE.Mesh(legGeo, mats.legs);
            leg.position.set(lx, legHeight / 2, lz);
            leg.castShadow = true;
            group.add(leg);
        }

        // 4. External Ladder
        const ladderWidth = 1.0;
        const ladderDepth = 0.2;
        const ladderRailGeo = new THREE.BoxGeometry(0.1, height + legHeight, 0.1);
        const ladderRungGeo = new THREE.BoxGeometry(ladderWidth, 0.1, 0.1);

        const ladderGroup = new THREE.Group();
        // Position ladder on the side
        ladderGroup.position.set(radius + 0.5, (height + legHeight) / 2, 0);

        // Rails
        const rail1 = new THREE.Mesh(ladderRailGeo, mats.ladder);
        rail1.position.x = -ladderWidth / 2;
        const rail2 = new THREE.Mesh(ladderRailGeo, mats.ladder);
        rail2.position.x = ladderWidth / 2;
        ladderGroup.add(rail1, rail2);

        // Rungs
        const rungCount = Math.floor((height + legHeight) / 0.5);
        for (let i = 0; i < rungCount; i++) {
            const rung = new THREE.Mesh(ladderRungGeo, mats.ladder);
            // Local Y position within the ladder group
            // Bottom of ladder is at -(height + legHeight)/2
            const yPos = -((height + legHeight) / 2) + (i * 0.5);
            rung.position.y = yPos;
            ladderGroup.add(rung);
        }

        group.add(ladderGroup);

        // 5. Caution Stripes (Canvas Texture) on the tank
        // Create a band around the middle
        const bandGeo = new THREE.CylinderGeometry(radius + 0.05, radius + 0.05, 1, 32);
        const stripeTexture = IndustrialSiloEntity.getStripeTexture();
        const bandMat = new THREE.MeshBasicMaterial({ map: stripeTexture });
        const band = new THREE.Mesh(bandGeo, bandMat);
        band.position.y = height / 2 + legHeight;
        group.add(band);

        return group;
    }
}

EntityRegistry.register('industrialSilo', IndustrialSiloEntity);
