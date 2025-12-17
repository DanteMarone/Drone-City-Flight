import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

const PANEL_COLORS = [0x7ad7ff, 0xff7ad1, 0x9ef17a, 0xffdd7a];

export class VendingMachineEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'vendingMachine';
        this._time = Math.random() * Math.PI * 2;
        this._glowPanel = null;
        this._virtualLight = null;
        this._lightLocalPos = null;
    }

    static get displayName() { return 'Vending Machine'; }

    createMesh(params = {}) {
        const group = new THREE.Group();

        const width = 1.1;
        const depth = 0.8;
        const height = 2.1;
        const bodyColor = params.bodyColor || 0x1a202c;
        const accent = params.accentColor || PANEL_COLORS[Math.floor(Math.random() * PANEL_COLORS.length)];

        // Base plinth
        const plinthGeo = new THREE.BoxGeometry(width * 1.05, 0.15, depth * 1.05);
        const plinthMat = new THREE.MeshStandardMaterial({ color: 0x11151b, roughness: 0.65, metalness: 0.1 });
        const plinth = new THREE.Mesh(plinthGeo, plinthMat);
        plinth.position.y = 0.075;
        plinth.receiveShadow = true;
        group.add(plinth);

        // Body with procedural facade
        const facadeTexture = TextureGenerator.createBuildingFacade({
            color: '#0f141d',
            windowColor: '#1f2c3c',
            floors: 3,
            cols: 2,
            width: 256,
            height: 256
        });
        facadeTexture.anisotropy = 4;

        const productTexture = TextureGenerator.createBuildingFacade({
            color: '#1a2533',
            windowColor: '#6de7ff',
            floors: 5,
            cols: 3,
            width: 256,
            height: 256
        });
        productTexture.anisotropy = 4;

        const sideMat = new THREE.MeshStandardMaterial({
            color: bodyColor,
            map: facadeTexture,
            roughness: 0.55,
            metalness: 0.25
        });

        const panelMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            map: productTexture,
            emissive: new THREE.Color(accent),
            emissiveIntensity: 0.4,
            roughness: 0.35,
            metalness: 0.2
        });

        const rearMat = new THREE.MeshStandardMaterial({
            color: 0x121722,
            roughness: 0.6,
            metalness: 0.2
        });

        const bodyGeo = new THREE.BoxGeometry(width, height, depth);
        const materials = [
            sideMat,          // +X
            sideMat.clone(),  // -X
            sideMat.clone(),  // +Y
            sideMat.clone(),  // -Y
            panelMat,         // +Z (front)
            rearMat           // -Z (back)
        ];
        materials[2].color = new THREE.Color(bodyColor);
        materials[3].color = new THREE.Color(bodyColor);

        const body = new THREE.Mesh(bodyGeo, materials);
        body.position.y = height / 2 + plinth.position.y;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        // Glass cover
        const glassGeo = new THREE.BoxGeometry(width * 0.88, height * 0.7, 0.05);
        const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0x99c9ff,
            transparent: true,
            opacity: 0.25,
            roughness: 0.05,
            metalness: 0,
            transmission: 0.7,
            emissive: new THREE.Color(accent),
            emissiveIntensity: 0.2
        });
        const glass = new THREE.Mesh(glassGeo, glassMat);
        glass.position.set(0, body.position.y + 0.05, depth / 2 + 0.03);
        group.add(glass);
        this._glowPanel = glass;

        // Button column
        const buttonGroup = new THREE.Group();
        const buttonGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.08, 10);
        const buttonMat = new THREE.MeshStandardMaterial({
            color: accent,
            emissive: new THREE.Color(accent),
            emissiveIntensity: 0.6,
            roughness: 0.2,
            metalness: 0.5
        });
        for (let i = 0; i < 5; i++) {
            const btn = new THREE.Mesh(buttonGeo, buttonMat);
            btn.rotation.x = Math.PI / 2;
            btn.position.set(width * 0.35, body.position.y + height * 0.1 + i * 0.22, depth / 2 + 0.07);
            buttonGroup.add(btn);
        }
        group.add(buttonGroup);

        // Payment slot and screen
        const slotGeo = new THREE.BoxGeometry(0.22, 0.08, 0.06);
        const slotMat = new THREE.MeshStandardMaterial({ color: 0x0b0f15, roughness: 0.4, metalness: 0.6 });
        const slot = new THREE.Mesh(slotGeo, slotMat);
        slot.position.set(width * 0.35, body.position.y - height * 0.2, depth / 2 + 0.05);
        group.add(slot);

        const screenGeo = new THREE.BoxGeometry(0.32, 0.16, 0.04);
        const screenMat = new THREE.MeshStandardMaterial({
            color: 0x0a121c,
            emissive: new THREE.Color(accent),
            emissiveIntensity: 0.35,
            roughness: 0.25,
            metalness: 0.45
        });
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.set(width * 0.35, body.position.y - height * 0.05, depth / 2 + 0.05);
        group.add(screen);

        // Light position reference (front panel upper center)
        this._lightLocalPos = new THREE.Vector3(0, body.position.y + height * 0.05, depth / 2 + 0.05);

        // Top marquee
        const topperGeo = new THREE.BoxGeometry(width * 1.05, 0.18, depth * 0.55);
        const topperMat = new THREE.MeshStandardMaterial({
            color: accent,
            emissive: new THREE.Color(accent),
            emissiveIntensity: 0.45,
            roughness: 0.3,
            metalness: 0.5
        });
        const topper = new THREE.Mesh(topperGeo, topperMat);
        topper.position.set(0, body.position.y + height / 2 + 0.14, depth * 0.05);
        topper.castShadow = true;
        group.add(topper);

        return group;
    }

    postInit() {
        const lightSystem = this.params.lightSystem || (window.app && window.app.world ? window.app.world.lightSystem : null);
        if (lightSystem && this._lightLocalPos) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightLocalPos.clone().applyMatrix4(this.mesh.matrixWorld);
            this._virtualLight = lightSystem.register(worldPos, this.params.lightColor || 0x7ad7ff, 2.2, 14);
            if (this._virtualLight) {
                this._virtualLight.parentMesh = this._glowPanel || this.mesh;
            }
        }
    }

    update(dt) {
        this._time += dt;
        const pulse = 0.25 + Math.sin(this._time * 2.2) * 0.15;

        if (this._glowPanel) {
            this._glowPanel.material.emissiveIntensity = 0.2 + pulse * 0.6;
            this._glowPanel.material.opacity = 0.2 + pulse * 0.15;
        }

        if (this._virtualLight) {
            const baseIntensity = 2.2;
            this._virtualLight.intensity = baseIntensity + pulse * 0.6;
        }
    }
}

EntityRegistry.register('vendingMachine', VendingMachineEntity);
