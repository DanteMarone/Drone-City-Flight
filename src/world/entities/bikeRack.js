import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class BikeRackEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'bikeRack';
        this._pulseTime = Math.random() * Math.PI * 2;
        this._indicatorMaterial = null;
    }

    static get displayName() { return 'Bike Rack'; }

    createMesh(params) {
        const group = new THREE.Group();

        const rackLength = params.length || 3 + Math.random() * 1.2;
        const rackDepth = params.depth || 0.75;
        const rackHeight = params.height || 0.9;
        const pipeRadius = params.pipeRadius || 0.05;
        const hoopCount = params.hoopCount || Math.max(3, Math.round(rackLength));

        this.params.length = rackLength;
        this.params.depth = rackDepth;
        this.params.height = rackHeight;
        this.params.pipeRadius = pipeRadius;
        this.params.hoopCount = hoopCount;

        const metalTone = new THREE.Color().setHSL(0.58, 0.15, 0.35 + Math.random() * 0.1);
        const accentTone = new THREE.Color().setHSL(0.55, 0.4, 0.6 + Math.random() * 0.1);

        const metalMat = new THREE.MeshStandardMaterial({
            color: metalTone,
            roughness: 0.45,
            metalness: 0.75
        });
        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x2d2f36,
            roughness: 0.6,
            metalness: 0.5
        });

        const hoopDepth = rackDepth * 0.75;
        const hoopHeight = rackHeight - pipeRadius * 1.2;
        const hoopSpacing = rackLength / (hoopCount + 1);

        const legGeo = new THREE.CylinderGeometry(pipeRadius, pipeRadius, hoopHeight, 12);
        const topGeo = new THREE.CylinderGeometry(pipeRadius, pipeRadius, hoopDepth, 12);
        const baseRailGeo = new THREE.CylinderGeometry(pipeRadius * 0.9, pipeRadius * 0.9, rackLength * 0.95, 10);

        for (let i = 0; i < hoopCount; i++) {
            const hoopGroup = new THREE.Group();
            const xOffset = -rackLength / 2 + hoopSpacing * (i + 1);
            hoopGroup.position.x = xOffset;

            const leftLeg = new THREE.Mesh(legGeo, metalMat);
            leftLeg.position.set(0, hoopHeight / 2, -hoopDepth / 2);
            leftLeg.castShadow = true;
            leftLeg.receiveShadow = true;
            hoopGroup.add(leftLeg);

            const rightLeg = leftLeg.clone();
            rightLeg.position.z = hoopDepth / 2;
            hoopGroup.add(rightLeg);

            const topBar = new THREE.Mesh(topGeo, metalMat);
            topBar.rotation.x = Math.PI / 2;
            topBar.position.set(0, hoopHeight, 0);
            topBar.castShadow = true;
            topBar.receiveShadow = true;
            hoopGroup.add(topBar);

            group.add(hoopGroup);
        }

        const baseRailFront = new THREE.Mesh(baseRailGeo, baseMat);
        baseRailFront.rotation.z = Math.PI / 2;
        baseRailFront.position.set(0, pipeRadius, -hoopDepth / 2);
        baseRailFront.castShadow = true;
        baseRailFront.receiveShadow = true;
        group.add(baseRailFront);

        const baseRailBack = baseRailFront.clone();
        baseRailBack.position.z = hoopDepth / 2;
        group.add(baseRailBack);

        const plateGeo = new THREE.BoxGeometry(pipeRadius * 4, pipeRadius * 0.6, pipeRadius * 3);
        const plateOffsets = [
            [-rackLength / 2 + pipeRadius * 2, 0, -hoopDepth / 2],
            [rackLength / 2 - pipeRadius * 2, 0, -hoopDepth / 2],
            [-rackLength / 2 + pipeRadius * 2, 0, hoopDepth / 2],
            [rackLength / 2 - pipeRadius * 2, 0, hoopDepth / 2]
        ];
        plateOffsets.forEach(([x, y, z]) => {
            const plate = new THREE.Mesh(plateGeo, baseMat);
            plate.position.set(x, y + pipeRadius * 0.3, z);
            plate.castShadow = true;
            plate.receiveShadow = true;
            group.add(plate);
        });

        this._indicatorMaterial = new THREE.MeshStandardMaterial({
            color: accentTone,
            emissive: accentTone,
            emissiveIntensity: 0.6,
            roughness: 0.4,
            metalness: 0.2
        });

        const indicatorGeo = new THREE.BoxGeometry(pipeRadius * 2.6, pipeRadius * 2.6, pipeRadius * 0.9);
        const indicator = new THREE.Mesh(indicatorGeo, this._indicatorMaterial);
        indicator.position.set(rackLength / 2 - pipeRadius * 2.5, hoopHeight * 0.65, hoopDepth / 2 + pipeRadius * 0.6);
        indicator.castShadow = true;
        indicator.receiveShadow = false;
        group.add(indicator);

        const capGeo = new THREE.SphereGeometry(pipeRadius * 1.1, 12, 12);
        const capPositions = [
            [-rackLength / 2 + pipeRadius * 1.5, hoopHeight, -hoopDepth / 2],
            [rackLength / 2 - pipeRadius * 1.5, hoopHeight, -hoopDepth / 2],
            [-rackLength / 2 + pipeRadius * 1.5, hoopHeight, hoopDepth / 2],
            [rackLength / 2 - pipeRadius * 1.5, hoopHeight, hoopDepth / 2]
        ];
        capPositions.forEach(([x, y, z]) => {
            const cap = new THREE.Mesh(capGeo, metalMat);
            cap.position.set(x, y, z);
            cap.castShadow = true;
            cap.receiveShadow = true;
            group.add(cap);
        });

        return group;
    }

    update(dt) {
        if (!this._indicatorMaterial) return;
        this._pulseTime += dt;
        const pulse = 0.45 + Math.sin(this._pulseTime * 2.2) * 0.25;
        this._indicatorMaterial.emissiveIntensity = THREE.MathUtils.clamp(pulse, 0.2, 0.9);
    }
}

EntityRegistry.register('bikeRack', BikeRackEntity);
