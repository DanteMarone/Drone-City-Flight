import * as THREE from 'three';
import { BaseEntity } from './base.js';

export class HotAirBalloonEntity extends BaseEntity {
    static get displayName() {
        return 'Hot Air Balloon';
    }

    constructor(params) {
        super(params);
        this.type = 'hotAirBalloon';
        this.time = Math.random() * 100; // Random offset for bobbing
        this.lightHandle = null;
        this.baseY = 0; // Set in postInit
        this.swaySpeed = 0.5 + Math.random() * 0.5;
        console.log('HotAirBalloonEntity constructed');
    }

    createMesh(params) {
        const group = new THREE.Group();

        // 1. Balloon Envelope (Teardrop shape via scaling)
        const balloonGeo = new THREE.SphereGeometry(3, 32, 32);
        // Squish the bottom half?
        // Simple scale Y to 1.3
        balloonGeo.scale(1, 1.3, 1);

        const balloonTex = this._createBalloonTexture();
        const balloonMat = new THREE.MeshStandardMaterial({
            map: balloonTex,
            roughness: 0.6,
            metalness: 0.1
        });
        const balloon = new THREE.Mesh(balloonGeo, balloonMat);
        balloon.position.y = 4; // Lift it up so basket is near origin
        balloon.castShadow = true;
        balloon.receiveShadow = true;
        group.add(balloon);

        // 2. Basket
        const basketGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
        const basketMat = new THREE.MeshStandardMaterial({
            color: 0x8B4513, // SaddleBrown
            roughness: 0.9,
            map: this._createWickerTexture() // Simple wicker pattern
        });
        const basket = new THREE.Mesh(basketGeo, basketMat);
        basket.position.y = -0.5;
        basket.castShadow = true;
        basket.receiveShadow = true;
        group.add(basket);

        // 3. Ropes (4 corners)
        const ropeMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
        // Make them longer to reach the balloon center/equator
        const ropeGeo = new THREE.CylinderGeometry(0.02, 0.02, 4.5);

        const offsets = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]];
        offsets.forEach(([x, z]) => {
            const rope = new THREE.Mesh(ropeGeo, ropeMat);
            // Basket top approx y=0.1
            // Balloon center y=4
            // Rope mid y approx 2.0
            rope.position.set(x * 0.8, 1.75, z * 0.8);
            // Just vertical ropes for abstraction
            group.add(rope);
        });

        // 4. Burner (Visual)
        const burnerGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.5);
        const burnerMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const burner = new THREE.Mesh(burnerGeo, burnerMat);
        burner.position.y = 0.5;
        group.add(burner);

        // Store the burner mesh to attach light later
        this.burnerMesh = burner;

        return group;
    }

    postInit() {
        this.baseY = this.mesh.position.y;

        // Register virtual light for the burner
        if (window.app && window.app.world && window.app.world.lightSystem) {
            this.lightHandle = window.app.world.lightSystem.register({
                position: new THREE.Vector3(0, 0, 0), // Relative to parent
                color: 0xffaa00,
                intensity: 2.0,
                distance: 10,
                decay: 2
            });
            // Attach to burner mesh so it moves with the balloon
            this.lightHandle.parentMesh = this.burnerMesh;
        }
    }

    update(dt) {
        this.time += dt;

        // Bobbing motion
        const bob = Math.sin(this.time * 0.5) * 0.5;
        this.mesh.position.y = this.baseY + bob;

        // Gentle Swaying
        this.mesh.rotation.z = Math.sin(this.time * this.swaySpeed * 0.5) * 0.02;
        this.mesh.rotation.x = Math.cos(this.time * this.swaySpeed * 0.3) * 0.02;

        // Flicker Light
        if (this.lightHandle) {
            // Random flicker
            const flicker = 1.5 + Math.random() * 1.0;
            this.lightHandle.intensity = flicker;
        }
    }

    _createBalloonTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 512, 256);

        // Vertical Stripes
        const numStripes = 8;
        const stripeW = 512 / numStripes;
        const colors = ['#ff0000', '#0000ff', '#ffff00', '#00ff00', '#ffa500', '#800080', '#00ffff', '#ff00ff'];

        // Use a consistent random offset if possible, but random per call is fine as it's called once per mesh creation
        const offset = Math.floor(Math.random() * colors.length);

        for (let i = 0; i < numStripes; i++) {
            ctx.fillStyle = colors[(i + offset) % colors.length];
            ctx.fillRect(i * stripeW, 0, stripeW, 256);
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }

    _createWickerTexture() {
        if (HotAirBalloonEntity.wickerTexture) {
            return HotAirBalloonEntity.wickerTexture;
        }

        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, 0, 64, 64);

        // Cross hatch
        ctx.fillStyle = '#A0522D';
        for(let i=0; i<64; i+=8) {
            ctx.fillRect(i, 0, 4, 64);
            ctx.fillRect(0, i, 64, 4);
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;

        HotAirBalloonEntity.wickerTexture = tex;
        return tex;
    }
}
