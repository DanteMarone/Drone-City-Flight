import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class FuturisticVendingMachineEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'futuristicVendingMachine';
        this._time = 0;
        this._virtualLight = null;
        this._panelMaterial = null;
        this._glowMaterial = null;
        this._baseLightIntensity = 1.8;
    }

    static get displayName() { return 'Futuristic Vending Machine'; }

    createMesh() {
        const group = new THREE.Group();

        const metalMat = new THREE.MeshStandardMaterial({
            color: 0x1b2330,
            roughness: 0.4,
            metalness: 0.8
        });
        const accentMat = new THREE.MeshStandardMaterial({
            color: 0x222a38,
            roughness: 0.6,
            metalness: 0.5
        });
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x99d4ff,
            roughness: 0.05,
            metalness: 0.3,
            transparent: true,
            opacity: 0.35
        });
        this._panelMaterial = new THREE.MeshStandardMaterial({
            color: 0x0e1118,
            emissive: new THREE.Color(0x5bd4ff),
            emissiveIntensity: 1.5,
            roughness: 0.25,
            metalness: 0.2
        });
        this._glowMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1f2b,
            emissive: new THREE.Color(0x32ff9b),
            emissiveIntensity: 1.2,
            roughness: 0.3,
            metalness: 0.4
        });

        // Base pedestal
        const baseGeo = new THREE.BoxGeometry(1.1, 0.2, 0.85);
        const base = new THREE.Mesh(baseGeo, accentMat);
        base.position.y = 0.1;
        base.castShadow = true;
        group.add(base);

        // Main cabinet
        const bodyGeo = new THREE.BoxGeometry(1, 1.8, 0.75);
        const body = new THREE.Mesh(bodyGeo, metalMat);
        body.position.y = 1.0;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        // Side venting strips
        const ventGeo = new THREE.BoxGeometry(0.95, 0.08, 0.05);
        for (let i = 0; i < 5; i++) {
            const vent = new THREE.Mesh(ventGeo, accentMat);
            vent.position.set(0, 0.5 + i * 0.25, -0.38);
            group.add(vent);
        }

        // Product display area
        const displayFrameGeo = new THREE.BoxGeometry(0.82, 1.25, 0.05);
        const displayFrame = new THREE.Mesh(displayFrameGeo, accentMat);
        displayFrame.position.set(-0.15, 1.05, 0.41);
        group.add(displayFrame);

        const productTexture = TextureGenerator.createBuildingFacade({
            color: '#0f1620',
            windowColor: '#66d6ff',
            floors: 6,
            cols: 3,
            width: 256,
            height: 256
        });
        const productMat = new THREE.MeshStandardMaterial({
            map: productTexture,
            emissive: new THREE.Color(0x1f6dff),
            emissiveIntensity: 0.6,
            roughness: 0.3,
            metalness: 0.1
        });
        const productPlaneGeo = new THREE.PlaneGeometry(0.72, 1.1);
        const productPlane = new THREE.Mesh(productPlaneGeo, productMat);
        productPlane.position.set(-0.15, 1.05, 0.45);
        group.add(productPlane);

        const glassGeo = new THREE.BoxGeometry(0.74, 1.12, 0.02);
        const glass = new THREE.Mesh(glassGeo, glassMat);
        glass.position.set(-0.15, 1.05, 0.46);
        group.add(glass);

        // Selection panel
        const panelGeo = new THREE.BoxGeometry(0.26, 1.15, 0.1);
        const panel = new THREE.Mesh(panelGeo, this._panelMaterial);
        panel.position.set(0.48, 1.05, 0.38);
        panel.castShadow = true;
        group.add(panel);

        // Buttons
        const buttonGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.04, 12);
        const buttonMat = new THREE.MeshStandardMaterial({
            color: 0xf5f7fa,
            metalness: 0.2,
            roughness: 0.4
        });
        for (let i = 0; i < 4; i++) {
            const btn = new THREE.Mesh(buttonGeo, buttonMat);
            btn.rotation.x = Math.PI / 2;
            btn.position.set(0.53, 1.55 - i * 0.24, 0.44);
            group.add(btn);
        }

        // Payment slot
        const slotGeo = new THREE.BoxGeometry(0.12, 0.04, 0.08);
        const slot = new THREE.Mesh(slotGeo, this._glowMaterial);
        slot.position.set(0.48, 0.55, 0.44);
        group.add(slot);

        // Collection bin
        const binGeo = new THREE.BoxGeometry(0.5, 0.25, 0.12);
        const bin = new THREE.Mesh(binGeo, accentMat);
        bin.position.set(-0.05, 0.35, 0.42);
        group.add(bin);

        const binLipGeo = new THREE.BoxGeometry(0.52, 0.04, 0.14);
        const binLip = new THREE.Mesh(binLipGeo, this._glowMaterial);
        binLip.position.set(-0.05, 0.48, 0.43);
        group.add(binLip);

        return group;
    }

    postInit() {
        if (window.app?.world?.lightSystem && this.mesh) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = new THREE.Vector3(-0.1, 1.05, 0.5).applyMatrix4(this.mesh.matrixWorld);
            this._baseLightIntensity = this.params.lightIntensity || this._baseLightIntensity;
            this._virtualLight = window.app.world.lightSystem.register(worldPos, 0x6be0ff, this._baseLightIntensity, 12);
            if (this._virtualLight) {
                this._virtualLight.parentMesh = this.mesh;
            }
        }
    }

    update(dt) {
        this._time += dt;
        const gentlePulse = 1 + Math.sin(this._time * 2.5) * 0.15;
        const flicker = 0.96 + Math.sin(this._time * 8.0) * 0.04;

        if (this._panelMaterial) {
            this._panelMaterial.emissiveIntensity = 1.2 * gentlePulse * flicker;
        }
        if (this._glowMaterial) {
            this._glowMaterial.emissiveIntensity = 1.0 * gentlePulse;
        }
        if (this._virtualLight) {
            this._virtualLight.intensity = this._baseLightIntensity * gentlePulse * 0.9;
        }
    }
}

EntityRegistry.register('futuristicVendingMachine', FuturisticVendingMachineEntity);
