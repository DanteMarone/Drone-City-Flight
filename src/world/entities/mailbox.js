import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class MailboxEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'mailbox';
        this._time = 0;
        this._flagPivot = null;
        this._lightHandle = null;
        this._lightLocalPos = null;
        this._bodyGroup = null;
        this._bodyBaseY = 0;
    }

    static get displayName() { return 'Mailbox'; }

    createMesh(params) {
        const group = new THREE.Group();

        const pedestalHeight = params.pedestalHeight || 0.4 + Math.random() * 0.1;
        const bodyWidth = params.bodyWidth || 0.6;
        const bodyDepth = params.bodyDepth || 0.45;
        const bodyHeight = params.bodyHeight || 0.6;
        const archRadius = bodyWidth / 2;

        Object.assign(this.params, { pedestalHeight, bodyWidth, bodyDepth, bodyHeight });

        const concreteMat = new THREE.MeshStandardMaterial({
            map: TextureGenerator.createConcrete(),
            color: 0xb8b8b8,
            roughness: 0.85,
            metalness: 0.05
        });

        const base = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.08, 0.75), concreteMat);
        base.position.y = 0.04;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const pedestalMat = new THREE.MeshStandardMaterial({
            color: 0x4b5563,
            roughness: 0.45,
            metalness: 0.65
        });
        const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, pedestalHeight, 14), pedestalMat);
        pedestal.position.y = base.position.y + pedestalHeight / 2 + 0.04;
        pedestal.castShadow = true;
        pedestal.receiveShadow = true;
        group.add(pedestal);

        const boxGroup = new THREE.Group();
        const bodyColor = params.bodyColor || (Math.random() > 0.5 ? 0x1f4b99 : 0xa83232);
        const shellMat = new THREE.MeshStandardMaterial({
            color: bodyColor,
            roughness: 0.3,
            metalness: 0.55
        });

        const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(bodyWidth, bodyHeight * 0.6, bodyDepth), shellMat);
        lowerBody.position.y = bodyHeight * 0.3;
        lowerBody.castShadow = true;
        lowerBody.receiveShadow = true;
        boxGroup.add(lowerBody);

        const arch = new THREE.Mesh(
            new THREE.CylinderGeometry(archRadius, archRadius, bodyDepth, 20, 1, true, 0, Math.PI),
            shellMat
        );
        arch.rotation.z = Math.PI / 2;
        arch.position.set(0, bodyHeight * 0.6, 0);
        arch.castShadow = true;
        arch.receiveShadow = true;
        boxGroup.add(arch);

        const cap = new THREE.Mesh(
            new THREE.CylinderGeometry(archRadius - 0.02, archRadius - 0.02, bodyDepth + 0.02, 20, 1, true, 0, Math.PI),
            new THREE.MeshStandardMaterial({
                color: 0xf3f4f6,
                roughness: 0.65,
                metalness: 0.15
            })
        );
        cap.rotation.z = Math.PI / 2;
        cap.position.set(0, bodyHeight * 0.6 + 0.01, 0);
        cap.castShadow = true;
        boxGroup.add(cap);

        const doorFrameMat = new THREE.MeshStandardMaterial({
            color: 0xd1d5db,
            roughness: 0.4,
            metalness: 0.35
        });
        const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(bodyWidth * 0.82, bodyHeight * 0.62, 0.04), doorFrameMat);
        doorFrame.position.set(0, bodyHeight * 0.35, bodyDepth / 2 + 0.02);
        doorFrame.castShadow = true;
        boxGroup.add(doorFrame);

        const labelTexture = TextureGenerator.createBuildingFacade({
            color: '#0f172a',
            windowColor: '#e5e7eb',
            floors: 3,
            cols: 2,
            width: 128,
            height: 96
        });
        const label = new THREE.Mesh(
            new THREE.PlaneGeometry(bodyWidth * 0.72, bodyHeight * 0.18),
            new THREE.MeshStandardMaterial({
                map: labelTexture,
                transparent: true,
                emissive: new THREE.Color(0xe5e7eb),
                emissiveIntensity: 0.15,
                side: THREE.DoubleSide
            })
        );
        label.position.set(0, bodyHeight * 0.52, bodyDepth / 2 + 0.025);
        boxGroup.add(label);

        const slot = new THREE.Mesh(
            new THREE.BoxGeometry(bodyWidth * 0.5, 0.02, 0.04),
            new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.25, metalness: 0.7 })
        );
        slot.position.set(0, bodyHeight * 0.35, bodyDepth / 2 + 0.03);
        boxGroup.add(slot);

        const hingeMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.35, metalness: 0.6 });
        const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, bodyHeight * 0.6, 8), hingeMat);
        hinge.rotation.z = Math.PI / 2;
        hinge.position.set(bodyWidth / 2 + 0.015, bodyHeight * 0.3, bodyDepth / 2 - 0.02);
        boxGroup.add(hinge);

        boxGroup.position.y = pedestal.position.y + pedestalHeight / 2 + 0.02;
        group.add(boxGroup);
        this._bodyGroup = boxGroup;
        this._bodyBaseY = boxGroup.position.y;

        const flagPivot = new THREE.Group();
        flagPivot.position.set(bodyWidth / 2 + 0.02, bodyHeight * 0.55, -bodyDepth * 0.2);
        boxGroup.add(flagPivot);

        const flagStem = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.012, 0.18, 8), hingeMat);
        flagStem.position.y = 0.09;
        flagStem.castShadow = true;
        flagPivot.add(flagStem);

        const flagPanel = new THREE.Mesh(
            new THREE.BoxGeometry(0.14, 0.08, 0.01),
            new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xf97316, emissiveIntensity: 0.2 })
        );
        flagPanel.position.set(0, 0.19, 0);
        flagPanel.castShadow = true;
        flagPivot.add(flagPanel);
        this._flagPivot = flagPivot;

        const indicator = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.022, 0.05, 12),
            new THREE.MeshStandardMaterial({
                color: 0x7dd3fc,
                emissive: 0x7dd3fc,
                emissiveIntensity: 0.5,
                roughness: 0.2,
                metalness: 0.4
            })
        );
        indicator.rotation.x = Math.PI / 2;
        indicator.position.set(0, bodyHeight * 0.72, bodyDepth / 2 + 0.02);
        boxGroup.add(indicator);
        this._lightLocalPos = indicator.position.clone();

        return group;
    }

    postInit() {
        const lightSystem = this.params.lightSystem || window.app?.world?.lightSystem;
        if (lightSystem && this.mesh && this._lightLocalPos) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightLocalPos.clone().applyMatrix4(this.mesh.matrixWorld);
            this._lightHandle = lightSystem.register(worldPos, 0x7dd3fc, this.params.lightIntensity || 1.1, 10);
            if (this._lightHandle) {
                this._lightHandle.parentMesh = this.mesh;
            }
        }
    }

    update(dt) {
        if (!this.mesh) return;

        this._time += dt;

        const windSway = Math.sin(this._time * 0.7 + (this.params.seed || 0)) * THREE.MathUtils.degToRad(1.8);
        this.mesh.rotation.z = windSway;

        if (this._flagPivot) {
            const flutter = Math.sin(this._time * 2.4) * THREE.MathUtils.degToRad(6);
            this._flagPivot.rotation.z = THREE.MathUtils.degToRad(35) + flutter;
        }

        if (this._lightHandle) {
            const base = this.params.lightIntensity || 1.1;
            this._lightHandle.intensity = THREE.MathUtils.clamp(base + 0.25 * Math.sin(this._time * 3), 0.6, 1.6);
        }

        if (this._bodyGroup) {
            const bob = Math.sin(this._time * 1.5) * 0.01;
            this._bodyGroup.position.y = this._bodyBaseY + bob;
        }
    }
}

EntityRegistry.register('mailbox', MailboxEntity);
