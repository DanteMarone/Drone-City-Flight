import * as THREE from 'three';
import { VehicleEntity } from './vehicles.js';
import { EntityRegistry } from './registry.js';
import { CONFIG } from '../../config.js';

export class FoodTruckEntity extends VehicleEntity {
    constructor(params) {
        super(params);
        this.type = 'foodTruck';
        this.baseSpeed = (CONFIG.DRONE.MAX_SPEED || 18.0) - 4.0; // Slower, heavy vehicle

        // Randomly select a food type if not specified
        const types = ['BURGER', 'DONUT', 'ICE_CREAM'];
        this.foodType = params?.foodType || types[Math.floor(Math.random() * types.length)];

        this.waitTime = params?.waitTime ?? 10; // Longer stops to serve customers
    }

    static get displayName() { return 'Food Truck'; }

    createMesh(params) {
        const group = new THREE.Group();
        const modelGroup = new THREE.Group();
        modelGroup.name = 'modelGroup';
        group.add(modelGroup);

        // --- Materials ---
        const colors = {
            BURGER: 0xD32F2F,    // Red
            DONUT: 0xC2185B,     // Pink
            ICE_CREAM: 0x1976D2  // Blue
        };
        const primaryColor = colors[this.foodType] || 0xffffff;

        const truckMat = new THREE.MeshStandardMaterial({
            color: primaryColor,
            roughness: 0.3,
            metalness: 0.4
        });

        const chassisMat = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.9
        });

        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x88ccff,
            roughness: 0.2,
            metalness: 0.8
        });

        const chromeMat = new THREE.MeshStandardMaterial({
            color: 0xeeeeee,
            roughness: 0.2,
            metalness: 0.9
        });

        // --- Geometry Construction ---

        // 1. Main Body (Boxy Kitchen)
        // Width: 2.2m, Height: 2.5m, Length: 4.5m
        const bodyGeo = new THREE.BoxGeometry(2.2, 2.5, 4.5);
        bodyGeo.translate(0, 1.25 + 0.5, -0.5); // Lift up (0.5 wheel clearance)
        const body = new THREE.Mesh(bodyGeo, truckMat);
        body.castShadow = true;
        body.receiveShadow = true;
        modelGroup.add(body);

        // 2. Cab (Front)
        // Width: 2.1m, Height: 1.8m, Length: 1.5m
        const cabGeo = new THREE.BoxGeometry(2.1, 1.8, 1.5);
        cabGeo.translate(0, 0.9 + 0.5, 2.5);
        const cab = new THREE.Mesh(cabGeo, truckMat);
        cab.castShadow = true;
        cab.receiveShadow = true;
        modelGroup.add(cab);

        // Windshield
        const windshieldGeo = new THREE.PlaneGeometry(1.9, 0.8);
        const windshield = new THREE.Mesh(windshieldGeo, glassMat);
        windshield.position.set(0, 1.8, 3.26);
        windshield.rotation.x = -0.1; // Slight tilt
        modelGroup.add(windshield);

        // 3. Serving Window (Side)
        // Cutout look using black plane or inset
        const windowFrameGeo = new THREE.BoxGeometry(0.1, 1.2, 2.5);
        const windowFrame = new THREE.Mesh(windowFrameGeo, chromeMat);
        windowFrame.position.set(1.1, 2.0, -0.5);
        modelGroup.add(windowFrame);

        const counterGeo = new THREE.BoxGeometry(0.4, 0.05, 2.5);
        const counter = new THREE.Mesh(counterGeo, chromeMat);
        counter.position.set(1.3, 1.4, -0.5);
        modelGroup.add(counter);

        const shutterGeo = new THREE.PlaneGeometry(2.4, 1.1);
        const shutterMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 });
        const shutter = new THREE.Mesh(shutterGeo, shutterMat);
        shutter.position.set(1.16, 2.0, -0.5);
        shutter.rotation.y = Math.PI / 2;
        // shutter.rotation.z = Math.PI / 4; // Open awning style?
        // Let's make it an awning
        shutter.rotation.z = -Math.PI / 6; // Tilt up
        shutter.position.y += 0.5; // Move pivot up
        modelGroup.add(shutter);


        // 4. Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
        wheelGeo.rotateZ(Math.PI / 2);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });

        const positions = [
            [1.0, 0.4, 2.5],  // Front R
            [-1.0, 0.4, 2.5], // Front L
            [1.0, 0.4, -1.5], // Rear R
            [-1.0, 0.4, -1.5] // Rear L
        ];

        positions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.position.set(...pos);
            wheel.castShadow = true;
            modelGroup.add(wheel);
        });

        // 5. Roof Prop (The "Sign")
        this.roofProp = new THREE.Group();
        this.roofProp.position.set(0, 4.0, -0.5);

        // Add a rotating base for the prop
        const propBaseGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.5);
        const propBase = new THREE.Mesh(propBaseGeo, chromeMat);
        this.roofProp.add(propBase);

        const propMesh = this._createFoodProp();
        propMesh.position.y = 0.5;
        this.roofProp.add(propMesh);

        modelGroup.add(this.roofProp);

        // 6. Signage (Procedural Texture)
        const signCanvas = this._createSignTexture(this.foodType, primaryColor);
        const signTexture = new THREE.CanvasTexture(signCanvas);
        signTexture.colorSpace = THREE.SRGBColorSpace;

        const signBoardGeo = new THREE.PlaneGeometry(3.0, 0.8);
        const signBoardMat = new THREE.MeshBasicMaterial({ map: signTexture, transparent: true });

        // Left Side Sign
        const leftSign = new THREE.Mesh(signBoardGeo, signBoardMat);
        leftSign.position.set(1.11, 3.2, -0.5);
        leftSign.rotation.y = Math.PI / 2;
        modelGroup.add(leftSign);

        // Right Side Sign
        const rightSign = new THREE.Mesh(signBoardGeo, signBoardMat);
        rightSign.position.set(-1.11, 3.2, -0.5);
        rightSign.rotation.y = -Math.PI / 2;
        modelGroup.add(rightSign);


        return group;
    }

    _createFoodProp() {
        const group = new THREE.Group();

        if (this.foodType === 'BURGER') {
            // Bun Bottom
            const bunMat = new THREE.MeshStandardMaterial({ color: 0xC58C58, roughness: 0.8 });
            const bunBot = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.7, 0.3, 12), bunMat);

            // Patty
            const meatMat = new THREE.MeshStandardMaterial({ color: 0x3E2723, roughness: 1.0 });
            const patty = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.2, 12), meatMat);
            patty.position.y = 0.25;

            // Cheese
            const cheeseMat = new THREE.MeshStandardMaterial({ color: 0xFFC107, roughness: 0.5 });
            const cheese = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 1.5), cheeseMat);
            cheese.position.y = 0.36;
            cheese.rotation.y = Math.PI / 4;

            // Lettuce
            const lettuceMat = new THREE.MeshStandardMaterial({ color: 0x4CAF50, roughness: 0.9 });
            const lettuce = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.1, 12), lettuceMat);
            lettuce.position.y = 0.45;

            // Bun Top
            const bunTopGeo = new THREE.SphereGeometry(0.8, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2);
            bunTopGeo.scale(1, 0.6, 1);
            const bunTop = new THREE.Mesh(bunTopGeo, bunMat);
            bunTop.position.y = 0.5;

            group.add(bunBot, patty, cheese, lettuce, bunTop);

        } else if (this.foodType === 'DONUT') {
            const doughMat = new THREE.MeshStandardMaterial({ color: 0xE6C098, roughness: 0.8 });
            const icingMat = new THREE.MeshStandardMaterial({ color: 0xF48FB1, roughness: 0.2 });
            const sprinkleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });

            const donut = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.3, 12, 24), doughMat);
            donut.rotation.x = Math.PI / 2;

            // Simple Icing (Torus slightly larger and thinner)
            const icing = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.28, 12, 24, Math.PI * 2), icingMat);
            icing.rotation.x = Math.PI / 2;
            icing.position.y = 0.05;
            icing.scale.set(1, 1, 0.5); // Flatten

            group.add(donut, icing);

        } else if (this.foodType === 'ICE_CREAM') {
            // Cone
            const coneMat = new THREE.MeshStandardMaterial({ color: 0xD7CCC8, roughness: 0.9 });
            const cone = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.2, 12, 1, true), coneMat);
            cone.rotation.x = Math.PI; // Point down
            cone.position.y = 0.6;

            // Scoops
            const scoopMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.5 }); // Vanilla
            const scoop1 = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 12), scoopMat);
            scoop1.position.y = 1.2;

            const scoopMat2 = new THREE.MeshStandardMaterial({ color: 0xF8BBD0, roughness: 0.5 }); // Strawberry
            const scoop2 = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 12), scoopMat2);
            scoop2.position.y = 1.6;

            group.add(cone, scoop1, scoop2);
            // Center it
            group.position.y = -0.5;
        }

        // Scale it up
        group.scale.set(1.5, 1.5, 1.5);
        return group;
    }

    _createSignTexture(type, baseColorHex) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#' + new THREE.Color(baseColorHex).getHexString();
        ctx.fillRect(0, 0, 512, 128);

        // Stripes
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        for(let i=0; i<512; i+=40) {
            ctx.fillRect(i, 0, 20, 128);
        }

        // Text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let text = "FOOD TRUCK";
        if (type === 'BURGER') text = "BURGER KING";
        if (type === 'DONUT') text = "DONUT STOP";
        if (type === 'ICE_CREAM') text = "ICE COLD";

        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.fillText(text, 256, 64);

        return canvas;
    }

    update(dt) {
        super.update(dt);

        // Animate the roof prop
        if (this.roofProp) {
            this.roofProp.rotation.y += 1.0 * dt;
        }
    }

    postInit() {
        super.postInit();
        if (this.mesh) {
            this.mesh.userData.foodType = this.foodType;
        }
    }

    serialize() {
        const data = super.serialize();
        data.params.foodType = this.mesh?.userData?.foodType ?? this.foodType;
        return data;
    }
}

EntityRegistry.register('foodTruck', FoodTruckEntity);
