import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const FRAME_COLORS = [0x5b6168, 0x7b8794, 0x3f4a56];
const CLOTH_COLORS = [
    { base: '#d3f1ff', stripe: '#4b9cd3' },
    { base: '#fff0d6', stripe: '#e36f6f' },
    { base: '#f6f2ff', stripe: '#7e68d7' },
    { base: '#d9ffe8', stripe: '#24a148' }
];

export class LaundryDryingRackEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'laundryDryingRack';
        this._time = Math.random() * Math.PI * 2;
        this._clothGroups = [];
    }

    static get displayName() { return 'Laundry Drying Rack'; }

    createMesh(params) {
        const group = new THREE.Group();

        const width = params.width || 2.3 + Math.random() * 0.5;
        const depth = params.depth || 0.75 + Math.random() * 0.15;
        const height = params.height || 1.75 + Math.random() * 0.35;
        const lineCount = params.lineCount || 3;
        const frameColor = params.frameColor || FRAME_COLORS[Math.floor(Math.random() * FRAME_COLORS.length)];

        this.params.width = width;
        this.params.depth = depth;
        this.params.height = height;
        this.params.lineCount = lineCount;
        this.params.frameColor = frameColor;

        const frameMat = new THREE.MeshStandardMaterial({
            color: frameColor,
            roughness: 0.55,
            metalness: 0.45
        });

        const footMat = new THREE.MeshStandardMaterial({
            color: 0x2b3139,
            roughness: 0.7,
            metalness: 0.25
        });

        const postGeo = new THREE.CylinderGeometry(0.05, 0.05, height, 10);
        const footGeo = new THREE.BoxGeometry(0.24, 0.04, 0.14);

        const postOffsets = [
            [width * 0.45, depth * 0.3],
            [width * 0.45, -depth * 0.3],
            [-width * 0.45, depth * 0.3],
            [-width * 0.45, -depth * 0.3]
        ];

        for (const [x, z] of postOffsets) {
            const post = new THREE.Mesh(postGeo, frameMat);
            post.position.set(x, height / 2, z);
            post.castShadow = true;
            post.receiveShadow = true;
            group.add(post);

            const foot = new THREE.Mesh(footGeo, footMat);
            foot.position.set(x, 0.02, z);
            foot.castShadow = true;
            foot.receiveShadow = true;
            group.add(foot);
        }

        const topBarGeo = new THREE.CylinderGeometry(0.035, 0.035, width * 0.95, 12);
        const topBar = new THREE.Mesh(topBarGeo, frameMat);
        topBar.rotation.z = Math.PI / 2;
        topBar.position.set(0, height * 0.95, 0);
        topBar.castShadow = true;
        group.add(topBar);

        const braceGeo = new THREE.CylinderGeometry(0.028, 0.028, depth * 0.9, 10);
        for (const x of [-width * 0.45, width * 0.45]) {
            const brace = new THREE.Mesh(braceGeo, frameMat);
            brace.rotation.x = Math.PI / 2;
            brace.position.set(x, height * 0.42, 0);
            brace.castShadow = true;
            group.add(brace);
        }

        const lineGeo = new THREE.CylinderGeometry(0.015, 0.015, width * 0.86, 8);
        const lineMat = new THREE.MeshStandardMaterial({
            color: 0x8f9aa3,
            roughness: 0.4,
            metalness: 0.35
        });

        for (let i = 0; i < lineCount; i += 1) {
            const t = lineCount === 1 ? 0 : i / (lineCount - 1);
            const z = THREE.MathUtils.lerp(-depth * 0.3, depth * 0.3, t);
            const line = new THREE.Mesh(lineGeo, lineMat);
            line.rotation.z = Math.PI / 2;
            line.position.set(0, height * 0.88, z);
            line.castShadow = false;
            group.add(line);
            this._addLaundry(group, line.position, width, z);
        }

        const basket = this._createBasket(width, depth);
        basket.position.set(-width * 0.32, 0.16, depth * 0.42);
        group.add(basket);

        return group;
    }

    _addLaundry(group, linePosition, width, lineZ) {
        const clothCount = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < clothCount; i += 1) {
            const color = CLOTH_COLORS[Math.floor(Math.random() * CLOTH_COLORS.length)];
            const clothWidth = 0.28 + Math.random() * 0.18;
            const clothHeight = 0.36 + Math.random() * 0.25;
            const clothTexture = this._createFabricTexture(color.base, color.stripe);
            const clothMat = new THREE.MeshStandardMaterial({
                map: clothTexture,
                roughness: 0.8,
                metalness: 0.05,
                side: THREE.DoubleSide
            });
            const clothGeo = new THREE.PlaneGeometry(clothWidth, clothHeight, 4, 2);
            const cloth = new THREE.Mesh(clothGeo, clothMat);
            cloth.position.set(0, -clothHeight / 2, 0);
            cloth.castShadow = true;
            cloth.receiveShadow = true;

            const clothGroup = new THREE.Group();
            clothGroup.add(cloth);
            const xOffset = THREE.MathUtils.lerp(-width * 0.3, width * 0.3, Math.random());
            clothGroup.position.set(xOffset, linePosition.y - 0.02, lineZ);
            clothGroup.rotation.y = Math.random() * 0.2 - 0.1;
            clothGroup.userData.swayPhase = Math.random() * Math.PI * 2;
            clothGroup.userData.swaySpeed = 0.6 + Math.random() * 0.8;
            clothGroup.userData.swayAmount = 0.08 + Math.random() * 0.05;
            this._clothGroups.push(clothGroup);
            group.add(clothGroup);
        }
    }

    _createBasket(width, depth) {
        const basketGroup = new THREE.Group();
        const baseGeo = new THREE.BoxGeometry(width * 0.22, 0.16, depth * 0.26);
        const sideMat = new THREE.MeshStandardMaterial({
            color: 0xb87a46,
            roughness: 0.65,
            metalness: 0.15
        });
        const base = new THREE.Mesh(baseGeo, sideMat);
        base.position.y = 0.08;
        base.castShadow = true;
        base.receiveShadow = true;
        basketGroup.add(base);

        const rimGeo = new THREE.BoxGeometry(width * 0.24, 0.04, depth * 0.28);
        const rim = new THREE.Mesh(rimGeo, sideMat);
        rim.position.y = 0.18;
        rim.castShadow = true;
        basketGroup.add(rim);

        return basketGroup;
    }

    _createFabricTexture(baseColor, stripeColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = stripeColor;
        for (let i = 0; i < 4; i += 1) {
            ctx.fillRect(i * 16, 0, 6, canvas.height);
        }

        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 6);
        ctx.lineTo(canvas.width, 6);
        ctx.moveTo(0, canvas.height - 8);
        ctx.lineTo(canvas.width, canvas.height - 8);
        ctx.stroke();

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        texture.needsUpdate = true;
        return texture;
    }

    update(dt) {
        this._time += dt;
        for (const cloth of this._clothGroups) {
            const phase = cloth.userData.swayPhase ?? 0;
            const speed = cloth.userData.swaySpeed ?? 0.8;
            const amount = cloth.userData.swayAmount ?? 0.1;
            cloth.rotation.z = Math.sin(this._time * speed + phase) * amount;
            cloth.rotation.x = Math.cos(this._time * speed * 0.7 + phase) * amount * 0.5;
        }
    }
}

EntityRegistry.register('laundryDryingRack', LaundryDryingRackEntity);
