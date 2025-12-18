import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

const MAILBOX_COLORS = [
    0x2b6cb0, // deep blue
    0xc53030, // postal red
    0x2f855a, // green
    0x4b5563  // neutral gray
];

export class MailboxEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'mailbox';
        this._time = Math.random() * Math.PI * 2;
        this._flagPivot = null;
        this._lightHandle = null;
        this._lightAnchor = new THREE.Vector3();
        this._accentColor = null;
        this._baseRotation = this.rotation.clone();
    }

    static get displayName() { return 'Mailbox'; }

    createMesh(params) {
        const group = new THREE.Group();

        const accent = params.color || MAILBOX_COLORS[Math.floor(Math.random() * MAILBOX_COLORS.length)];
        this._accentColor = accent;

        const baseHeight = 0.08;
        const poleHeight = params.poleHeight || 0.95;
        const bodyWidth = params.bodyWidth || 0.56;
        const bodyHeight = params.bodyHeight || 0.48;
        const bodyDepth = params.bodyDepth || 0.76;

        // Base slab
        const concreteTex = TextureGenerator.createConcrete();
        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x8a8f98,
            map: concreteTex,
            roughness: 0.85,
            metalness: 0.1
        });
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.64, baseHeight, 0.64), baseMat);
        base.position.y = baseHeight / 2;
        base.receiveShadow = true;
        group.add(base);

        // Support pole
        const poleMat = new THREE.MeshStandardMaterial({
            color: 0x4b5563,
            roughness: 0.35,
            metalness: 0.65
        });
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, poleHeight, 12), poleMat);
        pole.position.y = baseHeight + poleHeight / 2;
        pole.castShadow = true;
        pole.receiveShadow = true;
        group.add(pole);

        // Body group for easier animation
        const bodyGroup = new THREE.Group();
        bodyGroup.position.y = baseHeight + poleHeight;
        group.add(bodyGroup);

        const bodyTex = TextureGenerator.createConcrete();
        bodyTex.wrapS = THREE.RepeatWrapping;
        bodyTex.wrapT = THREE.RepeatWrapping;
        bodyTex.repeat.set(1.4, 1.4);

        const shellMat = new THREE.MeshStandardMaterial({
            color: accent,
            map: bodyTex,
            roughness: 0.5,
            metalness: 0.4
        });

        // Lower shell
        const shell = new THREE.Mesh(new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyDepth), shellMat);
        shell.position.y = bodyHeight / 2;
        shell.castShadow = true;
        shell.receiveShadow = true;
        bodyGroup.add(shell);

        // Rounded roof using a rotated cylinder that sinks into the shell
        const roofMat = new THREE.MeshStandardMaterial({
            color: accent,
            map: bodyTex,
            roughness: 0.45,
            metalness: 0.45
        });
        const roofRadius = bodyWidth / 2 + 0.02;
        const roof = new THREE.Mesh(new THREE.CylinderGeometry(roofRadius, roofRadius, bodyDepth, 24), roofMat);
        roof.rotation.x = Math.PI / 2;
        roof.position.set(0, shell.position.y + bodyHeight / 2 - roofRadius * 0.15, 0);
        roof.castShadow = true;
        roof.receiveShadow = true;
        bodyGroup.add(roof);

        // Front door panel
        const facadeTex = TextureGenerator.createBuildingFacade({
            color: '#1f2933',
            windowColor: '#0b1119',
            floors: 4,
            cols: 2,
            width: 128,
            height: 192
        });
        const doorMat = new THREE.MeshStandardMaterial({
            map: facadeTex,
            color: 0xffffff,
            roughness: 0.35,
            metalness: 0.25
        });
        const door = new THREE.Mesh(new THREE.PlaneGeometry(bodyWidth * 0.78, bodyHeight * 0.7), doorMat);
        door.position.set(0, shell.position.y + 0.04, bodyDepth / 2 + 0.01);
        door.castShadow = false;
        bodyGroup.add(door);

        const mailSlot = new THREE.Mesh(
            new THREE.BoxGeometry(bodyWidth * 0.5, bodyHeight * 0.1, 0.04),
            new THREE.MeshStandardMaterial({ color: 0x0f1115, roughness: 0.4, metalness: 0.2 })
        );
        mailSlot.position.set(0, door.position.y + 0.05, door.position.z + 0.04);
        bodyGroup.add(mailSlot);

        const handle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.012, 0.012, bodyWidth * 0.35, 8),
            new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.25, metalness: 0.65 })
        );
        handle.rotation.z = Math.PI / 2;
        handle.position.set(0, door.position.y - 0.08, mailSlot.position.z + 0.02);
        bodyGroup.add(handle);

        // Side flag for outgoing mail
        const flagGroup = new THREE.Group();
        flagGroup.position.set(bodyWidth / 2 + 0.03, shell.position.y + bodyHeight * 0.35, bodyDepth / 2 - 0.1);
        bodyGroup.add(flagGroup);
        this._flagPivot = flagGroup;

        const hinge = new THREE.Mesh(
            new THREE.CylinderGeometry(0.012, 0.012, 0.08, 8),
            new THREE.MeshStandardMaterial({ color: 0xa0aec0, roughness: 0.35, metalness: 0.55 })
        );
        hinge.rotation.z = Math.PI / 2;
        flagGroup.add(hinge);

        const arm = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.02, 0.26),
            new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.25, metalness: 0.4 })
        );
        arm.position.set(0.03, 0, 0.12);
        flagGroup.add(arm);

        const flag = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.12, 0.02),
            new THREE.MeshStandardMaterial({
                color: accent,
                emissive: new THREE.Color(accent),
                emissiveIntensity: 0.6,
                roughness: 0.25,
                metalness: 0.35
            })
        );
        flag.position.set(0.06, 0, 0.2);
        flag.castShadow = true;
        flagGroup.add(flag);

        // Light anchor sits near the glowing flag panel
        this._lightAnchor.set(
            flagGroup.position.x,
            bodyGroup.position.y + flagGroup.position.y,
            flagGroup.position.z
        );

        return group;
    }

    postInit() {
        if (this.mesh) {
            this._baseRotation.copy(this.mesh.rotation);
        }

        const lightSystem = this.params.lightSystem || window.app?.world?.lightSystem;
        if (lightSystem && this.mesh) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightAnchor.clone().applyMatrix4(this.mesh.matrixWorld);
            const baseIntensity = this.params.lightIntensity || 0.9;
            this._lightHandle = lightSystem.register(worldPos, this._accentColor || 0x7dd3fc, baseIntensity, 9);
            if (this._lightHandle) {
                this._lightHandle.parentMesh = this.mesh;
            }
        }
    }

    update(dt) {
        if (!this.mesh) return;

        this._time += dt;

        const sway = Math.sin(this._time * 0.8 + (this.params.seed || 0)) * THREE.MathUtils.degToRad(1.4);
        this.mesh.rotation.set(
            this._baseRotation.x,
            this._baseRotation.y,
            this._baseRotation.z + sway
        );

        if (this._flagPivot) {
            this._flagPivot.rotation.y = Math.sin(this._time * 2.2) * THREE.MathUtils.degToRad(6);
            this._flagPivot.rotation.z = THREE.MathUtils.degToRad(65 + Math.sin(this._time * 1.5) * 4);
        }

        if (this._lightHandle) {
            const baseIntensity = this.params.lightIntensity || 0.9;
            const pulse = 0.35 + 0.25 * Math.sin(this._time * 3.4);
            this._lightHandle.intensity = THREE.MathUtils.clamp(baseIntensity + pulse, 0.4, 1.6);
        }
    }
}

EntityRegistry.register('mailbox', MailboxEntity);
