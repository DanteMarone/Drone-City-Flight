import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const createPlanterWoodTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#6b4a2d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const plankCount = 6;
    const plankWidth = canvas.width / plankCount;
    for (let i = 0; i < plankCount; i++) {
        const hueShift = 8 - Math.random() * 16;
        const lightness = 32 + Math.random() * 10;
        ctx.fillStyle = `hsl(${28 + hueShift}, 30%, ${lightness}%)`;
        ctx.fillRect(i * plankWidth, 0, plankWidth - 2, canvas.height);

        ctx.strokeStyle = 'rgba(40, 25, 15, 0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(i * plankWidth + plankWidth - 2, 0);
        ctx.lineTo(i * plankWidth + plankWidth - 2, canvas.height);
        ctx.stroke();

        for (let j = 0; j < 6; j++) {
            ctx.strokeStyle = 'rgba(60, 40, 20, 0.35)';
            ctx.beginPath();
            ctx.moveTo(i * plankWidth + 4 + Math.random() * (plankWidth - 10), Math.random() * canvas.height);
            ctx.lineTo(i * plankWidth + 4 + Math.random() * (plankWidth - 10), Math.random() * canvas.height);
            ctx.stroke();
        }
    }

    for (let i = 0; i < 1400; i++) {
        const tone = Math.floor(40 + Math.random() * 30);
        ctx.fillStyle = `rgba(${tone}, ${tone - 10}, ${tone - 18}, 0.2)`;
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);

    return texture;
};

export class PlanterBoxEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'planterBox';
        this._time = 0;
        this._flowerStems = [];
    }

    static get displayName() { return 'Planter Box'; }

    createMesh(params) {
        const group = new THREE.Group();

        const width = params.width || 2.2;
        const depth = params.depth || 0.9;
        const height = params.height || 0.6;
        const rimHeight = height * 0.12;

        const woodTexture = createPlanterWoodTexture();
        const woodMat = new THREE.MeshStandardMaterial({
            map: woodTexture,
            roughness: 0.75,
            metalness: 0.05
        });

        const baseGeo = new THREE.BoxGeometry(width, height, depth);
        const base = new THREE.Mesh(baseGeo, woodMat);
        base.position.y = height / 2;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const rimGeo = new THREE.BoxGeometry(width * 1.02, rimHeight, depth * 1.02);
        const rimMat = new THREE.MeshStandardMaterial({
            color: 0x5a3f27,
            roughness: 0.6,
            metalness: 0.05
        });
        const rim = new THREE.Mesh(rimGeo, rimMat);
        rim.position.y = height + rimHeight / 2;
        rim.castShadow = true;
        rim.receiveShadow = true;
        group.add(rim);

        const soilGeo = new THREE.BoxGeometry(width * 0.88, rimHeight * 0.7, depth * 0.88);
        const soilMat = new THREE.MeshStandardMaterial({
            color: 0x3a2a1a,
            roughness: 0.95,
            metalness: 0.02
        });
        const soil = new THREE.Mesh(soilGeo, soilMat);
        soil.position.y = height + rimHeight * 0.4;
        soil.castShadow = false;
        soil.receiveShadow = true;
        group.add(soil);

        const flowerGroup = new THREE.Group();
        flowerGroup.position.y = soil.position.y + rimHeight * 0.35;
        group.add(flowerGroup);

        const flowerCount = 7 + Math.floor(Math.random() * 5);
        const stemGeo = new THREE.CylinderGeometry(0.025, 0.03, 0.35, 6);
        const stemMat = new THREE.MeshStandardMaterial({
            color: 0x3d7a3d,
            roughness: 0.7
        });

        const bloomGeo = new THREE.SphereGeometry(0.08, 10, 10);
        const bloomColors = [0xff7aa2, 0xffc857, 0x9ee37d, 0x7bdff2, 0xe4b1ff];

        for (let i = 0; i < flowerCount; i++) {
            const flower = new THREE.Group();
            const stem = new THREE.Mesh(stemGeo, stemMat);
            stem.position.y = 0.17;
            stem.castShadow = true;
            stem.receiveShadow = true;
            flower.add(stem);

            const bloomMat = new THREE.MeshStandardMaterial({
                color: bloomColors[i % bloomColors.length],
                emissive: 0x1a120b,
                roughness: 0.6
            });
            const bloom = new THREE.Mesh(bloomGeo, bloomMat);
            bloom.position.y = 0.36;
            bloom.castShadow = true;
            bloom.receiveShadow = false;
            flower.add(bloom);

            const offsetX = (Math.random() - 0.5) * (width * 0.7);
            const offsetZ = (Math.random() - 0.5) * (depth * 0.7);
            flower.position.set(offsetX, 0, offsetZ);
            flower.rotation.y = Math.random() * Math.PI * 2;
            flowerGroup.add(flower);

            this._flowerStems.push({
                mesh: flower,
                swaySpeed: 0.8 + Math.random() * 1.2,
                swayAmount: 0.05 + Math.random() * 0.05,
                swayPhase: Math.random() * Math.PI * 2,
                baseRot: flower.rotation.z
            });
        }

        return group;
    }

    update(dt) {
        if (!this.mesh) return;
        this._time += dt;

        for (const stem of this._flowerStems) {
            const sway = Math.sin(this._time * stem.swaySpeed + stem.swayPhase) * stem.swayAmount;
            stem.mesh.rotation.z = stem.baseRot + sway;
        }
    }
}

EntityRegistry.register('planterBox', PlanterBoxEntity);
