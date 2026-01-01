import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class CityBlockEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'cityBlock';
        this._time = 0;
        this._animatedLights = [];
    }

    static get displayName() { return 'City Block'; }

    createMesh(params) {
        const group = new THREE.Group();

        const blockSize = params.blockSize || 32;
        const sidewalkWidth = params.sidewalkWidth || 2.6;
        const sidewalkHeight = 0.25;
        const groundHeight = 0.2;
        const shopDepth = 4.2;
        const shopWidth = 5.2;
        const shopHeight = 3.6;

        this.params.blockSize = blockSize;
        this.params.sidewalkWidth = sidewalkWidth;

        const groundMat = new THREE.MeshStandardMaterial({
            map: TextureGenerator.createConcrete(),
            roughness: 0.9,
            metalness: 0.05
        });
        const ground = new THREE.Mesh(new THREE.BoxGeometry(blockSize, groundHeight, blockSize), groundMat);
        ground.position.y = groundHeight / 2;
        ground.receiveShadow = true;
        group.add(ground);

        const sidewalkMap = TextureGenerator.createSidewalk(256, 256);
        sidewalkMap.repeat.set(blockSize / 6, 1);
        const sidewalkMat = new THREE.MeshStandardMaterial({
            map: sidewalkMap,
            roughness: 0.95,
            metalness: 0.05
        });

        const sidewalkY = groundHeight + sidewalkHeight / 2;
        const sidewalkLongGeo = new THREE.BoxGeometry(blockSize, sidewalkHeight, sidewalkWidth);
        const sidewalkShortGeo = new THREE.BoxGeometry(sidewalkWidth, sidewalkHeight, blockSize - sidewalkWidth * 2);

        const sidewalkNorth = new THREE.Mesh(sidewalkLongGeo, sidewalkMat);
        sidewalkNorth.position.set(0, sidewalkY, blockSize / 2 - sidewalkWidth / 2);
        sidewalkNorth.receiveShadow = true;
        group.add(sidewalkNorth);

        const sidewalkSouth = new THREE.Mesh(sidewalkLongGeo, sidewalkMat);
        sidewalkSouth.position.set(0, sidewalkY, -blockSize / 2 + sidewalkWidth / 2);
        sidewalkSouth.receiveShadow = true;
        group.add(sidewalkSouth);

        const sidewalkEast = new THREE.Mesh(sidewalkShortGeo, sidewalkMat);
        sidewalkEast.position.set(blockSize / 2 - sidewalkWidth / 2, sidewalkY, 0);
        sidewalkEast.receiveShadow = true;
        group.add(sidewalkEast);

        const sidewalkWest = new THREE.Mesh(sidewalkShortGeo, sidewalkMat);
        sidewalkWest.position.set(-blockSize / 2 + sidewalkWidth / 2, sidewalkY, 0);
        sidewalkWest.receiveShadow = true;
        group.add(sidewalkWest);

        const plazaGeo = new THREE.BoxGeometry(blockSize - sidewalkWidth * 2.2, 0.12, blockSize - sidewalkWidth * 2.2);
        const plazaMat = new THREE.MeshStandardMaterial({
            map: TextureGenerator.createConcrete(),
            roughness: 0.85,
            metalness: 0.05
        });
        const plaza = new THREE.Mesh(plazaGeo, plazaMat);
        plaza.position.y = groundHeight + 0.06;
        plaza.receiveShadow = true;
        group.add(plaza);

        const shopLabels = ['Cafe', 'Market', 'Books', 'Bakery', 'Studio', 'Deli', 'Arcade', 'Pharmacy'];
        const shopColors = [0x6e6f7b, 0x6b5b4c, 0x4f6b74, 0x755a5a];
        const accentColors = [0xffb347, 0x7dd3fc, 0xf472b6, 0xa7f3d0];

        const createShop = (label, accent, rotation = 0) => {
            const shopGroup = new THREE.Group();
            const bodyTex = TextureGenerator.createBuildingFacade({
                color: `#${shopColors[Math.floor(Math.random() * shopColors.length)].toString(16).padStart(6, '0')}`,
                windowColor: '#1f2937',
                floors: 2,
                cols: 3,
                width: 256,
                height: 256
            });
            const bodyMat = new THREE.MeshStandardMaterial({
                map: bodyTex,
                roughness: 0.85,
                metalness: 0.05
            });
            const body = new THREE.Mesh(new THREE.BoxGeometry(shopWidth, shopHeight, shopDepth), bodyMat);
            body.position.y = shopHeight / 2;
            body.castShadow = true;
            body.receiveShadow = true;
            shopGroup.add(body);

            const awningMat = new THREE.MeshStandardMaterial({
                color: accent,
                roughness: 0.6,
                metalness: 0.1
            });
            const awning = new THREE.Mesh(
                new THREE.BoxGeometry(shopWidth * 1.05, 0.2, 0.9),
                awningMat
            );
            awning.position.set(0, shopHeight * 0.65, shopDepth / 2 + 0.45);
            awning.castShadow = true;
            shopGroup.add(awning);

            const signTexture = this.createShopSignTexture(label, accent);
            const signMat = new THREE.MeshStandardMaterial({
                map: signTexture,
                emissive: new THREE.Color(accent),
                emissiveIntensity: 0.6,
                roughness: 0.4,
                metalness: 0.1
            });
            const sign = new THREE.Mesh(new THREE.PlaneGeometry(shopWidth * 0.9, 1.2), signMat);
            sign.position.set(0, shopHeight * 0.85, shopDepth / 2 + 0.02);
            shopGroup.add(sign);

            this._animatedLights.push({
                material: signMat,
                base: 0.5,
                variance: 0.35,
                speed: 1.4,
                offset: Math.random() * Math.PI * 2
            });

            shopGroup.rotation.y = rotation;
            return shopGroup;
        };

        const shopOffsets = [-blockSize * 0.2, blockSize * 0.2];
        let labelIndex = 0;
        shopOffsets.forEach((offset) => {
            const shop = createShop(shopLabels[labelIndex % shopLabels.length], accentColors[labelIndex % accentColors.length], 0);
            shop.position.set(offset, groundHeight, blockSize / 2 - sidewalkWidth - shopDepth / 2);
            group.add(shop);
            labelIndex += 1;
        });
        shopOffsets.forEach((offset) => {
            const shop = createShop(shopLabels[labelIndex % shopLabels.length], accentColors[labelIndex % accentColors.length], Math.PI);
            shop.position.set(offset, groundHeight, -blockSize / 2 + sidewalkWidth + shopDepth / 2);
            group.add(shop);
            labelIndex += 1;
        });
        shopOffsets.forEach((offset) => {
            const shop = createShop(shopLabels[labelIndex % shopLabels.length], accentColors[labelIndex % accentColors.length], -Math.PI / 2);
            shop.position.set(blockSize / 2 - sidewalkWidth - shopDepth / 2, groundHeight, offset);
            group.add(shop);
            labelIndex += 1;
        });
        shopOffsets.forEach((offset) => {
            const shop = createShop(shopLabels[labelIndex % shopLabels.length], accentColors[labelIndex % accentColors.length], Math.PI / 2);
            shop.position.set(-blockSize / 2 + sidewalkWidth + shopDepth / 2, groundHeight, offset);
            group.add(shop);
            labelIndex += 1;
        });

        const towerConfigs = [
            { x: -6.5, z: -5.5, size: 6.5, height: 14 + Math.random() * 6, color: '#6b7280' },
            { x: 7.0, z: 6.0, size: 5.8, height: 12 + Math.random() * 7, color: '#7b6d5d' },
            { x: -6.5, z: 7.0, size: 5.2, height: 10 + Math.random() * 5, color: '#5f6b74' }
        ];

        towerConfigs.forEach((config) => {
            const facade = TextureGenerator.createBuildingFacade({
                color: config.color,
                windowColor: '#1e293b',
                floors: Math.floor(config.height / 2),
                cols: 4,
                width: 512,
                height: 512
            });
            const towerMat = new THREE.MeshStandardMaterial({
                map: facade,
                roughness: 0.8,
                metalness: 0.1
            });
            const tower = new THREE.Mesh(
                new THREE.BoxGeometry(config.size, config.height, config.size),
                towerMat
            );
            tower.position.set(config.x, groundHeight + config.height / 2, config.z);
            tower.castShadow = true;
            tower.receiveShadow = true;
            group.add(tower);

            const roof = new THREE.Mesh(
                new THREE.BoxGeometry(config.size * 0.7, 0.6, config.size * 0.7),
                new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.7 })
            );
            roof.position.set(config.x, groundHeight + config.height + 0.3, config.z);
            roof.castShadow = true;
            group.add(roof);
        });

        const createStreetLight = (x, z) => {
            const poleMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.5, metalness: 0.7 });
            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 5.8, 12), poleMat);
            pole.position.set(x, groundHeight + 2.9, z);
            pole.castShadow = true;
            group.add(pole);

            const arm = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.12), poleMat);
            arm.position.set(x + 0.7, groundHeight + 5.3, z);
            arm.castShadow = true;
            group.add(arm);

            const bulbMat = new THREE.MeshStandardMaterial({
                color: 0xfff4c2,
                emissive: new THREE.Color(0xffe8a3),
                emissiveIntensity: 0.9,
                roughness: 0.3,
                metalness: 0.1
            });
            const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), bulbMat);
            bulb.position.set(x + 1.1, groundHeight + 5.3, z);
            bulb.castShadow = true;
            group.add(bulb);

            this._animatedLights.push({
                material: bulbMat,
                base: 0.9,
                variance: 0.25,
                speed: 2.1,
                offset: Math.random() * Math.PI * 2
            });
        };

        const lightOffset = blockSize / 2 - sidewalkWidth * 0.6;
        createStreetLight(lightOffset, lightOffset);
        createStreetLight(-lightOffset, lightOffset);
        createStreetLight(lightOffset, -lightOffset);
        createStreetLight(-lightOffset, -lightOffset);

        return group;
    }

    createShopSignTexture(label, accent) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const accentHex = `#${accent.toString(16).padStart(6, '0')}`;

        ctx.fillStyle = '#111827';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = accentHex;
        ctx.lineWidth = 8;
        ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

        ctx.fillStyle = accentHex;
        ctx.font = 'bold 44px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, canvas.width / 2, canvas.height / 2 + 6);

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    update(dt) {
        this._time += dt;
        this._animatedLights.forEach((light) => {
            const pulse = Math.sin(this._time * light.speed + light.offset) * light.variance;
            light.material.emissiveIntensity = THREE.MathUtils.clamp(light.base + pulse, 0.2, 1.4);
        });
    }
}

EntityRegistry.register('cityBlock', CityBlockEntity);
