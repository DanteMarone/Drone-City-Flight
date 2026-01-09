import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const _tempColor = new THREE.Color();

export class LandingPadEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'landingPad';
        this.timer = 0;
        this.lights = [];
        this._virtualLight = null;
    }

    static get displayName() { return 'Drone Landing Pad'; }

    createMesh(params) {
        const group = new THREE.Group();

        // 1. Platform
        const baseGeo = new THREE.BoxGeometry(8, 0.5, 8);
        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.8
        });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.25;
        base.receiveShadow = true;
        group.add(base);

        // 2. Markings (H)
        // Using planes slightly above base to avoid z-fighting
        const markingMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });

        const vBarGeo = new THREE.PlaneGeometry(1, 4);
        vBarGeo.rotateX(-Math.PI / 2);

        const leftBar = new THREE.Mesh(vBarGeo, markingMat);
        leftBar.position.set(-1.5, 0.51, 0);
        group.add(leftBar);

        const rightBar = new THREE.Mesh(vBarGeo, markingMat);
        rightBar.position.set(1.5, 0.51, 0);
        group.add(rightBar);

        const hBarGeo = new THREE.PlaneGeometry(3, 1);
        hBarGeo.rotateX(-Math.PI / 2);
        const midBar = new THREE.Mesh(hBarGeo, markingMat);
        midBar.position.set(0, 0.51, 0);
        group.add(midBar);

        // 3. Perimeter Lights
        const lightGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const corners = [
            [-3.5, -3.5], [3.5, -3.5], [3.5, 3.5], [-3.5, 3.5]
        ];

        corners.forEach((corner, i) => {
            const mat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            const light = new THREE.Mesh(lightGeo, mat);
            light.position.set(corner[0], 0.5, corner[1]);
            group.add(light);
            this.lights.push(light);
        });

        // 4. Circle Ring
        const ringGeo = new THREE.RingGeometry(3, 3.5, 32);
        ringGeo.rotateX(-Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.y = 0.51;
        group.add(ring);

        return group;
    }

    postInit() {
        if (window.app?.world?.lightSystem) {
            this.mesh.updateMatrixWorld(true);
            // Center of pad, slightly up
            const worldPos = new THREE.Vector3(0, 0.5, 0).applyMatrix4(this.mesh.matrixWorld);
            this._virtualLight = window.app.world.lightSystem.register(worldPos, 0x00ff00, 2.0, 15);
            if (this._virtualLight) {
                this._virtualLight.parentMesh = this.mesh;
            }
        }
    }

    update(dt) {
        this.timer += dt;

        // Cycle colors: Green -> Blue -> Red
        const hue = (this.timer * 0.5) % 1;
        _tempColor.setHSL(hue, 1, 0.5);

        this.lights.forEach(light => {
            light.material.color.copy(_tempColor);
        });

        if (this._virtualLight) {
            this._virtualLight.color.copy(_tempColor);
        }
    }
}

EntityRegistry.register('landingPad', LandingPadEntity);
