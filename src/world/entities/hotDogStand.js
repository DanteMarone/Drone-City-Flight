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

        // Materials
        const metalMat = new THREE.MeshStandardMaterial({
            color: 0xaaaaaa,
            roughness: 0.3,
            metalness: 0.8
        });
        const cartPaintMat = new THREE.MeshStandardMaterial({
            color: 0xcc0000,
            roughness: 0.6
        }); // Red side panels
        const tireMat = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.9
        });
        const rimMat = new THREE.MeshStandardMaterial({
            color: 0xeeeeee,
            metalness: 0.5
        });

        // 1. Cart Body
        const cartGroup = new THREE.Group();
        group.add(cartGroup);

        const bodyGeo = new THREE.BoxGeometry(1.6, 1.0, 0.9);
        const body = new THREE.Mesh(bodyGeo, metalMat);
        body.position.y = 0.9; // Wheels are radius 0.4
        body.castShadow = true;
        body.receiveShadow = true;
        cartGroup.add(body);

        // Side Panels (Red branding)
        const panelGeo = new THREE.BoxGeometry(1.62, 0.6, 0.92);
        const panel = new THREE.Mesh(panelGeo, cartPaintMat);
        panel.position.y = 0.9;
        cartGroup.add(panel);

        // Counter Top
        const counterGeo = new THREE.BoxGeometry(1.7, 0.05, 1.0);
        const counter = new THREE.Mesh(counterGeo, metalMat);
        counter.position.y = 1.42;
        counter.castShadow = true;
        cartGroup.add(counter);

        // 2. Wheels (Left Side)
        const wheelGroup = new THREE.Group();
        const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.15, 16);
        wheelGeo.rotateZ(Math.PI / 2); // Rotate to roll

        const w1 = new THREE.Mesh(wheelGeo, tireMat);
        w1.position.set(-0.5, 0.35, 0.5);
        w1.castShadow = true;

        const w2 = new THREE.Mesh(wheelGeo, tireMat);
        w2.position.set(-0.5, 0.35, -0.5);
        w2.castShadow = true;

        // Axle
        const axleGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8);
        axleGeo.rotateX(Math.PI / 2);
        const axle = new THREE.Mesh(axleGeo, metalMat);
        axle.position.set(-0.5, 0.35, 0);

        wheelGroup.add(w1, w2, axle);
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
        this.umbrellaGroup.position.set(0, 1.4, 0); // On counter
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

        const canopyGeo = new THREE.ConeGeometry(1.4, 0.6, 16, 1, true); // Open ended
        const canopy = new THREE.Mesh(canopyGeo, canopyMat);
        canopy.position.y = 2.5;
        canopy.castShadow = true;
        this.umbrellaGroup.add(canopy);

        // 4. Props on Counter
        // Mustard Bottle
        const bottleGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.2, 8);
        const capGeo = new THREE.ConeGeometry(0.02, 0.1, 8);

        const musMat = new THREE.MeshStandardMaterial({ color: 0xffdd00 }); // Yellow
        const musBottle = new THREE.Mesh(bottleGeo, musMat);
        musBottle.position.set(0.3, 1.55, 0.2);
        const musCap = new THREE.Mesh(capGeo, musMat);
        musCap.position.set(0.3, 1.7, 0.2);
        group.add(musBottle, musCap);

        // Ketchup Bottle
        const ketMat = new THREE.MeshStandardMaterial({ color: 0xcc0000 }); // Red
        const ketBottle = new THREE.Mesh(bottleGeo, ketMat);
        ketBottle.position.set(0.45, 1.55, 0.25);
        const ketCap = new THREE.Mesh(capGeo, ketMat);
        ketCap.position.set(0.45, 1.7, 0.25);
        group.add(ketBottle, ketCap);

        // Grill Area
        const grillGeo = new THREE.BoxGeometry(0.8, 0.02, 0.4);
        const grillMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
        const grill = new THREE.Mesh(grillGeo, grillMat);
        grill.position.set(-0.2, 1.45, 0.1);
        group.add(grill);

        // Hot Dogs on Grill
        const hotDogGeo = new THREE.CapsuleGeometry(0.03, 0.15, 4, 8);
        hotDogGeo.rotateZ(Math.PI / 2);
        const sausageMat = new THREE.MeshStandardMaterial({ color: 0x883311 });

        for(let i=0; i<3; i++) {
            const hd = new THREE.Mesh(hotDogGeo, sausageMat);
            hd.position.set(-0.4 + (i*0.15), 1.47, 0.1);
            group.add(hd);
        }

        return group;
    }

    _createStripedTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 256, 256);

        // Red Stripes
        ctx.fillStyle = '#ff0000';
        const numStripes = 8;
        const stripeWidth = 256 / numStripes;

        for (let i = 0; i < numStripes; i+=2) {
            ctx.fillRect(i * stripeWidth, 0, stripeWidth, 256);
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.colorSpace = THREE.SRGBColorSpace;

        // Rotate texture to make stripes radial on cone?
        // Actually, UV mapping of cone wraps around.
        // Vertical stripes on texture = Radial stripes on cone.
        tex.repeat.set(4, 1);

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
