import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const poleGeo = new THREE.CylinderGeometry(0.06, 0.08, 1, 12);
const baseGeo = new THREE.CylinderGeometry(0.16, 0.18, 0.12, 12);
const lineGeo = new THREE.CylinderGeometry(0.015, 0.015, 1, 8);
const clothGeo = new THREE.PlaneGeometry(1, 1, 1, 1);

const palette = ['#e2d0c1', '#a9c6d9', '#f2b4c2', '#f0e3a1', '#b9d7b1', '#c5b1dd'];

const createFabricTexture = (baseColor) => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 5; i += 1) {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.06 + Math.random() * 0.08})`;
        ctx.fillRect(0, i * 24 + 6, canvas.width, 8);
    }

    for (let i = 0; i < 320; i += 1) {
        const shade = 140 + Math.floor(Math.random() * 80);
        ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, 0.12)`;
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
};

export class ApartmentLaundryLineEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'apartmentLaundryLine';
        this._time = 0;
        this._clothPanels = [];
    }

    static get displayName() { return 'Apartment Laundry Line'; }

    createMesh(params) {
        const group = new THREE.Group();

        const poleHeight = params.poleHeight || 2.3 + Math.random() * 0.6;
        const poleSpacing = params.poleSpacing || 3.6 + Math.random() * 0.6;
        const lineHeight = params.lineHeight || poleHeight * 0.75;
        const clothCount = params.clothCount || 5;
        const lineOffset = 0.18;

        this.params.poleHeight = poleHeight;
        this.params.poleSpacing = poleSpacing;
        this.params.lineHeight = lineHeight;
        this.params.clothCount = clothCount;

        const poleMat = new THREE.MeshStandardMaterial({ color: 0x4a4f58, roughness: 0.6, metalness: 0.2 });
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x2f3138, roughness: 0.7, metalness: 0.25 });
        const lineMat = new THREE.MeshStandardMaterial({ color: 0x2c2c2c, roughness: 0.85, metalness: 0.1 });

        const poleLeft = new THREE.Mesh(poleGeo, poleMat);
        poleLeft.scale.y = poleHeight;
        poleLeft.position.set(-poleSpacing / 2, poleHeight / 2, 0);
        poleLeft.castShadow = true;
        poleLeft.receiveShadow = true;

        const poleRight = poleLeft.clone();
        poleRight.position.x = poleSpacing / 2;

        const baseLeft = new THREE.Mesh(baseGeo, baseMat);
        baseLeft.position.set(-poleSpacing / 2, 0.06, 0);
        const baseRight = baseLeft.clone();
        baseRight.position.x = poleSpacing / 2;

        group.add(poleLeft, poleRight, baseLeft, baseRight);

        const lineLength = poleSpacing - 0.3;
        const lineFront = new THREE.Mesh(lineGeo, lineMat);
        lineFront.scale.y = lineLength;
        lineFront.rotation.z = Math.PI / 2;
        lineFront.position.set(0, lineHeight, lineOffset);
        const lineBack = lineFront.clone();
        lineBack.position.z = -lineOffset;
        group.add(lineFront, lineBack);

        const clothWidth = lineLength / (clothCount + 1);
        const clothHeight = 0.45 + Math.random() * 0.15;

        for (let i = 0; i < clothCount; i += 1) {
            const hue = palette[Math.floor(Math.random() * palette.length)];
            const clothMat = new THREE.MeshStandardMaterial({
                map: createFabricTexture(hue),
                side: THREE.DoubleSide,
                roughness: 0.9,
                metalness: 0.05
            });

            const cloth = new THREE.Mesh(clothGeo, clothMat);
            cloth.scale.set(clothWidth * 0.65, clothHeight, 1);
            const offsetX = -lineLength / 2 + clothWidth * (i + 1);
            cloth.position.set(offsetX, lineHeight - clothHeight / 2, i % 2 === 0 ? lineOffset : -lineOffset);
            cloth.castShadow = true;
            cloth.receiveShadow = true;
            cloth.rotation.y = i % 2 === 0 ? Math.PI * 0.06 : -Math.PI * 0.04;

            this._clothPanels.push({
                mesh: cloth,
                baseRotZ: cloth.rotation.z,
                baseRotX: cloth.rotation.x,
                phase: Math.random() * Math.PI * 2,
                speed: 1.1 + Math.random() * 0.6,
                sway: 0.15 + Math.random() * 0.1
            });
            group.add(cloth);
        }

        return group;
    }

    update(dt) {
        this._time += dt;
        this._clothPanels.forEach((panel, index) => {
            const flutter = Math.sin(this._time * panel.speed + panel.phase + index * 0.4) * panel.sway;
            const lift = Math.cos(this._time * (panel.speed * 0.7) + panel.phase) * panel.sway * 0.4;
            panel.mesh.rotation.z = panel.baseRotZ + flutter;
            panel.mesh.rotation.x = panel.baseRotX + lift;
        });
    }
}

EntityRegistry.register('apartmentLaundryLine', ApartmentLaundryLineEntity);
