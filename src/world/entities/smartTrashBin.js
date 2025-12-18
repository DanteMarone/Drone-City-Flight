import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

const ACCENT_COLORS = [
    0x4de2ff,
    0x7dff7a,
    0xffe066,
    0xff7bd1
];

export class SmartTrashBinEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'smartTrashBin';
        this._time = Math.random() * Math.PI * 2;
        this._indicatorMaterial = null;
        this._virtualLight = null;
        this._lightLocalPos = new THREE.Vector3();
    }

    static get displayName() { return 'Smart Trash Bin'; }

    createMesh(params) {
        const group = new THREE.Group();

        const height = params.height || 1.2;
        const radius = params.radius || 0.34;
        const accent = params.accentColor || ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)];
        const lidHeight = height * 0.18;

        this.params.height = height;
        this.params.radius = radius;
        this.params.accentColor = accent;

        const concreteTex = TextureGenerator.createConcrete();
        concreteTex.wrapS = THREE.RepeatWrapping;
        concreteTex.wrapT = THREE.RepeatWrapping;
        concreteTex.repeat.set(1.4, 1.6);

        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x2b2f38,
            roughness: 0.65,
            metalness: 0.35,
            map: concreteTex
        });

        const shell = new THREE.Mesh(
            new THREE.CylinderGeometry(radius * 0.98, radius * 1.02, height * 0.82, 20, 1, true),
            bodyMaterial
        );
        shell.position.y = height * 0.41;
        shell.castShadow = true;
        shell.receiveShadow = true;
        group.add(shell);

        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(radius * 1.05, radius * 1.15, height * 0.08, 20),
            new THREE.MeshStandardMaterial({ color: 0x1a1c21, roughness: 0.75, metalness: 0.25 })
        );
        base.position.y = base.geometry.parameters.height / 2;
        base.receiveShadow = true;
        group.add(base);

        const lid = new THREE.Mesh(
            new THREE.CylinderGeometry(radius * 1.02, radius * 0.9, lidHeight, 24),
            new THREE.MeshStandardMaterial({ color: 0x1f222a, roughness: 0.55, metalness: 0.4 })
        );
        lid.position.y = height * 0.86;
        lid.castShadow = true;
        lid.receiveShadow = true;
        group.add(lid);

        const lidCap = new THREE.Mesh(
            new THREE.SphereGeometry(radius * 0.48, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2),
            new THREE.MeshStandardMaterial({ color: 0x16181e, roughness: 0.45, metalness: 0.55 })
        );
        lidCap.scale.y = 0.45;
        lidCap.position.y = lid.position.y + lidHeight / 2;
        lidCap.castShadow = true;
        group.add(lidCap);

        const slot = new THREE.Mesh(
            new THREE.BoxGeometry(radius * 1.2, lidHeight * 0.32, radius * 0.3),
            new THREE.MeshStandardMaterial({ color: 0x0b0d11, roughness: 0.65, metalness: 0.2 })
        );
        slot.position.set(0, lid.position.y + lidHeight * 0.05, radius * 0.45);
        group.add(slot);

        const statusRingGeo = new THREE.TorusGeometry(radius * 0.9, radius * 0.05, 10, 32);
        this._indicatorMaterial = new THREE.MeshStandardMaterial({
            color: accent,
            emissive: new THREE.Color(accent),
            emissiveIntensity: 0.5,
            roughness: 0.25,
            metalness: 0.6
        });
        const statusRing = new THREE.Mesh(statusRingGeo, this._indicatorMaterial);
        statusRing.rotation.x = Math.PI / 2;
        statusRing.position.set(0, height * 0.7, radius * 0.6);
        statusRing.castShadow = false;
        group.add(statusRing);

        const frontPanelTex = TextureGenerator.createBuildingFacade({
            color: '#0f141d',
            windowColor: '#1dd8ff',
            floors: 4,
            cols: 2,
            width: 256,
            height: 256
        });
        frontPanelTex.wrapS = THREE.RepeatWrapping;
        frontPanelTex.wrapT = THREE.RepeatWrapping;
        frontPanelTex.repeat.set(1.4, 1.2);

        const panel = new THREE.Mesh(
            new THREE.BoxGeometry(radius * 1.1, height * 0.38, radius * 0.12),
            new THREE.MeshStandardMaterial({
                color: 0x0d1118,
                roughness: 0.45,
                metalness: 0.55,
                map: frontPanelTex,
                emissive: new THREE.Color(0x0d1118),
                emissiveIntensity: 0.12
            })
        );
        panel.position.set(0, height * 0.45, radius * 0.56);
        panel.castShadow = true;
        group.add(panel);

        const indicatorEye = new THREE.Mesh(
            new THREE.CylinderGeometry(radius * 0.14, radius * 0.14, radius * 0.1, 12),
            new THREE.MeshStandardMaterial({
                color: accent,
                emissive: new THREE.Color(accent),
                emissiveIntensity: 0.35,
                roughness: 0.35,
                metalness: 0.55
            })
        );
        indicatorEye.rotation.x = Math.PI / 2;
        indicatorEye.position.set(0, height * 0.6, radius * 0.64);
        indicatorEye.castShadow = false;
        group.add(indicatorEye);

        const trim = new THREE.Mesh(
            new THREE.CylinderGeometry(radius * 1.08, radius * 1.08, height * 0.02, 20),
            new THREE.MeshStandardMaterial({ color: 0x3a3f4b, roughness: 0.55, metalness: 0.5 })
        );
        trim.position.y = height * 0.35;
        trim.receiveShadow = true;
        group.add(trim);

        const anchorBracket = new THREE.Mesh(
            new THREE.BoxGeometry(radius * 0.45, height * 0.12, radius * 0.2),
            new THREE.MeshStandardMaterial({ color: 0x262a32, roughness: 0.6, metalness: 0.4 })
        );
        anchorBracket.position.set(0, height * 0.15, -radius * 0.35);
        group.add(anchorBracket);

        this._lightLocalPos.copy(statusRing.position);

        return group;
    }

    postInit() {
        if (window.app?.world?.lightSystem && this.mesh) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightLocalPos.clone().applyMatrix4(this.mesh.matrixWorld);
            this._virtualLight = window.app.world.lightSystem.register(
                worldPos,
                this.params.accentColor || 0x4de2ff,
                1.6,
                9
            );

            if (this._virtualLight) {
                this._virtualLight.parentMesh = this.mesh;
            }
        }
    }

    update(dt) {
        this._time += dt;
        const pulse = 0.35 + 0.15 * Math.sin(this._time * 2.6);
        if (this._indicatorMaterial) {
            this._indicatorMaterial.emissiveIntensity = 0.45 + pulse * 0.8;
        }

        if (this._virtualLight) {
            const baseIntensity = 1.6;
            this._virtualLight.intensity = baseIntensity + pulse;
        }
    }
}

EntityRegistry.register('smartTrashBin', SmartTrashBinEntity);
