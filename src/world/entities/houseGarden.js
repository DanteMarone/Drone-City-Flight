import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { TextureGenerator } from '../../utils/textures.js';
import { EntityRegistry } from './registry.js';

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const cylinderGeo = new THREE.CylinderGeometry(0.1, 0.1, 1, 12);

const createSidingTexture = (options = {}) => {
    const {
        baseColor = '#c6d0d8',
        lineColor = '#9aa6af',
        lineCount = 10,
        width = 256,
        height = 256
    } = options;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 3;
    const lineSpacing = height / lineCount;
    for (let i = 1; i < lineCount; i++) {
        const y = i * lineSpacing + (Math.random() * 1.5 - 0.75);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    for (let i = 0; i < 120; i++) {
        const shade = 140 + Math.random() * 40;
        ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, 0.12)`;
        ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
};

export class HouseGardenEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'house_garden';
        this._spinner = null;
        this._spinnerSpeed = params.spinnerSpeed || 1.2 + Math.random() * 1.2;
    }

    static get displayName() { return 'House Garden'; }

    createMesh(params) {
        const group = new THREE.Group();
        const w = params.width || 12;
        const h = params.height || 6.5;
        const d = params.depth || 10;

        this.params.width = w;
        this.params.height = h;
        this.params.depth = d;

        const sidingHue = 0.55 + Math.random() * 0.08;
        const baseColor = new THREE.Color().setHSL(sidingHue, 0.2, 0.78);
        const lineColor = new THREE.Color().setHSL(sidingHue, 0.25, 0.6);
        const sidingTexture = createSidingTexture({
            baseColor: `#${baseColor.getHexString()}`,
            lineColor: `#${lineColor.getHexString()}`
        });
        const sidingMat = new THREE.MeshStandardMaterial({ map: sidingTexture });

        const baseBrick = TextureGenerator.createBrick({
            color: '#8a6248',
            rows: 8,
            cols: 6
        });
        const baseMat = new THREE.MeshStandardMaterial({ map: baseBrick });

        const roofColor = new THREE.Color().setHSL(0.04 + Math.random() * 0.05, 0.45, 0.25);
        const roofMat = new THREE.MeshStandardMaterial({ color: roofColor });

        const trimMat = new THREE.MeshStandardMaterial({ color: 0xf4f0e8, roughness: 0.7 });
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x88bbee,
            roughness: 0.2,
            metalness: 0.7,
            emissive: 0x223344,
            emissiveIntensity: 0.3
        });

        const body = new THREE.Mesh(boxGeo, sidingMat);
        body.scale.set(w, h, d);
        body.position.set(0, h / 2, 0);
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        const foundation = new THREE.Mesh(boxGeo, baseMat);
        foundation.scale.set(w * 1.02, h * 0.2, d * 1.02);
        foundation.position.set(0, foundation.scale.y / 2, 0);
        foundation.castShadow = true;
        foundation.receiveShadow = true;
        group.add(foundation);

        const roofPitch = Math.PI / 6;
        const roofThickness = 0.45;
        const roofDepth = d * 1.05;
        const roofPanel = new THREE.Mesh(boxGeo, roofMat);
        roofPanel.scale.set(w * 0.58, roofThickness, roofDepth);
        roofPanel.position.set(-w * 0.17, h + roofThickness, 0);
        roofPanel.rotation.z = roofPitch;
        roofPanel.castShadow = true;
        roofPanel.receiveShadow = true;
        group.add(roofPanel);

        const roofPanelRight = new THREE.Mesh(boxGeo, roofMat);
        roofPanelRight.scale.set(w * 0.58, roofThickness, roofDepth);
        roofPanelRight.position.set(w * 0.17, h + roofThickness, 0);
        roofPanelRight.rotation.z = -roofPitch;
        roofPanelRight.castShadow = true;
        roofPanelRight.receiveShadow = true;
        group.add(roofPanelRight);

        const ridge = new THREE.Mesh(boxGeo, trimMat);
        ridge.scale.set(w * 0.05, roofThickness * 0.6, roofDepth * 0.98);
        ridge.position.set(0, h + roofThickness * 1.2, 0);
        ridge.castShadow = true;
        ridge.receiveShadow = true;
        group.add(ridge);

        const porchDepth = 2.6;
        const porchHeight = 0.3;
        const porch = new THREE.Mesh(boxGeo, baseMat);
        porch.scale.set(w * 0.62, porchHeight, porchDepth);
        porch.position.set(0, porchHeight / 2, d / 2 + porchDepth / 2 - 0.2);
        porch.castShadow = true;
        porch.receiveShadow = true;
        group.add(porch);

        const steps = new THREE.Mesh(boxGeo, baseMat);
        steps.scale.set(w * 0.25, porchHeight * 0.6, porchDepth * 0.45);
        steps.position.set(0, steps.scale.y / 2, porch.position.z + porchDepth * 0.28);
        steps.castShadow = true;
        steps.receiveShadow = true;
        group.add(steps);

        const postHeight = 2.4;
        const postGeo = new THREE.BoxGeometry(0.2, 1, 0.2);
        const postOffsets = [
            [-w * 0.25, porchHeight + postHeight / 2, porch.position.z - porchDepth / 2 + 0.2],
            [w * 0.25, porchHeight + postHeight / 2, porch.position.z - porchDepth / 2 + 0.2]
        ];
        postOffsets.forEach(([x, y, z]) => {
            const post = new THREE.Mesh(postGeo, trimMat);
            post.scale.y = postHeight;
            post.position.set(x, y, z);
            post.castShadow = true;
            post.receiveShadow = true;
            group.add(post);
        });

        const awning = new THREE.Mesh(boxGeo, roofMat);
        awning.scale.set(w * 0.6, 0.2, porchDepth * 0.7);
        awning.position.set(0, porchHeight + postHeight + 0.1, porch.position.z - porchDepth * 0.1);
        awning.rotation.x = Math.PI / 14;
        awning.castShadow = true;
        awning.receiveShadow = true;
        group.add(awning);

        const door = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ color: 0x6b4a30 }));
        door.scale.set(1.6, 2.6, 0.2);
        door.position.set(0, 1.3, d / 2 + 0.02);
        group.add(door);

        const windowWide = new THREE.Mesh(boxGeo, glassMat);
        windowWide.scale.set(3.5, 1.4, 0.15);
        windowWide.position.set(-w * 0.2, h * 0.55, d / 2 + 0.05);
        group.add(windowWide);

        const windowTall = new THREE.Mesh(boxGeo, glassMat);
        windowTall.scale.set(1.4, 2.2, 0.15);
        windowTall.position.set(w * 0.28, h * 0.55, d / 2 + 0.05);
        group.add(windowTall);

        const planterMat = new THREE.MeshStandardMaterial({ color: 0x5b3e2a, roughness: 0.8 });
        const soilMat = new THREE.MeshStandardMaterial({ color: 0x3b2a1a, roughness: 1 });
        const plantMat = new THREE.MeshStandardMaterial({ color: 0x3a7a3f, roughness: 0.9 });
        [-w * 0.32, w * 0.32].forEach((x) => {
            const planter = new THREE.Mesh(boxGeo, planterMat);
            planter.scale.set(2.2, 0.6, 0.9);
            planter.position.set(x, 0.3, porch.position.z + porchDepth * 0.2);
            planter.castShadow = true;
            planter.receiveShadow = true;
            group.add(planter);

            const soil = new THREE.Mesh(boxGeo, soilMat);
            soil.scale.set(1.9, 0.2, 0.7);
            soil.position.set(x, 0.6, planter.position.z);
            group.add(soil);

            for (let i = 0; i < 3; i++) {
                const flower = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.5, 6), plantMat);
                flower.position.set(x - 0.5 + i * 0.5, 0.85, planter.position.z);
                flower.castShadow = true;
                group.add(flower);
            }
        });

        const acUnit = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ color: 0x90959f, roughness: 0.6 }));
        acUnit.scale.set(1.4, 0.9, 1);
        acUnit.position.set(-w / 2 - 0.4, 0.6, -d * 0.1);
        acUnit.castShadow = true;
        acUnit.receiveShadow = true;
        group.add(acUnit);

        const acFan = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.1, 12), trimMat);
        acFan.rotation.z = Math.PI / 2;
        acFan.position.set(acUnit.position.x - acUnit.scale.x / 2, acUnit.position.y, acUnit.position.z);
        group.add(acFan);

        const spinnerPole = new THREE.Mesh(cylinderGeo, trimMat);
        spinnerPole.scale.set(1, 3.2, 1);
        spinnerPole.position.set(w * 0.45, 1.6, d * 0.55);
        spinnerPole.castShadow = true;
        spinnerPole.receiveShadow = true;
        group.add(spinnerPole);

        const spinner = new THREE.Group();
        spinner.position.set(spinnerPole.position.x, spinnerPole.position.y + 0.8, spinnerPole.position.z);
        group.add(spinner);
        this._spinner = spinner;

        const bladeMat = new THREE.MeshStandardMaterial({ color: 0xded6c5, metalness: 0.3, roughness: 0.4 });
        for (let i = 0; i < 4; i++) {
            const blade = new THREE.Mesh(boxGeo, bladeMat);
            blade.scale.set(0.9, 0.1, 0.25);
            blade.position.set(0.45, 0, 0);
            blade.rotation.z = Math.PI / 2;
            const bladeGroup = new THREE.Group();
            bladeGroup.rotation.y = (Math.PI / 2) * i;
            bladeGroup.add(blade);
            spinner.add(bladeGroup);
        }

        const spinnerHub = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), trimMat);
        spinner.add(spinnerHub);

        return group;
    }

    update(dt) {
        if (this._spinner) {
            this._spinner.rotation.y += dt * this._spinnerSpeed;
        }
    }
}

EntityRegistry.register('house_garden', HouseGardenEntity);
