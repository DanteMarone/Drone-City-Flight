import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

function createDirectoryTexture(accentColor, highlightColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1b1f2b');
    gradient.addColorStop(1, '#0c0f18');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(18, 18, canvas.width - 36, canvas.height - 36);

    ctx.fillStyle = accentColor;
    ctx.fillRect(22, 22, canvas.width - 44, 70);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MALL DIRECTORY', canvas.width / 2, 66);

    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(26, 110, canvas.width - 52, canvas.height - 160);

    const mapStartY = 128;
    const mapHeight = 250;
    const mapWidth = canvas.width - 72;
    const mapX = 36;
    const blockRows = 3;
    const blockCols = 3;
    const blockGap = 8;
    const blockWidth = (mapWidth - blockGap * (blockCols - 1)) / blockCols;
    const blockHeight = (mapHeight - blockGap * (blockRows - 1)) / blockRows;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (let row = 0; row < blockRows; row++) {
        for (let col = 0; col < blockCols; col++) {
            const x = mapX + col * (blockWidth + blockGap);
            const y = mapStartY + row * (blockHeight + blockGap);
            ctx.fillRect(x, y, blockWidth, blockHeight);
        }
    }

    ctx.fillStyle = highlightColor;
    ctx.fillRect(mapX + blockWidth + blockGap, mapStartY + blockHeight + blockGap, blockWidth, blockHeight);

    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    const listings = ['Atrium Court', 'Food Hall', 'Skyline Cinema', 'Tech Boutique', 'Crystal Plaza'];
    listings.forEach((label, index) => {
        ctx.fillText(label, 40, 410 + index * 20);
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

export class MallDirectoryEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'mallDirectory';
        this._pulseTime = Math.random() * Math.PI * 2;
        this._accentMaterial = null;
        this._ring = null;
    }

    static get displayName() { return 'Mall Directory'; }

    createMesh(params) {
        const group = new THREE.Group();

        const height = params.height || 2.4 + Math.random() * 0.4;
        const screenWidth = params.screenWidth || 1.1;
        const screenHeight = params.screenHeight || height * 0.85;
        const baseWidth = params.baseWidth || 1.3;
        const baseDepth = params.baseDepth || 0.9;

        this.params.height = height;
        this.params.screenWidth = screenWidth;
        this.params.screenHeight = screenHeight;
        this.params.baseWidth = baseWidth;
        this.params.baseDepth = baseDepth;

        const concreteTexture = TextureGenerator.createConcrete();
        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x777d86,
            roughness: 0.85,
            metalness: 0.1,
            map: concreteTexture
        });
        const metalMat = new THREE.MeshStandardMaterial({
            color: 0x3b424d,
            roughness: 0.4,
            metalness: 0.7
        });

        const accentColor = new THREE.Color().setHSL(0.78 + Math.random() * 0.08, 0.65, 0.55);
        const accentHex = `#${accentColor.getHexString()}`;
        const highlightColor = '#7ff0ff';

        this._accentMaterial = new THREE.MeshStandardMaterial({
            color: accentColor,
            emissive: accentColor,
            emissiveIntensity: 0.75,
            roughness: 0.25,
            metalness: 0.2
        });

        const baseGeo = new THREE.BoxGeometry(baseWidth, 0.25, baseDepth);
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.125;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const columnGeo = new THREE.BoxGeometry(0.45, height * 0.55, 0.45);
        const column = new THREE.Mesh(columnGeo, metalMat);
        column.position.y = 0.25 + height * 0.275;
        column.castShadow = true;
        column.receiveShadow = true;
        group.add(column);

        const screenFrameGeo = new THREE.BoxGeometry(screenWidth + 0.12, screenHeight + 0.12, 0.15);
        const screenFrame = new THREE.Mesh(screenFrameGeo, metalMat);
        screenFrame.position.set(0, 0.25 + screenHeight * 0.5, 0.25);
        screenFrame.castShadow = true;
        screenFrame.receiveShadow = true;
        group.add(screenFrame);

        const screenTexture = createDirectoryTexture(accentHex, highlightColor);
        const screenMat = new THREE.MeshStandardMaterial({
            map: screenTexture,
            emissiveMap: screenTexture,
            emissive: new THREE.Color(0xffffff),
            emissiveIntensity: 0.45,
            roughness: 0.5,
            metalness: 0.1
        });

        const screenGeo = new THREE.PlaneGeometry(screenWidth, screenHeight);
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.set(0, 0.25 + screenHeight * 0.5, 0.34);
        screen.castShadow = false;
        screen.receiveShadow = false;
        group.add(screen);

        const sideLightGeo = new THREE.BoxGeometry(0.06, screenHeight * 0.85, 0.06);
        const leftLight = new THREE.Mesh(sideLightGeo, this._accentMaterial);
        leftLight.position.set(-screenWidth / 2 - 0.07, 0.25 + screenHeight * 0.5, 0.3);
        leftLight.castShadow = true;
        group.add(leftLight);

        const rightLight = leftLight.clone();
        rightLight.position.x = screenWidth / 2 + 0.07;
        group.add(rightLight);

        const capGeo = new THREE.CylinderGeometry(0.36, 0.45, 0.12, 16);
        const cap = new THREE.Mesh(capGeo, metalMat);
        cap.position.y = 0.25 + height * 0.8;
        cap.castShadow = true;
        cap.receiveShadow = true;
        group.add(cap);

        const ringGeo = new THREE.TorusGeometry(0.45, 0.05, 12, 24);
        this._ring = new THREE.Mesh(ringGeo, this._accentMaterial);
        this._ring.position.y = 0.25 + height * 0.95;
        this._ring.rotation.x = Math.PI / 2;
        this._ring.castShadow = true;
        group.add(this._ring);

        const logoGeo = new THREE.CircleGeometry(0.22, 24);
        const logoMat = new THREE.MeshStandardMaterial({
            color: 0xf1f6ff,
            emissive: accentColor,
            emissiveIntensity: 0.35,
            roughness: 0.3,
            metalness: 0.2
        });
        const logo = new THREE.Mesh(logoGeo, logoMat);
        logo.position.set(0, 0.25 + height * 0.95, 0);
        logo.rotation.x = -Math.PI / 2;
        logo.castShadow = true;
        group.add(logo);

        return group;
    }

    update(dt) {
        if (!this._accentMaterial || !this._ring) return;
        this._pulseTime += dt;
        const pulse = 0.55 + Math.sin(this._pulseTime * 2.4) * 0.25;
        this._accentMaterial.emissiveIntensity = THREE.MathUtils.clamp(pulse, 0.25, 0.95);
        this._ring.rotation.z += dt * 0.6;
    }
}

EntityRegistry.register('mallDirectory', MallDirectoryEntity);
