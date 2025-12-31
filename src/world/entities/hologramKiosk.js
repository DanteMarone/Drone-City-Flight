import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class HologramKioskEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'hologramKiosk';
        this._time = 0;
        this._ring = null;
        this._core = null;
        this._coreBaseY = 0;
        this._glowMaterials = [];
    }

    static get displayName() { return 'Hologram Kiosk'; }

    createMesh(params) {
        const group = new THREE.Group();

        const baseRadius = params.baseRadius || 0.46 + Math.random() * 0.05;
        const pedestalHeight = params.pedestalHeight || 0.55 + Math.random() * 0.1;
        const accentColor = params.accentColor || [0x44f2ff, 0x7c5cff, 0xff6bd4][
            Math.floor(Math.random() * 3)
        ];
        const shellColor = params.shellColor || 0x1f2937;

        this.params.baseRadius = baseRadius;
        this.params.pedestalHeight = pedestalHeight;
        this.params.accentColor = accentColor;
        this.params.shellColor = shellColor;

        const baseMaterial = new THREE.MeshStandardMaterial({
            color: shellColor,
            roughness: 0.45,
            metalness: 0.6
        });
        const accentMaterial = new THREE.MeshStandardMaterial({
            color: accentColor,
            roughness: 0.2,
            metalness: 0.7,
            emissive: new THREE.Color(accentColor),
            emissiveIntensity: 0.7
        });
        const glassMaterial = new THREE.MeshStandardMaterial({
            color: 0x9fd8ff,
            roughness: 0.1,
            metalness: 0.05,
            transparent: true,
            opacity: 0.45
        });

        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(baseRadius, baseRadius * 1.08, 0.18, 18),
            baseMaterial
        );
        base.position.y = 0.09;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const trim = new THREE.Mesh(
            new THREE.TorusGeometry(baseRadius * 0.72, 0.03, 10, 20),
            accentMaterial
        );
        trim.rotation.x = Math.PI / 2;
        trim.position.y = 0.18;
        group.add(trim);

        const pedestal = new THREE.Mesh(
            new THREE.CylinderGeometry(baseRadius * 0.45, baseRadius * 0.5, pedestalHeight, 14),
            baseMaterial
        );
        pedestal.position.y = 0.18 + pedestalHeight / 2;
        pedestal.castShadow = true;
        pedestal.receiveShadow = true;
        group.add(pedestal);

        const consoleBase = new THREE.Mesh(
            new THREE.BoxGeometry(baseRadius * 1.1, 0.2, baseRadius * 0.8),
            baseMaterial
        );
        consoleBase.position.y = pedestal.position.y + pedestalHeight / 2 + 0.14;
        consoleBase.castShadow = true;
        consoleBase.receiveShadow = true;
        group.add(consoleBase);

        const screenTexture = TextureGenerator.createBuildingFacade({
            color: '#0b1220',
            windowColor: '#6be7ff',
            floors: 6,
            cols: 3,
            width: 128,
            height: 256
        });
        const screenMaterial = new THREE.MeshStandardMaterial({
            map: screenTexture,
            color: 0xffffff,
            emissive: new THREE.Color(accentColor),
            emissiveIntensity: 0.9,
            roughness: 0.35,
            metalness: 0.15
        });
        this._glowMaterials.push(screenMaterial);

        const screen = new THREE.Mesh(new THREE.PlaneGeometry(baseRadius * 0.7, 0.36), screenMaterial);
        screen.position.set(0, consoleBase.position.y + 0.02, baseRadius * 0.4 + 0.01);
        screen.rotation.x = -0.15;
        group.add(screen);

        const sidePanel = new THREE.Mesh(
            new THREE.BoxGeometry(baseRadius * 0.22, 0.46, baseRadius * 0.55),
            glassMaterial
        );
        sidePanel.position.set(baseRadius * 0.43, consoleBase.position.y + 0.08, 0);
        group.add(sidePanel);

        const sidePanelMirror = sidePanel.clone();
        sidePanelMirror.position.x = -baseRadius * 0.43;
        group.add(sidePanelMirror);

        const projector = new THREE.Mesh(
            new THREE.CylinderGeometry(baseRadius * 0.22, baseRadius * 0.3, 0.12, 16),
            baseMaterial
        );
        projector.position.y = consoleBase.position.y + 0.36;
        group.add(projector);

        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(baseRadius * 0.4, 0.035, 12, 28),
            accentMaterial
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.y = projector.position.y + 0.12;
        group.add(ring);
        this._ring = ring;

        const core = new THREE.Mesh(
            new THREE.SphereGeometry(baseRadius * 0.16, 14, 14),
            new THREE.MeshStandardMaterial({
                color: accentColor,
                emissive: new THREE.Color(accentColor),
                emissiveIntensity: 1.1,
                roughness: 0.2,
                metalness: 0.3,
                transparent: true,
                opacity: 0.85
            })
        );
        core.position.y = ring.position.y + 0.02;
        group.add(core);
        this._core = core;
        this._coreBaseY = core.position.y;
        this._glowMaterials.push(core.material);

        const antenna = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.02, 0.3, 10),
            baseMaterial
        );
        antenna.position.set(baseRadius * 0.2, projector.position.y + 0.24, -baseRadius * 0.15);
        group.add(antenna);

        const beacon = new THREE.Mesh(
            new THREE.SphereGeometry(0.045, 12, 12),
            accentMaterial
        );
        beacon.position.y = antenna.position.y + 0.16;
        beacon.position.x = antenna.position.x;
        beacon.position.z = antenna.position.z;
        group.add(beacon);
        this._glowMaterials.push(beacon.material);

        return group;
    }

    update(dt) {
        if (!this.mesh) return;

        this._time += dt;

        if (this._ring) {
            this._ring.rotation.z += dt * 0.7;
            this._ring.rotation.y += dt * 0.9;
        }

        if (this._core) {
            this._core.position.y = this._coreBaseY + Math.sin(this._time * 2.4) * 0.04;
        }

        const pulse = 0.15 + 0.1 * Math.sin(this._time * 3.1) + 0.05 * Math.sin(this._time * 9.8);
        this._glowMaterials.forEach((material) => {
            material.emissiveIntensity = THREE.MathUtils.clamp(0.75 + pulse, 0.5, 1.4);
        });
    }
}

EntityRegistry.register('hologramKiosk', HologramKioskEntity);
