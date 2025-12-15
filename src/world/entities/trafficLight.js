import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const LIGHT_STATES = ['red', 'green', 'yellow'];
const STATE_DURATIONS = {
    red: 5,
    green: 5,
    yellow: 2
};

export class TrafficLightEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'trafficLight';
        this.currentStateIndex = 0;
        this.stateElapsed = 0;
        this.lightMeshes = null;
    }

    static get displayName() { return 'Traffic Light'; }

    createMesh(params) {
        const group = new THREE.Group();

        const baseGeo = new THREE.CylinderGeometry(0.55, 0.65, 0.35, 12);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.8, metalness: 0.2 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.175;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const poleGeo = new THREE.CylinderGeometry(0.12, 0.15, 4.2, 12);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x4c4c4c, roughness: 0.6, metalness: 0.3 });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 2.35;
        pole.castShadow = true;
        pole.receiveShadow = true;
        group.add(pole);

        const armLength = 2.1;
        const armGeo = new THREE.BoxGeometry(armLength, 0.2, 0.2);
        const armMat = new THREE.MeshStandardMaterial({ color: 0x2e2e2e, metalness: 0.4, roughness: 0.5 });
        const arm = new THREE.Mesh(armGeo, armMat);
        arm.position.set(armLength * 0.5, 4.1, 0);
        arm.castShadow = true;
        arm.receiveShadow = true;
        group.add(arm);

        const braceGeo = new THREE.BoxGeometry(0.25, 0.9, 0.08);
        const brace = new THREE.Mesh(braceGeo, armMat);
        brace.position.set(armLength * 0.3, 3.7, 0);
        brace.castShadow = true;
        brace.receiveShadow = true;
        group.add(brace);

        const headGeo = new THREE.BoxGeometry(0.5, 1.05, 0.45);
        const headMat = new THREE.MeshStandardMaterial({ color: 0x1f1f1f, roughness: 0.7, metalness: 0.25 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(armLength + 0.35, 3.9, 0);
        head.castShadow = true;
        head.receiveShadow = true;
        group.add(head);

        const visorGeo = new THREE.BoxGeometry(0.55, 0.12, 0.5);
        const visor = new THREE.Mesh(visorGeo, armMat);
        visor.position.set(armLength + 0.35, 4.4, 0);
        visor.castShadow = true;
        visor.receiveShadow = true;
        group.add(visor);

        const lightGeo = new THREE.SphereGeometry(0.12, 16, 16);
        const redLight = new THREE.Mesh(lightGeo, this._createLightMaterial(0xd2312d));
        const yellowLight = new THREE.Mesh(lightGeo, this._createLightMaterial(0xe0c22e));
        const greenLight = new THREE.Mesh(lightGeo, this._createLightMaterial(0x31d25c));

        redLight.position.set(armLength + 0.35, 4.25, 0.24);
        yellowLight.position.set(armLength + 0.35, 3.9, 0.24);
        greenLight.position.set(armLength + 0.35, 3.55, 0.24);

        [redLight, yellowLight, greenLight].forEach(light => {
            light.castShadow = true;
            light.receiveShadow = true;
            group.add(light);
        });

        this.lightMeshes = {
            red: redLight,
            yellow: yellowLight,
            green: greenLight
        };

        this._applyLightState(LIGHT_STATES[this.currentStateIndex]);

        return group;
    }

    update(dt) {
        if (!this.lightMeshes) return;

        this.stateElapsed += dt;
        const state = LIGHT_STATES[this.currentStateIndex];
        const duration = STATE_DURATIONS[state] || 1;

        if (this.stateElapsed >= duration) {
            this.stateElapsed -= duration;
            this.currentStateIndex = (this.currentStateIndex + 1) % LIGHT_STATES.length;
            this._applyLightState(LIGHT_STATES[this.currentStateIndex]);
        }
    }

    _createLightMaterial(hex) {
        return new THREE.MeshStandardMaterial({
            color: hex,
            emissive: new THREE.Color(hex),
            emissiveIntensity: 0.15,
            roughness: 0.4,
            metalness: 0.2
        });
    }

    _applyLightState(state) {
        if (!this.lightMeshes) return;

        const activeIntensity = 2.2;
        const idleIntensity = 0.15;

        this.lightMeshes.red.material.emissiveIntensity = state === 'red' ? activeIntensity : idleIntensity;
        this.lightMeshes.yellow.material.emissiveIntensity = state === 'yellow' ? activeIntensity : idleIntensity;
        this.lightMeshes.green.material.emissiveIntensity = state === 'green' ? activeIntensity : idleIntensity;
    }
}

EntityRegistry.register('trafficLight', TrafficLightEntity);
