import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class PicnicTableEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'picnic_table';
        this.width = 2; // Approximate width for collider
        this.depth = 2; // Approximate depth for collider
        this.height = 1;
    }

    static get displayName() { return 'Picnic Table'; }

    createMesh(params) {
        const group = new THREE.Group();

        // Materials
        const woodColor = new THREE.Color(0x8B4513).multiplyScalar(0.8 + Math.random() * 0.4); // Random shade
        const woodMat = new THREE.MeshStandardMaterial({
            color: woodColor,
            roughness: 0.8,
            metalness: 0.1
        });

        const metalMat = new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.4,
            metalness: 0.8
        });

        // -----------------------
        // Table Top
        // -----------------------
        const tableTop = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 0.8), woodMat);
        tableTop.position.y = 0.75;
        tableTop.castShadow = true;
        tableTop.receiveShadow = true;
        group.add(tableTop);

        // -----------------------
        // Benches
        // -----------------------
        const benchGeo = new THREE.BoxGeometry(2, 0.1, 0.4);

        const bench1 = new THREE.Mesh(benchGeo, woodMat);
        bench1.position.set(0, 0.4, 0.7); // Front bench
        bench1.castShadow = true;
        bench1.receiveShadow = true;
        group.add(bench1);

        const bench2 = new THREE.Mesh(benchGeo, woodMat);
        bench2.position.set(0, 0.4, -0.7); // Back bench
        bench2.castShadow = true;
        bench2.receiveShadow = true;
        group.add(bench2);

        // -----------------------
        // Frame / Legs (A-Frame style)
        // -----------------------
        // Instead of complex angles, we can use angled cylinders
        const legGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.4);

        // Two frames: Left and Right
        [-0.8, 0.8].forEach(xOffset => {
            // Front Leg
            const l1 = new THREE.Mesh(legGeo, metalMat);
            l1.position.set(xOffset, 0.35, 0.35); // Center point
            l1.rotation.x = Math.PI / 6; // Angle out
            l1.castShadow = true;
            group.add(l1);

            // Back Leg
            const l2 = new THREE.Mesh(legGeo, metalMat);
            l2.position.set(xOffset, 0.35, -0.35); // Center point
            l2.rotation.x = -Math.PI / 6; // Angle out
            l2.castShadow = true;
            group.add(l2);

            // Crossbar (Support under table)
            const cross = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 1.2), metalMat);
            cross.position.set(xOffset, 0.7, 0);
            cross.castShadow = true;
            group.add(cross);
        });

        // -----------------------
        // Props (Random clutter)
        // -----------------------
        if (Math.random() > 0.3) {
            // Add a Soda Can
            const canColor = Math.random() > 0.5 ? 0xff0000 : 0x0000ff; // Red or Blue
            const can = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.12, 12), new THREE.MeshStandardMaterial({ color: canColor, metalness: 0.4, roughness: 0.3 }));
            can.position.set((Math.random() - 0.5) * 1.5, 0.81, (Math.random() - 0.5) * 0.4);
            can.castShadow = true;
            group.add(can);
        }

        if (Math.random() > 0.7) {
            // Add a Picnic Basket
            const basketGroup = new THREE.Group();
            const basketBody = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.3), new THREE.MeshStandardMaterial({ color: 0xd2b48c }));
            basketBody.castShadow = true;
            basketGroup.add(basketBody);

            const handle = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.02, 8, 16, Math.PI), new THREE.MeshStandardMaterial({ color: 0x8b4513 }));
            handle.rotation.y = Math.PI / 2;
            handle.position.y = 0.12;
            basketGroup.add(handle);

            basketGroup.position.set((Math.random() - 0.5) * 1.0, 0.875, (Math.random() - 0.5) * 0.3);
            basketGroup.rotation.y = Math.random() * Math.PI;
            group.add(basketGroup);
        }

        return group;
    }
}

EntityRegistry.register('picnic_table', PicnicTableEntity);
