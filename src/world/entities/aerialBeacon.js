import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class AerialBeaconEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'aerialBeacon';
        this.elapsed = 0;
        this.haloGroup = null;
        this.lightHandle = null;
        this.beaconMesh = null;
        this.pulseSpeed = 3 + Math.random() * 2;
        this.spinSpeed = 0.6 + Math.random() * 0.4;
    }

    static get displayName() { return 'Aerial Beacon'; }

    createMesh(params = {}) {
        const group = new THREE.Group();

        const shaftHeight = params.height || 8 + Math.random() * 2;
        const baseRadius = 1.4;

        // Materials
        const concreteTex = TextureGenerator.createConcrete();
        const concreteMat = new THREE.MeshStandardMaterial({
            map: concreteTex,
            color: 0xaaaaaa,
            roughness: 0.85
        });

        const metalMat = new THREE.MeshStandardMaterial({
            color: 0xb3c0c8,
            roughness: 0.35,
            metalness: 0.65,
            flatShading: true
        });

        const accentMat = new THREE.MeshStandardMaterial({
            color: 0x1f6bf2,
            roughness: 0.4,
            metalness: 0.5
        });

        const glassMat = new THREE.MeshBasicMaterial({
            color: 0x66ccff,
            transparent: true,
            opacity: 0.75
        });

        // Base Pad
        const baseGeo = new THREE.CylinderGeometry(baseRadius * 1.1, baseRadius * 1.3, 0.6, 10);
        baseGeo.translate(0, 0.3, 0);
        const base = new THREE.Mesh(baseGeo, concreteMat);
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        // Ground inlay ring for added visual interest
        const inlayGeo = new THREE.CylinderGeometry(baseRadius, baseRadius, 0.1, 16);
        inlayGeo.translate(0, 0.05, 0);
        const inlay = new THREE.Mesh(inlayGeo, accentMat);
        inlay.receiveShadow = true;
        group.add(inlay);

        // Central Shaft
        const shaftGeo = new THREE.CylinderGeometry(0.25, 0.35, shaftHeight, 14);
        shaftGeo.translate(0, shaftHeight / 2 + 0.6, 0);
        const shaft = new THREE.Mesh(shaftGeo, metalMat);
        shaft.castShadow = true;
        shaft.receiveShadow = true;
        group.add(shaft);

        // Midway stabilizer ring
        const ringGeo = new THREE.TorusGeometry(0.45, 0.06, 8, 20);
        const stabilizer = new THREE.Mesh(ringGeo, accentMat);
        stabilizer.position.y = shaftHeight * 0.45 + 0.6;
        stabilizer.rotation.x = Math.PI / 2;
        stabilizer.castShadow = true;
        group.add(stabilizer);

        // Tri-legs for extra support
        const braceGeo = new THREE.BoxGeometry(0.08, shaftHeight * 0.4, 0.6);
        braceGeo.translate(0, shaftHeight * 0.2, 0);
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2;
            const brace = new THREE.Mesh(braceGeo, metalMat);
            brace.position.set(Math.cos(angle) * 0.5, 0.6, Math.sin(angle) * 0.5);
            brace.rotation.y = angle;
            brace.castShadow = true;
            brace.receiveShadow = true;
            group.add(brace);
        }

        // Beacon head
        const headHeight = shaftHeight + 1.0;
        const headPlateGeo = new THREE.CylinderGeometry(0.8, 0.9, 0.3, 12);
        headPlateGeo.translate(0, headHeight, 0);
        const headPlate = new THREE.Mesh(headPlateGeo, metalMat);
        headPlate.castShadow = true;
        headPlate.receiveShadow = true;
        group.add(headPlate);

        // Halo group for motion and glow
        this.haloGroup = new THREE.Group();
        this.haloGroup.position.y = headHeight + 0.3;
        group.add(this.haloGroup);

        const haloRingGeo = new THREE.TorusGeometry(1.1, 0.07, 8, 28);
        const haloRing = new THREE.Mesh(haloRingGeo, accentMat);
        haloRing.rotation.x = Math.PI / 2;
        haloRing.castShadow = true;
        this.haloGroup.add(haloRing);

        // Inner light tube
        const tubeGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.6, 12);
        const tube = new THREE.Mesh(tubeGeo, glassMat);
        tube.position.y = 0.3;
        tube.castShadow = true;
        this.haloGroup.add(tube);

        // Beacon orb
        const beaconGeo = new THREE.SphereGeometry(0.22, 12, 12);
        this.beaconMesh = new THREE.Mesh(beaconGeo, glassMat.clone());
        this.beaconMesh.position.y = headHeight + 0.8;
        this.beaconMesh.castShadow = true;
        group.add(this.beaconMesh);

        // Register virtual light for night guidance
        const lightSystem = params.lightSystem || (typeof window !== 'undefined' ? window.app?.world?.lightSystem : null);
        if (lightSystem) {
            this.lightHandle = lightSystem.register(new THREE.Vector3(0, headHeight + 0.8, 0), 0x66ccff, 1.0, 18);
            this.lightHandle.parentMesh = group;
        }

        return group;
    }

    update(dt) {
        this.elapsed += dt;

        // Spin the halo to create an aerial navigation feel
        if (this.haloGroup) {
            this.haloGroup.rotation.y += this.spinSpeed * dt;
        }

        // Pulse beacon brightness
        const pulse = 0.55 + 0.45 * Math.sin(this.elapsed * this.pulseSpeed);
        if (this.beaconMesh && this.beaconMesh.material) {
            this.beaconMesh.material.opacity = 0.5 + pulse * 0.4;
        }

        if (this.lightHandle) {
            this.lightHandle.intensity = 0.6 + pulse * 1.2;
        }
    }
}

EntityRegistry.register('aerialBeacon', AerialBeaconEntity);
