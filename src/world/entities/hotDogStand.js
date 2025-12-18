import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class HotDogStandEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'hotDogStand';
        this.time = Math.random() * 100;
    }

    static get displayName() { return 'Hot Dog Stand'; }

    createMesh(params) {
        const group = new THREE.Group();

        // Materials - Brighter and more vivid
        const metalMat = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            roughness: 0.3,
            metalness: 0.8
        });

        // Create custom texture for the side panel
        const signTex = this._createSignTexture();
        const cartPaintMat = new THREE.MeshStandardMaterial({
            map: signTex,
            roughness: 0.4,
            color: 0xffffff
        });

        const tireMat = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.9
        });

        const rimMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.5,
            roughness: 0.5
        });

        // 1. Cart Body
        const cartGroup = new THREE.Group();
        group.add(cartGroup);

        const bodyGeo = new THREE.BoxGeometry(1.6, 1.0, 0.9);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 }); // Dark grey interior frame
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.9;
        body.castShadow = true;
        body.receiveShadow = true;
        cartGroup.add(body);

        // Side Panels (Branded)
        const panelGeo = new THREE.BoxGeometry(1.62, 0.7, 0.92);
        const panel = new THREE.Mesh(panelGeo, cartPaintMat);
        panel.position.y = 0.9;
        cartGroup.add(panel);

        // Counter Top
        const counterGeo = new THREE.BoxGeometry(1.7, 0.05, 1.0);
        const counterMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.5, metalness: 0.2 });
        const counter = new THREE.Mesh(counterGeo, counterMat);
        counter.position.y = 1.42;
        counter.castShadow = true;
        cartGroup.add(counter);

        // 2. Wheels (Left Side)
        const wheelGroup = new THREE.Group();
        const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.15, 32);
        wheelGeo.rotateZ(Math.PI / 2);

        const w1 = new THREE.Mesh(wheelGeo, tireMat);
        w1.position.set(-0.5, 0.35, 0.5);
        w1.castShadow = true;

        // Hubcap
        const hubGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.16, 16);
        hubGeo.rotateZ(Math.PI / 2);
        const h1 = new THREE.Mesh(hubGeo, rimMat);
        h1.position.copy(w1.position);

        const w2 = new THREE.Mesh(wheelGeo, tireMat);
        w2.position.set(-0.5, 0.35, -0.5);
        w2.castShadow = true;

        const h2 = new THREE.Mesh(hubGeo, rimMat);
        h2.position.copy(w2.position);

        // Axle
        const axleGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8);
        axleGeo.rotateX(Math.PI / 2);
        const axle = new THREE.Mesh(axleGeo, metalMat);
        axle.position.set(-0.5, 0.35, 0);

        wheelGroup.add(w1, h1, w2, h2, axle);
        group.add(wheelGroup);

        // Support Legs (Right Side)
        const legGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8);
        const l1 = new THREE.Mesh(legGeo, metalMat);
        l1.position.set(0.6, 0.25, 0.3);

        const l2 = new THREE.Mesh(legGeo, metalMat);
        l2.position.set(0.6, 0.25, -0.3);

        group.add(l1, l2);

        // 3. Umbrella
        this.umbrellaGroup = new THREE.Group();
        this.umbrellaGroup.position.set(0, 1.4, 0);
        group.add(this.umbrellaGroup);

        // Pole
        const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.5, 8);
        const pole = new THREE.Mesh(poleGeo, metalMat);
        pole.position.y = 1.25;
        this.umbrellaGroup.add(pole);

        // Canopy (Striped Texture)
        const canopyTex = this._createStripedTexture();
        const canopyMat = new THREE.MeshStandardMaterial({
            map: canopyTex,
            side: THREE.DoubleSide,
            roughness: 0.8
        });

        // Smoother cone
        const canopyGeo = new THREE.ConeGeometry(1.4, 0.6, 32, 1, true);
        const canopy = new THREE.Mesh(canopyGeo, canopyMat);
        canopy.position.y = 2.5;
        canopy.castShadow = true;
        this.umbrellaGroup.add(canopy);

        // 4. Props on Counter
        this._addCondiments(group);

        // Grill Area
        const grillGeo = new THREE.BoxGeometry(0.8, 0.02, 0.4);
        const grillMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
        const grill = new THREE.Mesh(grillGeo, grillMat);
        grill.position.set(-0.2, 1.45, 0.1);
        group.add(grill);

        // Hot Dogs on Grill
        const hotDogGeo = new THREE.CapsuleGeometry(0.035, 0.18, 4, 16);
        hotDogGeo.rotateZ(Math.PI / 2);
        const sausageMat = new THREE.MeshStandardMaterial({ color: 0x883311, roughness: 0.6 });

        for(let i=0; i<4; i++) {
            const hd = new THREE.Mesh(hotDogGeo, sausageMat);
            hd.position.set(-0.45 + (i*0.12), 1.47, 0.1 + (Math.random() * 0.05));
            hd.rotation.y = (Math.random() - 0.5) * 0.2; // Slight random rotation
            group.add(hd);
        }

        // Napkin holder
        const napkinGeo = new THREE.BoxGeometry(0.15, 0.1, 0.15);
        const napkinMat = new THREE.MeshStandardMaterial({ color: 0xcccccc }); // Silver
        const holder = new THREE.Mesh(napkinGeo, napkinMat);
        holder.position.set(0.6, 1.5, -0.2);

        const paperGeo = new THREE.BoxGeometry(0.13, 0.08, 0.01);
        const paperMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const p1 = new THREE.Mesh(paperGeo, paperMat);
        p1.position.set(0, 0.05, 0.02);
        holder.add(p1);

        group.add(holder);

        return group;
    }

    _addCondiments(group) {
        // Detailed bottles
        const bottleBodyGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.18, 16);
        const bottleNeckGeo = new THREE.CylinderGeometry(0.02, 0.06, 0.05, 16);
        const capGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.04, 16);

        const createBottle = (color, x, z) => {
            const bGroup = new THREE.Group();
            bGroup.position.set(x, 1.54, z);

            const mat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.2 });
            const body = new THREE.Mesh(bottleBodyGeo, mat);

            const neck = new THREE.Mesh(bottleNeckGeo, mat);
            neck.position.y = 0.115;

            const cap = new THREE.Mesh(capGeo, mat); // Same color cap often, or white
            cap.position.y = 0.15;

            bGroup.add(body, neck, cap);
            bGroup.castShadow = true;
            return bGroup;
        };

        const mustard = createBottle(0xffdd00, 0.3, 0.2);
        const ketchup = createBottle(0xcc0000, 0.45, 0.25);
        const relish = createBottle(0x006600, 0.38, 0.35); // Added Relish

        group.add(mustard, ketchup, relish);
    }

    _createStripedTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 512, 512);

        // Red Stripes
        ctx.fillStyle = '#e60000';
        const numStripes = 16;
        const stripeWidth = 512 / numStripes;

        for (let i = 0; i < numStripes; i+=2) {
            ctx.fillRect(i * stripeWidth, 0, stripeWidth, 512);
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.repeat.set(8, 1);

        return tex;
    }

    _createSignTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Red background
        ctx.fillStyle = '#cc0000';
        ctx.fillRect(0, 0, 512, 256);

        // Border
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 10;
        ctx.strokeRect(10, 10, 492, 236);

        // Text
        ctx.fillStyle = '#ffcc00'; // Yellow text
        ctx.font = 'bold 80px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillText('HOT DOGS', 256, 128);

        // Dirt/Noise for realism
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = '#000000';
        for(let i=0; i<100; i++) {
            ctx.beginPath();
            ctx.arc(Math.random()*512, Math.random()*256, Math.random()*20, 0, Math.PI*2);
            ctx.fill();
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }

    update(dt) {
        if (!this.mesh) return;
        this.time += dt;

        // Subtle umbrella movement (wind)
        if (this.umbrellaGroup) {
            const windStrength = 0.05;
            this.umbrellaGroup.rotation.z = Math.sin(this.time * 0.5) * windStrength;
            this.umbrellaGroup.rotation.x = Math.cos(this.time * 0.3) * windStrength;
        }
    }
}

EntityRegistry.register('hotDogStand', HotDogStandEntity);
