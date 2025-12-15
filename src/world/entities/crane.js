import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class CraneEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'crane';
        this.rotationSpeed = params.rotationSpeed || 0.1;
    }

    static get displayName() { return 'Construction Crane'; }

    createMesh(params) {
        const height = params.height || 30;
        const jibLength = params.jibLength || 20;
        const color = params.color || 0xFFCC00; // Construction Yellow

        this.params.height = height;
        this.params.jibLength = jibLength;
        this.params.color = color;
        this.params.rotationSpeed = this.rotationSpeed;

        const group = new THREE.Group();

        // Materials
        const paintMat = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.7,
            metalness: 0.1
        });
        const concreteMat = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.9
        });
        const cableMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

        // 1. Base (Static)
        const baseSize = 4;
        const baseGeo = new THREE.BoxGeometry(baseSize, 2, baseSize);
        const baseMesh = new THREE.Mesh(baseGeo, concreteMat);
        baseMesh.position.y = 1;
        baseMesh.castShadow = true;
        baseMesh.receiveShadow = true;
        group.add(baseMesh);

        // 2. Mast (Static)
        // Represented as a solid truss block for performance
        const mastWidth = 1.2;
        const mastGeo = new THREE.BoxGeometry(mastWidth, height, mastWidth);
        const mastMesh = new THREE.Mesh(mastGeo, paintMat);
        mastMesh.position.y = height / 2 + 2; // On top of base
        mastMesh.castShadow = true;
        group.add(mastMesh);

        // 3. Rotating Assembly (Top)
        const topGroup = new THREE.Group();
        topGroup.name = 'rotatingAssembly';
        topGroup.position.y = height + 2;
        group.add(topGroup);

        // Turntable/Cab connector
        const turntableGeo = new THREE.CylinderGeometry(1, 1, 1, 16);
        const turntableMesh = new THREE.Mesh(turntableGeo, paintMat);
        turntableMesh.position.y = 0.5;
        topGroup.add(turntableMesh);

        // Cab
        const cabGeo = new THREE.BoxGeometry(1.5, 2, 1.5);
        const cabMesh = new THREE.Mesh(cabGeo, new THREE.MeshStandardMaterial({ color: 0xeeeeee }));
        cabMesh.position.set(1.2, 1.5, 0.5); // Offset to side
        topGroup.add(cabMesh);

        // Jib (The long arm)
        const jibGeo = new THREE.BoxGeometry(jibLength, 1, 1);
        jibGeo.translate(jibLength / 2 - 2, 0, 0); // Pivot near the mast
        const jibMesh = new THREE.Mesh(jibGeo, paintMat);
        jibMesh.position.y = 2.5;
        topGroup.add(jibMesh);

        // Counter-Jib
        const counterJibLen = 8;
        const counterJibGeo = new THREE.BoxGeometry(counterJibLen, 1, 1);
        counterJibGeo.translate(-(counterJibLen / 2 + 2), 0, 0);
        const counterJibMesh = new THREE.Mesh(counterJibGeo, paintMat);
        counterJibMesh.position.y = 2.5;
        topGroup.add(counterJibMesh);

        // Counterweights
        const weightGeo = new THREE.BoxGeometry(2, 1.5, 3);
        const weightMesh = new THREE.Mesh(weightGeo, concreteMat);
        weightMesh.position.set(-(counterJibLen - 1), 1.5, 0);
        topGroup.add(weightMesh);

        // Cable/Hook (Visual only)
        // Hang it from somewhere along the jib
        const hookPos = jibLength * 0.7;
        const cableLen = height * 0.6;

        // Cable line
        const cableGeo = new THREE.CylinderGeometry(0.05, 0.05, cableLen);
        cableGeo.translate(0, -cableLen / 2, 0);
        const cableMesh = new THREE.Mesh(cableGeo, cableMat);
        cableMesh.position.set(hookPos - 2, 2, 0);
        topGroup.add(cableMesh);

        // Hook block
        const blockGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const blockMesh = new THREE.Mesh(blockGeo, new THREE.MeshStandardMaterial({ color: 0xFFFF00 }));
        blockMesh.position.set(hookPos - 2, 2 - cableLen, 0);
        topGroup.add(blockMesh);

        // Light on top
        const beaconGeo = new THREE.SphereGeometry(0.3, 8, 8);
        const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.set(0, 3.5, 0);
        topGroup.add(beacon);

        return group;
    }

    update(dt) {
        if (this.mesh) {
            const topGroup = this.mesh.getObjectByName('rotatingAssembly');
            if (topGroup) {
                topGroup.rotation.y += this.rotationSpeed * dt;
            }
        }
    }
}

EntityRegistry.register('crane', CraneEntity);
