import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

function createDirectoryTexture(accentColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 384;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0e1117';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(70, 120, 160, 0.45)');
    gradient.addColorStop(1, 'rgba(10, 30, 50, 0.65)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let y = 20; y < canvas.height; y += 40) {
        ctx.fillRect(18, y, canvas.width - 36, 16);
    }

    ctx.fillStyle = '#1c2634';
    ctx.fillRect(24, 28, 208, 160);
    ctx.strokeStyle = 'rgba(220, 235, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 28, 208, 160);

    for (let i = 0; i < 8; i++) {
        const blockWidth = 36 + Math.random() * 24;
        const blockHeight = 18 + Math.random() * 22;
        const x = 32 + Math.random() * 160;
        const y = 36 + Math.random() * 120;
        ctx.fillStyle = `rgba(130, 180, 220, ${0.15 + Math.random() * 0.2})`;
        ctx.fillRect(x, y, blockWidth, blockHeight);
    }

    ctx.fillStyle = '#ff556b';
    ctx.beginPath();
    ctx.arc(180, 140, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = accentColor;
    ctx.fillRect(24, 210, 208, 8);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = '22px sans-serif';
    ctx.fillText('MALL DIRECTORY', 32, 252);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '16px sans-serif';
    ctx.fillText('Level 2 • Dining • Cinemas', 32, 280);
    ctx.fillText('You Are Here', 32, 310);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
}

export class MallDirectoryKioskEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'mallDirectoryKiosk';
        this._time = Math.random() * Math.PI * 2;
        this._screenMaterial = null;
        this._beaconGroup = null;
        this._accentColor = params.accentColor || 0x5ad6ff;
    }

    static get displayName() { return 'Mall Directory'; }

    createMesh(params = {}) {
        const group = new THREE.Group();

        const width = params.width ?? 1.3;
        const height = params.height ?? 2.4;
        const depth = params.depth ?? 0.6;
        const accentColor = params.accentColor ?? this._accentColor;
        const screenTilt = params.screenTilt ?? THREE.MathUtils.degToRad(8);

        this.params.width = width;
        this.params.height = height;
        this.params.depth = depth;
        this.params.accentColor = accentColor;
        this.params.screenTilt = screenTilt;

        const baseMaterial = new THREE.MeshStandardMaterial({
            map: TextureGenerator.createConcrete({ scale: 2 }),
            color: 0x7c848e,
            roughness: 0.85
        });
        const metalMaterial = new THREE.MeshStandardMaterial({
            color: 0x2c313a,
            roughness: 0.45,
            metalness: 0.7
        });
        const accentMaterial = new THREE.MeshStandardMaterial({
            color: accentColor,
            emissive: new THREE.Color(accentColor),
            emissiveIntensity: 0.6,
            roughness: 0.25,
            metalness: 0.55
        });

        const base = new THREE.Mesh(new THREE.CylinderGeometry(width * 0.55, width * 0.65, 0.24, 16), baseMaterial);
        base.position.y = 0.12;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const column = new THREE.Mesh(new THREE.BoxGeometry(width * 0.5, height * 0.82, depth * 0.38), metalMaterial);
        column.position.y = height * 0.41 + 0.24;
        column.castShadow = true;
        column.receiveShadow = true;
        group.add(column);

        const sideGlow = new THREE.Mesh(new THREE.BoxGeometry(width * 0.08, height * 0.7, depth * 0.4), accentMaterial);
        sideGlow.position.set(width * 0.22, height * 0.44 + 0.24, 0);
        sideGlow.castShadow = false;
        group.add(sideGlow);

        const screenFrame = new THREE.Mesh(
            new THREE.BoxGeometry(width * 0.62, height * 0.68, depth * 0.08),
            metalMaterial
        );
        screenFrame.position.set(-width * 0.08, height * 0.55 + 0.24, depth * 0.22);
        screenFrame.rotation.x = -screenTilt;
        screenFrame.castShadow = true;
        group.add(screenFrame);

        const screenTexture = createDirectoryTexture(new THREE.Color(accentColor).getStyle());
        const screenMaterial = new THREE.MeshStandardMaterial({
            map: screenTexture,
            emissive: new THREE.Color(accentColor),
            emissiveIntensity: 0.4,
            roughness: 0.35,
            metalness: 0.15
        });
        this._screenMaterial = screenMaterial;

        const screen = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.56, height * 0.62), screenMaterial);
        screen.position.set(0, 0, depth * 0.06);
        screenFrame.add(screen);

        const header = new THREE.Mesh(new THREE.BoxGeometry(width * 0.58, 0.14, depth * 0.3), accentMaterial);
        header.position.set(0, height * 0.88 + 0.24, 0);
        header.castShadow = true;
        group.add(header);

        const beaconGroup = new THREE.Group();
        beaconGroup.position.set(0, height * 0.98 + 0.24, 0);
        this._beaconGroup = beaconGroup;
        group.add(beaconGroup);

        const ring = new THREE.Mesh(new THREE.TorusGeometry(width * 0.28, 0.05, 10, 28), accentMaterial);
        ring.rotation.x = Math.PI / 2;
        beaconGroup.add(ring);

        const pointer = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 10), accentMaterial);
        pointer.position.set(width * 0.28, 0.05, 0);
        pointer.rotation.z = Math.PI / 2;
        beaconGroup.add(pointer);

        const beaconCore = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), accentMaterial.clone());
        beaconCore.position.y = 0.08;
        beaconCore.material.emissiveIntensity = 0.9;
        beaconGroup.add(beaconCore);

        return group;
    }

    update(dt) {
        this._time += dt;
        if (this._beaconGroup) {
            this._beaconGroup.rotation.y += dt * 0.8;
        }
        if (this._screenMaterial) {
            this._screenMaterial.emissiveIntensity = 0.35 + Math.sin(this._time * 2.2) * 0.15;
        }
    }
}

EntityRegistry.register('mallDirectoryKiosk', MallDirectoryKioskEntity);
