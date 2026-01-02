import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const ACCENT_COLORS = [0x63f5ff, 0xffc857, 0xff7ac8, 0x8bff9f];

const createClockFaceTexture = (options = {}) => {
    const {
        faceColor = '#f2f3f7',
        tickColor = '#21242b',
        accentColor = '#ff7ac8',
        width = 256,
        height = 256
    } = options;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = faceColor;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = tickColor;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, width * 0.46, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 4;
    for (let i = 0; i < 60; i += 1) {
        const angle = (i / 60) * Math.PI * 2;
        const inner = i % 5 === 0 ? width * 0.32 : width * 0.36;
        const outer = width * 0.44;
        ctx.beginPath();
        ctx.moveTo(width / 2 + Math.cos(angle) * inner, height / 2 + Math.sin(angle) * inner);
        ctx.lineTo(width / 2 + Math.cos(angle) * outer, height / 2 + Math.sin(angle) * outer);
        ctx.stroke();
    }

    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, width * 0.05, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 400; i += 1) {
        const v = Math.floor(Math.random() * 12);
        ctx.fillStyle = `rgba(${v},${v},${v},0.08)`;
        ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
};

export class StreetClockEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'streetClock';
        this._elapsed = Math.random() * 120;
        this._hands = {};
        this._glassMaterial = null;
    }

    static get displayName() { return 'Street Clock'; }

    createMesh(params) {
        const group = new THREE.Group();

        const height = params.height || 3.8;
        const poleRadius = params.poleRadius || 0.08;
        const clockWidth = params.clockWidth || 0.6;
        const clockDepth = params.clockDepth || 0.25;
        const accentColor = params.accentColor || ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)];
        const timeScale = params.timeScale || 8;

        this.params.height = height;
        this.params.poleRadius = poleRadius;
        this.params.clockWidth = clockWidth;
        this.params.clockDepth = clockDepth;
        this.params.accentColor = accentColor;
        this.params.timeScale = timeScale;

        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2d33,
            roughness: 0.7,
            metalness: 0.4
        });
        const poleMaterial = new THREE.MeshStandardMaterial({
            color: 0x3b3f47,
            roughness: 0.5,
            metalness: 0.6
        });

        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(poleRadius * 2.4, poleRadius * 2.8, height * 0.08, 20),
            baseMaterial
        );
        base.position.y = base.geometry.parameters.height / 2;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(poleRadius, poleRadius * 1.05, height * 0.72, 18),
            poleMaterial
        );
        pole.position.y = base.geometry.parameters.height + pole.geometry.parameters.height / 2;
        pole.castShadow = true;
        pole.receiveShadow = true;
        group.add(pole);

        const brace = new THREE.Mesh(
            new THREE.BoxGeometry(clockWidth * 0.55, poleRadius * 1.2, poleRadius * 1.2),
            poleMaterial
        );
        brace.position.set(0, pole.position.y + pole.geometry.parameters.height / 2, 0);
        group.add(brace);

        const clockHousing = new THREE.Mesh(
            new THREE.BoxGeometry(clockWidth, clockWidth * 0.9, clockDepth),
            new THREE.MeshStandardMaterial({
                color: 0x1e2026,
                roughness: 0.4,
                metalness: 0.7
            })
        );
        clockHousing.position.y = brace.position.y + clockWidth * 0.45;
        clockHousing.castShadow = true;
        clockHousing.receiveShadow = true;
        group.add(clockHousing);

        const crown = new THREE.Mesh(
            new THREE.ConeGeometry(clockWidth * 0.2, clockWidth * 0.24, 12),
            new THREE.MeshStandardMaterial({
                color: accentColor,
                roughness: 0.35,
                metalness: 0.6,
                emissive: new THREE.Color(accentColor),
                emissiveIntensity: 0.2
            })
        );
        crown.position.set(0, clockHousing.position.y + clockWidth * 0.58, 0);
        crown.castShadow = true;
        group.add(crown);

        const faceTexture = createClockFaceTexture({
            accentColor: `#${accentColor.toString(16).padStart(6, '0')}`
        });
        const faceMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.4,
            metalness: 0.2,
            map: faceTexture,
            emissive: new THREE.Color(0x101218),
            emissiveIntensity: 0.15
        });

        const face = new THREE.Mesh(
            new THREE.CircleGeometry(clockWidth * 0.34, 40),
            faceMaterial
        );
        face.position.set(0, clockHousing.position.y, clockDepth / 2 + 0.02);
        group.add(face);

        const glassMaterial = new THREE.MeshStandardMaterial({
            color: 0x9fd7ff,
            roughness: 0.1,
            metalness: 0.2,
            transparent: true,
            opacity: 0.35
        });
        const glass = new THREE.Mesh(
            new THREE.CircleGeometry(clockWidth * 0.355, 40),
            glassMaterial
        );
        glass.position.set(0, clockHousing.position.y, clockDepth / 2 + 0.03);
        glassMaterial.depthWrite = false;
        group.add(glass);
        this._glassMaterial = glassMaterial;

        const handGroup = new THREE.Group();
        handGroup.position.copy(face.position);
        group.add(handGroup);

        const handMaterial = new THREE.MeshStandardMaterial({
            color: 0x101218,
            roughness: 0.5,
            metalness: 0.3
        });

        const hourHand = new THREE.Mesh(
            new THREE.BoxGeometry(clockWidth * 0.06, clockWidth * 0.22, clockWidth * 0.02),
            handMaterial
        );
        hourHand.position.y = clockWidth * 0.11;
        const hourGroup = new THREE.Group();
        hourGroup.add(hourHand);
        handGroup.add(hourGroup);

        const minuteHand = new THREE.Mesh(
            new THREE.BoxGeometry(clockWidth * 0.04, clockWidth * 0.3, clockWidth * 0.02),
            handMaterial
        );
        minuteHand.position.y = clockWidth * 0.15;
        const minuteGroup = new THREE.Group();
        minuteGroup.add(minuteHand);
        handGroup.add(minuteGroup);

        const secondHand = new THREE.Mesh(
            new THREE.BoxGeometry(clockWidth * 0.02, clockWidth * 0.34, clockWidth * 0.01),
            new THREE.MeshStandardMaterial({
                color: accentColor,
                roughness: 0.4,
                metalness: 0.4,
                emissive: new THREE.Color(accentColor),
                emissiveIntensity: 0.3
            })
        );
        secondHand.position.y = clockWidth * 0.17;
        const secondGroup = new THREE.Group();
        secondGroup.add(secondHand);
        handGroup.add(secondGroup);

        this._hands = { hour: hourGroup, minute: minuteGroup, second: secondGroup };

        const faceBack = new THREE.Mesh(
            new THREE.CircleGeometry(clockWidth * 0.34, 40),
            faceMaterial
        );
        faceBack.position.set(0, clockHousing.position.y, -clockDepth / 2 - 0.02);
        faceBack.rotation.y = Math.PI;
        group.add(faceBack);

        return group;
    }

    update(dt) {
        this._elapsed += dt * (this.params.timeScale || 8);
        const seconds = this._elapsed;
        const hourAngle = -((seconds / 3600) * Math.PI * 2);
        const minuteAngle = -((seconds / 60) * Math.PI * 2);
        const secondAngle = -((seconds % 60) / 60) * Math.PI * 2;

        if (this._hands.hour) this._hands.hour.rotation.z = hourAngle;
        if (this._hands.minute) this._hands.minute.rotation.z = minuteAngle;
        if (this._hands.second) this._hands.second.rotation.z = secondAngle;

        if (this._glassMaterial) {
            this._glassMaterial.opacity = 0.28 + 0.04 * Math.sin(seconds * 0.6);
        }
    }
}

EntityRegistry.register('streetClock', StreetClockEntity);
