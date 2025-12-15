import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class StreetLightEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'streetLight';
    }

    static get displayName() { return 'Street Light'; }

    createMesh(params) {
        const height = params.height || 10;
        this.params.height = height;

        const group = new THREE.Group();

        // Materials
        const metalMat = new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.5,
            metalness: 0.8
        });

        const emissiveMat = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            toneMapped: false // Make it glow brighter
        });

        // 1. Base/Pole
        const poleGeo = new THREE.CylinderGeometry(0.2, 0.3, height, 8);
        const pole = new THREE.Mesh(poleGeo, metalMat);
        pole.position.y = height / 2;
        pole.castShadow = true;
        pole.receiveShadow = true;
        group.add(pole);

        // 2. Base Plate (Decorative)
        const plateGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 8);
        const plate = new THREE.Mesh(plateGeo, metalMat);
        plate.position.y = 0.1;
        group.add(plate);

        // 3. Arm
        // Curve the arm or just use a horizontal cylinder
        const armLength = 3;
        const armGeo = new THREE.CylinderGeometry(0.15, 0.15, armLength, 8);
        // Rotate to be horizontal
        armGeo.rotateZ(Math.PI / 2);
        // Translate so it starts at the pole
        armGeo.translate(armLength / 2, 0, 0);

        const arm = new THREE.Mesh(armGeo, metalMat);
        arm.position.y = height - 0.5;
        arm.castShadow = true;
        group.add(arm);

        // 4. Lamp Head
        const headGeo = new THREE.BoxGeometry(1.2, 0.4, 0.6);
        const head = new THREE.Mesh(headGeo, metalMat);
        // Position at end of arm
        head.position.set(armLength, height - 0.5, 0);
        head.castShadow = true;
        group.add(head);

        // 5. Bulb (Emissive)
        const bulbGeo = new THREE.PlaneGeometry(0.8, 0.4);
        bulbGeo.rotateX(Math.PI / 2); // Face down
        const bulb = new THREE.Mesh(bulbGeo, emissiveMat);
        bulb.position.set(armLength, height - 0.5 - 0.21, 0); // Slightly below head
        group.add(bulb);

        return group;
    }

    createCollider() {
        if (!this.mesh) return null;
        // Collider should just be the pole to avoid cars hitting the overhead light
        // The pole is centered at (0, y, 0) with radius 0.3 approx.
        const box = new THREE.Box3();
        box.min.set(-0.5, 0, -0.5);
        box.max.set(0.5, this.params.height, 0.5);

        // Transform the box by the mesh's world matrix is usually done by Physics,
        // but here we return a local AABB that ColliderSystem uses?
        // Let's check BaseEntity.createCollider.
        // It does `box.setFromObject(this.mesh)`.

        // If we want a tighter collider (just the pole), we can construct it manually.
        // But `BaseEntity` default behavior works fine, it just might be large if it includes the arm.
        // Actually, if we include the arm, the bounding box will be wide, and cars might hit "air" under the arm.

        // So yes, we should override to return a box around the pole.
        // We need to apply the mesh's current transform to our local pole definition
        // because ColliderSystem expects the box in World Space?

        // Wait, BaseEntity.createCollider does `this.mesh.updateMatrixWorld(true); box.setFromObject(this.mesh)`.
        // This implies the returned box is in World Space.

        // So I need to calculate the world space box of the pole.

        this.mesh.updateMatrixWorld(true);
        const poleBox = new THREE.Box3();

        // Local bounds of pole
        const r = 0.4; // Slightly larger than pole radius
        const h = this.params.height;

        // We need to transform these local points to world space
        const points = [
            new THREE.Vector3(-r, 0, -r),
            new THREE.Vector3(r, 0, -r),
            new THREE.Vector3(-r, 0, r),
            new THREE.Vector3(r, 0, r),
            new THREE.Vector3(-r, h, -r),
            new THREE.Vector3(r, h, -r),
            new THREE.Vector3(-r, h, r),
            new THREE.Vector3(r, h, r)
        ];

        for (const p of points) {
            p.applyMatrix4(this.mesh.matrixWorld);
            poleBox.expandByPoint(p);
        }

        return poleBox;
    }
}

EntityRegistry.register('streetLight', StreetLightEntity);
