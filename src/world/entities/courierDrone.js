import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

function createDroneDecal(color = '#1f2937', accent = '#38bdf8') {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = accent;
    ctx.fillRect(18, 24, 220, 18);
    ctx.fillRect(18, 86, 220, 18);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('COURIER', canvas.width / 2, canvas.height / 2 + 2);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
}

export class CourierDroneEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'courierDrone';
        this.rotorGroups = [];
        this.elapsed = 0;
        this.bobSpeed = params.bobSpeed ?? (1.6 + Math.random() * 0.6);
        this.bobHeight = params.bobHeight ?? (0.12 + Math.random() * 0.08);
        this.rotorSpeed = params.rotorSpeed ?? (4.2 + Math.random() * 1.8);
        this.swayAmount = params.swayAmount ?? THREE.MathUtils.degToRad(2.2);
        this.baseY = 0;
        this.baseRotation = new THREE.Euler();
    }

    static get displayName() { return 'Courier Drone'; }

    createMesh(params = {}) {
        const group = new THREE.Group();
        const bodyColor = new THREE.Color(params.bodyColor || 0x2f3b4f);
        const accentColor = new THREE.Color(params.accentColor || 0x38bdf8);
        const payloadColor = new THREE.Color(params.payloadColor || 0xfbbf24);

        const bodyMat = new THREE.MeshStandardMaterial({
            color: bodyColor,
            roughness: 0.45,
            metalness: 0.35
        });
        const accentMat = new THREE.MeshStandardMaterial({
            color: accentColor,
            roughness: 0.3,
            metalness: 0.6,
            emissive: accentColor,
            emissiveIntensity: 0.35
        });
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x7dd3fc,
            roughness: 0.1,
            metalness: 0.1,
            transparent: true,
            opacity: 0.75
        });
        const payloadMat = new THREE.MeshStandardMaterial({
            color: payloadColor,
            roughness: 0.55,
            metalness: 0.2
        });

        const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.45, 1.1), bodyMat);
        body.position.y = 0.5;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), glassMat);
        canopy.position.set(0.3, 0.75, 0);
        canopy.scale.set(1.2, 0.7, 0.9);
        canopy.castShadow = true;
        group.add(canopy);

        const nose = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.5, 16), bodyMat);
        nose.rotation.z = Math.PI / 2;
        nose.position.set(1.05, 0.48, 0);
        nose.castShadow = true;
        group.add(nose);

        const decalTexture = createDroneDecal(bodyColor.getStyle(), accentColor.getStyle());
        const decalMat = new THREE.MeshStandardMaterial({
            map: decalTexture,
            roughness: 0.6,
            metalness: 0.1
        });
        const decalPanel = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.28, 0.02), decalMat);
        decalPanel.position.set(0, 0.5, 0.57);
        group.add(decalPanel);

        const armMat = new THREE.MeshStandardMaterial({
            color: 0x475569,
            roughness: 0.5,
            metalness: 0.55
        });
        const armGeo = new THREE.BoxGeometry(0.7, 0.12, 0.18);
        const rotorOffsets = [
            [0.75, 0.62],
            [-0.75, 0.62],
            [0.75, -0.62],
            [-0.75, -0.62]
        ];

        rotorOffsets.forEach(([x, z]) => {
            const arm = new THREE.Mesh(armGeo, armMat);
            arm.position.set(x * 0.55, 0.62, z * 0.55);
            arm.castShadow = true;
            group.add(arm);

            const rotorGroup = new THREE.Group();
            rotorGroup.position.set(x, 0.66, z);

            const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.1, 12), accentMat);
            hub.rotation.x = Math.PI / 2;
            hub.castShadow = true;
            rotorGroup.add(hub);

            const bladeGeo = new THREE.BoxGeometry(0.05, 0.02, 0.6);
            for (let i = 0; i < 4; i++) {
                const blade = new THREE.Mesh(bladeGeo, armMat);
                blade.rotation.y = (Math.PI / 2) * i;
                blade.position.z = 0.25;
                blade.castShadow = true;
                rotorGroup.add(blade);
            }

            const ring = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.03, 6, 20), accentMat);
            ring.rotation.x = Math.PI / 2;
            ring.position.y = 0.03;
            rotorGroup.add(ring);

            this.rotorGroups.push(rotorGroup);
            group.add(rotorGroup);
        });

        const skidGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.4, 12);
        skidGeo.rotateZ(Math.PI / 2);
        const skidLeft = new THREE.Mesh(skidGeo, armMat);
        skidLeft.position.set(0, 0.15, 0.55);
        skidLeft.castShadow = true;
        group.add(skidLeft);

        const skidRight = new THREE.Mesh(skidGeo, armMat);
        skidRight.position.set(0, 0.15, -0.55);
        skidRight.castShadow = true;
        group.add(skidRight);

        const payload = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, 0.7), payloadMat);
        payload.position.set(-0.25, 0.12, 0);
        payload.castShadow = true;
        payload.receiveShadow = true;
        group.add(payload);

        const payloadDecal = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.3, 0.02), decalMat);
        payloadDecal.position.set(-0.25, 0.12, 0.36);
        group.add(payloadDecal);

        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.4, 8), accentMat);
        antenna.position.set(-0.6, 0.95, 0.2);
        antenna.castShadow = true;
        group.add(antenna);

        const antennaTip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), accentMat);
        antennaTip.position.set(-0.6, 1.15, 0.2);
        group.add(antennaTip);

        return group;
    }

    postInit() {
        if (!this.mesh) return;
        this.baseY = this.mesh.position.y;
        this.baseRotation.copy(this.mesh.rotation);
    }

    update(dt) {
        if (!this.mesh) return;
        this.elapsed += dt;

        const hover = Math.sin(this.elapsed * this.bobSpeed) * this.bobHeight;
        this.mesh.position.y = this.baseY + hover;

        const sway = Math.sin(this.elapsed * 0.9) * this.swayAmount;
        const swayZ = Math.cos(this.elapsed * 0.7) * (this.swayAmount * 0.7);
        this.mesh.rotation.set(
            this.baseRotation.x + sway,
            this.baseRotation.y,
            this.baseRotation.z + swayZ
        );

        const rotorSpin = this.rotorSpeed * dt * Math.PI * 2;
        this.rotorGroups.forEach((rotor, index) => {
            rotor.rotation.y += rotorSpin * (index % 2 === 0 ? 1 : -1);
        });
    }
}

EntityRegistry.register('courierDrone', CourierDroneEntity);
