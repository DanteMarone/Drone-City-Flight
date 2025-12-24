import * as THREE from 'three';
import { PickupTruckEntity } from './vehicles.js';
import { EntityRegistry } from './registry.js';
import { CONFIG } from '../../config.js';

export class CementMixerEntity extends PickupTruckEntity {
    constructor(params) {
        super(params);
        this.type = 'cementMixer';
        // Speed between truck and bus
        this.baseSpeed = (CONFIG.DRONE.MAX_SPEED || 18.0) * 0.6;
        this.drumSpeed = 2.0;
    }

    static get displayName() { return 'Cement Mixer'; }

    createMesh(params) {
        const group = new THREE.Group();
        const modelGroup = new THREE.Group();
        modelGroup.name = 'modelGroup';
        group.add(modelGroup);

        // Materials
        const paintColor = 0xFFC107; // Amber/Industrial Yellow
        const paintMat = new THREE.MeshStandardMaterial({
            color: paintColor,
            roughness: 0.3,
            metalness: 0.1
        });
        const metalMat = new THREE.MeshStandardMaterial({
            color: 0x555555,
            roughness: 0.7,
            metalness: 0.6
        });
        const blackMat = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.9
        });
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.1,
            metalness: 0.9
        });

        // 1. Chassis
        const chassisGeo = new THREE.BoxGeometry(2.0, 0.6, 5.5);
        const chassis = new THREE.Mesh(chassisGeo, metalMat);
        chassis.position.y = 0.6;
        chassis.castShadow = true;
        modelGroup.add(chassis);

        // 2. Cab
        const cabGroup = new THREE.Group();
        cabGroup.position.set(0, 0, 2.0); // Front
        modelGroup.add(cabGroup);

        const cabBaseGeo = new THREE.BoxGeometry(2.0, 1.4, 1.5);
        const cabBase = new THREE.Mesh(cabBaseGeo, paintMat);
        cabBase.position.y = 1.4;
        cabBase.castShadow = true;
        cabGroup.add(cabBase);

        const cabWindowGeo = new THREE.BoxGeometry(1.8, 0.7, 1.0);
        cabWindowGeo.translate(0, 0.35, -0.25);
        const cabWindow = new THREE.Mesh(cabWindowGeo, glassMat);
        cabWindow.position.y = 2.1;
        cabGroup.add(cabWindow);

        // Headlights
        const lightGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16);
        lightGeo.rotateX(Math.PI/2);
        const l1 = new THREE.Mesh(lightGeo, new THREE.MeshStandardMaterial({color: 0xffffee, emissive: 0xffaa00, emissiveIntensity: 0.5}));
        l1.position.set(0.6, 1.2, 0.76);
        cabGroup.add(l1);
        const l2 = l1.clone();
        l2.position.set(-0.6, 1.2, 0.76);
        cabGroup.add(l2);

        // 3. Mixer Drum System
        const drumPivot = new THREE.Group();
        drumPivot.name = 'drumPivot';
        drumPivot.position.set(0, 1.8, -0.5); // Centered on rear chassis
        drumPivot.rotation.x = -Math.PI / 12; // Tilted slightly up
        modelGroup.add(drumPivot);

        // Main Drum Body
        const drumGeo = new THREE.CylinderGeometry(1.2, 1.4, 3.2, 16);
        drumGeo.rotateX(Math.PI / 2);
        const drum = new THREE.Mesh(drumGeo, paintMat);
        drum.castShadow = true;
        drumPivot.add(drum);

        // Cone cap (rear)
        const coneGeo = new THREE.ConeGeometry(1.2, 0.8, 16);
        coneGeo.rotateX(-Math.PI / 2); // Point back
        const cone = new THREE.Mesh(coneGeo, paintMat);
        cone.position.z = -2.0; // 3.2/2 + 0.8/2
        cone.castShadow = true;
        drumPivot.add(cone);

        // Spiral Stripes (for rotation visibility)
        const stripeGeo = new THREE.TorusGeometry(1.25, 0.05, 8, 32);
        const stripe1 = new THREE.Mesh(stripeGeo, metalMat);
        stripe1.rotation.y = Math.PI / 6;
        drumPivot.add(stripe1);

        const stripe2 = stripe1.clone();
        stripe2.rotation.y = -Math.PI / 6;
        drumPivot.add(stripe2);

        // 4. Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.35, 16);
        wheelGeo.rotateZ(Math.PI/2);

        const addAxle = (z) => {
            const wL = new THREE.Mesh(wheelGeo, blackMat);
            wL.position.set(0.9, 0.45, z);
            wL.castShadow = true;
            modelGroup.add(wL);
            const wR = wL.clone();
            wR.position.set(-0.9, 0.45, z);
            modelGroup.add(wR);
        };

        addAxle(1.8); // Front
        addAxle(-1.2); // Rear 1
        addAxle(-2.2); // Rear 2

        // 5. Discharge Chute
        const chuteGeo = new THREE.BoxGeometry(0.6, 0.2, 1.5);
        const chute = new THREE.Mesh(chuteGeo, metalMat);
        chute.position.set(0, 1.5, -3.2);
        chute.rotation.x = -Math.PI / 6;
        modelGroup.add(chute);

        return group;
    }

    update(dt) {
        // Handle movement via PickupTruck (which handles PingPong and waiting)
        super.update(dt);

        if (this.mesh) {
            const modelGroup = this.mesh.getObjectByName('modelGroup');
            if (modelGroup) {
                const drum = modelGroup.getObjectByName('drumPivot');
                if (drum) {
                    drum.rotation.z += this.drumSpeed * dt;
                }
            }
        }
    }
}

EntityRegistry.register('cementMixer', CementMixerEntity);
