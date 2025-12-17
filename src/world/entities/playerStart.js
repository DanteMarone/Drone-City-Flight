import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class PlayerStartEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'playerStart';
    }

    createMesh(params) {
        // Create a visual marker for Dev Mode
        const group = new THREE.Group();

        // Marker Base (Cylinder)
        const baseGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 16);
        const baseMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: false });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.05;
        group.add(base);

        // Marker Pole
        const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 2, 8);
        const poleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 1;
        group.add(pole);

        // Marker Flag (Triangle)
        const flagShape = new THREE.Shape();
        flagShape.moveTo(0, 0);
        flagShape.lineTo(0, 0.5);
        flagShape.lineTo(0.8, 0.25);
        flagShape.lineTo(0, 0);

        const flagGeo = new THREE.ShapeGeometry(flagShape);
        const flagMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
        const flag = new THREE.Mesh(flagGeo, flagMat);
        flag.position.set(0, 1.5, 0);
        group.add(flag);

        // Arrow indicating forward direction (useful for spawn orientation)
        // Drone usually faces -Z (North) by default.
        // Let's add an arrow pointing to -Z.
        const arrowGeo = new THREE.ConeGeometry(0.2, 0.5, 8);
        arrowGeo.rotateX(-Math.PI / 2); // Point along +Z
        // Wait, standard forward is usually -Z in Three.js for cameras/objects?
        // Let's assume the entity rotation determines the spawn rotation.
        // If I rotate the entity, the flag rotates.
        // I'll add an arrow pointing in local -Z direction on the base.
        const arrow = new THREE.Mesh(arrowGeo, baseMat);
        arrow.position.set(0, 0.1, -0.6); // Slightly forward
        arrow.rotation.y = Math.PI; // Cone points up +Y by default. RotX(-90) -> +Z. Rotate Y 180 -> -Z.
        // Actually ConeGeometry default: tip at (0, height/2, 0).
        // rotateX(-PI/2) -> tip at (0, 0, -height/2)? No.
        // Cone points along +Y.
        // rotateX(-PI/2) -> Points along -Z? No, +Z?
        // Right Hand Rule: Thumb +X. Fingers Curl Y->Z.
        // Rotate -90 around X: +Y axis moves to -Z axis.
        // So yes, points to -Z.

        group.add(arrow);

        // Ensure it doesn't cast/receive shadows to keep it lightweight visual
        group.children.forEach(c => {
            c.castShadow = false;
            c.receiveShadow = false;
        });

        // Set userData for filtering later if needed
        group.userData.isPlayerStart = true;

        // Hidden by default (shown in DevMode)
        group.visible = false;

        return group;
    }

    static get displayName() {
        return 'Player Start';
    }
}

EntityRegistry.register('playerStart', PlayerStartEntity);
