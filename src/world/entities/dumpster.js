import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

function createGrimeTexture(colorHex) {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Base color
    const color = new THREE.Color(colorHex);
    ctx.fillStyle = `#${color.getHexString()}`;
    ctx.fillRect(0, 0, size, size);

    // Add noise/grime
    for (let i = 0; i < 400; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const w = 5 + Math.random() * 40;
        const h = 5 + Math.random() * 40;

        const alpha = Math.random() * 0.15;
        const blend = Math.random() > 0.5 ? '#000000' : '#3e2723'; // Black or dark rust

        ctx.fillStyle = blend;
        ctx.globalAlpha = alpha;
        ctx.fillRect(x, y, w, h);
    }

    // Scratches
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * size, Math.random() * size);
        ctx.lineTo(Math.random() * size, Math.random() * size);
        ctx.globalAlpha = 0.1;
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

export class DumpsterEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'dumpster';
    }

    static get displayName() { return 'Industrial Dumpster'; }

    createMesh(params) {
        const group = new THREE.Group();

        // Dimensions
        const width = 2.2;
        const depth = 1.4;
        const height = 1.3;

        // Randomize base color: Green, Blue, or Brown
        const colors = [0x2e8b57, 0x2a446e, 0x8b4513];
        const baseColor = params.color || colors[Math.floor(Math.random() * colors.length)];

        // Generate texture
        const grimeTexture = createGrimeTexture(baseColor);

        const metalMat = new THREE.MeshStandardMaterial({
            map: grimeTexture,
            roughness: 0.7,
            metalness: 0.3
        });

        const blackPlasticMat = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.5,
            metalness: 0.1
        });

        const rustMat = new THREE.MeshStandardMaterial({
            color: 0x5a3a2a,
            roughness: 0.9,
            metalness: 0.1
        });

        // 1. Main Hull (Trapezoidal prism simulated with box + rotation or just box)
        // Let's use a simple box for the main container
        const hullGeo = new THREE.BoxGeometry(width, height, depth);
        const hull = new THREE.Mesh(hullGeo, metalMat);
        hull.position.y = height / 2 + 0.1; // Lifted slightly for wheels/skids
        hull.castShadow = true;
        hull.receiveShadow = true;
        group.add(hull);

        // 2. Reinforcement Ribs (Vertical)
        const ribGeo = new THREE.BoxGeometry(0.1, height * 0.9, 0.05);
        const ribPositions = [-width * 0.4, 0, width * 0.4];

        // Front ribs
        ribPositions.forEach(x => {
            const rib = new THREE.Mesh(ribGeo, metalMat);
            rib.position.set(x, height / 2 + 0.1, depth / 2 + 0.02);
            rib.castShadow = true;
            group.add(rib);
        });

        // Back ribs
        ribPositions.forEach(x => {
            const rib = new THREE.Mesh(ribGeo, metalMat);
            rib.position.set(x, height / 2 + 0.1, -depth / 2 - 0.02);
            rib.castShadow = true;
            group.add(rib);
        });

        // 3. Side Pockets (for forklift)
        const pocketGeo = new THREE.BoxGeometry(0.4, 0.2, depth + 0.1);
        const pocketLeft = new THREE.Mesh(pocketGeo, rustMat); // Pockets often rusty
        pocketLeft.position.set(-width / 2 - 0.2, height * 0.6, 0);
        pocketLeft.castShadow = true;
        pocketLeft.receiveShadow = true;
        group.add(pocketLeft);

        const pocketRight = pocketLeft.clone();
        pocketRight.position.x *= -1;
        group.add(pocketRight);

        // 4. Lids (Split on top)
        const lidGeo = new THREE.BoxGeometry(width * 0.48, 0.05, depth * 1.05);

        // Left Lid
        const lidLeft = new THREE.Mesh(lidGeo, blackPlasticMat);
        lidLeft.position.set(-width * 0.25, height + 0.125, 0);
        lidLeft.rotation.z = 0.05; // Slight angle
        lidLeft.rotation.y = (Math.random() - 0.5) * 0.05; // Random skew
        lidLeft.castShadow = true;
        group.add(lidLeft);

        // Right Lid
        const lidRight = new THREE.Mesh(lidGeo, blackPlasticMat);
        lidRight.position.set(width * 0.25, height + 0.125, 0);
        lidRight.rotation.z = -0.05;
        lidRight.rotation.y = (Math.random() - 0.5) * 0.05;
        lidRight.castShadow = true;
        group.add(lidRight);

        // 5. Wheels / Skids
        const wheelGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.1, 16);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x333333 });

        const wheelPositions = [
            [-width * 0.4, 0.1, depth * 0.4],
            [width * 0.4, 0.1, depth * 0.4],
            [-width * 0.4, 0.1, -depth * 0.4],
            [width * 0.4, 0.1, -depth * 0.4]
        ];

        wheelPositions.forEach(([x, y, z]) => {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.rotation.z = Math.PI / 2; // Wheels roll forward/back? Usually casters swivel.
            wheel.position.set(x, 0.1, z);
            wheel.castShadow = true;
            group.add(wheel);
        });

        // Store dynamic parts if needed for update
        this.lidLeft = lidLeft;
        this.lidRight = lidRight;

        return group;
    }

    update(dt) {
        // Subtle lid vibration if windy
        if (window.app?.world?.wind && this.lidLeft && this.lidRight) {
            const windSpeed = window.app.world.wind.speed || 0;
            if (windSpeed > 10) {
                const rattle = Math.sin(Date.now() * 0.02) * (windSpeed * 0.0002);
                this.lidLeft.rotation.x = rattle;
                this.lidRight.rotation.x = -rattle;
            }
        }
    }
}

EntityRegistry.register('dumpster', DumpsterEntity);
