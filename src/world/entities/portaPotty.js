import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class PortaPottyEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'portaPotty';
    }

    static get displayName() { return 'Porta-Potty'; }

    createMesh(params) {
        const group = new THREE.Group();

        // Dimensions
        const width = 1.0;
        const depth = 1.1;
        const height = 2.2;

        // Randomly select color (Blue vs Green)
        const isGreen = Math.random() > 0.7;
        const primaryColor = isGreen ? 0x228833 : 0x0055aa;

        // Materials
        const plasticMat = new THREE.MeshStandardMaterial({
            color: primaryColor,
            roughness: 0.6,
            metalness: 0.1
        });
        const roofMat = new THREE.MeshStandardMaterial({
            color: 0xeeeeee,
            roughness: 0.4,
            transparent: true,
            opacity: 0.9
        });
        const darkMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.9
        });
        const pipeMat = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.5
        });

        // 1. Main Cabin
        // Use a slightly chamfered box effect by stacking? Or just a box.
        // Let's use a BoxGeometry.
        const cabinGeo = new THREE.BoxGeometry(width, height, depth);
        // Move pivot to bottom
        cabinGeo.translate(0, height / 2, 0);

        const cabin = new THREE.Mesh(cabinGeo, plasticMat);
        cabin.castShadow = true;
        cabin.receiveShadow = true;
        group.add(cabin);

        // 2. Roof (Rounded top)
        // Use a Cylinder segment scaled or a Box with top bevel
        const roofGeo = new THREE.CylinderGeometry(0.6, 0.6, width, 16, 1, false, 0, Math.PI);
        // Rotate to lay flat across the top
        roofGeo.rotateZ(Math.PI / 2);
        // Scale to fit depth
        roofGeo.scale(1, 1, depth / (width * 1.1)); // Adjust aspect

        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = height;
        roof.castShadow = true;
        group.add(roof);

        // 3. Door
        const doorWidth = width * 0.85;
        const doorHeight = height * 0.85;
        const doorGeo = new THREE.BoxGeometry(doorWidth, doorHeight, 0.05);
        doorGeo.translate(0, doorHeight / 2 + 0.1, depth / 2 + 0.02); // Stick out slightly front

        // Door texture/color (slightly lighter/darker)
        const doorMat = plasticMat.clone();
        doorMat.color.offsetHSL(0, 0, 0.05); // Lighter

        const door = new THREE.Mesh(doorGeo, doorMat);
        door.castShadow = true;
        group.add(door);

        // Door details: Hinges
        const hingeGeo = new THREE.BoxGeometry(0.05, 0.15, 0.06);
        for(let y of [0.5, 1.8]) {
            const hinge = new THREE.Mesh(hingeGeo, darkMat);
            hinge.position.set(-doorWidth/2 - 0.02, y, depth/2 + 0.02);
            group.add(hinge);
        }

        // Door Handle
        const handleGeo = new THREE.BoxGeometry(0.15, 0.05, 0.08);
        const handle = new THREE.Mesh(handleGeo, darkMat);
        handle.position.set(doorWidth/2 - 0.1, 1.0, depth/2 + 0.06);
        group.add(handle);

        // Occupied Sign (Red/Green rectangle)
        const signGeo = new THREE.PlaneGeometry(0.15, 0.08);
        const isOccupied = Math.random() > 0.5;
        const signColor = isOccupied ? 0xff0000 : 0x00ff00;
        const signMat = new THREE.MeshBasicMaterial({ color: signColor });
        const sign = new THREE.Mesh(signGeo, signMat);
        sign.position.set(doorWidth/2 - 0.1, 1.15, depth/2 + 0.05);
        group.add(sign);

        // 4. Vent Pipe
        const pipeGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.6);
        const pipe = new THREE.Mesh(pipeGeo, pipeMat);
        pipe.position.set(width/2 - 0.15, height + 0.3, -depth/2 + 0.15);
        group.add(pipe);

        // 5. Vent Slits (Visual detail on sides)
        const slitGeo = new THREE.PlaneGeometry(0.6, 0.05);
        const slitMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

        // Add slits to left and right sides
        for(let side of [-1, 1]) {
            for(let i=0; i<3; i++) {
                const slit = new THREE.Mesh(slitGeo, slitMat);
                slit.position.set(side * (width/2 + 0.01), height - 0.3 - (i*0.1), 0);
                slit.rotation.y = side * Math.PI / 2;
                group.add(slit);
            }
        }

        return group;
    }
}

EntityRegistry.register('portaPotty', PortaPottyEntity);
