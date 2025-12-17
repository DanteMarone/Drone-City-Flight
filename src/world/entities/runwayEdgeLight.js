import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class RunwayEdgeLightEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'runwayEdgeLight';
        this._time = 0;
        this._lights = [];
    }

    static get displayName() { return 'Runway Edge Lights'; }

    createMesh(params) {
        const group = new THREE.Group();

        const length = params.length || 18 + Math.random() * 6;
        const width = params.width || 6.5;
        const lightSpacing = params.lightSpacing || 3.5;

        this.params.length = length;
        this.params.width = width;
        this.params.lightSpacing = lightSpacing;

        // Runway segment
        const baseGeo = new THREE.BoxGeometry(length, 0.25, width);
        const asphaltMat = new THREE.MeshStandardMaterial({ color: 0x252525, roughness: 0.95, metalness: 0.05 });
        const base = new THREE.Mesh(baseGeo, asphaltMat);
        base.position.y = 0.125;
        base.receiveShadow = true;
        group.add(base);

        // Centerline dashes
        const dashCount = Math.max(4, Math.floor(length / 2.8));
        const dashGeo = new THREE.BoxGeometry((length / dashCount) * 0.28, 0.02, 0.25);
        const dashMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.8, metalness: 0.2 });
        for (let i = 0; i < dashCount; i++) {
            const dash = new THREE.Mesh(dashGeo, dashMat);
            const segmentLength = length / dashCount;
            dash.position.set(-length / 2 + segmentLength * i + segmentLength * 0.5, 0.26, 0);
            dash.receiveShadow = true;
            group.add(dash);
        }

        // Shoulder markings
        const shoulderGeo = new THREE.BoxGeometry(length, 0.02, 0.2);
        const shoulderMat = new THREE.MeshStandardMaterial({ color: 0xb5b5b5, roughness: 0.7, metalness: 0.1 });
        const leftShoulder = new THREE.Mesh(shoulderGeo, shoulderMat);
        leftShoulder.position.set(0, 0.26, width / 2 - 0.35);
        const rightShoulder = leftShoulder.clone();
        rightShoulder.position.z = -width / 2 + 0.35;
        group.add(leftShoulder, rightShoulder);

        // Light fixtures along both sides
        const lightCount = Math.max(4, Math.floor(length / lightSpacing));
        const startOffset = -length / 2 + length / (lightCount + 1);
        const poleHeight = 0.8 + Math.random() * 0.2;

        const poleMat = new THREE.MeshStandardMaterial({ color: 0x5b6b78, roughness: 0.5, metalness: 0.6 });
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x808b96, roughness: 0.6, metalness: 0.4 });

        for (let i = 0; i < lightCount; i++) {
            const x = startOffset + (length / (lightCount + 1)) * i;
            [-1, 1].forEach(side => {
                const lightGroup = new THREE.Group();

                const footingGeo = new THREE.CylinderGeometry(0.22, 0.24, 0.18, 10);
                const footing = new THREE.Mesh(footingGeo, baseMat);
                footing.position.y = 0.09;
                footing.castShadow = true;
                footing.receiveShadow = true;
                lightGroup.add(footing);

                const poleGeo = new THREE.CylinderGeometry(0.07, 0.08, poleHeight, 12);
                const pole = new THREE.Mesh(poleGeo, poleMat);
                pole.position.y = poleHeight / 2 + footing.position.y * 2;
                pole.castShadow = true;
                pole.receiveShadow = true;
                lightGroup.add(pole);

                const headGeo = new THREE.BoxGeometry(0.35, 0.18, 0.3);
                const head = new THREE.Mesh(headGeo, poleMat);
                head.position.set(0, pole.position.y + poleHeight / 2 + 0.08, 0);
                head.castShadow = true;
                head.receiveShadow = true;
                lightGroup.add(head);

                const lensMat = new THREE.MeshStandardMaterial({
                    color: 0x7dc7ff,
                    emissive: new THREE.Color(0x4fb5ff),
                    emissiveIntensity: 0.8,
                    roughness: 0.25,
                    metalness: 0.2
                });
                const lensGeo = new THREE.SphereGeometry(0.16, 12, 12);
                const lens = new THREE.Mesh(lensGeo, lensMat);
                lens.position.set(0, head.position.y, 0);
                lens.castShadow = true;
                lightGroup.add(lens);

                const guardGeo = new THREE.TorusGeometry(0.22, 0.03, 8, 16);
                const guard = new THREE.Mesh(guardGeo, poleMat);
                guard.rotation.x = Math.PI / 2;
                guard.position.copy(lens.position);
                lightGroup.add(guard);

                const pointLight = new THREE.PointLight(lensMat.color, 1.5, 14, 1.6);
                pointLight.position.set(0, lens.position.y, 0);
                lightGroup.add(pointLight);

                lightGroup.position.set(x, 0, (width / 2 - 0.5) * side);
                group.add(lightGroup);

                this._lights.push({
                    lens,
                    light: pointLight,
                    phase: Math.random() * Math.PI * 2
                });
            });
        }

        return group;
    }

    update(dt) {
        this._time += dt;
        const basePulse = 0.6 + 0.25 * Math.sin(this._time * 3);

        this._lights.forEach((fixture, idx) => {
            const wave = Math.sin(this._time * 4 + fixture.phase + idx * 0.35);
            const intensity = THREE.MathUtils.clamp(basePulse + wave * 0.2, 0.3, 1.4);
            fixture.lens.material.emissiveIntensity = intensity;
            fixture.light.intensity = 1.3 + wave * 0.6;
        });
    }
}

EntityRegistry.register('runwayEdgeLight', RunwayEdgeLightEntity);
