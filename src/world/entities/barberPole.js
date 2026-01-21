import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

let cachedBarberTexture = null;

function createBarberTexture() {
    if (cachedBarberTexture) return cachedBarberTexture.clone();

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // White Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 256);

    ctx.lineWidth = 50;
    ctx.lineCap = 'square'; // Extend line ends

    // Helper to draw a diagonal line with X offset
    const drawDiagonal = (offsetX, color) => {
        ctx.strokeStyle = color;
        ctx.beginPath();
        // Draw from top-edge to bottom-edge
        // x1 = offsetX, y1 = 0
        // x2 = offsetX + 256, y2 = 256
        // Extend beyond to ensure coverage
        ctx.moveTo(offsetX - 50, -50);
        ctx.lineTo(offsetX + 306, 306);
        ctx.stroke();
    };

    // Red Stripes (0 offset)
    // We need to cover the seam.
    // Main line at 0.
    // Wrap around: The line leaving the right edge enters the left edge (or vice versa).
    // Actually, for a spiral, we just need the texture to tile.
    // If we draw a line from (0,0) to (256,256), the start at x=0,y=0 matches end at x=256,y=256?
    // In UV space: (0,0) and (1,1).
    // This creates a single continuous spiral.

    // To ensure width is handled correctly at corners:
    // Draw the main diagonal and the adjacent repeated diagonals.

    // Red set
    drawDiagonal(0, '#cc0000');
    drawDiagonal(256, '#cc0000'); // Right neighbor
    drawDiagonal(-256, '#cc0000'); // Left neighbor

    // Blue set (Offset by 128)
    drawDiagonal(128, '#0000cc');
    drawDiagonal(128 + 256, '#0000cc');
    drawDiagonal(128 - 256, '#0000cc');

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    cachedBarberTexture = texture;
    return texture.clone();
}

export class BarberPoleEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'barberPole';
        this.spinSpeed = 2.0;
        this._poleMesh = null;
    }

    static get displayName() { return 'Barber Pole'; }

    createMesh(params) {
        const group = new THREE.Group();

        // Constants
        const totalHeight = 1.0;
        const radius = 0.15;
        const capHeight = 0.15;
        const poleHeight = totalHeight - (2 * capHeight); // 0.7

        // Materials
        const chromeMat = new THREE.MeshStandardMaterial({
            color: 0xeeeeee,
            metalness: 0.9,
            roughness: 0.2
        });

        // 1. Bottom Cap
        const bottomCap = new THREE.Mesh(
            new THREE.CylinderGeometry(radius, radius * 0.8, capHeight, 16),
            chromeMat
        );
        bottomCap.position.y = capHeight / 2;
        group.add(bottomCap);

        // 2. Top Cap
        const topCap = new THREE.Mesh(
            new THREE.SphereGeometry(radius, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
            chromeMat
        );
        topCap.position.y = totalHeight - (radius * 0.5); // Sit on top
        group.add(topCap);

        // Also a cylinder part for top cap connector
        const topConnector = new THREE.Mesh(
             new THREE.CylinderGeometry(radius, radius, capHeight, 16),
             chromeMat
        );
        topConnector.position.y = totalHeight - capHeight / 2;
        group.add(topConnector);


        // 3. Inner Spinning Pole
        const poleGeo = new THREE.CylinderGeometry(radius * 0.7, radius * 0.7, poleHeight, 16);
        const poleTex = createBarberTexture();
        // Scale texture to repeat vertically if needed, but 1:1 is fine for a spiral.
        // Actually, if height is > width, we might want to repeat T more?
        // But the diagonal logic relied on square.
        // Let's just let it stretch or set repeat.
        poleTex.repeat.set(1, 2); // Tighter spiral

        const poleMat = new THREE.MeshBasicMaterial({
            map: poleTex
        });

        this._poleMesh = new THREE.Mesh(poleGeo, poleMat);
        this._poleMesh.position.y = capHeight + poleHeight / 2;
        group.add(this._poleMesh);

        // 4. Glass Case (Outer Shell)
        const glassGeo = new THREE.CylinderGeometry(radius * 0.85, radius * 0.85, poleHeight, 16, 1, true);
        const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 0.1,
            roughness: 0.1,
            transmission: 0.9,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const glassCase = new THREE.Mesh(glassGeo, glassMat);
        glassCase.position.y = capHeight + poleHeight / 2;
        group.add(glassCase);

        // 5. Wall Mount Bracket
        // A simple arm sticking out the back (Z-)
        const armGeo = new THREE.BoxGeometry(0.1, 0.1, 0.3);
        const arm = new THREE.Mesh(armGeo, chromeMat);
        arm.position.set(0, totalHeight / 2, -0.2);
        group.add(arm);

        // Mounting Plate
        const plateGeo = new THREE.BoxGeometry(0.2, 0.4, 0.05);
        const plate = new THREE.Mesh(plateGeo, chromeMat);
        plate.position.set(0, totalHeight / 2, -0.35);
        group.add(plate);

        return group;
    }

    update(dt) {
        if (this._poleMesh) {
            // Rotate on Y to simulate spiral movement
            this._poleMesh.rotation.y -= dt * this.spinSpeed;
        }
    }
}

EntityRegistry.register('barberPole', BarberPoleEntity);
