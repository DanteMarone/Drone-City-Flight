import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class CityBlockEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'cityBlock';
        this.elapsed = 0;
        this.pulseTargets = [];
    }

    static get displayName() { return 'City Block'; }

    createMesh(params) {
        const group = new THREE.Group();
        const blockSize = params.blockSize ?? 34;
        const sidewalkWidth = params.sidewalkWidth ?? 3;
        const baseHeight = 0.4;
        const half = blockSize / 2;

        const sidewalkTexture = TextureGenerator.createSidewalk();
        sidewalkTexture.repeat.set(2, 2);
        const sidewalkMat = new THREE.MeshStandardMaterial({
            map: sidewalkTexture,
            roughness: 0.9
        });
        const baseGeo = new THREE.BoxGeometry(blockSize, baseHeight, blockSize);
        const base = new THREE.Mesh(baseGeo, sidewalkMat);
        base.position.y = baseHeight / 2;
        base.receiveShadow = true;
        group.add(base);

        const plazaSize = blockSize - sidewalkWidth * 2;
        const plazaGeo = new THREE.BoxGeometry(plazaSize, 0.2, plazaSize);
        const plazaMat = new THREE.MeshStandardMaterial({
            map: TextureGenerator.createConcrete({ scale: 2 }),
            roughness: 0.85
        });
        const plaza = new THREE.Mesh(plazaGeo, plazaMat);
        plaza.position.y = baseHeight + 0.1;
        plaza.receiveShadow = true;
        group.add(plaza);

        const buildingPositions = [
            new THREE.Vector3(-half + 6, baseHeight + 0.2, -half + 6),
            new THREE.Vector3(half - 6, baseHeight + 0.2, -half + 6),
            new THREE.Vector3(-half + 6, baseHeight + 0.2, half - 6),
            new THREE.Vector3(half - 6, baseHeight + 0.2, half - 6)
        ];

        buildingPositions.forEach((pos, index) => {
            const shop = this.createShopBuilding({
                width: 7 + Math.random() * 1.5,
                depth: 6 + Math.random() * 1.5,
                height: 6 + index + Math.random() * 3,
                label: index % 2 === 0 ? 'GLOW MART' : 'CITY DELI',
                accent: index % 2 === 0 ? '#55e6ff' : '#ffb347'
            });
            shop.position.copy(pos);
            shop.position.y += shop.userData.baseOffset || 0;
            group.add(shop);
        });

        const midBuildings = [
            { x: 0, z: -half + 7, label: 'NEON NOODLES', accent: '#ff6ad5' },
            { x: 0, z: half - 7, label: 'LOFT COFFEE', accent: '#9bff7a' }
        ];

        midBuildings.forEach((config, index) => {
            const building = this.createShopBuilding({
                width: 10,
                depth: 5,
                height: 5 + index,
                label: config.label,
                accent: config.accent
            });
            building.position.set(config.x, baseHeight + 0.2, config.z);
            group.add(building);
        });

        const lightOffsets = [
            [half - 2.2, half - 2.2],
            [-half + 2.2, half - 2.2],
            [half - 2.2, -half + 2.2],
            [-half + 2.2, -half + 2.2],
            [0, half - 2.2],
            [0, -half + 2.2]
        ];

        lightOffsets.forEach(([x, z]) => {
            const light = this.createStreetLight();
            light.position.set(x, baseHeight + 0.2, z);
            group.add(light);
        });

        return group;
    }

    createShopBuilding({ width, depth, height, label, accent }) {
        const group = new THREE.Group();

        const facadeTexture = TextureGenerator.createBuildingFacade({
            color: '#7b8790',
            windowColor: '#1f3b4d',
            floors: 6,
            cols: 4
        });
        facadeTexture.repeat.set(1, 1);

        const facadeMat = new THREE.MeshStandardMaterial({
            map: facadeTexture,
            roughness: 0.8
        });
        const bodyGeo = new THREE.BoxGeometry(width, height, depth);
        const body = new THREE.Mesh(bodyGeo, facadeMat);
        body.position.y = height / 2;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        const roofGeo = new THREE.BoxGeometry(width + 0.2, 0.3, depth + 0.2);
        const roofMat = new THREE.MeshStandardMaterial({
            color: 0x2a2f38,
            roughness: 0.9
        });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = height + 0.2;
        roof.castShadow = true;
        group.add(roof);

        const shopFrontGeo = new THREE.BoxGeometry(width + 0.3, 1.1, depth * 0.3);
        const shopFrontMat = new THREE.MeshStandardMaterial({
            color: 0x3a3a3a,
            roughness: 0.8
        });
        const shopFront = new THREE.Mesh(shopFrontGeo, shopFrontMat);
        shopFront.position.set(0, 0.55, depth / 2 - depth * 0.15);
        shopFront.castShadow = true;
        group.add(shopFront);

        const awningGeo = new THREE.BoxGeometry(width, 0.4, 1.1);
        const awningMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(accent).offsetHSL(0, -0.2, -0.1),
            roughness: 0.6
        });
        const awning = new THREE.Mesh(awningGeo, awningMat);
        awning.position.set(0, 1.2, depth / 2 - 0.3);
        awning.castShadow = true;
        group.add(awning);

        const signTexture = this.createSignTexture(label, accent);
        const signMat = new THREE.MeshStandardMaterial({
            map: signTexture,
            emissive: new THREE.Color(accent),
            emissiveIntensity: 0.9,
            transparent: true
        });
        const signGeo = new THREE.PlaneGeometry(width * 0.9, 1.2);
        const sign = new THREE.Mesh(signGeo, signMat);
        sign.position.set(0, height * 0.55, depth / 2 + 0.05);
        sign.castShadow = false;
        group.add(sign);

        this.pulseTargets.push({
            material: signMat,
            base: 0.9,
            variance: 0.5,
            speed: 1.4 + Math.random() * 0.8,
            offset: Math.random() * Math.PI * 2
        });

        group.userData.baseOffset = 0;
        return group;
    }

    createStreetLight() {
        const group = new THREE.Group();

        const poleMat = new THREE.MeshStandardMaterial({
            color: 0x2f2f2f,
            roughness: 0.7,
            metalness: 0.4
        });
        const poleGeo = new THREE.CylinderGeometry(0.12, 0.12, 5, 10);
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 2.5;
        pole.castShadow = true;
        group.add(pole);

        const armGeo = new THREE.BoxGeometry(1.6, 0.15, 0.15);
        const arm = new THREE.Mesh(armGeo, poleMat);
        arm.position.set(0.8, 4.6, 0);
        arm.castShadow = true;
        group.add(arm);

        const bulbMat = new THREE.MeshStandardMaterial({
            color: 0xfff2c2,
            emissive: 0xfff2c2,
            emissiveIntensity: 1.5,
            roughness: 0.3
        });
        const bulbGeo = new THREE.SphereGeometry(0.25, 16, 12);
        const bulb = new THREE.Mesh(bulbGeo, bulbMat);
        bulb.position.set(1.45, 4.45, 0);
        bulb.castShadow = true;
        group.add(bulb);

        this.pulseTargets.push({
            material: bulbMat,
            base: 1.5,
            variance: 0.6,
            speed: 2.5 + Math.random(),
            offset: Math.random() * Math.PI * 2
        });

        return group;
    }

    createSignTexture(label, accent) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#111111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = accent;
        ctx.fillRect(0, 0, canvas.width, 14);
        ctx.fillRect(0, canvas.height - 14, canvas.width, 14);

        ctx.fillStyle = '#f5f5f5';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    update(dt) {
        this.elapsed += dt;
        this.pulseTargets.forEach((pulse) => {
            const flicker = (Math.sin(this.elapsed * pulse.speed + pulse.offset) + 1) / 2;
            pulse.material.emissiveIntensity = pulse.base + flicker * pulse.variance;
        });
    }
}

EntityRegistry.register('cityBlock', CityBlockEntity);
