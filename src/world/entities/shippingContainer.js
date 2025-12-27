import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const CONTAINER_COLORS = [
    '#004488', // Maersk Blue
    '#882211', // Rusty Red
    '#226633', // Evergreen
    '#CC6600', // Hapag Orange
    '#556677', // Military Grey
    '#EEEEEE'  // White/Reefer
];

const LOGO_TEXTS = [
    'MAERSK', 'CMA CGM', 'COSCO', 'HAPAG', 'MSC', 'ONE', 'EVERGREEN', 'DRONE-LOG', 'JULES-XP'
];

export class ShippingContainerEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'shippingContainer';
    }

    static get displayName() { return 'Shipping Container'; }

    createMesh(params) {
        const group = new THREE.Group();

        // 1. Parameters
        const lengthType = params.lengthType || (Math.random() > 0.5 ? 20 : 40); // 20 or 40 ft
        const color = params.color || CONTAINER_COLORS[Math.floor(Math.random() * CONTAINER_COLORS.length)];
        const logoText = params.logoText || LOGO_TEXTS[Math.floor(Math.random() * LOGO_TEXTS.length)];

        this.params.lengthType = lengthType;
        this.params.color = color;
        this.params.logoText = logoText;

        // Dimensions (approx scale: 1 unit = 1 meter)
        // 20ft: 6.058m x 2.438m x 2.591m
        // 40ft: 12.192m x 2.438m x 2.591m
        const len = lengthType === 20 ? 6 : 12;
        const wid = 2.44;
        const hgt = 2.6;

        // 2. Texture
        const texture = this._createCorrugatedTexture(color, logoText);
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.7,
            metalness: 0.3,
            bumpMap: texture,
            bumpScale: 0.05
        });

        // 3. Main Body
        // Reduce width slightly so corner posts stick out
        const bodyGeo = new THREE.BoxGeometry(len - 0.2, hgt - 0.2, wid - 0.1);
        const body = new THREE.Mesh(bodyGeo, material);
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        // 4. Frame / Corner Posts (The load bearing parts)
        const frameMat = new THREE.MeshStandardMaterial({
            color: color, // Same color but solid, no texture
            roughness: 0.8,
            metalness: 0.4
        });

        const postSize = 0.25;
        const postGeo = new THREE.BoxGeometry(postSize, hgt, postSize);

        // Positions: corners relative to center
        // x: +/- (len/2 - postSize/2)
        // z: +/- (wid/2 - postSize/2)
        const dx = len / 2 - postSize / 2;
        const dz = wid / 2 - postSize / 2;

        const corners = [
            { x: dx, z: dz }, { x: -dx, z: dz },
            { x: dx, z: -dz }, { x: -dx, z: -dz }
        ];

        corners.forEach(pos => {
            const post = new THREE.Mesh(postGeo, frameMat);
            post.position.set(pos.x, 0, pos.z);
            post.castShadow = true;
            post.receiveShadow = true;
            group.add(post);
        });

        // Top/Bottom Rails (Simple boxes connecting posts)
        // Lengthwise rails
        const railGeo = new THREE.BoxGeometry(len, 0.2, 0.2);
        const topRailL = new THREE.Mesh(railGeo, frameMat);
        topRailL.position.set(0, hgt/2 - 0.1, dz);
        group.add(topRailL);

        const topRailR = new THREE.Mesh(railGeo, frameMat);
        topRailR.position.set(0, hgt/2 - 0.1, -dz);
        group.add(topRailR);

        const botRailL = new THREE.Mesh(railGeo, frameMat);
        botRailL.position.set(0, -hgt/2 + 0.1, dz);
        group.add(botRailL);

        const botRailR = new THREE.Mesh(railGeo, frameMat);
        botRailR.position.set(0, -hgt/2 + 0.1, -dz);
        group.add(botRailR);

        // Widthwise rails (Front/Back)
        const wRailGeo = new THREE.BoxGeometry(0.2, 0.2, wid);
        const topRailF = new THREE.Mesh(wRailGeo, frameMat);
        topRailF.position.set(dx, hgt/2 - 0.1, 0);
        group.add(topRailF);

        const topRailB = new THREE.Mesh(wRailGeo, frameMat);
        topRailB.position.set(-dx, hgt/2 - 0.1, 0);
        group.add(topRailB);

        const botRailF = new THREE.Mesh(wRailGeo, frameMat);
        botRailF.position.set(dx, -hgt/2 + 0.1, 0);
        group.add(botRailF);

        const botRailB = new THREE.Mesh(wRailGeo, frameMat);
        botRailB.position.set(-dx, -hgt/2 + 0.1, 0);
        group.add(botRailB);


        // 5. Door Details (Front face +X)
        // Locking bars: Vertical cylinders
        const barGeo = new THREE.CylinderGeometry(0.04, 0.04, hgt - 0.4);
        const barMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.2 });

        // 4 bars typically
        [-0.6, -0.2, 0.2, 0.6].forEach(zOffset => {
            const bar = new THREE.Mesh(barGeo, barMat);
            // Position on +X face, slight offset out
            bar.position.set(len/2, 0, zOffset);
            group.add(bar);
        });

        // 6. Floor Adjustment
        // BaseEntity centers mesh at (0,0,0). Shipping container usually sits on ground.
        // We'll leave it centered locally, but add a slight offset in World if needed?
        // No, standard is center pivot. But let's check `BaseEntity`.
        // Typically we want pivot at bottom center for easy placement?
        // Most objects (cars, buildings) seem to handle their own offsets or expect center pivot.
        // `Crane` base was at y=1 (Box height 2), so pivot is center.
        // I will keep pivot at center of the box. The user places it at Y ~ 1.3.
        // Or I can shift the geometry up so pivot is at bottom.
        // Let's shift geometry up so (0,0,0) is bottom center.

        group.children.forEach(c => {
            c.position.y += hgt / 2;
        });

        // Add a "Shadow" plane? No, renderer handles shadows.

        return group;
    }

    _createCorrugatedTexture(colorHex, logoText) {
        const width = 512;
        const height = 512;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Fill Base
        ctx.fillStyle = colorHex;
        ctx.fillRect(0, 0, width, height);

        // Corrugation Stripes
        // Vertical lines.
        const stripeWidth = 16;
        for (let x = 0; x < width; x += stripeWidth) {
            // Shadow side
            const grad = ctx.createLinearGradient(x, 0, x + stripeWidth, 0);
            grad.addColorStop(0, 'rgba(0,0,0, 0.3)');
            grad.addColorStop(0.5, 'rgba(0,0,0, 0)');
            grad.addColorStop(0.8, 'rgba(255,255,255, 0.1)');
            grad.addColorStop(1, 'rgba(0,0,0, 0.3)');

            ctx.fillStyle = grad;
            ctx.fillRect(x, 0, stripeWidth, height);
        }

        // Noise / Rust
        for (let i = 0; i < 5000; i++) {
            const rx = Math.random() * width;
            const ry = Math.random() * height;
            const s = Math.random() * 3;
            // Rust color
            ctx.fillStyle = `rgba(100, 40, 20, ${Math.random() * 0.15})`;
            ctx.fillRect(rx, ry, s, s);
        }

        // Logo
        if (logoText) {
            ctx.save();
            ctx.font = 'bold 60px Impact, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // White text with border
            ctx.strokeStyle = 'rgba(0,0,0, 0.5)';
            ctx.lineWidth = 4;
            ctx.fillStyle = 'rgba(255,255,255, 0.9)';

            ctx.translate(width / 2, height / 2);
            // Draw on side? The texture wraps the whole box.
            // Box UV mapping is usually 1:1 per face or stretched?
            // Standard BoxGeometry maps UV 0..1 to each face.
            // So centering text means it appears on ALL faces centered.
            // That's fine for this LoD.

            ctx.strokeText(logoText, 0, 0);
            ctx.fillText(logoText, 0, 0);

            // Frame around text
            ctx.lineWidth = 8;
            ctx.strokeRect(-200, -50, 400, 100);

            ctx.restore();
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }
}

EntityRegistry.register('shippingContainer', ShippingContainerEntity);
