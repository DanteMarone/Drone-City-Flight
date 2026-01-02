import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class WindowACUnitEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'windowACUnit';
        this.fanSpeed = 3 + Math.random() * 4;
        this.casingHue = 0.08 + Math.random() * 0.08;
    }

    static get displayName() { return 'Window AC Unit'; }

    createMesh() {
        const group = new THREE.Group();

        const casingColor = new THREE.Color().setHSL(this.casingHue, 0.1, 0.82);
        const casingMat = new THREE.MeshStandardMaterial({
            color: casingColor,
            roughness: 0.7,
            metalness: 0.25
        });
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.6, metalness: 0.2 });
        const grilleMat = new THREE.MeshStandardMaterial({ color: 0xb2b2b2, roughness: 0.5, metalness: 0.4 });
        const accentMat = new THREE.MeshStandardMaterial({ color: 0x4a6a7f, roughness: 0.4, metalness: 0.3 });

        const housingGeo = new THREE.BoxGeometry(2.2, 1.4, 1.2);
        const housing = new THREE.Mesh(housingGeo, casingMat);
        housing.position.y = 0.7;
        housing.castShadow = true;
        housing.receiveShadow = true;
        group.add(housing);

        const frontPanelGeo = new THREE.BoxGeometry(2.0, 1.1, 0.08);
        const frontPanel = new THREE.Mesh(frontPanelGeo, casingMat);
        frontPanel.position.set(0, 0.75, 0.64);
        group.add(frontPanel);

        const grilleGroup = new THREE.Group();
        grilleGroup.position.set(0, 0.75, 0.7);

        const slatGeo = new THREE.BoxGeometry(1.8, 0.05, 0.04);
        for (let i = -4; i <= 4; i++) {
            const slat = new THREE.Mesh(slatGeo, grilleMat);
            slat.position.y = i * 0.1;
            grilleGroup.add(slat);
        }

        const sideVentGeo = new THREE.BoxGeometry(0.35, 0.8, 0.06);
        const sideVent = new THREE.Mesh(sideVentGeo, darkMat);
        sideVent.position.set(0.75, 0, -0.02);
        grilleGroup.add(sideVent);

        group.add(grilleGroup);

        this.fanGroup = new THREE.Group();
        this.fanGroup.position.set(-0.6, 0.75, 0.71);
        group.add(this.fanGroup);

        const fanGuard = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.04, 18), darkMat);
        fanGuard.rotation.x = Math.PI / 2;
        this.fanGroup.add(fanGuard);

        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 12), accentMat);
        hub.rotation.x = Math.PI / 2;
        this.fanGroup.add(hub);

        const bladeGeo = new THREE.BoxGeometry(0.05, 0.01, 0.32);
        bladeGeo.translate(0, 0, 0.16);
        for (let i = 0; i < 5; i++) {
            const blade = new THREE.Mesh(bladeGeo, accentMat);
            blade.rotation.y = (i * Math.PI * 2) / 5;
            this.fanGroup.add(blade);
        }

        const controlPanelGeo = new THREE.BoxGeometry(0.5, 0.35, 0.1);
        const controlPanel = new THREE.Mesh(controlPanelGeo, accentMat);
        controlPanel.position.set(0.78, 1.05, 0.63);
        group.add(controlPanel);

        const knobGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.05, 10);
        for (let i = 0; i < 2; i++) {
            const knob = new THREE.Mesh(knobGeo, darkMat);
            knob.rotation.x = Math.PI / 2;
            knob.position.set(0.65 + i * 0.15, 1.05, 0.7);
            group.add(knob);
        }

        const trayGeo = new THREE.BoxGeometry(2.3, 0.08, 1.4);
        const tray = new THREE.Mesh(trayGeo, grilleMat);
        tray.position.set(0, 0.04, -0.08);
        tray.receiveShadow = true;
        group.add(tray);

        const bracketGeo = new THREE.BoxGeometry(0.1, 0.5, 0.1);
        for (let i = -1; i <= 1; i += 2) {
            const bracket = new THREE.Mesh(bracketGeo, grilleMat);
            bracket.position.set(1.0 * i, 0.25, -0.65);
            group.add(bracket);
        }

        return group;
    }

    update(dt) {
        if (this.fanGroup) {
            this.fanGroup.rotation.z += this.fanSpeed * dt;
        }
    }
}

EntityRegistry.register('windowACUnit', WindowACUnitEntity);
