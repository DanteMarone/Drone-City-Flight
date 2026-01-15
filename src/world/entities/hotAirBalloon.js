import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class HotAirBalloonEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'hotAirBalloon';
        this.time = Math.random() * 100;
        this.bobSpeed = 0.5 + Math.random() * 0.5;
        this.driftSpeed = 0.05 + Math.random() * 0.05;
        this.bobAmplitude = 0.5 + Math.random() * 0.5;
    }

    static get displayName() { return 'Hot Air Balloon'; }

    createMesh(params) {
        const height = params.height || 12; // Overall height constraint if needed
        const balloonRadius = 3.5;

        const group = new THREE.Group();

        // --- Materials ---

        // Generate Stripe Texture
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256; // 2:1 aspect for sphere UV
        const ctx = canvas.getContext('2d');

        // Randomize Colors
        const hue1 = Math.random() * 360;
        const hue2 = (hue1 + 180) % 360; // Complementary
        const col1 = `hsl(${hue1}, 80%, 60%)`;
        const col2 = `hsl(${hue2}, 80%, 60%)`;

        // Draw Vertical Stripes
        const stripes = 16;
        const stripeW = canvas.width / stripes;
        for (let i = 0; i < stripes; i++) {
            ctx.fillStyle = i % 2 === 0 ? col1 : col2;
            ctx.fillRect(i * stripeW, 0, stripeW, canvas.height);
        }

        // Add some noise/wicker texture to bottom maybe?
        // Let's keep it clean for the balloon.

        const balloonTex = new THREE.CanvasTexture(canvas);
        balloonTex.colorSpace = THREE.SRGBColorSpace;

        const balloonMat = new THREE.MeshStandardMaterial({
            map: balloonTex,
            roughness: 0.3,
            metalness: 0.1
        });

        const wickerMat = new THREE.MeshStandardMaterial({
            color: 0x8B4513, // SaddleBrown
            roughness: 0.9
        });

        const ropeMat = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            roughness: 0.8
        });

        // --- Geometry Construction ---

        // 1. Balloon (Sphere stretched)
        // Shift up so basket is at ~0 local (or adjust later)
        const balloonGeo = new THREE.SphereGeometry(balloonRadius, 32, 24);
        balloonGeo.scale(1, 1.3, 1);
        const balloon = new THREE.Mesh(balloonGeo, balloonMat);
        balloon.position.y = 6;
        balloon.castShadow = true;
        group.add(balloon);
        this.balloonMesh = balloon; // Save for animation if needed

        // 2. Basket
        const basketSize = 1.2;
        const basketGeo = new THREE.BoxGeometry(basketSize, basketSize, basketSize);
        const basket = new THREE.Mesh(basketGeo, wickerMat);
        basket.position.y = 0.6; // Sit on ground or just float?
        // Hot Air Balloons fly. So the whole group will be moved up.
        // But for placement, we probably want the basket to be reachable?
        // Let's assume the entity origin is on the ground, and the balloon floats high.
        // We'll add a default Y offset in update or here.
        // Let's put basket higher up so people don't walk through it easily if it's "flying".
        // Or if it's grounded, it sits on ground.
        // Let's make it float by default.
        basket.castShadow = true;
        basket.receiveShadow = true;
        group.add(basket);

        // 3. Ropes (Connecting Basket to Balloon)
        // Basket corners to Balloon center-bottom
        const ropeGeo = new THREE.CylinderGeometry(0.05, 0.05, 4, 4);
        ropeGeo.translate(0, 2, 0); // Pivot at bottom

        const cornerOffset = basketSize * 0.4;
        const ropeGroup = new THREE.Group();
        ropeGroup.position.y = basket.position.y + basketSize/2;

        const corners = [
            { x: cornerOffset, z: cornerOffset },
            { x: -cornerOffset, z: cornerOffset },
            { x: cornerOffset, z: -cornerOffset },
            { x: -cornerOffset, z: -cornerOffset }
        ];

        corners.forEach(c => {
            const rope = new THREE.Mesh(ropeGeo, ropeMat);
            rope.position.set(c.x, 0, c.z);
            // Angle towards center-ish or straight up? Balloon is wide.
            // Balloon bottom is at y=6 - (radius*1.3 ~ 4.5) = 1.5?
            // Sphere radius 3.5 scaled y 1.3 => height radius is 4.55.
            // Center is at 6. Bottom is 6 - 4.55 = 1.45.
            // Basket top is 0.6 + 0.6 = 1.2.
            // Gap is small.
            // Let's adjust balloon higher.
            balloon.position.y = 7.5;
            // Bottom of balloon ~ 7.5 - 4.55 = 2.95.
            // Basket top = 1.2.
            // Rope length needed ~ 1.75.

            // Let's just angle them slightly inwards to a ring on the balloon.
            rope.lookAt(new THREE.Vector3(c.x * 0.5, 3.5, c.z * 0.5));
            rope.scale.y = 0.6; // Shorten
            ropeGroup.add(rope);
        });
        group.add(ropeGroup);

        // 4. Burner Flame (Visual only)
        // Add a small point light or emissive mesh
        const burnerGeo = new THREE.CylinderGeometry(0.2, 0.1, 0.5, 8);
        const burnerMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        const burner = new THREE.Mesh(burnerGeo, burnerMat);
        burner.position.y = basket.position.y + basketSize/2 + 0.5;
        group.add(burner);
        this.burnerMesh = burner;

        // --- Logic Group ---
        // We want the whole thing to bob, so we put everything in a wrapper?
        // `createMesh` returns the root mesh.
        // BaseEntity sets mesh.position to `this.position`.
        // If we want bobbing relative to that, we should use a child group for visuals.

        const rootGroup = new THREE.Group();
        this.visualGroup = group;
        rootGroup.add(group);

        // Initial fly height
        this.flyHeight = params.flyHeight || (10 + Math.random() * 5);
        this.visualGroup.position.y = this.flyHeight;

        return rootGroup;
    }

    update(dt) {
        if (!this.mesh || !this.visualGroup) return;

        this.time += dt;

        // Bobbing
        const bob = Math.sin(this.time * this.bobSpeed) * this.bobAmplitude;
        this.visualGroup.position.y = this.flyHeight + bob;

        // Gentle rotation
        this.visualGroup.rotation.y = Math.sin(this.time * 0.1) * 0.2;

        // Burner Flicker
        if (this.burnerMesh) {
            const flicker = 0.8 + Math.random() * 0.4;
            this.burnerMesh.scale.setScalar(flicker);
        }
    }
}

EntityRegistry.register('hotAirBalloon', HotAirBalloonEntity);
