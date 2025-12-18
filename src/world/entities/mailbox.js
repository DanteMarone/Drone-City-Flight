import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class MailboxEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'mailbox';
        this._time = Math.random() * Math.PI * 2;
        this._indicatorMaterial = null;
        this._lightHandle = null;
        this._lightAnchor = new THREE.Vector3();
        this._flagPivot = null;
        this._baseRotation = this.rotation.clone();
    }

    static get displayName() { return 'Mailbox'; }

    createMesh(params) {
        const group = new THREE.Group();

        const width = params.width || 0.68;
        const depth = params.depth || 0.55;
        const bodyHeight = params.bodyHeight || 0.82;
        const legHeight = params.legHeight || 0.18;
        this.params.width = width;
        this.params.depth = depth;
        this.params.bodyHeight = bodyHeight;
        this.params.legHeight = legHeight;

        const concreteTex = TextureGenerator.createConcrete();
        concreteTex.wrapS = THREE.RepeatWrapping;
        concreteTex.wrapT = THREE.RepeatWrapping;
        concreteTex.repeat.set(2, 2);

        const shellMaterial = new THREE.MeshStandardMaterial({
            color: 0x1f3f77,
            map: concreteTex,
            roughness: 0.5,
            metalness: 0.45
        });

        const accentMaterial = new THREE.MeshStandardMaterial({
            color: 0xdde6f5,
            roughness: 0.4,
            metalness: 0.25
        });

        const frameMaterial = new THREE.MeshStandardMaterial({
            color: 0x10131a,
            roughness: 0.6,
            metalness: 0.3
        });

        const legMaterial = new THREE.MeshStandardMaterial({
            color: 0x2d3545,
            roughness: 0.55,
            metalness: 0.35
        });

        const body = new THREE.Mesh(new THREE.BoxGeometry(width, bodyHeight, depth), shellMaterial);
        body.position.y = legHeight + bodyHeight / 2;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        const domeRadius = width / 2;
        const dome = new THREE.Mesh(
            new THREE.SphereGeometry(domeRadius, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2),
            shellMaterial
        );
        dome.scale.z = depth / width;
        dome.position.y = body.position.y + bodyHeight / 2;
        dome.castShadow = true;
        dome.receiveShadow = true;
        group.add(dome);

        const legGeo = new THREE.CylinderGeometry(0.05, 0.055, legHeight, 10);
        const legOffsetX = width / 2 - 0.1;
        const legOffsetZ = depth / 2 - 0.1;
        const addLeg = (x, z) => {
            const leg = new THREE.Mesh(legGeo, legMaterial);
            leg.position.set(x, legHeight / 2, z);
            leg.castShadow = true;
            leg.receiveShadow = true;
            group.add(leg);
            return leg;
        };

        addLeg(legOffsetX, legOffsetZ);
        addLeg(-legOffsetX, legOffsetZ);
        addLeg(legOffsetX, -legOffsetZ);
        addLeg(-legOffsetX, -legOffsetZ);

        const feetGeo = new THREE.BoxGeometry(0.12, 0.04, 0.12);
        const footY = 0.02;
        const addFoot = (x, z) => {
            const foot = new THREE.Mesh(feetGeo, frameMaterial);
            foot.position.set(x, footY, z);
            foot.receiveShadow = true;
            group.add(foot);
        };

        addFoot(legOffsetX, legOffsetZ);
        addFoot(-legOffsetX, legOffsetZ);
        addFoot(legOffsetX, -legOffsetZ);
        addFoot(-legOffsetX, -legOffsetZ);

        const slotHeight = body.position.y + bodyHeight * 0.1;
        const slotFrame = new THREE.Mesh(new THREE.BoxGeometry(width * 0.52, 0.08, 0.03), accentMaterial);
        slotFrame.position.set(0, slotHeight, depth / 2 + 0.015);
        slotFrame.castShadow = true;
        group.add(slotFrame);

        const slotOpening = new THREE.Mesh(
            new THREE.BoxGeometry(width * 0.35, 0.02, 0.02),
            new THREE.MeshStandardMaterial({
                color: 0x0d111b,
                emissive: new THREE.Color(0x0d111b),
                emissiveIntensity: 0.35,
                roughness: 0.5,
                metalness: 0.25
            })
        );
        slotOpening.position.set(0, slotHeight, depth / 2 + 0.026);
        group.add(slotOpening);

        const indicatorMat = new THREE.MeshStandardMaterial({
            color: 0x5ad4ff,
            emissive: new THREE.Color(0x5ad4ff),
            emissiveIntensity: 0.9,
            roughness: 0.3,
            metalness: 0.65
        });
        this._indicatorMaterial = indicatorMat;

        const indicator = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.016, 12), indicatorMat);
        indicator.rotation.x = Math.PI / 2;
        indicator.position.set(width * 0.21, slotHeight + 0.05, depth / 2 + 0.027);
        indicator.castShadow = false;
        group.add(indicator);

        const labelTex = TextureGenerator.createBuildingFacade({
            color: '#243b68',
            windowColor: '#ffffff',
            floors: 3,
            cols: 2,
            width: 128,
            height: 128
        });
        labelTex.repeat.set(1, 1);

        const label = new THREE.Mesh(
            new THREE.PlaneGeometry(width * 0.42, bodyHeight * 0.36),
            new THREE.MeshStandardMaterial({
                map: labelTex,
                color: 0xffffff,
                emissive: new THREE.Color(0x0b0f17),
                emissiveIntensity: 0.12,
                roughness: 0.5,
                metalness: 0.2
            })
        );
        label.position.set(0, body.position.y + 0.05, depth / 2 + 0.028);
        label.castShadow = false;
        group.add(label);

        const handle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.01, 0.01, 0.16, 8),
            frameMaterial
        );
        handle.rotation.z = Math.PI / 2;
        handle.position.set(0, body.position.y - bodyHeight * 0.22, depth / 2 + 0.02);
        handle.castShadow = true;
        group.add(handle);

        const flagPivot = new THREE.Group();
        flagPivot.position.set(width / 2 - 0.05, body.position.y + bodyHeight * 0.25, -depth * 0.2);
        group.add(flagPivot);
        this._flagPivot = flagPivot;

        const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.012, 0.18, 10), accentMaterial);
        flagPole.position.y = 0.09;
        flagPole.castShadow = true;
        flagPivot.add(flagPole);

        const flagPanel = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 0.08, 0.02),
            new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.45, metalness: 0.35 })
        );
        flagPanel.position.set(0.05, 0.16, 0);
        flagPanel.castShadow = true;
        flagPivot.add(flagPanel);

        const topRidge = new THREE.Mesh(
            new THREE.TorusGeometry(width / 2.05, 0.008, 8, 18, Math.PI * 2),
            accentMaterial
        );
        topRidge.rotation.x = Math.PI / 2;
        topRidge.position.y = dome.position.y + domeRadius * 0.2;
        group.add(topRidge);

        this._lightAnchor.set(0, slotHeight + 0.02, depth / 2 + 0.06);

        return group;
    }

    postInit() {
        if (this.mesh) {
            this._baseRotation = this.mesh.rotation.clone();
        }

        const lightSystem = this.params.lightSystem || window.app?.world?.lightSystem;
        if (lightSystem && this.mesh) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightAnchor.clone().applyMatrix4(this.mesh.matrixWorld);
            this._lightHandle = lightSystem.register(worldPos, 0x5ad4ff, 1.1, 9);
            if (this._lightHandle) {
                this._lightHandle.parentMesh = this.mesh;
            }
        }
    }

    update(dt) {
        if (!this.mesh) return;

        this._time += dt;
        const wobble = Math.sin(this._time * 0.6 + (this.params.seed || 0)) * THREE.MathUtils.degToRad(1.2);
        if (this._baseRotation) {
            this.mesh.rotation.set(
                this._baseRotation.x,
                this._baseRotation.y,
                this._baseRotation.z + wobble * 0.25
            );
        }

        if (this._flagPivot) {
            this._flagPivot.rotation.y = Math.sin(this._time * 0.9) * THREE.MathUtils.degToRad(8);
        }

        const pulse = 0.55 + Math.sin(this._time * 3.2) * 0.35;
        if (this._indicatorMaterial) {
            this._indicatorMaterial.emissiveIntensity = 0.7 + pulse * 0.8;
        }

        if (this._lightHandle) {
            this._lightHandle.intensity = 0.9 + pulse * 0.8;
        }
    }
}

EntityRegistry.register('mailbox', MailboxEntity);
