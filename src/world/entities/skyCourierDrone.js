import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class SkyCourierDroneEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'skyCourierDrone';
        this.elapsed = 0;
        this.rotorGroups = [];
        this.bodyGroup = null;
        this.hoverPhase = Math.random() * Math.PI * 2;
        this.hoverAmplitude = params.hoverAmplitude ?? 0.12;
        this.hoverSpeed = params.hoverSpeed ?? 1.6;
        this.baseLift = params.baseLift ?? 1.4;
        this.spinSpeed = params.spinSpeed ?? (9 + Math.random() * 3);
    }

    static get displayName() { return 'Sky Courier Drone'; }

    createMesh(params = {}) {
        const group = new THREE.Group();
        const bodyGroup = new THREE.Group();
        this.bodyGroup = bodyGroup;
        bodyGroup.position.y = this.baseLift;
        group.add(bodyGroup);

        const bodyColor = new THREE.Color(params.bodyColor || 0x2f3a4f);
        const accentColor = new THREE.Color(params.accentColor || 0x5de2ff);

        const bodyMat = new THREE.MeshStandardMaterial({
            color: bodyColor,
            roughness: 0.35,
            metalness: 0.7
        });
        const accentMat = new THREE.MeshStandardMaterial({
            color: accentColor,
            roughness: 0.4,
            metalness: 0.5,
            emissive: accentColor,
            emissiveIntensity: 0.25
        });
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x79d4ff,
            roughness: 0.1,
            metalness: 0.9,
            transparent: true,
            opacity: 0.75
        });
        const rotorMat = new THREE.MeshStandardMaterial({
            color: 0x1b1f2a,
            roughness: 0.7,
            metalness: 0.2
        });

        const stripeTexture = TextureGenerator.createBuildingFacade({
            color: '#1f2937',
            windowColor: '#7dd3fc',
            floors: 3,
            cols: 8,
            width: 256,
            height: 128
        });
        stripeTexture.repeat.set(1.4, 1);

        const stripeMat = new THREE.MeshStandardMaterial({
            map: stripeTexture,
            color: 0xffffff,
            roughness: 0.45,
            metalness: 0.4
        });

        const fuselageGeo = new THREE.CylinderGeometry(0.45, 0.55, 2.6, 14, 1);
        fuselageGeo.rotateX(Math.PI / 2);
        const fuselage = new THREE.Mesh(fuselageGeo, bodyMat);
        fuselage.castShadow = true;
        fuselage.receiveShadow = true;
        bodyGroup.add(fuselage);

        const noseGeo = new THREE.SphereGeometry(0.5, 16, 16);
        noseGeo.translate(0, 0, 1.35);
        const nose = new THREE.Mesh(noseGeo, glassMat);
        nose.castShadow = true;
        bodyGroup.add(nose);

        const tailGeo = new THREE.ConeGeometry(0.35, 0.8, 12);
        tailGeo.rotateX(Math.PI / 2);
        tailGeo.translate(0, 0, -1.7);
        const tail = new THREE.Mesh(tailGeo, bodyMat);
        tail.castShadow = true;
        bodyGroup.add(tail);

        const cargoGeo = new THREE.BoxGeometry(0.9, 0.35, 1.1);
        cargoGeo.translate(0, -0.35, -0.2);
        const cargo = new THREE.Mesh(cargoGeo, stripeMat);
        cargo.castShadow = true;
        cargo.receiveShadow = true;
        bodyGroup.add(cargo);

        const canopyGeo = new THREE.BoxGeometry(0.6, 0.22, 0.5);
        canopyGeo.translate(0, 0.25, 0.7);
        const canopy = new THREE.Mesh(canopyGeo, glassMat);
        canopy.castShadow = true;
        bodyGroup.add(canopy);

        const finGeo = new THREE.BoxGeometry(0.08, 0.35, 0.45);
        finGeo.translate(0, 0.2, -1.45);
        const fin = new THREE.Mesh(finGeo, accentMat);
        fin.castShadow = true;
        bodyGroup.add(fin);

        const armGeo = new THREE.BoxGeometry(0.18, 0.12, 1.2);
        armGeo.translate(0, 0.05, 0);
        for (let i = 0; i < 4; i++) {
            const arm = new THREE.Mesh(armGeo, bodyMat);
            const armGroup = new THREE.Group();
            armGroup.rotation.y = (i / 4) * Math.PI * 2;
            armGroup.add(arm);
            arm.position.z = 0.7;
            arm.castShadow = true;
            bodyGroup.add(armGroup);

            const rotorGroup = new THREE.Group();
            rotorGroup.position.set(0, 0.18, 1.3);
            armGroup.add(rotorGroup);
            this.rotorGroups.push(rotorGroup);

            const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12), rotorMat);
            hub.rotation.x = Math.PI / 2;
            hub.castShadow = true;
            rotorGroup.add(hub);

            const bladeGeo = new THREE.BoxGeometry(0.9, 0.03, 0.18);
            const bladeA = new THREE.Mesh(bladeGeo, rotorMat);
            const bladeB = new THREE.Mesh(bladeGeo, rotorMat);
            bladeB.rotation.y = Math.PI / 2;
            bladeA.castShadow = true;
            bladeB.castShadow = true;
            rotorGroup.add(bladeA, bladeB);
        }

        const skidGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.0, 10);
        skidGeo.rotateX(Math.PI / 2);
        const skidMat = new THREE.MeshStandardMaterial({
            color: 0x2d3748,
            roughness: 0.6,
            metalness: 0.3
        });
        const skidLeft = new THREE.Mesh(skidGeo, skidMat);
        skidLeft.position.set(-0.45, 0.1, 0);
        const skidRight = new THREE.Mesh(skidGeo, skidMat);
        skidRight.position.set(0.45, 0.1, 0);
        group.add(skidLeft, skidRight);

        const strutGeo = new THREE.BoxGeometry(0.08, 0.4, 0.08);
        for (const x of [-0.45, 0.45]) {
            for (const z of [-0.6, 0.6]) {
                const strut = new THREE.Mesh(strutGeo, skidMat);
                strut.position.set(x, 0.3, z);
                group.add(strut);
            }
        }

        const lightGeo = new THREE.SphereGeometry(0.08, 12, 12);
        const lightMat = new THREE.MeshStandardMaterial({
            color: 0xff3b3b,
            emissive: 0xff3b3b,
            emissiveIntensity: 1.2
        });
        const lightMatAlt = new THREE.MeshStandardMaterial({
            color: 0x3bffb1,
            emissive: 0x3bffb1,
            emissiveIntensity: 1.2
        });
        const lightFront = new THREE.Mesh(lightGeo, lightMat);
        lightFront.position.set(0, 0.05, 1.5);
        const lightRear = new THREE.Mesh(lightGeo, lightMatAlt);
        lightRear.position.set(0, 0.05, -1.6);
        bodyGroup.add(lightFront, lightRear);

        return group;
    }

    update(dt) {
        this.elapsed += dt;

        if (this.bodyGroup) {
            const hover = Math.sin(this.elapsed * this.hoverSpeed + this.hoverPhase) * this.hoverAmplitude;
            this.bodyGroup.position.y = this.baseLift + hover;
        }

        const spin = this.spinSpeed * dt;
        this.rotorGroups.forEach((rotor, index) => {
            const direction = index % 2 === 0 ? 1 : -1;
            rotor.rotation.y += spin * direction;
        });
    }
}

EntityRegistry.register('skyCourierDrone', SkyCourierDroneEntity);
