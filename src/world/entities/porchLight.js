import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

const LANTERN_COLORS = [
    0x1f2937,
    0x374151,
    0x6b7280,
    0x0f172a
];

export class PorchLightEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'porchLight';
        this._time = Math.random() * Math.PI * 2;
        this._bulbMaterial = null;
        this._glassMaterial = null;
        this._lightHandle = null;
        this._lightAnchor = new THREE.Vector3();
    }

    static get displayName() { return 'Porch Light'; }

    createMesh(params) {
        const group = new THREE.Group();

        const plateWidth = params.plateWidth || 0.46;
        const plateHeight = params.plateHeight || 0.62;
        const plateDepth = params.plateDepth || 0.06;

        const armLength = params.armLength || 0.26;
        const lanternWidth = params.lanternWidth || 0.34;
        const lanternHeight = params.lanternHeight || 0.42;
        const lanternDepth = params.lanternDepth || 0.34;

        const accentColor = params.color || LANTERN_COLORS[Math.floor(Math.random() * LANTERN_COLORS.length)];

        const plateTexture = TextureGenerator.createConcrete();
        plateTexture.wrapS = THREE.RepeatWrapping;
        plateTexture.wrapT = THREE.RepeatWrapping;
        plateTexture.repeat.set(1.2, 1.2);

        const plateMaterial = new THREE.MeshStandardMaterial({
            color: 0x9aa3af,
            map: plateTexture,
            roughness: 0.85,
            metalness: 0.1
        });

        const plate = new THREE.Mesh(new THREE.BoxGeometry(plateWidth, plateHeight, plateDepth), plateMaterial);
        plate.position.set(0, plateHeight / 2, 0);
        plate.castShadow = true;
        plate.receiveShadow = true;
        group.add(plate);

        const metalMaterial = new THREE.MeshStandardMaterial({
            color: accentColor,
            roughness: 0.35,
            metalness: 0.7
        });

        const bracket = new THREE.Mesh(new THREE.BoxGeometry(plateWidth * 0.42, plateDepth * 0.55, plateDepth * 1.6), metalMaterial);
        bracket.position.set(0, plateHeight * 0.65, plateDepth * 0.6);
        bracket.castShadow = true;
        group.add(bracket);

        const arm = new THREE.Mesh(new THREE.CylinderGeometry(plateDepth * 0.2, plateDepth * 0.2, armLength, 8), metalMaterial);
        arm.rotation.x = Math.PI / 2;
        arm.position.set(0, plateHeight * 0.6, plateDepth * 0.6 + armLength / 2);
        arm.castShadow = true;
        group.add(arm);

        const lanternGroup = new THREE.Group();
        lanternGroup.position.set(0, plateHeight * 0.55, plateDepth * 0.6 + armLength + lanternDepth / 2);
        group.add(lanternGroup);

        const frameMaterial = new THREE.MeshStandardMaterial({
            color: accentColor,
            roughness: 0.45,
            metalness: 0.6
        });

        const frameThickness = 0.04;
        const frameHeight = lanternHeight * 0.92;
        const frame = new THREE.Group();

        const verticalGeo = new THREE.BoxGeometry(frameThickness, frameHeight, frameThickness);
        const offsets = [
            [lanternWidth / 2 - frameThickness / 2, frameHeight / 2, lanternDepth / 2 - frameThickness / 2],
            [-lanternWidth / 2 + frameThickness / 2, frameHeight / 2, lanternDepth / 2 - frameThickness / 2],
            [lanternWidth / 2 - frameThickness / 2, frameHeight / 2, -lanternDepth / 2 + frameThickness / 2],
            [-lanternWidth / 2 + frameThickness / 2, frameHeight / 2, -lanternDepth / 2 + frameThickness / 2]
        ];

        offsets.forEach(([x, y, z]) => {
            const post = new THREE.Mesh(verticalGeo, frameMaterial);
            post.position.set(x, y, z);
            post.castShadow = true;
            frame.add(post);
        });

        const topCap = new THREE.Mesh(new THREE.BoxGeometry(lanternWidth, frameThickness, lanternDepth), frameMaterial);
        topCap.position.y = frameHeight + frameThickness / 2;
        topCap.castShadow = true;
        frame.add(topCap);

        const baseCap = new THREE.Mesh(new THREE.BoxGeometry(lanternWidth * 0.92, frameThickness * 1.1, lanternDepth * 0.92), frameMaterial);
        baseCap.position.y = frameThickness / 2;
        baseCap.castShadow = true;
        frame.add(baseCap);

        lanternGroup.add(frame);

        const roof = new THREE.Mesh(
            new THREE.ConeGeometry(lanternWidth * 0.65, lanternHeight * 0.35, 4),
            frameMaterial
        );
        roof.position.y = frameHeight + lanternHeight * 0.2;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        lanternGroup.add(roof);

        this._glassMaterial = new THREE.MeshStandardMaterial({
            color: 0xfff2c2,
            emissive: new THREE.Color(0xffd48a),
            emissiveIntensity: 0.6,
            roughness: 0.2,
            metalness: 0,
            transparent: true,
            opacity: 0.75
        });

        const glass = new THREE.Mesh(
            new THREE.BoxGeometry(lanternWidth * 0.8, frameHeight * 0.75, lanternDepth * 0.8),
            this._glassMaterial
        );
        glass.position.y = frameHeight * 0.5;
        lanternGroup.add(glass);

        this._bulbMaterial = new THREE.MeshStandardMaterial({
            color: 0xfff6d5,
            emissive: new THREE.Color(0xffe1a6),
            emissiveIntensity: 1.2,
            roughness: 0.15,
            metalness: 0.05
        });

        const bulb = new THREE.Mesh(new THREE.SphereGeometry(lanternWidth * 0.16, 12, 12), this._bulbMaterial);
        bulb.position.y = frameHeight * 0.55;
        lanternGroup.add(bulb);

        const finial = new THREE.Mesh(
            new THREE.SphereGeometry(lanternWidth * 0.08, 8, 8),
            frameMaterial
        );
        finial.position.y = roof.position.y + lanternHeight * 0.2;
        lanternGroup.add(finial);

        const plaqueTexture = this.createNumberPlaqueTexture(params.houseNumber);
        const plaqueMaterial = new THREE.MeshStandardMaterial({
            map: plaqueTexture,
            color: 0xffffff,
            roughness: 0.6,
            metalness: 0.1
        });
        const plaque = new THREE.Mesh(new THREE.PlaneGeometry(plateWidth * 0.55, plateHeight * 0.18), plaqueMaterial);
        plaque.position.set(0, plateHeight * 0.23, plateDepth / 2 + 0.01);
        group.add(plaque);

        this._lightAnchor.set(
            lanternGroup.position.x,
            lanternGroup.position.y + frameHeight * 0.55,
            lanternGroup.position.z
        );

        return group;
    }

    createNumberPlaqueTexture(forcedNumber) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 96;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#111827';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const border = 8;
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 6;
        ctx.strokeRect(border, border, canvas.width - border * 2, canvas.height - border * 2);

        const number = forcedNumber || `${Math.floor(100 + Math.random() * 800)}`;
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 56px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(number, canvas.width / 2, canvas.height / 2 + 4);

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    postInit() {
        const lightSystem = this.params.lightSystem || window.app?.world?.lightSystem;
        if (lightSystem && this.mesh) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightAnchor.clone().applyMatrix4(this.mesh.matrixWorld);
            const intensity = this.params.lightIntensity || 2.2;
            this._lightHandle = lightSystem.register(worldPos, 0xffd48a, intensity, 14);
            if (this._lightHandle) {
                this._lightHandle.parentMesh = this.mesh;
            }
        }
    }

    update(dt) {
        if (!this.mesh) return;
        this._time += dt;
        const pulse = 0.15 + Math.sin(this._time * 2.2) * 0.12 + Math.sin(this._time * 4.3) * 0.08;
        const glow = 0.9 + pulse;

        if (this._bulbMaterial) {
            this._bulbMaterial.emissiveIntensity = glow * 1.2;
        }

        if (this._glassMaterial) {
            this._glassMaterial.emissiveIntensity = glow * 0.7;
        }

        if (this._lightHandle) {
            this._lightHandle.intensity = (this.params.lightIntensity || 2.2) * glow;
        }
    }
}

EntityRegistry.register('porchLight', PorchLightEntity);
