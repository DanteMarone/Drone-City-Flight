import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class MallDirectoryKioskEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'mallDirectoryKiosk';
        this._time = Math.random() * Math.PI * 2;
        this._ring = null;
        this._screenMaterials = [];
        this._accentMaterials = [];
    }

    static get displayName() { return 'Mall Directory'; }

    createMesh(params) {
        const group = new THREE.Group();

        const height = params.height || 2.2;
        const width = params.width || 1.4;
        const depth = params.depth || 0.6;

        this.params.height = height;
        this.params.width = width;
        this.params.depth = depth;

        const baseHeight = 0.16;
        const concreteTex = TextureGenerator.createConcrete();
        concreteTex.wrapS = THREE.RepeatWrapping;
        concreteTex.wrapT = THREE.RepeatWrapping;
        concreteTex.repeat.set(1.2, 0.9);

        const baseMat = new THREE.MeshStandardMaterial({
            color: 0xb7bcc6,
            map: concreteTex,
            roughness: 0.85,
            metalness: 0.08
        });
        const plinth = new THREE.Mesh(new THREE.BoxGeometry(width * 1.12, baseHeight, depth * 1.08), baseMat);
        plinth.position.y = baseHeight / 2;
        plinth.castShadow = true;
        plinth.receiveShadow = true;
        group.add(plinth);

        const pedestalHeight = height * 0.32;
        const pedestalMat = new THREE.MeshStandardMaterial({
            color: 0x3b404a,
            roughness: 0.55,
            metalness: 0.35
        });
        const pedestal = new THREE.Mesh(new THREE.BoxGeometry(width * 0.68, pedestalHeight, depth * 0.52), pedestalMat);
        pedestal.position.y = baseHeight + pedestalHeight / 2;
        pedestal.castShadow = true;
        pedestal.receiveShadow = true;
        group.add(pedestal);

        const coreHeight = height * 0.75;
        const coreMat = new THREE.MeshStandardMaterial({
            color: 0xe1e5ee,
            roughness: 0.45,
            metalness: 0.2
        });
        const core = new THREE.Mesh(new THREE.BoxGeometry(width * 0.86, coreHeight, depth * 0.38), coreMat);
        core.position.y = baseHeight + pedestalHeight + coreHeight / 2 - 0.04;
        core.castShadow = true;
        core.receiveShadow = true;
        group.add(core);

        const headerHeight = 0.22;
        const headerMat = new THREE.MeshStandardMaterial({
            color: 0x111827,
            roughness: 0.4,
            metalness: 0.6
        });
        const header = new THREE.Mesh(new THREE.BoxGeometry(width * 0.92, headerHeight, depth * 0.45), headerMat);
        header.position.y = baseHeight + pedestalHeight + coreHeight + headerHeight / 2 - 0.04;
        header.castShadow = true;
        header.receiveShadow = true;
        group.add(header);

        const headerFaceTex = this.createHeaderTexture();
        const headerFaceMat = new THREE.MeshStandardMaterial({
            map: headerFaceTex,
            emissive: new THREE.Color(0x60f2ff),
            emissiveIntensity: 1.1,
            roughness: 0.4,
            metalness: 0.2,
            transparent: true
        });
        this._accentMaterials.push(headerFaceMat);
        const headerFace = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.72, headerHeight * 0.78), headerFaceMat);
        headerFace.position.set(0, header.position.y, depth * 0.225 + 0.01);
        group.add(headerFace);

        const screenTexture = this.createDirectoryTexture();
        const screenMat = new THREE.MeshStandardMaterial({
            map: screenTexture,
            emissive: new THREE.Color(0x3ddbf3),
            emissiveIntensity: 0.9,
            roughness: 0.4,
            metalness: 0.15
        });
        this._screenMaterials.push(screenMat);

        const screenWidth = width * 0.68;
        const screenHeight = height * 0.58;
        const screenOffsetY = baseHeight + pedestalHeight + coreHeight * 0.35;
        const screenDepth = depth * 0.24;

        const screenFrameMat = new THREE.MeshStandardMaterial({
            color: 0x1f2937,
            roughness: 0.5,
            metalness: 0.55
        });
        const screenFrame = new THREE.Mesh(new THREE.BoxGeometry(screenWidth * 1.08, screenHeight * 1.08, screenDepth), screenFrameMat);
        screenFrame.position.set(0, screenOffsetY, 0);
        screenFrame.castShadow = true;
        screenFrame.receiveShadow = true;
        group.add(screenFrame);

        const screenFront = new THREE.Mesh(new THREE.PlaneGeometry(screenWidth, screenHeight), screenMat);
        screenFront.position.set(0, screenOffsetY, screenDepth / 2 + 0.01);
        group.add(screenFront);

        const screenBack = new THREE.Mesh(new THREE.PlaneGeometry(screenWidth, screenHeight), screenMat);
        screenBack.position.set(0, screenOffsetY, -screenDepth / 2 - 0.01);
        screenBack.rotation.y = Math.PI;
        group.add(screenBack);

        const accentMat = new THREE.MeshStandardMaterial({
            color: 0x43d9ff,
            emissive: new THREE.Color(0x43d9ff),
            emissiveIntensity: 0.7,
            roughness: 0.35,
            metalness: 0.6
        });
        this._accentMaterials.push(accentMat);

        const accentLeft = new THREE.Mesh(new THREE.BoxGeometry(0.05, screenHeight * 0.9, 0.04), accentMat);
        accentLeft.position.set(-screenWidth * 0.56, screenOffsetY, screenDepth / 2 + 0.05);
        group.add(accentLeft);

        const accentRight = new THREE.Mesh(new THREE.BoxGeometry(0.05, screenHeight * 0.9, 0.04), accentMat);
        accentRight.position.set(screenWidth * 0.56, screenOffsetY, screenDepth / 2 + 0.05);
        group.add(accentRight);

        const arrowMat = new THREE.MeshStandardMaterial({
            color: 0xffc857,
            emissive: new THREE.Color(0xffb020),
            emissiveIntensity: 0.8,
            roughness: 0.4,
            metalness: 0.3
        });
        this._accentMaterials.push(arrowMat);
        const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 12), arrowMat);
        arrow.position.set(0, screenOffsetY - screenHeight * 0.32, screenDepth / 2 + 0.08);
        arrow.rotation.x = Math.PI / 2;
        group.add(arrow);

        const ringMat = new THREE.MeshStandardMaterial({
            color: 0x7cf4ff,
            emissive: new THREE.Color(0x7cf4ff),
            emissiveIntensity: 0.9,
            roughness: 0.35,
            metalness: 0.3
        });
        this._accentMaterials.push(ringMat);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(width * 0.32, 0.025, 10, 42), ringMat);
        ring.position.y = header.position.y + headerHeight * 0.6;
        ring.rotation.x = Math.PI / 2;
        ring.castShadow = true;
        group.add(ring);
        this._ring = ring;

        const footMat = new THREE.MeshStandardMaterial({
            color: 0x8a9099,
            roughness: 0.5,
            metalness: 0.4
        });
        const footPositions = [
            [-width * 0.38, baseHeight * 0.45, depth * 0.28],
            [width * 0.38, baseHeight * 0.45, depth * 0.28],
            [-width * 0.38, baseHeight * 0.45, -depth * 0.28],
            [width * 0.38, baseHeight * 0.45, -depth * 0.28]
        ];
        footPositions.forEach((position) => {
            const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, baseHeight * 0.9, 10), footMat);
            foot.position.set(position[0], position[1], position[2]);
            foot.castShadow = true;
            foot.receiveShadow = true;
            group.add(foot);
        });

        return group;
    }

    createDirectoryTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#0b1c28';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#0f2433';
        ctx.fillRect(24, 24, 464, 464);

        ctx.strokeStyle = 'rgba(93, 232, 255, 0.35)';
        ctx.lineWidth = 3;
        ctx.strokeRect(24, 24, 464, 464);

        ctx.strokeStyle = 'rgba(93, 232, 255, 0.15)';
        for (let i = 0; i < 6; i += 1) {
            const offset = 24 + i * 80;
            ctx.beginPath();
            ctx.moveTo(offset, 24);
            ctx.lineTo(offset, 488);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(24, offset);
            ctx.lineTo(488, offset);
            ctx.stroke();
        }

        const blocks = [
            { x: 64, y: 80, w: 120, h: 80 },
            { x: 208, y: 72, w: 152, h: 60 },
            { x: 96, y: 192, w: 100, h: 80 },
            { x: 240, y: 184, w: 160, h: 96 },
            { x: 80, y: 320, w: 144, h: 112 },
            { x: 256, y: 320, w: 176, h: 120 }
        ];
        ctx.fillStyle = 'rgba(72, 200, 230, 0.35)';
        blocks.forEach((block) => {
            ctx.fillRect(block.x, block.y, block.w, block.h);
            ctx.strokeStyle = 'rgba(140, 250, 255, 0.45)';
            ctx.strokeRect(block.x, block.y, block.w, block.h);
        });

        ctx.strokeStyle = 'rgba(255, 189, 64, 0.9)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(80, 120);
        ctx.lineTo(180, 220);
        ctx.lineTo(320, 220);
        ctx.lineTo(370, 340);
        ctx.stroke();

        ctx.fillStyle = '#ffd166';
        ctx.beginPath();
        ctx.arc(144, 256, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#102a3b';
        ctx.beginPath();
        ctx.arc(144, 256, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText('YOU ARE HERE', 64, 468);

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        return texture;
    }

    createHeaderTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'rgba(12, 18, 28, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'rgba(110, 245, 255, 0.6)';
        ctx.lineWidth = 6;
        ctx.strokeRect(10, 10, 492, 108);

        ctx.fillStyle = '#8df8ff';
        ctx.font = 'bold 64px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('MALL GUIDE', canvas.width / 2, canvas.height / 2 + 4);

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        return texture;
    }

    update(dt) {
        this._time += dt;
        const pulse = 0.4 + 0.3 * Math.sin(this._time * 2.6) + 0.15 * Math.sin(this._time * 6.8);

        this._screenMaterials.forEach((material) => {
            material.emissiveIntensity = THREE.MathUtils.clamp(0.7 + pulse * 0.5, 0.6, 1.4);
        });

        this._accentMaterials.forEach((material) => {
            material.emissiveIntensity = THREE.MathUtils.clamp(0.6 + pulse * 0.5, 0.5, 1.5);
        });

        if (this._ring) {
            this._ring.rotation.z += dt * 0.9;
        }
    }
}

EntityRegistry.register('mallDirectoryKiosk', MallDirectoryKioskEntity);
