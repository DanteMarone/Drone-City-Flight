import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

function createPhoneBoothSignTexture(text = 'CALL') {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0d1626';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#59d7ff';
    ctx.lineWidth = 10;
    ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);

    ctx.fillStyle = '#e8f6ff';
    ctx.font = 'bold 48px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#59d7ff';
    ctx.shadowBlur = 12;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 4);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

export class PhoneBoothEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'phoneBooth';
        this.pulseTime = 0;
        this.interiorLight = null;
        this.glowMats = [];
    }

    static get displayName() { return 'Phone Booth'; }

    createMesh(params) {
        const group = new THREE.Group();

        const frameColor = new THREE.Color(params.frameColor || '#1d2a3a');
        const accentColor = new THREE.Color(params.accentColor || '#59d7ff');
        const glassColor = new THREE.Color('#8fd9ff');

        const frameMat = new THREE.MeshStandardMaterial({ color: frameColor, roughness: 0.6, metalness: 0.15 });
        const roofMat = new THREE.MeshStandardMaterial({ color: frameColor.clone().multiplyScalar(0.9), roughness: 0.5 });
        const glassMat = new THREE.MeshStandardMaterial({
            color: glassColor,
            transparent: true,
            opacity: 0.35,
            roughness: 0.1,
            metalness: 0.1
        });

        const base = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.2, 2.2), frameMat);
        base.position.y = 0.1;
        group.add(base);

        const postGeo = new THREE.BoxGeometry(0.16, 3.1, 0.16);
        const postOffsets = [
            [1.02, 1.65, 1.02],
            [-1.02, 1.65, 1.02],
            [1.02, 1.65, -1.02],
            [-1.02, 1.65, -1.02]
        ];
        postOffsets.forEach(([x, y, z]) => {
            const post = new THREE.Mesh(postGeo, frameMat);
            post.position.set(x, y, z);
            group.add(post);
        });

        const roof = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.25, 2.4), roofMat);
        roof.position.y = 3.25;
        group.add(roof);

        const cap = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.18, 2.6), roofMat);
        cap.position.y = 3.45;
        group.add(cap);

        const panelGeo = new THREE.BoxGeometry(1.8, 2.2, 0.06);
        const backPanel = new THREE.Mesh(panelGeo, glassMat);
        backPanel.position.set(0, 1.55, -1.05);
        group.add(backPanel);

        const frontPanel = new THREE.Mesh(panelGeo, glassMat);
        frontPanel.position.set(0, 1.55, 1.05);
        group.add(frontPanel);

        const sidePanelGeo = new THREE.BoxGeometry(0.06, 2.2, 1.8);
        const leftPanel = new THREE.Mesh(sidePanelGeo, glassMat);
        leftPanel.position.set(-1.05, 1.55, 0);
        group.add(leftPanel);

        const rightPanel = new THREE.Mesh(sidePanelGeo, glassMat);
        rightPanel.position.set(1.05, 1.55, 0);
        group.add(rightPanel);

        const signTexture = createPhoneBoothSignTexture(params.signText || 'CALL');
        const signMat = new THREE.MeshStandardMaterial({
            map: signTexture,
            emissive: accentColor,
            emissiveIntensity: 1.2,
            transparent: true
        });

        const signGeo = new THREE.PlaneGeometry(1.6, 0.6);
        const signFront = new THREE.Mesh(signGeo, signMat);
        signFront.position.set(0, 3.05, 1.26);
        group.add(signFront);

        const signBack = new THREE.Mesh(signGeo, signMat.clone());
        signBack.position.set(0, 3.05, -1.26);
        signBack.rotation.y = Math.PI;
        group.add(signBack);

        const interiorGlowMat = new THREE.MeshStandardMaterial({
            color: accentColor,
            emissive: accentColor,
            emissiveIntensity: 2.5,
            transparent: true,
            opacity: 0.8
        });
        const glow = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), interiorGlowMat);
        glow.position.set(0, 2.7, 0);
        group.add(glow);
        this.interiorLight = glow;
        this.glowMats = [signMat, signBack.material, interiorGlowMat];

        const handsetMat = new THREE.MeshStandardMaterial({ color: '#1b1b1b', roughness: 0.4, metalness: 0.2 });
        const handset = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.14), handsetMat);
        handset.position.set(0.65, 1.2, -0.65);
        handset.rotation.y = -0.4;
        group.add(handset);

        const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 10), handsetMat);
        cord.position.set(0.4, 0.9, -0.7);
        cord.rotation.z = Math.PI / 3.2;
        group.add(cord);

        return group;
    }

    update(dt) {
        this.pulseTime += dt;
        const pulse = 0.7 + Math.sin(this.pulseTime * 2.4) * 0.3;
        if (this.interiorLight) {
            this.interiorLight.scale.setScalar(0.9 + pulse * 0.25);
        }

        this.glowMats.forEach((mat) => {
            mat.emissiveIntensity = 1.0 + pulse * 1.2;
        });
    }
}

EntityRegistry.register('phoneBooth', PhoneBoothEntity);
