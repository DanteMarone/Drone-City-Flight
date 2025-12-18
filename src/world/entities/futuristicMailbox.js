import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class FuturisticMailboxEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'futuristicMailbox';
        this._time = 0;
        this._flagPivot = null;
        this._indicatorMaterial = null;
        this._virtualLight = null;
        this._lightLocalPos = null;
    }

    static get displayName() { return 'Futuristic Mailbox'; }

    createMesh(params) {
        const group = new THREE.Group();

        const concreteTex = TextureGenerator.createConcrete();
        const bodyTex = TextureGenerator.createConcrete();

        const pedestalMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b8c8f,
            map: concreteTex,
            roughness: 0.9,
            metalness: 0.05
        });

        const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.08, 18), pedestalMaterial);
        pedestal.position.y = 0.04;
        pedestal.receiveShadow = true;
        group.add(pedestal);

        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x1b4f9c,
            map: bodyTex,
            roughness: 0.45,
            metalness: 0.35
        });

        const bodyHeight = 0.6;
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, bodyHeight, 0.55), bodyMaterial);
        body.position.y = pedestal.position.y + bodyHeight / 2 + pedestal.geometry.parameters.height / 2;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        const dome = new THREE.Mesh(
            new THREE.SphereGeometry(0.28, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
            bodyMaterial
        );
        dome.position.set(0, body.position.y + bodyHeight / 2, 0);
        dome.scale.set(1, 0.8, 1);
        dome.castShadow = true;
        dome.receiveShadow = true;
        group.add(dome);

        const doorMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            map: TextureGenerator.createConcrete(),
            roughness: 0.4,
            metalness: 0.35
        });
        const door = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.28, 0.02), doorMat);
        door.position.set(0, body.position.y + 0.02, 0.55 / 2 + 0.011);
        door.castShadow = true;
        group.add(door);

        const slotMat = new THREE.MeshStandardMaterial({ color: 0xd9d9d9, metalness: 0.7, roughness: 0.25 });
        const slot = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.04, 0.01), slotMat);
        slot.position.set(0, 0.06, 0.015);
        door.add(slot);

        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.01, 0.02), slotMat);
        handle.position.set(0, -0.06, 0.012);
        door.add(handle);

        this._indicatorMaterial = new THREE.MeshStandardMaterial({
            color: 0x92f0ff,
            emissive: new THREE.Color(0x5edcff),
            emissiveIntensity: 1.2,
            metalness: 0.1,
            roughness: 0.3
        });
        const indicator = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 12), this._indicatorMaterial);
        indicator.position.set(0, body.position.y + bodyHeight / 2 - 0.06, 0.55 / 2 + 0.018);
        indicator.castShadow = false;
        group.add(indicator);
        this._lightLocalPos = indicator.position.clone();

        const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.12, 10), slotMat);
        hinge.rotation.z = Math.PI / 2;
        hinge.position.set(0.5 / 2 + 0.03, body.position.y + bodyHeight / 2 - 0.12, 0);
        hinge.castShadow = true;
        group.add(hinge);

        this._flagPivot = new THREE.Group();
        this._flagPivot.position.set(0.5 / 2 + 0.03, body.position.y + bodyHeight / 2 - 0.12, 0);
        group.add(this._flagPivot);

        const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.18, 12), new THREE.MeshStandardMaterial({
            color: 0xe5e7eb,
            roughness: 0.35,
            metalness: 0.5
        }));
        flagPole.position.y = 0.09;
        flagPole.castShadow = true;
        this._flagPivot.add(flagPole);

        const flagPanel = new THREE.Mesh(
            new THREE.BoxGeometry(0.16, 0.08, 0.02),
            new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5, metalness: 0.15 })
        );
        flagPanel.position.set(0.08, 0.16, 0);
        flagPanel.castShadow = true;
        this._flagPivot.add(flagPanel);

        const feetMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.65, metalness: 0.2 });
        const footGeo = new THREE.BoxGeometry(0.12, 0.06, 0.22);
        const footLeft = new THREE.Mesh(footGeo, feetMat);
        footLeft.position.set(-0.15, footGeo.parameters.height / 2, 0);
        footLeft.receiveShadow = true;
        group.add(footLeft);
        const footRight = footLeft.clone();
        footRight.position.x = 0.15;
        group.add(footRight);

        return group;
    }

    postInit() {
        const lightSystem = this.params.lightSystem || window.app?.world?.lightSystem;
        if (lightSystem && this._lightLocalPos && this.mesh) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightLocalPos.clone().applyMatrix4(this.mesh.matrixWorld);
            this._virtualLight = lightSystem.register(worldPos, this.params.lightColor || 0x5edcff, this.params.lightIntensity || 1.1, 8);
            if (this._virtualLight) {
                this._virtualLight.parentMesh = this.mesh;
            }
        }
    }

    update(dt) {
        if (!this.mesh) return;

        this._time += dt;
        const sway = Math.sin(this._time * 1.2 + (this.params.seed || 0)) * THREE.MathUtils.degToRad(8);
        if (this._flagPivot) {
            this._flagPivot.rotation.z = sway;
        }

        if (this._indicatorMaterial) {
            const pulse = 0.6 + 0.4 * Math.sin(this._time * 3 + Math.cos(this._time * 1.3));
            this._indicatorMaterial.emissiveIntensity = THREE.MathUtils.clamp(0.6 + pulse, 0.6, 1.6);
        }

        if (this._virtualLight) {
            const base = this.params.lightIntensity || 1.1;
            const variation = 0.35 * Math.sin(this._time * 3.2 + 1.1);
            this._virtualLight.intensity = THREE.MathUtils.clamp(base + variation, base * 0.65, base * 1.5);
        }
    }
}

EntityRegistry.register('futuristicMailbox', FuturisticMailboxEntity);
