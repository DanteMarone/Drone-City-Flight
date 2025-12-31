import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

const BOOTH_COLORS = [
    0xc0392b,
    0x1f6feb,
    0x16a34a,
    0xf59e0b
];

const SIGN_MESSAGES = ['CALL', 'LINK', 'DIAL'];

const createSignTexture = (label, accent) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0b1119';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = `#${accent.toString(16).padStart(6, '0')}`;
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 52px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, canvas.width / 2, canvas.height / 2 + 4);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
};

export class PhoneBoothEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'phoneBooth';
        this._time = Math.random() * Math.PI * 2;
        this._signMaterial = null;
        this._interiorLightMaterial = null;
        this._lightHandle = null;
        this._accentColor = null;
        this._lightAnchor = new THREE.Vector3();
    }

    static get displayName() { return 'Phone Booth'; }

    createMesh(params) {
        const group = new THREE.Group();

        const width = params.width || 1.2;
        const depth = params.depth || 1.08;
        const baseHeight = 0.12;
        const frameHeight = params.height || 2.3;
        const roofHeight = 0.18;

        const accent = params.color || BOOTH_COLORS[Math.floor(Math.random() * BOOTH_COLORS.length)];
        this._accentColor = accent;

        const frameTex = TextureGenerator.createConcrete();
        frameTex.wrapS = THREE.RepeatWrapping;
        frameTex.wrapT = THREE.RepeatWrapping;
        frameTex.repeat.set(1.5, 2.2);

        const frameMat = new THREE.MeshStandardMaterial({
            color: accent,
            map: frameTex,
            roughness: 0.45,
            metalness: 0.35
        });

        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x1c2028,
            roughness: 0.8,
            metalness: 0.1
        });

        const base = new THREE.Mesh(new THREE.BoxGeometry(width * 1.05, baseHeight, depth * 1.05), baseMat);
        base.position.y = baseHeight / 2;
        base.receiveShadow = true;
        group.add(base);

        const columnGeo = new THREE.BoxGeometry(0.12, frameHeight, 0.12);
        const columnOffsets = [
            [-width / 2 + 0.06, baseHeight + frameHeight / 2, -depth / 2 + 0.06],
            [width / 2 - 0.06, baseHeight + frameHeight / 2, -depth / 2 + 0.06],
            [-width / 2 + 0.06, baseHeight + frameHeight / 2, depth / 2 - 0.06],
            [width / 2 - 0.06, baseHeight + frameHeight / 2, depth / 2 - 0.06]
        ];
        columnOffsets.forEach((pos) => {
            const column = new THREE.Mesh(columnGeo, frameMat);
            column.position.set(pos[0], pos[1], pos[2]);
            column.castShadow = true;
            column.receiveShadow = true;
            group.add(column);
        });

        const topFrame = new THREE.Mesh(
            new THREE.BoxGeometry(width, 0.12, depth),
            frameMat
        );
        topFrame.position.y = baseHeight + frameHeight + 0.06;
        topFrame.castShadow = true;
        topFrame.receiveShadow = true;
        group.add(topFrame);

        const roofMat = new THREE.MeshStandardMaterial({
            color: 0x111827,
            roughness: 0.6,
            metalness: 0.4
        });
        const roof = new THREE.Mesh(new THREE.BoxGeometry(width * 1.04, roofHeight, depth * 1.04), roofMat);
        roof.position.y = baseHeight + frameHeight + roofHeight / 2 + 0.12;
        roof.castShadow = true;
        roof.receiveShadow = true;
        group.add(roof);

        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x7dd3fc,
            transparent: true,
            opacity: 0.35,
            roughness: 0.1,
            metalness: 0.1,
            emissive: new THREE.Color(0x1b4965),
            emissiveIntensity: 0.15
        });

        const glassHeight = frameHeight * 0.86;
        const glassY = baseHeight + frameHeight * 0.55;
        const sideGlassGeo = new THREE.PlaneGeometry(depth * 0.78, glassHeight);
        const frontGlassGeo = new THREE.PlaneGeometry(width * 0.78, glassHeight);

        const leftGlass = new THREE.Mesh(sideGlassGeo, glassMat);
        leftGlass.rotation.y = Math.PI / 2;
        leftGlass.position.set(-width / 2 + 0.07, glassY, 0);
        group.add(leftGlass);

        const rightGlass = new THREE.Mesh(sideGlassGeo, glassMat);
        rightGlass.rotation.y = -Math.PI / 2;
        rightGlass.position.set(width / 2 - 0.07, glassY, 0);
        group.add(rightGlass);

        const backGlass = new THREE.Mesh(frontGlassGeo, glassMat);
        backGlass.rotation.y = Math.PI;
        backGlass.position.set(0, glassY, -depth / 2 + 0.07);
        group.add(backGlass);

        const doorGlass = new THREE.Mesh(frontGlassGeo, glassMat);
        doorGlass.position.set(0, glassY, depth / 2 - 0.07);
        group.add(doorGlass);

        const handle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.015, 0.3, 12),
            new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.3, metalness: 0.7 })
        );
        handle.rotation.z = Math.PI / 2;
        handle.position.set(width * 0.2, glassY, depth / 2 + 0.01);
        group.add(handle);

        const signText = params.signText || SIGN_MESSAGES[Math.floor(Math.random() * SIGN_MESSAGES.length)];
        const signTexture = createSignTexture(signText, accent);
        this._signMaterial = new THREE.MeshStandardMaterial({
            map: signTexture,
            emissive: new THREE.Color(0xffffff),
            emissiveIntensity: 1.1,
            roughness: 0.4,
            metalness: 0.2
        });
        const signGeo = new THREE.PlaneGeometry(width * 0.9, 0.32);
        const signFront = new THREE.Mesh(signGeo, this._signMaterial);
        signFront.position.set(0, baseHeight + frameHeight + 0.28, depth / 2 + 0.01);
        group.add(signFront);

        const signBack = new THREE.Mesh(signGeo, this._signMaterial);
        signBack.rotation.y = Math.PI;
        signBack.position.set(0, baseHeight + frameHeight + 0.28, -depth / 2 - 0.01);
        group.add(signBack);

        const phoneGroup = new THREE.Group();
        phoneGroup.position.set(0, baseHeight + frameHeight * 0.5, -depth / 2 + 0.2);
        group.add(phoneGroup);

        const consoleMat = new THREE.MeshStandardMaterial({
            color: 0x2f3640,
            roughness: 0.5,
            metalness: 0.4
        });
        const consoleBox = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.32, 0.2), consoleMat);
        consoleBox.castShadow = true;
        phoneGroup.add(consoleBox);

        const panelTexture = TextureGenerator.createBuildingFacade({
            color: '#10141b',
            windowColor: '#3b82f6',
            floors: 3,
            cols: 4,
            width: 128,
            height: 96
        });
        const panelMat = new THREE.MeshStandardMaterial({
            map: panelTexture,
            roughness: 0.35,
            metalness: 0.2,
            emissive: new THREE.Color(0x1d4ed8),
            emissiveIntensity: 0.6
        });
        const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.22), panelMat);
        panel.position.set(0, 0.08, 0.12);
        phoneGroup.add(panel);

        const handsetMat = new THREE.MeshStandardMaterial({
            color: 0x111827,
            roughness: 0.5,
            metalness: 0.3
        });
        const handset = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.42, 16), handsetMat);
        handset.rotation.z = Math.PI / 2;
        handset.position.set(0, 0.2, -0.02);
        phoneGroup.add(handset);

        const cord = new THREE.Mesh(
            new THREE.TorusGeometry(0.12, 0.02, 12, 32, Math.PI * 1.4),
            handsetMat
        );
        cord.rotation.y = Math.PI / 2;
        cord.position.set(0.18, -0.02, 0.02);
        phoneGroup.add(cord);

        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            roughness: 0.9,
            metalness: 0.05
        });
        const floor = new THREE.Mesh(new THREE.BoxGeometry(width * 0.82, 0.03, depth * 0.82), floorMat);
        floor.position.y = baseHeight + 0.02;
        floor.receiveShadow = true;
        group.add(floor);

        const interiorLightMat = new THREE.MeshStandardMaterial({
            color: 0xf8fafc,
            emissive: new THREE.Color(0x93c5fd),
            emissiveIntensity: 1.2,
            transparent: true,
            opacity: 0.85
        });
        this._interiorLightMaterial = interiorLightMat;
        const interiorLight = new THREE.Mesh(new THREE.BoxGeometry(width * 0.4, 0.06, depth * 0.4), interiorLightMat);
        interiorLight.position.set(0, baseHeight + frameHeight - 0.05, 0);
        group.add(interiorLight);

        this._lightAnchor.set(0, interiorLight.position.y, 0);

        return group;
    }

    postInit() {
        const lightSystem = this.params.lightSystem || window.app?.world?.lightSystem;
        if (lightSystem && this.mesh) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightAnchor.clone().applyMatrix4(this.mesh.matrixWorld);
            this._lightHandle = lightSystem.register(worldPos, this._accentColor || 0x93c5fd, 1.2, 10);
            if (this._lightHandle) {
                this._lightHandle.parentMesh = this.mesh;
            }
        }
    }

    update(dt) {
        this._time += dt;
        const flicker = 0.9 + Math.sin(this._time * 2.8) * 0.2 + Math.sin(this._time * 11.7) * 0.08;

        if (this._signMaterial) {
            this._signMaterial.emissiveIntensity = 0.9 + Math.max(0.1, flicker) * 0.6;
        }

        if (this._interiorLightMaterial) {
            this._interiorLightMaterial.emissiveIntensity = 1.0 + Math.sin(this._time * 3.4) * 0.25;
        }

        if (this._lightHandle) {
            this._lightHandle.intensity = 1.0 + Math.max(0.2, flicker) * 0.7;
        }
    }
}

EntityRegistry.register('phoneBooth', PhoneBoothEntity);
