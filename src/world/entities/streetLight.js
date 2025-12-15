import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class StreetLightEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'streetLight';
        this._time = 0;
        this._glowMaterial = null;
        this._light = null;
    }

    static get displayName() { return 'Street Light'; }

    createMesh(params) {
        const group = new THREE.Group();

        const poleHeight = params.poleHeight || (7 + Math.random() * 2);
        const armLength = params.armLength || (2 + Math.random() * 0.5);
        const poleRadius = params.poleRadius || 0.15;
        const baseRadius = poleRadius * 1.8;

        this.params.poleHeight = poleHeight;
        this.params.armLength = armLength;
        this.params.poleRadius = poleRadius;

        // Base block
        const baseGeo = new THREE.CylinderGeometry(baseRadius, baseRadius, 0.4, 12);
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x4c566a, roughness: 0.4, metalness: 0.8 });
        const base = new THREE.Mesh(baseGeo, metalMat);
        base.position.y = 0.2;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        // Vertical pole
        const poleGeo = new THREE.CylinderGeometry(poleRadius, poleRadius * 1.05, poleHeight, 16);
        const pole = new THREE.Mesh(poleGeo, metalMat);
        pole.position.y = poleHeight / 2 + 0.4;
        pole.castShadow = true;
        pole.receiveShadow = true;
        group.add(pole);

        // Decorative ring
        const ringGeo = new THREE.TorusGeometry(poleRadius * 1.4, poleRadius * 0.25, 8, 16);
        const ring = new THREE.Mesh(ringGeo, metalMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = pole.position.y + poleHeight * 0.35;
        group.add(ring);

        // Arm and lamp head
        const armGeo = new THREE.CylinderGeometry(poleRadius * 0.7, poleRadius * 0.7, armLength, 8);
        const arm = new THREE.Mesh(armGeo, metalMat);
        arm.rotation.z = Math.PI / 2;
        arm.position.set(armLength / 2 + poleRadius * 0.8, poleHeight + 0.2, 0);
        arm.castShadow = true;
        arm.receiveShadow = true;
        group.add(arm);

        const capGeo = new THREE.ConeGeometry(poleRadius * 1.4, poleRadius * 2.5, 12);
        const cap = new THREE.Mesh(capGeo, metalMat);
        cap.rotation.z = -Math.PI / 2;
        cap.position.set(arm.position.x + armLength / 2 + poleRadius * 0.5, arm.position.y, 0);
        cap.castShadow = true;
        cap.receiveShadow = true;
        group.add(cap);

        const glassGeo = new THREE.SphereGeometry(poleRadius * 1.2, 12, 12);
        this._glowMaterial = new THREE.MeshStandardMaterial({
            color: 0xfff7d1,
            emissive: new THREE.Color(0xffe9a3),
            emissiveIntensity: 0.6,
            roughness: 0.3,
            metalness: 0.1,
            transparent: true,
            opacity: 0.95
        });
        const glass = new THREE.Mesh(glassGeo, this._glowMaterial);
        glass.position.set(cap.position.x + poleRadius * 1.2, cap.position.y, 0);
        glass.castShadow = true;
        glass.receiveShadow = false;
        group.add(glass);

        // Light source
        this._light = new THREE.PointLight(0xffe9a3, 1.4, 18, 1.5);
        this._light.position.copy(glass.position).add(new THREE.Vector3(0.1, -poleRadius * 0.2, 0));
        this._light.castShadow = false;
        group.add(this._light);

        return group;
    }

    update(dt) {
        this._time += dt;
        if (this._glowMaterial && this._light) {
            const pulse = 0.15 * Math.sin(this._time * 2.5 + (this.params.seed || 0));
            const flicker = 0.05 * Math.sin(this._time * 17.0);
            const intensity = 0.7 + pulse + flicker;
            this._glowMaterial.emissiveIntensity = THREE.MathUtils.clamp(intensity, 0.4, 1.1);
            this._light.intensity = THREE.MathUtils.clamp(1.1 + pulse + flicker * 2, 0.8, 1.8);
        }
    }
}

EntityRegistry.register('streetLight', StreetLightEntity);
