import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class BikeRackEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'bikeRack';
        this.slotCount = params.slotCount ?? 3;
        this.pulseOffset = Math.random() * Math.PI * 2;
        this.elapsed = 0;
        this.ledMesh = null;
    }

    static get displayName() { return 'Bike Rack'; }

    createMesh() {
        const group = new THREE.Group();

        const metalMat = new THREE.MeshStandardMaterial({
            color: 0x9aa3ad,
            roughness: 0.35,
            metalness: 0.85
        });
        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x2f3236,
            roughness: 0.7,
            metalness: 0.2
        });
        const accentMat = new THREE.MeshStandardMaterial({
            color: 0x1c2731,
            roughness: 0.5,
            metalness: 0.6
        });
        const ledMat = new THREE.MeshStandardMaterial({
            color: 0x3ad3ff,
            emissive: new THREE.Color(0x3ad3ff),
            emissiveIntensity: 0.6,
            roughness: 0.2,
            metalness: 0.2
        });

        const rackWidth = Math.max(1.4, this.slotCount * 0.5);
        const baseGeo = new THREE.BoxGeometry(rackWidth, 0.08, 0.5);
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.04;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const anchorGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.12, 12);
        for (const xOffset of [-rackWidth * 0.35, rackWidth * 0.35]) {
            const anchor = new THREE.Mesh(anchorGeo, accentMat);
            anchor.position.set(xOffset, 0.06, 0.18);
            anchor.castShadow = true;
            anchor.receiveShadow = true;
            group.add(anchor);
        }

        const hoopRadius = 0.18;
        const hoopTube = 0.04;
        const hoopDepth = 0.14;
        const hoopGeo = new THREE.TorusGeometry(hoopRadius, hoopTube, 12, 24, Math.PI);
        hoopGeo.rotateZ(Math.PI);
        hoopGeo.rotateX(Math.PI / 2);

        const legGeo = new THREE.CylinderGeometry(hoopTube * 0.9, hoopTube * 0.9, 0.32, 12);

        for (let i = 0; i < this.slotCount; i += 1) {
            const t = this.slotCount === 1 ? 0 : i / (this.slotCount - 1);
            const xOffset = THREE.MathUtils.lerp(-rackWidth * 0.35, rackWidth * 0.35, t);

            const hoop = new THREE.Mesh(hoopGeo, metalMat);
            hoop.position.set(xOffset, 0.35, 0);
            hoop.castShadow = true;
            hoop.receiveShadow = true;
            group.add(hoop);

            const leftLeg = new THREE.Mesh(legGeo, metalMat);
            leftLeg.position.set(xOffset - hoopRadius, 0.16, hoopDepth);
            leftLeg.castShadow = true;
            leftLeg.receiveShadow = true;
            group.add(leftLeg);

            const rightLeg = new THREE.Mesh(legGeo, metalMat);
            rightLeg.position.set(xOffset + hoopRadius, 0.16, hoopDepth);
            rightLeg.castShadow = true;
            rightLeg.receiveShadow = true;
            group.add(rightLeg);
        }

        const controlGeo = new THREE.BoxGeometry(0.25, 0.28, 0.22);
        const controlBox = new THREE.Mesh(controlGeo, accentMat);
        controlBox.position.set(rackWidth * 0.5 + 0.2, 0.22, 0);
        controlBox.castShadow = true;
        controlBox.receiveShadow = true;
        group.add(controlBox);

        const ledGeo = new THREE.SphereGeometry(0.04, 16, 16);
        this.ledMesh = new THREE.Mesh(ledGeo, ledMat);
        this.ledMesh.position.set(rackWidth * 0.5 + 0.32, 0.27, 0.12);
        this.ledMesh.castShadow = true;
        group.add(this.ledMesh);

        return group;
    }

    update(dt) {
        if (!this.ledMesh) return;
        this.elapsed += dt;
        const pulse = (Math.sin((this.elapsed * 2) + this.pulseOffset) + 1) * 0.5;
        this.ledMesh.material.emissiveIntensity = 0.4 + pulse * 1.2;
    }
}

EntityRegistry.register('bikeRack', BikeRackEntity);
