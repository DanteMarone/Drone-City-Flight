import * as THREE from 'three';
import { VehicleEntity } from './vehicles.js';
import { EntityRegistry } from './registry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CONFIG } from '../../config.js';

export class CementMixerEntity extends VehicleEntity {
    constructor(params) {
        super(params);
        this.type = 'cementMixer';
        this.baseSpeed = (CONFIG.DRONE.MAX_SPEED || 18.0) - 3.0; // Heavy vehicle, slower
        this.rotationSpeed = 2.0; // Radians per second for drum
    }

    static get displayName() { return 'Cement Mixer'; }

    createMesh(params) {
        const modelGroup = new THREE.Group();
        modelGroup.name = 'modelGroup';

        // Materials
        const orangeMat = new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.4, metalness: 0.3 });
        const greyMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.7, metalness: 0.5 });
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9, metalness: 0.1 });
        const drumMat = new THREE.MeshStandardMaterial({
            color: 0xeeeeee,
            roughness: 0.5,
            metalness: 0.2,
            map: this._createStripeTexture()
        });

        // 1. Chassis
        const chassisGeo = new THREE.BoxGeometry(2.2, 0.8, 6.0);
        chassisGeo.translate(0, 0.8, 0);
        const chassis = new THREE.Mesh(chassisGeo, darkMat);
        chassis.castShadow = true;
        modelGroup.add(chassis);

        // 2. Cabin (Front)
        const cabGeo = new THREE.BoxGeometry(2.2, 1.4, 1.8);
        cabGeo.translate(0, 1.7, 2.0); // Front is +Z
        const cab = new THREE.Mesh(cabGeo, orangeMat);
        cab.castShadow = true;
        modelGroup.add(cab);

        // Windshield
        const windshieldGeo = new THREE.BoxGeometry(2.0, 0.8, 0.1);
        windshieldGeo.translate(0, 1.8, 2.91);
        const windshield = new THREE.Mesh(windshieldGeo, darkMat);
        modelGroup.add(windshield);

        // 3. Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.5, 16);
        wheelGeo.rotateZ(Math.PI / 2);

        const wheelPositions = [
            [1.0, 0.5, 2.0], [-1.0, 0.5, 2.0], // Front
            [1.0, 0.5, -1.2], [-1.0, 0.5, -1.2], // Rear 1
            [1.0, 0.5, -2.4], [-1.0, 0.5, -2.4]  // Rear 2 (Dual axle)
        ];

        wheelPositions.forEach(pos => {
            const w = new THREE.Mesh(wheelGeo, darkMat);
            w.position.set(...pos);
            w.castShadow = true;
            modelGroup.add(w);
        });

        // 4. Mixer Drum (Animated)
        const drumGroup = new THREE.Group();
        drumGroup.name = 'drumGroup';
        // Position drum on the back, tilted
        drumGroup.position.set(0, 1.8, -1.0);
        drumGroup.rotation.x = -Math.PI / 8; // Tilt up

        // Composite Drum Geometry
        // Bottom (Rear) Section - Tapered
        const drumBase = new THREE.CylinderGeometry(1.3, 0.8, 1.5, 16);
        drumBase.translate(0, -0.75, 0); // Move down so top is at 0

        // Middle Section - Wide
        const drumMid = new THREE.CylinderGeometry(1.3, 1.3, 1.0, 16);
        drumMid.translate(0, 0.5, 0);

        // Top (Front) Section - Tapered to opening
        const drumTop = new THREE.CylinderGeometry(0.6, 1.3, 1.2, 16);
        drumTop.translate(0, 1.6, 0);

        const drumParts = mergeGeometries([drumBase, drumMid, drumTop]);
        const drumMesh = new THREE.Mesh(drumParts, drumMat);
        drumMesh.castShadow = true;
        drumMesh.receiveShadow = true;

        // Rotate geometry to align with Y axis of the group (which is tilted)
        // Wait, Cylinder is Y-up. Our group is tilted X. So the Cylinder Y aligns with the tilt.
        // That is correct.

        drumGroup.add(drumMesh);
        modelGroup.add(drumGroup);

        // 5. Chute (Static)
        const chuteGeo = new THREE.BoxGeometry(0.6, 0.2, 2.0);
        chuteGeo.rotateX(0.2);
        const chute = new THREE.Mesh(chuteGeo, greyMat);
        chute.position.set(0, 2.2, -3.5);
        chute.rotation.x = -Math.PI / 6;
        modelGroup.add(chute);

        const group = new THREE.Group();
        group.add(modelGroup);

        return group;
    }

    _createStripeTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // White background
        ctx.fillStyle = '#eeeeee';
        ctx.fillRect(0, 0, 128, 128);

        // Spiral stripe pattern
        ctx.fillStyle = '#ff9900'; // Orange stripe
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(128, 64);
        ctx.lineTo(128, 128);
        ctx.lineTo(0, 64);
        ctx.fill();

        // Second stripe
        ctx.beginPath();
        ctx.moveTo(64, 0);
        ctx.lineTo(128, 32);
        ctx.lineTo(64, 128);
        ctx.lineTo(0, 96);
        ctx.fill();

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        return tex;
    }

    update(dt) {
        // Run vehicle logic (movement)
        super.update(dt);

        if (!this.mesh) return;
        const modelGroup = this.mesh.getObjectByName('modelGroup');
        if (!modelGroup) return;

        const drum = modelGroup.getObjectByName('drumGroup');
        if (drum) {
            // Spin the drum
            drum.rotation.y += this.rotationSpeed * dt;
        }
    }
}

EntityRegistry.register('cementMixer', CementMixerEntity);
