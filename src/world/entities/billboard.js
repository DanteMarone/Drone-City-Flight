import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

function createPosterTexture(bgColor, accentColor, textColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, bgColor);
    gradient.addColorStop(1, accentColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Accent stripes
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 12;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const y = canvas.height * (0.25 + i * 0.2);
        ctx.moveTo(40, y);
        ctx.lineTo(canvas.width - 40, y - 20);
        ctx.stroke();
    }

    // Simple blocky title
    ctx.fillStyle = textColor;
    ctx.font = 'bold 96px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FLY', canvas.width * 0.35, canvas.height * 0.35);
    ctx.fillText('FAST', canvas.width * 0.6, canvas.height * 0.65);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
}

export class BillboardEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'billboard';
        this.elapsed = 0;
        this.lightMeshes = [];
    }

    static get displayName() { return 'Billboard'; }

    createMesh(params) {
        const width = params.width || 16;
        const height = params.height || 9;
        const thickness = 0.6;
        const poleHeight = height + 8;

        this.params.width = width;
        this.params.height = height;

        const group = new THREE.Group();

        // Colors
        const bgColor = params.bgColor || '#0e1a2b';
        const accentColor = params.accentColor || '#1e90ff';
        const textColor = params.textColor || '#ffffff';
        const metalColor = 0x888a8f;

        const poleMat = new THREE.MeshStandardMaterial({ color: metalColor, roughness: 0.6, metalness: 0.5 });
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x22252a, roughness: 0.5, metalness: 0.3 });
        const posterTexture = createPosterTexture(bgColor, accentColor, textColor);
        const posterMat = new THREE.MeshStandardMaterial({ map: posterTexture, roughness: 0.45, metalness: 0.1, emissive: new THREE.Color(accentColor), emissiveIntensity: 0.25 });

        // Main pole
        const poleGeo = new THREE.CylinderGeometry(0.7, 0.9, poleHeight, 12);
        poleGeo.translate(0, poleHeight / 2, 0);
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.castShadow = true;
        pole.receiveShadow = true;
        group.add(pole);

        // Base
        const baseGeo = new THREE.CylinderGeometry(1.8, 2.4, 1.2, 14);
        baseGeo.translate(0, 0.6, 0);
        const base = new THREE.Mesh(baseGeo, frameMat);
        base.receiveShadow = true;
        group.add(base);

        // Billboard frame
        const frameGeo = new THREE.BoxGeometry(width + 1, height + 1, thickness);
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.set(0, poleHeight - height * 0.45, 0);
        frame.castShadow = true;
        frame.receiveShadow = true;
        group.add(frame);

        // Poster surfaces (front/back share texture)
        const posterGeo = new THREE.BoxGeometry(width, height, thickness * 0.4);
        const poster = new THREE.Mesh(posterGeo, [frameMat, frameMat, frameMat, frameMat, posterMat, posterMat]);
        poster.position.copy(frame.position);
        poster.castShadow = true;
        poster.receiveShadow = true;
        group.add(poster);

        // Support beams
        const braceGeo = new THREE.BoxGeometry(0.6, poleHeight * 0.4, 0.6);
        const leftBrace = new THREE.Mesh(braceGeo, poleMat);
        leftBrace.position.set(-width * 0.35, poleHeight * 0.45, -thickness);
        leftBrace.rotation.z = Math.PI / 12;
        leftBrace.castShadow = true;
        group.add(leftBrace);

        const rightBrace = leftBrace.clone();
        rightBrace.position.x *= -1;
        rightBrace.rotation.z *= -1;
        group.add(rightBrace);

        // Top lights
        const lightMat = new THREE.MeshStandardMaterial({ color: textColor, emissive: new THREE.Color(accentColor), emissiveIntensity: 0.8 });
        const lightGeo = new THREE.SphereGeometry(0.5, 12, 12);
        const lightCount = 3 + Math.floor(Math.random() * 2);
        for (let i = 0; i < lightCount; i++) {
            const light = new THREE.Mesh(lightGeo, lightMat.clone());
            const offset = (i - (lightCount - 1) / 2) * (width / (lightCount + 0.5));
            light.position.set(offset, frame.position.y + height * 0.6, thickness * 0.45);
            light.castShadow = true;
            group.add(light);
            this.lightMeshes.push(light);
        }

        // Small maintenance ladder rungs on one side
        const rungGeo = new THREE.BoxGeometry(0.3, 0.1, 1.2);
        const rungMat = new THREE.MeshStandardMaterial({ color: metalColor, roughness: 0.4, metalness: 0.6 });
        for (let i = 0; i < 7; i++) {
            const rung = new THREE.Mesh(rungGeo, rungMat);
            rung.position.set(width * 0.45, 1.5 + i * 1.1, -0.2);
            rung.castShadow = true;
            group.add(rung);
        }

        return group;
    }

    update(dt) {
        if (!this.lightMeshes.length) return;
        this.elapsed += dt;
        const pulse = 0.5 + 0.4 * Math.sin(this.elapsed * 2.5);
        for (const light of this.lightMeshes) {
            const mat = light.material;
            if (mat && 'emissiveIntensity' in mat) {
                mat.emissiveIntensity = 0.6 + pulse * 0.6;
            }
        }
    }
}

EntityRegistry.register('billboard', BillboardEntity);
