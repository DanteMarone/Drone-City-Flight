import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

const MAILBOX_COLORS = [0x1f4b99, 0x164b6a, 0x8b1e3f, 0x2c6e3f];

export class MailboxEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'mailbox';
        this._time = 0;
        this._lightHandle = null;
        this._indicatorMaterial = null;
        this._flagPivot = null;
        this._baseRotation = null;
        this._lightLocalPos = new THREE.Vector3();
        this._baseLightIntensity = params.lightIntensity || 1.05;
    }

    static get displayName() { return 'Mailbox'; }

    createMesh(params) {
        const group = new THREE.Group();

        const width = params.width || 0.82 + Math.random() * 0.04;
        const depth = params.depth || 0.58 + Math.random() * 0.05;
        const totalHeight = params.height || 1.12 + Math.random() * 0.08;
        const radius = width * 0.48;

        const padHeight = 0.08;
        const legHeight = totalHeight * 0.26;
        const domeHeight = radius * 0.9;
        const bodyHeight = Math.max(totalHeight - padHeight - legHeight - domeHeight, totalHeight * 0.42);

        const baseTex = TextureGenerator.createConcrete();
        baseTex.wrapS = THREE.RepeatWrapping;
        baseTex.wrapT = THREE.RepeatWrapping;
        baseTex.repeat.set(1.6, 1.6);

        const shellColor = params.color || MAILBOX_COLORS[Math.floor(Math.random() * MAILBOX_COLORS.length)];
        const shellMaterial = new THREE.MeshStandardMaterial({
            color: shellColor,
            map: baseTex,
            roughness: 0.38,
            metalness: 0.58
        });

        const pad = new THREE.Mesh(new THREE.BoxGeometry(width * 1.05, padHeight, depth * 1.05), new THREE.MeshStandardMaterial({
            color: 0x5e5e66,
            map: baseTex,
            roughness: 0.9,
            metalness: 0.1
        }));
        pad.position.y = padHeight / 2;
        pad.receiveShadow = true;
        group.add(pad);

        const legMaterial = new THREE.MeshStandardMaterial({
            color: 0x1f2933,
            roughness: 0.45,
            metalness: 0.65
        });
        const legGeo = new THREE.BoxGeometry(width * 0.12, legHeight, depth * 0.12);
        const legPositions = [
            [width * 0.36, padHeight + legHeight / 2, depth * 0.28],
            [-width * 0.36, padHeight + legHeight / 2, depth * 0.28],
            [width * 0.36, padHeight + legHeight / 2, -depth * 0.28],
            [-width * 0.36, padHeight + legHeight / 2, -depth * 0.28]
        ];
        legPositions.forEach(([x, y, z]) => {
            const leg = new THREE.Mesh(legGeo, legMaterial);
            leg.position.set(x, y, z);
            leg.castShadow = true;
            leg.receiveShadow = true;
            group.add(leg);
        });

        const brace = new THREE.Mesh(
            new THREE.BoxGeometry(width * 0.9, legHeight * 0.18, depth * 0.35),
            new THREE.MeshStandardMaterial({ color: 0x2d3544, roughness: 0.5, metalness: 0.4 })
        );
        brace.position.y = padHeight + legHeight * 0.55;
        brace.castShadow = true;
        brace.receiveShadow = true;
        group.add(brace);

        const body = new THREE.Mesh(new THREE.BoxGeometry(width, bodyHeight, depth), shellMaterial);
        body.position.y = padHeight + legHeight + bodyHeight / 2;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        const dome = new THREE.Mesh(
            new THREE.SphereGeometry(radius, 22, 14, 0, Math.PI * 2, 0, Math.PI / 2),
            shellMaterial
        );
        dome.position.y = body.position.y + bodyHeight / 2 - 0.02;
        dome.scale.set(1, 1, depth / (radius * 2));
        dome.castShadow = true;
        dome.receiveShadow = true;
        group.add(dome);

        const seam = new THREE.Mesh(
            new THREE.TorusGeometry(radius * 0.98, 0.012, 8, 32),
            new THREE.MeshStandardMaterial({ color: 0x102136, roughness: 0.45, metalness: 0.7 })
        );
        seam.rotation.x = Math.PI / 2;
        seam.position.y = dome.position.y - radius * 0.2;
        seam.scale.z = dome.scale.z;
        group.add(seam);

        const panelMaterial = new THREE.MeshStandardMaterial({
            color: 0x0d1524,
            roughness: 0.5,
            metalness: 0.4
        });
        const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(width * 0.74, bodyHeight * 0.7, 0.05), panelMaterial);
        doorFrame.position.set(0, body.position.y + bodyHeight * 0.04, depth / 2 + 0.025);
        doorFrame.castShadow = true;
        group.add(doorFrame);

        const slot = new THREE.Mesh(
            new THREE.BoxGeometry(width * 0.6, bodyHeight * 0.08, 0.03),
            new THREE.MeshStandardMaterial({ color: 0x11151e, roughness: 0.25, metalness: 0.6 })
        );
        slot.position.set(0, doorFrame.position.y + bodyHeight * 0.18, doorFrame.position.z + 0.04);
        group.add(slot);

        const accentColor = params.accentColor || 0xffc66d;
        this._indicatorMaterial = new THREE.MeshStandardMaterial({
            color: accentColor,
            emissive: new THREE.Color(accentColor),
            emissiveIntensity: 0.75,
            roughness: 0.2,
            metalness: 0.5
        });
        const indicator = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), this._indicatorMaterial);
        indicator.position.set(width * 0.3, slot.position.y, slot.position.z + 0.03);
        indicator.castShadow = true;
        group.add(indicator);
        this._lightLocalPos.copy(indicator.position);

        const handle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 0.18, 8),
            new THREE.MeshStandardMaterial({ color: 0xd5d9e2, roughness: 0.3, metalness: 0.65 })
        );
        handle.rotation.z = Math.PI / 2;
        handle.position.set(doorFrame.position.x, doorFrame.position.y - bodyHeight * 0.12, doorFrame.position.z + 0.04);
        handle.castShadow = true;
        group.add(handle);

        const flagBase = new THREE.Mesh(
            new THREE.CylinderGeometry(0.016, 0.016, bodyHeight * 0.32, 8),
            new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.35, metalness: 0.55 })
        );
        flagBase.position.set(width / 2 + 0.015, body.position.y + bodyHeight * 0.15, 0);
        flagBase.castShadow = true;
        group.add(flagBase);

        this._flagPivot = new THREE.Group();
        this._flagPivot.position.copy(flagBase.position);
        group.add(this._flagPivot);

        const flagPanel = new THREE.Mesh(
            new THREE.BoxGeometry(0.02, 0.18, 0.12),
            new THREE.MeshStandardMaterial({ color: 0xd44d4d, roughness: 0.4, metalness: 0.45 })
        );
        flagPanel.position.set(0, bodyHeight * 0.2, 0.02);
        flagPanel.castShadow = true;
        this._flagPivot.add(flagPanel);

        const footings = new THREE.Mesh(
            new THREE.BoxGeometry(width * 1.02, 0.06, depth * 1.08),
            new THREE.MeshStandardMaterial({ color: 0x3e434f, roughness: 0.75, metalness: 0.2 })
        );
        footings.position.y = padHeight - 0.03;
        footings.receiveShadow = true;
        group.add(footings);

        return group;
    }

    postInit() {
        if (this.mesh) {
            this._baseRotation = this.mesh.rotation.clone();
        }

        const lightSystem = this.params.lightSystem || window.app?.world?.lightSystem;
        if (lightSystem && this.mesh && this._lightLocalPos) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightLocalPos.clone().applyMatrix4(this.mesh.matrixWorld);
            this._lightHandle = lightSystem.register(
                worldPos,
                this.params.lightColor || 0xffc66d,
                this._baseLightIntensity,
                9
            );

            if (this._lightHandle) {
                this._lightHandle.parentMesh = this.mesh;
            }
        }
    }

    update(dt) {
        if (!this.mesh) return;

        this._time += dt;
        const sway = Math.sin(this._time * 0.8 + (this.params.seed || 0)) * THREE.MathUtils.degToRad(1.1);
        if (this._baseRotation) {
            this.mesh.rotation.set(
                this._baseRotation.x,
                this._baseRotation.y,
                this._baseRotation.z + sway
            );
        }

        if (this._flagPivot) {
            this._flagPivot.rotation.z = THREE.MathUtils.degToRad(12) + Math.sin(this._time * 1.6) * THREE.MathUtils.degToRad(4);
        }

        if (this._indicatorMaterial) {
            const pulse = 0.35 + 0.25 * Math.sin(this._time * 3.2) + 0.1 * Math.sin(this._time * 6.7);
            this._indicatorMaterial.emissiveIntensity = THREE.MathUtils.clamp(0.6 + pulse, 0.6, 1.6);
        }

        if (this._lightHandle) {
            const modulated = this._baseLightIntensity + 0.35 * Math.sin(this._time * 2.2);
            this._lightHandle.intensity = THREE.MathUtils.clamp(
                modulated,
                this._baseLightIntensity * 0.65,
                this._baseLightIntensity * 1.65
            );
        }
    }
}

EntityRegistry.register('mailbox', MailboxEntity);
