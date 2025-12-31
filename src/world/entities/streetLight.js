import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class StreetLightEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'streetLight';
        this.pulseOffset = params.pulseOffset ?? Math.random() * Math.PI * 2;
        this.pulseSpeed = params.pulseSpeed ?? THREE.MathUtils.randFloat(1.2, 2.4);
        this.poleHeight = params.poleHeight ?? THREE.MathUtils.randFloat(2.8, 3.6);
        this.armLength = params.armLength ?? THREE.MathUtils.randFloat(0.7, 1.0);
        this.lightHue = params.lightHue ?? THREE.MathUtils.randFloat(0.1, 0.16);
        this.lightIntensity = params.lightIntensity ?? THREE.MathUtils.randFloat(1.1, 1.6);
        this.elapsed = 0;
    }

    static get displayName() { return 'Street Light'; }

    createMesh() {
        const group = new THREE.Group();

        const poleMaterial = new THREE.MeshStandardMaterial({
            color: 0x2f3b45,
            roughness: 0.55,
            metalness: 0.65
        });
        const accentMaterial = new THREE.MeshStandardMaterial({
            color: 0x5c6b75,
            roughness: 0.45,
            metalness: 0.4
        });

        const lampColor = new THREE.Color().setHSL(this.lightHue, 0.75, 0.55);
        this.lampMaterial = new THREE.MeshStandardMaterial({
            color: 0xf8f2d6,
            emissive: lampColor,
            emissiveIntensity: this.lightIntensity,
            roughness: 0.2,
            metalness: 0.1
        });
        this.glowMaterial = new THREE.MeshBasicMaterial({
            color: lampColor,
            transparent: true,
            opacity: 0.45,
            depthWrite: false
        });

        const baseHeight = 0.2;
        const baseGeo = new THREE.CylinderGeometry(0.22, 0.26, baseHeight, 10);
        const base = new THREE.Mesh(baseGeo, accentMaterial);
        base.position.y = baseHeight / 2;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const poleGeo = new THREE.CylinderGeometry(0.08, 0.11, this.poleHeight, 12);
        const pole = new THREE.Mesh(poleGeo, poleMaterial);
        pole.position.y = baseHeight + this.poleHeight / 2;
        pole.castShadow = true;
        pole.receiveShadow = true;
        group.add(pole);

        const capGeo = new THREE.SphereGeometry(0.12, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const cap = new THREE.Mesh(capGeo, accentMaterial);
        cap.position.y = baseHeight + this.poleHeight;
        cap.castShadow = true;
        group.add(cap);

        const armGeo = new THREE.CylinderGeometry(0.04, 0.05, this.armLength, 10);
        armGeo.rotateZ(Math.PI / 2);
        const arm = new THREE.Mesh(armGeo, poleMaterial);
        arm.position.y = baseHeight + this.poleHeight - 0.12;
        arm.position.x = this.armLength / 2;
        arm.castShadow = true;
        group.add(arm);

        const braceGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.45, 8);
        braceGeo.rotateZ(Math.PI / 3.2);
        const brace = new THREE.Mesh(braceGeo, accentMaterial);
        brace.position.set(0.2, baseHeight + this.poleHeight - 0.5, 0);
        brace.castShadow = true;
        group.add(brace);

        const lampHousingGeo = new THREE.BoxGeometry(0.32, 0.14, 0.22);
        const lampHousing = new THREE.Mesh(lampHousingGeo, accentMaterial);
        lampHousing.position.set(this.armLength + 0.12, baseHeight + this.poleHeight - 0.18, 0);
        lampHousing.castShadow = true;
        lampHousing.receiveShadow = true;
        group.add(lampHousing);

        const lampLensGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.06, 12);
        lampLensGeo.rotateX(Math.PI / 2);
        const lampLens = new THREE.Mesh(lampLensGeo, this.lampMaterial);
        lampLens.position.set(this.armLength + 0.2, baseHeight + this.poleHeight - 0.2, 0);
        group.add(lampLens);

        const glowGeo = new THREE.SphereGeometry(0.18, 10, 10);
        this.glowMesh = new THREE.Mesh(glowGeo, this.glowMaterial);
        this.glowMesh.position.copy(lampLens.position);
        group.add(this.glowMesh);

        const panelGeo = new THREE.BoxGeometry(0.22, 0.12, 0.02);
        const panel = new THREE.Mesh(panelGeo, accentMaterial);
        panel.position.set(-0.12, baseHeight + 0.35, 0);
        panel.rotation.y = Math.PI / 10;
        panel.castShadow = true;
        group.add(panel);

        return group;
    }

    update(dt) {
        if (!this.lampMaterial || !this.glowMaterial || !this.glowMesh) return;
        this.elapsed += dt;
        const pulse = Math.sin(this.pulseOffset + this.elapsed * this.pulseSpeed);
        const intensity = this.lightIntensity + pulse * 0.2;
        this.lampMaterial.emissiveIntensity = intensity;
        this.glowMaterial.opacity = 0.35 + Math.max(0, pulse) * 0.25;
        const scale = 1 + Math.max(0, pulse) * 0.2;
        this.glowMesh.scale.setScalar(scale);
    }
}

EntityRegistry.register('streetLight', StreetLightEntity);
