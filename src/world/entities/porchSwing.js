import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

let cachedWoodTexture = null;

function createWoodTexture(baseColor = '#b07a45') {
    if (cachedWoodTexture) return cachedWoodTexture.clone();

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 14; i++) {
        const shade = 20 + Math.random() * 35;
        ctx.fillStyle = `rgba(${shade}, ${shade * 0.8}, ${shade * 0.6}, 0.25)`;
        const stripeHeight = 6 + Math.random() * 6;
        ctx.fillRect(0, i * 18 + Math.random() * 4, canvas.width, stripeHeight);
    }

    for (let i = 0; i < 500; i++) {
        const noise = Math.floor(Math.random() * 40);
        ctx.fillStyle = `rgba(${noise}, ${noise}, ${noise}, 0.12)`;
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    cachedWoodTexture = texture;
    return texture.clone();
}

export class PorchSwingEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'porchSwing';
        this.swingPhase = Math.random() * Math.PI * 2;
        this.swingSpeed = params.swingSpeed ?? 0.6 + Math.random() * 0.4;
        this.swingAmplitude = params.swingAmplitude ?? 0.18 + Math.random() * 0.08;
        this.swingGroup = null;
    }

    static get displayName() { return 'Porch Swing'; }

    createMesh(params) {
        const group = new THREE.Group();

        const width = params.width || 4.4;
        const depth = params.depth || 2.4;
        const height = params.height || 3.2;

        this.params.width = width;
        this.params.depth = depth;
        this.params.height = height;
        this.params.swingSpeed = this.swingSpeed;
        this.params.swingAmplitude = this.swingAmplitude;

        const frameColor = params.frameColor || [0x3a3f46, 0x4b4f55, 0x2f2b30][Math.floor(Math.random() * 3)];
        this.params.frameColor = frameColor;

        const woodTexture = createWoodTexture(params.woodColor || '#b07a45');
        woodTexture.repeat.set(2, 1);

        const frameMat = new THREE.MeshStandardMaterial({
            color: frameColor,
            roughness: 0.6,
            metalness: 0.4
        });
        const woodMat = new THREE.MeshStandardMaterial({
            map: woodTexture,
            roughness: 0.8
        });
        const cushionMat = new THREE.MeshStandardMaterial({
            color: params.cushionColor || 0x5f8aa8,
            roughness: 0.9
        });
        const chainMat = new THREE.MeshStandardMaterial({
            color: 0x9aa0a6,
            roughness: 0.4,
            metalness: 0.9
        });

        const legGeo = new THREE.CylinderGeometry(0.07, 0.08, height, 8);
        const legOffsets = [
            [-width / 2 + 0.2, height / 2, -depth / 2 + 0.2],
            [width / 2 - 0.2, height / 2, -depth / 2 + 0.2],
            [-width / 2 + 0.2, height / 2, depth / 2 - 0.2],
            [width / 2 - 0.2, height / 2, depth / 2 - 0.2]
        ];

        legOffsets.forEach(([x, y, z]) => {
            const leg = new THREE.Mesh(legGeo, frameMat);
            leg.position.set(x, y, z);
            leg.castShadow = true;
            leg.receiveShadow = true;
            group.add(leg);
        });

        const beamGeo = new THREE.CylinderGeometry(0.09, 0.09, width, 10);
        const topBeam = new THREE.Mesh(beamGeo, frameMat);
        topBeam.rotation.z = Math.PI / 2;
        topBeam.position.set(0, height, 0);
        topBeam.castShadow = true;
        group.add(topBeam);

        const braceGeo = new THREE.BoxGeometry(width - 0.4, 0.08, 0.1);
        const braceFront = new THREE.Mesh(braceGeo, frameMat);
        braceFront.position.set(0, height * 0.35, depth / 2 - 0.25);
        group.add(braceFront);

        const braceBack = braceFront.clone();
        braceBack.position.set(0, height * 0.35, -depth / 2 + 0.25);
        group.add(braceBack);

        const swingGroup = new THREE.Group();
        swingGroup.position.set(0, height - 0.08, 0);
        this.swingGroup = swingGroup;

        const chainGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.4, 6);
        const chainOffsetX = width * 0.25;
        const chainOffsetZ = depth * 0.2;

        const chainPositions = [
            [-chainOffsetX, -0.7, chainOffsetZ],
            [chainOffsetX, -0.7, chainOffsetZ],
            [-chainOffsetX, -0.7, -chainOffsetZ],
            [chainOffsetX, -0.7, -chainOffsetZ]
        ];

        chainPositions.forEach(([x, y, z]) => {
            const chain = new THREE.Mesh(chainGeo, chainMat);
            chain.position.set(x, y, z);
            swingGroup.add(chain);
        });

        const seatGroup = new THREE.Group();
        const seatWidth = width * 0.55;
        const seatDepth = depth * 0.5;
        const seatHeight = 0.18;

        for (let i = 0; i < 4; i++) {
            const slatGeo = new THREE.BoxGeometry(seatWidth, 0.04, seatDepth * 0.22);
            const slat = new THREE.Mesh(slatGeo, woodMat);
            slat.position.set(0, 0, (i - 1.5) * (seatDepth * 0.22 + 0.02));
            slat.castShadow = true;
            seatGroup.add(slat);
        }

        const backrestGeo = new THREE.BoxGeometry(seatWidth, seatHeight * 2.8, 0.05);
        const backrest = new THREE.Mesh(backrestGeo, woodMat);
        backrest.position.set(0, seatHeight * 1.4, -seatDepth * 0.45);
        backrest.castShadow = true;
        seatGroup.add(backrest);

        const armGeo = new THREE.BoxGeometry(0.1, 0.08, seatDepth * 0.6);
        const armLeft = new THREE.Mesh(armGeo, woodMat);
        armLeft.position.set(-seatWidth / 2 + 0.05, seatHeight * 0.8, 0);
        seatGroup.add(armLeft);

        const armRight = armLeft.clone();
        armRight.position.set(seatWidth / 2 - 0.05, seatHeight * 0.8, 0);
        seatGroup.add(armRight);

        const cushionGeo = new THREE.BoxGeometry(seatWidth * 0.9, 0.08, seatDepth * 0.7);
        const cushion = new THREE.Mesh(cushionGeo, cushionMat);
        cushion.position.set(0, 0.08, 0);
        cushion.castShadow = true;
        seatGroup.add(cushion);

        seatGroup.position.set(0, -1.55, 0);
        swingGroup.add(seatGroup);
        group.add(swingGroup);

        return group;
    }

    update(dt) {
        if (!this.swingGroup) return;
        this.swingPhase += dt * this.swingSpeed;
        this.swingGroup.rotation.x = Math.sin(this.swingPhase) * this.swingAmplitude;
    }
}

EntityRegistry.register('porchSwing', PorchSwingEntity);
